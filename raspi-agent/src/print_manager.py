#!/usr/bin/env python3
"""
CUPS Print Manager for Raspberry Pi Print Agent
Handles actual printing operations using CUPS
"""

import cups
import time
import logging
import os
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class PrintJobStatus(Enum):
    """CUPS job status mapping"""
    PENDING = 3
    HELD = 4
    PROCESSING = 5
    STOPPED = 6
    CANCELLED = 7
    ABORTED = 8
    COMPLETED = 9

@dataclass
class PrintOptions:
    """Print job options"""
    copies: int = 1
    duplex: bool = False
    paper_size: str = "A4"
    orientation: str = "portrait"
    color_mode: str = "monochrome"
    print_quality: str = "normal"
    
    def to_cups_options(self) -> Dict[str, str]:
        """Convert to CUPS options dictionary"""
        options = {}
        
        # Number of copies
        if self.copies > 1:
            options['copies'] = str(self.copies)
        
        # Duplex printing
        if self.duplex:
            options['sides'] = 'two-sided-long-edge'
        else:
            options['sides'] = 'one-sided'
        
        # Paper size
        options['media'] = self.paper_size.lower()
        
        # Orientation
        if self.orientation == 'landscape':
            options['orientation-requested'] = '4'
        else:
            options['orientation-requested'] = '3'
        
        # Color mode
        if self.color_mode.lower() in ['color', 'colour']:
            options['print-color-mode'] = 'color'
        else:
            options['print-color-mode'] = 'monochrome'
        
        # Print quality
        quality_map = {
            'draft': '3',
            'normal': '4',
            'high': '5'
        }
        options['print-quality'] = quality_map.get(self.print_quality.lower(), '4')
        
        return options

