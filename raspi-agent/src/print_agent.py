#!/usr/bin/env python3
"""
Raspberry Pi Print Agent
Main service that handles print job requests and manages the printing workflow
"""

import os
import sys
import asyncio
import aiohttp
import logging
import json
import time
import tempfile
import websockets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
from urllib.parse import urljoin

from print_manager import PrintManager, PrintOptions, PrintJobStatus

# Configuration from environment variables
@dataclass
class Config:
    """Application configuration from environment variables"""
    backend_url: str
    raspi_api_key: str
    printer_name: str
    poll_interval_seconds: float = 5.0
    http_port: int = 8080
    file_retention_seconds: int = 3600  # 1 hour
    max_retry_attempts: int = 3
    base_retry_delay: float = 2.0  # Base delay for exponential backoff
    websocket_reconnect_interval: float = 30.0
    log_level: str = "INFO"
    
    @classmethod
    def from_env(cls) -> 'Config':
        """Load configuration from environment variables"""
        required_vars = ['BACKEND_URL', 'RASPI_API_KEY', 'PRINTER_NAME']
        missing = [var for var in required_vars if not os.getenv(var)]
        
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
        
        return cls(
            backend_url=os.getenv('BACKEND_URL').rstrip('/'),
            raspi_api_key=os.getenv('RASPI_API_KEY'),
            printer_name=os.getenv('PRINTER_NAME'),
            poll_interval_seconds=float(os.getenv('POLL_INTERVAL_SECONDS', '5.0')),
            http_port=int(os.getenv('HTTP_PORT', '8080')),
            file_retention_seconds=int(os.getenv('FILE_RETENTION_SECONDS', '3600')),
            max_retry_attempts=int(os.getenv('MAX_RETRY_ATTEMPTS', '3')),
            base_retry_delay=float(os.getenv('BASE_RETRY_DELAY', '2.0')),
            websocket_reconnect_interval=float(os.getenv('WEBSOCKET_RECONNECT_INTERVAL', '30.0')),
            log_level=os.getenv('LOG_LEVEL', 'INFO').upper()
        )

