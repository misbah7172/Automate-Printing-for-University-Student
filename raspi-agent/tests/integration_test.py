#!/usr/bin/env python3
"""
Integration tests for Raspberry Pi Print Agent
Tests the complete print workflow with a mock backend server
"""

import asyncio
import aiohttp
import json
import tempfile
import os
import logging
from datetime import datetime
from pathlib import Path
from aiohttp import web

# Mock backend server responses
MOCK_PRINT_JOB = {
    "jobNumber": "APR-2024-001",
    "upid": "TEST12345",
    "originalName": "test_document.pdf",
    "fileUrl": "https://mock-s3-url.com/test_document.pdf",
    "copies": 1,
    "doubleSided": False,
    "paperSize": "A4",
    "orientation": "portrait",
    "colorMode": "blackwhite",
    "printQuality": "normal",
    "totalPages": 1,
    "status": "queued"
}

# Simple PDF content for testing
MOCK_PDF_CONTENT = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Print Job) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
295
%%EOF"""

class MockBackend:
    """Mock backend server for testing"""
    
    def __init__(self):
        self.print_jobs = {}
        self.completed_jobs = []
        self.error_reports = []
        self.api_key = "test-api-key"
    
    async def fetch_print_job(self, request):
        """Mock /api/print/fetch endpoint"""
        # Verify API key
        if request.headers.get('X-API-KEY') != self.api_key:
            return web.json_response({'error': 'Invalid API key'}, status=401)
        
        upid = request.query.get('upid')
        if not upid:
            return web.json_response({'error': 'UPID required'}, status=400)
        
        # Return mock job data
        if upid == "TEST12345":
            return web.json_response(MOCK_PRINT_JOB)
        else:
            return web.json_response({'error': 'Job not found'}, status=404)
    
    async def serve_mock_file(self, request):
        """Serve mock PDF file"""
        return web.Response(body=MOCK_PDF_CONTENT, content_type='application/pdf')
    
    async def complete_job(self, request):
        """Mock /api/print/complete endpoint"""
        if request.headers.get('X-API-KEY') != self.api_key:
            return web.json_response({'error': 'Invalid API key'}, status=401)
        
        data = await request.json()
        self.completed_jobs.append(data)
        print(f"✅ Job completed: {data}")
        return web.json_response({'status': 'success'})
    
    async def report_error(self, request):
        """Mock /api/print/error endpoint"""
        if request.headers.get('X-API-KEY') != self.api_key:
            return web.json_response({'error': 'Invalid API key'}, status=401)
        
        data = await request.json()
        self.error_reports.append(data)
        print(f"❌ Job error: {data}")
        return web.json_response({'status': 'success'})

async def create_mock_backend():
    """Create and start mock backend server"""
    backend = MockBackend()
    app = web.Application()
    
    # Add routes
    app.router.add_get('/api/print/fetch', backend.fetch_print_job)
    app.router.add_get('/test_document.pdf', backend.serve_mock_file)  # Mock S3 URL
    app.router.add_post('/api/print/complete', backend.complete_job)
    app.router.add_post('/api/print/error', backend.report_error)
    
    return app, backend

class MockPrintManager:
    """Mock print manager for testing without actual CUPS"""
    
    def __init__(self, printer_name: str, poll_interval: float = 2.0):
        self.printer_name = printer_name
        self.poll_interval = poll_interval
        self.job_counter = 1000
        self.jobs = {}
    
    def print_file(self, file_path: str, job_title: str, print_options) -> int:
        """Mock print file submission"""
        job_id = self.job_counter
        self.job_counter += 1
        
        # Simulate job processing
        self.jobs[job_id] = {
            'status': 'processing',
            'file_path': file_path,
            'job_title': job_title,
            'options': print_options,
            'pages': 1
        }
        
        print(f"📄 Mock print job submitted: {job_id} - {job_title}")
        return job_id
    
    def wait_for_completion(self, job_id: int, timeout: float = None) -> tuple:
        """Mock job completion monitoring"""
        if job_id not in self.jobs:
            return False, {}
        
        # Simulate processing time
        asyncio.create_task(self._simulate_processing(job_id))
        
        # Wait a bit then return success
        time.sleep(2)
        
        job_info = self.jobs[job_id]
        job_info['status'] = 'completed'
        job_info['job-media-sheets-completed'] = job_info['pages']
        
        print(f"✅ Mock print job completed: {job_id}")
        return True, job_info
    
    async def _simulate_processing(self, job_id: int):
        """Simulate job processing"""
        await asyncio.sleep(1)
        if job_id in self.jobs:
            self.jobs[job_id]['status'] = 'processing'
    
    def get_printer_info(self) -> dict:
        """Mock printer info"""
        return {
            'printer-name': self.printer_name,
            'printer-state': 3,  # idle
            'printer-info': 'Mock Test Printer'
        }

async def test_print_workflow():
    """Test the complete print workflow"""
    print("🧪 Starting Raspberry Pi Print Agent Integration Test")
    
    # Start mock backend
    print("🔧 Starting mock backend server...")
    app, backend = await create_mock_backend()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 9999)
    await site.start()
    print("✅ Mock backend server started on http://localhost:9999")
    
    try:
        # Test 1: Fetch print job
        print("\n📋 Test 1: Fetching print job data...")
        async with aiohttp.ClientSession() as session:
            headers = {'X-API-KEY': 'test-api-key'}
            params = {'upid': 'TEST12345'}
            
            async with session.get(
                'http://localhost:9999/api/print/fetch',
                headers=headers,
                params=params
            ) as response:
                if response.status == 200:
                    job_data = await response.json()
                    print(f"✅ Successfully fetched job: {job_data['jobNumber']}")
                else:
                    print(f"❌ Failed to fetch job: {response.status}")
                    return False
        
        # Test 2: Download file
        print("\n📥 Test 2: Downloading mock PDF file...")
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:9999/test_document.pdf') as response:
                if response.status == 200:
                    content = await response.read()
                    if len(content) > 0:
                        print(f"✅ Successfully downloaded file ({len(content)} bytes)")
                        
                        # Save to temp file for mock printing
                        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
                            f.write(content)
                            temp_file = f.name
                    else:
                        print("❌ Downloaded file is empty")
                        return False
                else:
                    print(f"❌ Failed to download file: {response.status}")
                    return False
        
        # Test 3: Mock print job
        print("\n🖨️  Test 3: Submitting mock print job...")
        mock_printer = MockPrintManager("Mock_Printer")
        
        from print_manager import PrintOptions
        print_options = PrintOptions(
            copies=1,
            duplex=False,
            paper_size="A4",
            color_mode="blackwhite"
        )
        
        job_id = mock_printer.print_file(temp_file, "Test Print Job", print_options)
        success, job_info = mock_printer.wait_for_completion(job_id)
        
        if success:
            pages_printed = job_info.get('job-media-sheets-completed', 0)
            print(f"✅ Mock print job completed successfully ({pages_printed} pages)")
        else:
            print("❌ Mock print job failed")
            return False
        
        # Test 4: Report completion to backend
        print("\n📡 Test 4: Reporting completion to backend...")
        async with aiohttp.ClientSession() as session:
            headers = {
                'X-API-KEY': 'test-api-key',
                'Content-Type': 'application/json'
            }
            data = {
                'upid': 'TEST12345',
                'printed_pages': pages_printed,
                'printer_id': 'Mock_Printer',
                'cups_job_id': job_id,
                'completed_at': datetime.now().isoformat()
            }
            
            async with session.post(
                'http://localhost:9999/api/print/complete',
                headers=headers,
                json=data
            ) as response:
                if response.status == 200:
                    print("✅ Successfully reported completion to backend")
                else:
                    print(f"❌ Failed to report completion: {response.status}")
                    return False
        
        # Test 5: Verify backend received the completion
        print("\n🔍 Test 5: Verifying backend state...")
        if len(backend.completed_jobs) == 1:
            completed_job = backend.completed_jobs[0]
            print(f"✅ Backend received completion: UPID {completed_job['upid']}")
        else:
            print(f"❌ Backend completion count mismatch: {len(backend.completed_jobs)}")
            return False
        
        # Test 6: Test error reporting
        print("\n⚠️  Test 6: Testing error reporting...")
        async with aiohttp.ClientSession() as session:
            headers = {
                'X-API-KEY': 'test-api-key',
                'Content-Type': 'application/json'
            }
            data = {
                'upid': 'TEST_ERROR',
                'error_message': 'Test error for integration test',
                'printer_id': 'Mock_Printer',
                'timestamp': datetime.now().isoformat()
            }
            
            async with session.post(
                'http://localhost:9999/api/print/error',
                headers=headers,
                json=data
            ) as response:
                if response.status == 200:
                    print("✅ Successfully reported error to backend")
                else:
                    print(f"❌ Failed to report error: {response.status}")
                    return False
        
        print("\n🎉 All tests passed! Print agent integration test successful.")
        return True
        
    finally:
        # Clean up
        await runner.cleanup()
        if 'temp_file' in locals():
            try:
                os.unlink(temp_file)
            except:
                pass

async def test_print_agent_http_server():
    """Test the print agent HTTP server endpoints"""
    print("\n🌐 Testing Print Agent HTTP Server...")
    
    # This would require the actual print agent to be running
    # For now, we'll test the endpoints manually
    
    test_upid = "TEST67890"
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test print request endpoint
            print("📤 Testing /print endpoint...")
            data = {'upid': test_upid}
            
            async with session.post(
                'http://localhost:8080/print',
                json=data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Print request accepted: {result['message']}")
                else:
                    print(f"⚠️  Print agent not running or error: {response.status}")
            
            # Test status endpoint
            print("📊 Testing /status endpoint...")
            async with session.get('http://localhost:8080/status') as response:
                if response.status == 200:
                    status = await response.json()
                    print(f"✅ Status retrieved: {status['status']}")
                    print(f"📈 Statistics: {status['statistics']}")
                else:
                    print(f"⚠️  Status endpoint not available: {response.status}")
    
    except aiohttp.ClientError:
        print("⚠️  Print agent HTTP server is not running")
        print("💡 To test the HTTP server:")
        print("   1. Set environment variables (see config.env.example)")
        print("   2. Run: python src/print_agent.py")
        print("   3. Run this test again")

if __name__ == "__main__":
    import sys
    import time
    
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    print("🚀 Raspberry Pi Print Agent - Integration Test Suite")
    print("=" * 60)
    
    async def run_all_tests():
        # Test 1: Basic workflow with mock backend
        success = await test_print_workflow()
        
        if success:
            print("\n" + "=" * 60)
            # Test 2: HTTP server endpoints (optional)
            await test_print_agent_http_server()
        
        return success
    
    # Run tests
    try:
        success = asyncio.run(run_all_tests())
        if success:
            print("\n🎯 Integration test completed successfully!")
            sys.exit(0)
        else:
            print("\n💥 Integration test failed!")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        sys.exit(1)