class PrintManager:
    """Manages CUPS printing operations"""
    
    def __init__(self, printer_name: str, poll_interval: float = 2.0):
        """
        Initialize CUPS connection and printer
        
        Args:
            printer_name: Name of the CUPS printer
            poll_interval: How often to poll job status (seconds)
        """
        self.printer_name = printer_name
        self.poll_interval = poll_interval
        self.logger = logging.getLogger(__name__)
        
        try:
            self.cups_conn = cups.Connection()
            self.logger.info(f"Connected to CUPS server")
        except Exception as e:
            self.logger.error(f"Failed to connect to CUPS: {e}")
            raise
        
        # Verify printer exists
        self._verify_printer()
    
    def _verify_printer(self) -> None:
        """Verify that the specified printer exists and is available"""
        try:
            printers = self.cups_conn.getPrinters()
            if self.printer_name not in printers:
                available = list(printers.keys())
                raise ValueError(f"Printer '{self.printer_name}' not found. Available: {available}")
            
            printer_info = printers[self.printer_name]
            self.logger.info(f"Printer '{self.printer_name}' found: {printer_info.get('printer-info', 'N/A')}")
            
            # Check printer state
            state = printer_info.get('printer-state', 0)
            if state == 3:  # idle
                self.logger.info(f"Printer '{self.printer_name}' is ready")
            elif state == 4:  # processing
                self.logger.warning(f"Printer '{self.printer_name}' is currently processing jobs")
            elif state == 5:  # stopped
                self.logger.error(f"Printer '{self.printer_name}' is stopped")
                
        except Exception as e:
            self.logger.error(f"Error verifying printer: {e}")
            raise
    
    def print_file(self, file_path: str, job_title: str, print_options: PrintOptions) -> int:
        """
        Submit a print job to CUPS
        
        Args:
            file_path: Path to the file to print
            job_title: Title for the print job
            print_options: Print configuration options
            
        Returns:
            int: CUPS job ID
            
        Raises:
            FileNotFoundError: If file doesn't exist
            cups.IPPError: If CUPS operation fails
        """
        # Verify file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Print file not found: {file_path}")
        
        # Get file size for logging
        file_size = os.path.getsize(file_path)
        self.logger.info(f"Submitting print job: {file_path} ({file_size} bytes)")
        
        try:
            # Convert print options to CUPS format
            cups_options = print_options.to_cups_options()
            self.logger.debug(f"CUPS options: {cups_options}")
            
            # Submit the print job
            job_id = self.cups_conn.printFile(
                self.printer_name,
                file_path,
                job_title,
                cups_options
            )
            
            self.logger.info(f"Print job submitted successfully: Job ID {job_id}")
            return job_id
            
        except cups.IPPError as e:
            self.logger.error(f"CUPS IPP Error: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error submitting print job: {e}")
            raise
    
    def get_job_status(self, job_id: int) -> Tuple[PrintJobStatus, Dict[str, Any]]:
        """
        Get the current status of a print job
        
        Args:
            job_id: CUPS job ID
            
        Returns:
            Tuple of (status, job_info_dict)
        """
        try:
            jobs = self.cups_conn.getJobs(which_jobs='all', my_jobs=False)
            
            if job_id not in jobs:
                # Job might be completed and removed from active jobs
                # Check completed jobs
                completed_jobs = self.cups_conn.getJobs(which_jobs='completed', my_jobs=False)
                if job_id in completed_jobs:
                    job_info = completed_jobs[job_id]
                    return PrintJobStatus.COMPLETED, job_info
                else:
                    # Job not found anywhere - might have been cancelled/failed
                    self.logger.warning(f"Job {job_id} not found in active or completed jobs")
                    return PrintJobStatus.ABORTED, {}
            
            job_info = jobs[job_id]
            status_code = job_info.get('job-state', 0)
            
            # Map CUPS status to our enum
            try:
                status = PrintJobStatus(status_code)
            except ValueError:
                self.logger.warning(f"Unknown job status code: {status_code}")
                status = PrintJobStatus.PENDING
            
            return status, job_info
            
        except cups.IPPError as e:
            self.logger.error(f"Error getting job status: {e}")
            raise
    
    def wait_for_completion(self, job_id: int, timeout: Optional[float] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Wait for a print job to complete
        
        Args:
            job_id: CUPS job ID to monitor
            timeout: Maximum time to wait in seconds (None for no timeout)
            
        Returns:
            Tuple of (success, final_job_info)
        """
        start_time = time.time()
        self.logger.info(f"Monitoring job {job_id} for completion...")
        
        while True:
            try:
                status, job_info = self.get_job_status(job_id)
                
                # Log current status
                self.logger.debug(f"Job {job_id} status: {status.name}")
                
                # Check for completion
                if status == PrintJobStatus.COMPLETED:
                    pages_printed = job_info.get('job-media-sheets-completed', 0)
                    self.logger.info(f"Job {job_id} completed successfully. Pages printed: {pages_printed}")
                    return True, job_info
                
                # Check for failure states
                elif status in [PrintJobStatus.CANCELLED, PrintJobStatus.ABORTED]:
                    error_msg = job_info.get('job-state-message', 'Unknown error')
                    self.logger.error(f"Job {job_id} failed: {status.name} - {error_msg}")
                    return False, job_info
                
                # Check for stopped/held states
                elif status in [PrintJobStatus.STOPPED, PrintJobStatus.HELD]:
                    self.logger.warning(f"Job {job_id} is {status.name}")
                    # Continue monitoring in case it resumes
                
                # Check timeout
                if timeout and (time.time() - start_time) > timeout:
                    self.logger.error(f"Timeout waiting for job {job_id} completion")
                    return False, job_info
                
                # Wait before next poll
                time.sleep(self.poll_interval)
                
            except Exception as e:
                self.logger.error(f"Error monitoring job {job_id}: {e}")
                return False, {}
    
    def cancel_job(self, job_id: int) -> bool:
        """
        Cancel a print job
        
        Args:
            job_id: CUPS job ID to cancel
            
        Returns:
            bool: True if cancelled successfully
        """
        try:
            self.cups_conn.cancelJob(job_id)
            self.logger.info(f"Job {job_id} cancelled successfully")
            return True
        except cups.IPPError as e:
            self.logger.error(f"Error cancelling job {job_id}: {e}")
            return False
    
    def get_printer_info(self) -> Dict[str, Any]:
        """Get detailed information about the configured printer"""
        try:
            printers = self.cups_conn.getPrinters()
            return printers.get(self.printer_name, {})
        except Exception as e:
            self.logger.error(f"Error getting printer info: {e}")
            return {}
    
    def get_job_history(self, limit: int = 10) -> Dict[int, Dict[str, Any]]:
        """
        Get recent job history
        
        Args:
            limit: Maximum number of jobs to return
            
        Returns:
            Dict of job_id -> job_info
        """
        try:
            # Get both active and completed jobs
            active_jobs = self.cups_conn.getJobs(which_jobs='all', my_jobs=False)
            completed_jobs = self.cups_conn.getJobs(which_jobs='completed', my_jobs=False)
            
            # Combine and sort by job ID (most recent first)
            all_jobs = {**active_jobs, **completed_jobs}
            sorted_jobs = dict(sorted(all_jobs.items(), key=lambda x: x[0], reverse=True))
            
            # Return only the requested number
            return dict(list(sorted_jobs.items())[:limit])
            
        except Exception as e:
            self.logger.error(f"Error getting job history: {e}")
            return {}

# Example usage and test functions
def test_print_manager():
    """Test function for the print manager"""
    import tempfile
    
    # Create a test PDF file (you would normally download this)
    test_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [2 0 R]\n>>\nendobj\n"
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
        f.write(test_content)
        test_file = f.name
    
    try:
        # Initialize print manager
        pm = PrintManager("HP_Laserjet")  # Replace with your printer name
        
        # Set print options
        options = PrintOptions(
            copies=1,
            duplex=False,
            paper_size="A4",
            color_mode="monochrome"
        )
        
        # Submit print job
        job_id = pm.print_file(test_file, "Test Print Job", options)
        print(f"Submitted job ID: {job_id}")
        
        # Monitor job completion
        success, job_info = pm.wait_for_completion(job_id, timeout=300)  # 5 minute timeout
        
        if success:
            pages = job_info.get('job-media-sheets-completed', 0)
            print(f"Print job completed successfully! Pages printed: {pages}")
        else:
            print(f"Print job failed: {job_info}")
            
    finally:
        # Clean up test file
        os.unlink(test_file)

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Run test
    test_print_manager()