class PrintAgent:
    """Main Raspberry Pi print agent"""
    
    def __init__(self, config: Config):
        """Initialize the print agent with configuration"""
        self.config = config
        self.logger = self._setup_logging()
        self.print_manager = None
        self.session = None
        self.temp_files: Dict[str, datetime] = {}  # Track temporary files for cleanup
        
        # Statistics
        self.stats = {
            'jobs_processed': 0,
            'jobs_successful': 0,
            'jobs_failed': 0,
            'pages_printed': 0,
            'start_time': datetime.now()
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger('print_agent')
        logger.setLevel(getattr(logging, self.config.log_level))
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(getattr(logging, self.config.log_level))
        
        # File handler
        log_file = Path('/var/log/raspi-print-agent.log')
        if log_file.parent.exists():
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.DEBUG)
            logger.addHandler(file_handler)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(formatter)
        if 'file_handler' in locals():
            file_handler.setFormatter(formatter)
        
        logger.addHandler(console_handler)
        return logger
    
    async def initialize(self):
        """Initialize the print agent"""
        self.logger.info("Initializing Raspberry Pi Print Agent...")
        self.logger.info(f"Config: Backend URL: {self.config.backend_url}")
        self.logger.info(f"Config: Printer: {self.config.printer_name}")
        
        # Initialize CUPS print manager
        try:
            self.print_manager = PrintManager(
                self.config.printer_name,
                poll_interval=2.0
            )
            self.logger.info("Print manager initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize print manager: {e}")
            raise
        
        # Initialize HTTP session
        timeout = aiohttp.ClientTimeout(total=60)
        self.session = aiohttp.ClientSession(timeout=timeout)
        
        self.logger.info("Print agent initialization complete")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
        
        # Clean up temporary files
        await self._cleanup_temp_files(force=True)
    
    async def fetch_print_job(self, upid: str) -> Optional[Dict[str, Any]]:
        """
        Fetch print job details from backend
        
        Args:
            upid: Unique print ID
            
        Returns:
            Print job data or None if not found
        """
        url = urljoin(self.config.backend_url, f'/api/print/fetch')
        headers = {
            'X-API-KEY': self.config.raspi_api_key,
            'Content-Type': 'application/json'
        }
        params = {'upid': upid}
        
        self.logger.info(f"Fetching print job for UPID: {upid}")
        
        try:
            async with self.session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    job_data = await response.json()
                    self.logger.info(f"Fetched print job: {job_data.get('jobNumber', 'N/A')}")
                    return job_data
                elif response.status == 404:
                    self.logger.warning(f"Print job not found for UPID: {upid}")
                    return None
                else:
                    error_text = await response.text()
                    self.logger.error(f"Backend error {response.status}: {error_text}")
                    return None
                    
        except Exception as e:
            self.logger.error(f"Error fetching print job: {e}")
            return None
    
    async def download_file(self, file_url: str, filename: str) -> Optional[str]:
        """
        Download file from S3 URL to temporary location
        
        Args:
            file_url: Signed S3 URL
            filename: Original filename for logging
            
        Returns:
            Path to downloaded file or None if failed
        """
        self.logger.info(f"Downloading file: {filename}")
        
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(
                suffix='.pdf',
                prefix='print_job_',
                delete=False
            )
            temp_path = temp_file.name
            temp_file.close()
            
            # Download file
            async with self.session.get(file_url) as response:
                if response.status == 200:
                    with open(temp_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
                    
                    # Track temporary file
                    self.temp_files[temp_path] = datetime.now()
                    
                    file_size = os.path.getsize(temp_path)
                    self.logger.info(f"File downloaded successfully: {temp_path} ({file_size} bytes)")
                    return temp_path
                else:
                    self.logger.error(f"Failed to download file: HTTP {response.status}")
                    os.unlink(temp_path)
                    return None
                    
        except Exception as e:
            self.logger.error(f"Error downloading file: {e}")
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.unlink(temp_path)
            return None
    
    async def process_print_job(self, upid: str) -> bool:
        """
        Process a complete print job workflow
        
        Args:
            upid: Unique print ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        self.logger.info(f"Processing print job for UPID: {upid}")
        self.stats['jobs_processed'] += 1
        
        try:
            # 1. Fetch job details from backend
            job_data = await self.fetch_print_job(upid)
            if not job_data:
                await self.report_error(upid, "Failed to fetch job details from backend")
                return False
            
            # 2. Extract job information
            file_url = job_data.get('fileUrl')
            filename = job_data.get('originalName', 'document.pdf')
            job_title = job_data.get('jobNumber', f"AutoPrint-{upid}")
            
            if not file_url:
                await self.report_error(upid, "No file URL provided in job data")
                return False
            
            # 3. Parse print options
            print_options = PrintOptions(
                copies=job_data.get('copies', 1),
                duplex=job_data.get('doubleSided', False),
                paper_size=job_data.get('paperSize', 'A4'),
                orientation=job_data.get('orientation', 'portrait'),
                color_mode=job_data.get('colorMode', 'blackwhite'),
                print_quality=job_data.get('printQuality', 'normal')
            )
            
            self.logger.info(f"Print options: {asdict(print_options)}")
            
            # 4. Download file
            temp_file_path = await self.download_file(file_url, filename)
            if not temp_file_path:
                await self.report_error(upid, "Failed to download print file")
                return False
            
            # 5. Submit print job to CUPS
            try:
                job_id = self.print_manager.print_file(temp_file_path, job_title, print_options)
                self.logger.info(f"Print job submitted to CUPS: Job ID {job_id}")
            except Exception as e:
                await self.report_error(upid, f"Failed to submit print job: {e}")
                return False
            
            # 6. Monitor print job completion
            success, job_info = self.print_manager.wait_for_completion(job_id, timeout=600)  # 10 minute timeout
            
            if success:
                pages_printed = job_info.get('job-media-sheets-completed', 0)
                self.logger.info(f"Print job completed successfully. Pages: {pages_printed}")
                
                # 7. Report success to backend
                await self.report_completion(upid, pages_printed, job_id)
                
                # Update statistics
                self.stats['jobs_successful'] += 1
                self.stats['pages_printed'] += pages_printed
                
                return True
            else:
                error_msg = job_info.get('job-state-message', 'Unknown CUPS error')
                self.logger.error(f"Print job failed: {error_msg}")
                await self.report_error(upid, f"Print job failed: {error_msg}")
                return False
            
        except Exception as e:
            self.logger.error(f"Unexpected error processing print job {upid}: {e}")
            await self.report_error(upid, f"Unexpected error: {e}")
            return False
        
        finally:
            # Always try to clean up the temporary file
            if 'temp_file_path' in locals() and temp_file_path:
                await self._cleanup_temp_file(temp_file_path)
    
    async def report_completion(self, upid: str, pages_printed: int, printer_job_id: int):
        """Report successful print job completion to backend"""
        url = urljoin(self.config.backend_url, '/api/print/complete')
        headers = {
            'X-API-KEY': self.config.raspi_api_key,
            'Content-Type': 'application/json'
        }
        data = {
            'upid': upid,
            'printed_pages': pages_printed,
            'printer_id': self.config.printer_name,
            'cups_job_id': printer_job_id,
            'completed_at': datetime.now().isoformat()
        }
        
        await self._make_backend_request('POST', url, headers, data, f"completion for {upid}")
    
    async def report_error(self, upid: str, error_message: str):
        """Report print job error to backend"""
        url = urljoin(self.config.backend_url, '/api/print/error')
        headers = {
            'X-API-KEY': self.config.raspi_api_key,
            'Content-Type': 'application/json'
        }
        data = {
            'upid': upid,
            'error_message': error_message,
            'printer_id': self.config.printer_name,
            'timestamp': datetime.now().isoformat()
        }
        
        self.stats['jobs_failed'] += 1
        await self._make_backend_request('POST', url, headers, data, f"error report for {upid}")
    
    async def _make_backend_request(self, method: str, url: str, headers: Dict, data: Dict, description: str):
        """Make a request to the backend with retry logic"""
        for attempt in range(self.config.max_retry_attempts):
            try:
                async with self.session.request(method, url, headers=headers, json=data) as response:
                    if response.status in [200, 201]:
                        self.logger.info(f"Successfully reported {description}")
                        return
                    else:
                        error_text = await response.text()
                        self.logger.error(f"Backend error {response.status} for {description}: {error_text}")
                        
            except Exception as e:
                self.logger.error(f"Error reporting {description} (attempt {attempt + 1}): {e}")
            
            # Exponential backoff
            if attempt < self.config.max_retry_attempts - 1:
                delay = self.config.base_retry_delay * (2 ** attempt)
                self.logger.info(f"Retrying {description} in {delay} seconds...")
                await asyncio.sleep(delay)
        
        self.logger.error(f"Failed to report {description} after {self.config.max_retry_attempts} attempts")
    
    async def _cleanup_temp_files(self, force: bool = False):
        """Clean up old temporary files"""
        current_time = datetime.now()
        retention_delta = timedelta(seconds=self.config.file_retention_seconds)
        
        files_to_remove = []
        for file_path, created_time in self.temp_files.items():
            if force or (current_time - created_time) > retention_delta:
                files_to_remove.append(file_path)
        
        for file_path in files_to_remove:
            await self._cleanup_temp_file(file_path)
    
    async def _cleanup_temp_file(self, file_path: str):
        """Clean up a specific temporary file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                self.logger.debug(f"Cleaned up temporary file: {file_path}")
            
            # Remove from tracking
            if file_path in self.temp_files:
                del self.temp_files[file_path]
                
        except Exception as e:
            self.logger.error(f"Error cleaning up temporary file {file_path}: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current agent statistics"""
        uptime = datetime.now() - self.stats['start_time']
        
        return {
            **self.stats,
            'uptime_seconds': uptime.total_seconds(),
            'temp_files_count': len(self.temp_files),
            'printer_name': self.config.printer_name,
            'success_rate': (
                self.stats['jobs_successful'] / max(self.stats['jobs_processed'], 1) * 100
            )
        }

# HTTP server for receiving UPID requests
async def handle_print_request(request):
    """Handle HTTP POST requests with UPID"""
    try:
        data = await request.json()
        upid = data.get('upid')
        
        if not upid:
            return aiohttp.web.json_response(
                {'error': 'UPID is required'}, 
                status=400
            )
        
        # Get print agent from app context
        print_agent = request.app['print_agent']
        
        # Process print job asynchronously
        asyncio.create_task(print_agent.process_print_job(upid))
        
        return aiohttp.web.json_response({
            'message': f'Print job queued for UPID: {upid}',
            'upid': upid
        })
        
    except Exception as e:
        logging.error(f"Error handling print request: {e}")
        return aiohttp.web.json_response(
            {'error': 'Internal server error'}, 
            status=500
        )

async def handle_status_request(request):
    """Handle status/health check requests"""
    print_agent = request.app['print_agent']
    stats = print_agent.get_stats()
    
    return aiohttp.web.json_response({
        'status': 'healthy',
        'statistics': stats,
        'printer_info': print_agent.print_manager.get_printer_info() if print_agent.print_manager else {}
    })

async def create_http_server(print_agent: PrintAgent, port: int):
    """Create and start the HTTP server"""
    app = aiohttp.web.Application()
    app['print_agent'] = print_agent
    
    # Add routes
    app.router.add_post('/print', handle_print_request)
    app.router.add_get('/status', handle_status_request)
    app.router.add_get('/health', handle_status_request)
    
    return app, port

# WebSocket client for queue updates
async def websocket_client(print_agent: PrintAgent):
    """WebSocket client to receive queue updates from backend"""
    logger = logging.getLogger('websocket_client')
    ws_url = print_agent.config.backend_url.replace('http', 'ws') + '/api/ws/print-queue'
    
    while True:
        try:
            logger.info(f"Connecting to WebSocket: {ws_url}")
            
            async with websockets.connect(
                ws_url,
                extra_headers={'X-API-KEY': print_agent.config.raspi_api_key}
            ) as websocket:
                logger.info("WebSocket connected successfully")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        logger.debug(f"Received queue update: {data}")
                        
                        # Here you could update a display or trigger other actions
                        # based on the queue status updates
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON received: {e}")
                        
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            logger.info(f"Reconnecting in {print_agent.config.websocket_reconnect_interval} seconds...")
            await asyncio.sleep(print_agent.config.websocket_reconnect_interval)

async def main():
    """Main entry point"""
    try:
        # Load configuration
        config = Config.from_env()
        
        # Create print agent
        print_agent = PrintAgent(config)
        await print_agent.initialize()
        
        # Create HTTP server
        app, port = await create_http_server(print_agent, config.http_port)
        
        # Start HTTP server
        runner = aiohttp.web.AppRunner(app)
        await runner.setup()
        site = aiohttp.web.TCPSite(runner, '0.0.0.0', port)
        await site.start()
        
        print_agent.logger.info(f"HTTP server started on port {port}")
        
        # Start WebSocket client task
        websocket_task = asyncio.create_task(websocket_client(print_agent))
        
        # Start cleanup task
        async def cleanup_task():
            while True:
                await asyncio.sleep(300)  # Clean up every 5 minutes
                await print_agent._cleanup_temp_files()
        
        cleanup_task_handle = asyncio.create_task(cleanup_task())
        
        print_agent.logger.info("Print agent is ready and running")
        
        # Wait for shutdown signal
        try:
            await asyncio.gather(websocket_task, cleanup_task_handle)
        except KeyboardInterrupt:
            print_agent.logger.info("Received shutdown signal")
        
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(1)
    
    finally:
        # Cleanup
        if 'print_agent' in locals():
            await print_agent.cleanup()
        if 'runner' in locals():
            await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())