# AutoPrint Raspberry Pi Agent

Python-based service running on Raspberry Pi devices to manage physical printers and process print jobs. Acts as a bridge between the AutoPrint backend system and the physical printing hardware.

## Features

- **Printer Management**: Discover, connect, and manage multiple printers
- **Print Job Processing**: Receive jobs from backend and execute printing
- **Queue Management**: Local queue handling with retry mechanisms
- **Status Monitoring**: Real-time printer status and job progress reporting
- **Hardware Integration**: Support for various printer interfaces (USB, Network, Bluetooth)
- **Error Handling**: Comprehensive error detection and reporting
- **Remote Management**: API endpoints for remote configuration and monitoring
- **File Processing**: Document format conversion and preprocessing

## Tech Stack

- **Runtime**: Python 3.9+
- **Web Framework**: FastAPI or Flask
- **Print System**: CUPS (Common UNIX Printing System)
- **Hardware Interface**: PyUSB, PySerial
- **HTTP Client**: httpx or requests
- **Task Queue**: Celery with Redis
- **Configuration**: Pydantic Settings
- **Logging**: Python logging with structured output
- **System Integration**: systemd service

## Hardware Requirements

- **Raspberry Pi**: 4B (recommended) or 3B+
- **Storage**: 32GB+ microSD card (Class 10)
- **Network**: Ethernet or WiFi connectivity
- **Printers**: USB or network-connected printers
- **Optional**: LCD display for status monitoring

## Quick Start

### 1. System Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install system dependencies
sudo apt install -y python3-pip python3-venv cups cups-client python3-cups

# Install Python dependencies
pip3 install -r requirements.txt
```

### 2. Configuration
```bash
# Copy configuration template
cp config.example.json config.json

# Edit configuration
nano config.json
```

### 3. Service Installation
```bash
# Install as systemd service
sudo cp autoprint-agent.service /etc/systemd/system/
sudo systemctl enable autoprint-agent
sudo systemctl start autoprint-agent
```

### 4. Development Mode
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run in development mode
python main.py --dev
```

## Project Structure

```
raspi-agent/
├── src/
│   ├── main.py                 # Application entry point
│   ├── config/                 # Configuration management
│   │   ├── settings.py         # Pydantic settings
│   │   └── logging.py          # Logging configuration
│   ├── services/               # Core services
│   │   ├── printer_service.py  # Printer management
│   │   ├── job_service.py      # Print job processing
│   │   ├── api_service.py      # Backend API communication
│   │   └── queue_service.py    # Local job queue
│   ├── models/                 # Data models
│   │   ├── printer.py          # Printer model
│   │   ├── job.py             # Print job model
│   │   └── status.py          # Status models
│   ├── utils/                  # Utility functions
│   │   ├── file_utils.py       # File processing
│   │   ├── printer_utils.py    # Printer utilities
│   │   └── network_utils.py    # Network utilities
│   ├── api/                    # FastAPI routes
│   │   ├── health.py           # Health check endpoints
│   │   ├── printers.py         # Printer management API
│   │   └── jobs.py            # Job management API
│   └── hardware/               # Hardware integration
│       ├── cups_driver.py      # CUPS integration
│       ├── usb_driver.py       # USB printer support
│       └── network_driver.py   # Network printer support
├── tests/                      # Test files
├── scripts/                    # Utility scripts
├── config/                     # Configuration files
├── logs/                       # Log files
└── requirements.txt            # Python dependencies
```

## Configuration

### config.json
```json
{
  "backend": {
    "base_url": "http://autoprint-backend:3000/api",
    "api_key": "your-raspi-api-key",
    "poll_interval": 5,
    "timeout": 30
  },
  "printers": {
    "auto_discover": true,
    "default_options": {
      "paper_size": "A4",
      "color": false,
      "duplex": false
    }
  },
  "queue": {
    "max_concurrent_jobs": 3,
    "retry_attempts": 3,
    "retry_delay": 60
  },
  "logging": {
    "level": "INFO",
    "file": "/var/log/autoprint-agent.log",
    "max_size": "10MB",
    "backup_count": 5
  },
  "hardware": {
    "status_led_pin": 18,
    "error_led_pin": 19,
    "buzzer_pin": 20
  }
}
```

## Using GitHub Copilot for Development

This Raspberry Pi agent is structured for excellent GitHub Copilot integration:

### 1. Printer Management
```python
# Example: Generate comprehensive printer discovery
class PrinterService:
    def discover_printers(self) -> List[Printer]:
        """Discover all available printers on the network and USB"""
        # Copilot will suggest CUPS integration, USB detection, network scanning
        pass
    
    def connect_printer(self, printer_id: str) -> bool:
        """Connect to a specific printer"""
        # Implementation suggestions for different printer types
        pass
```

### 2. Print Job Processing
```python
# Example: Create print job processor
class JobProcessor:
    async def process_job(self, job: PrintJob) -> JobResult:
        """Process a print job with error handling and status updates"""
        # Copilot will suggest file processing, printer communication, status reporting
        pass
    
    def convert_document(self, file_path: str, target_format: str) -> str:
        """Convert document to printer-compatible format"""
        # Format conversion implementation
        pass
```

### 3. Hardware Integration
```python
# Example: Hardware status monitoring
class HardwareMonitor:
    def __init__(self, config: HardwareConfig):
        # Copilot will suggest GPIO setup, sensor initialization
        pass
    
    def update_status_led(self, status: AgentStatus):
        """Update status LED based on agent state"""
        # LED control implementation
        pass
```

### 4. API Communication
```python
# Example: Backend API integration
class BackendAPI:
    async def fetch_pending_jobs(self) -> List[PrintJob]:
        """Fetch pending print jobs from backend"""
        # HTTP client implementation with error handling
        pass
    
    async def update_job_status(self, job_id: str, status: JobStatus):
        """Update job status in backend system"""
        # Status update implementation
        pass
```

### 5. Error Handling
```python
# Example: Comprehensive error handling
class ErrorHandler:
    def handle_printer_error(self, error: PrinterError):
        """Handle printer-specific errors"""
        # Error categorization and response
        pass
    
    def handle_network_error(self, error: NetworkError):
        """Handle network connectivity issues"""
        # Network error recovery
        pass
```

## Core Services

### Printer Service
- Auto-discovery of network and USB printers
- Printer capability detection
- Print queue management
- Status monitoring and reporting

### Job Service
- Job fetching from backend
- Document preprocessing
- Print execution with monitoring
- Status updates and error handling

### API Service
- Communication with AutoPrint backend
- Authentication and security
- Retry mechanisms for network issues
- Real-time status reporting

### Queue Service
- Local job queue management
- Priority handling
- Retry logic for failed jobs
- Concurrent job processing

## Hardware Integration

### CUPS Integration
```python
# Example: CUPS printer management
import cups

class CUPSDriver:
    def __init__(self):
        self.conn = cups.Connection()
    
    def get_printers(self):
        """Get all available CUPS printers"""
        # Copilot will suggest implementation
        pass
```

### GPIO Control
```python
# Example: GPIO control for status indicators
import RPi.GPIO as GPIO

class StatusIndicator:
    def __init__(self, led_pin: int):
        # GPIO setup with Copilot assistance
        pass
    
    def set_status(self, status: str):
        """Update visual status indicator"""
        pass
```

## Monitoring and Logging

### Health Checks
- System resource monitoring
- Printer connectivity checks
- Backend communication status
- Queue health monitoring

### Logging
- Structured logging with JSON format
- Log rotation and compression
- Remote log shipping (optional)
- Error alerting integration

## Security

### Authentication
- API key-based authentication with backend
- Certificate-based TLS communication
- Local access controls
- Secure configuration storage

### Network Security
- VPN support for remote management
- Firewall configuration
- Network traffic encryption
- Access logging and monitoring

## Installation and Deployment

### Automated Installation Script
```bash
#!/bin/bash
# install.sh - Automated setup script

# System update and dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv cups cups-client

# User setup
sudo useradd -r -s /bin/false autoprint
sudo mkdir -p /opt/autoprint-agent
sudo chown autoprint:autoprint /opt/autoprint-agent

# Service installation
# Copilot can suggest complete installation steps
```

### systemd Service
```ini
[Unit]
Description=AutoPrint Raspberry Pi Agent
After=network.target cups.service

[Service]
Type=simple
User=autoprint
WorkingDirectory=/opt/autoprint-agent
ExecStart=/opt/autoprint-agent/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Development Guidelines

### Code Organization
- Follow Python PEP 8 style guide
- Use type hints throughout
- Implement proper error handling
- Write comprehensive docstrings
- Use async/await for I/O operations

### Testing
- Unit tests for all services
- Integration tests with mock printers
- Hardware simulation for CI/CD
- Performance testing under load
- Error scenario testing

### Performance
- Efficient memory usage on Pi hardware
- Concurrent job processing
- Resource monitoring and limits
- Optimal file processing
- Network request batching

## Troubleshooting

### Common Issues
- Printer driver installation
- Network connectivity problems
- CUPS configuration issues
- File permission problems
- Service startup failures

### Diagnostic Tools
- Built-in diagnostic commands
- Log analysis utilities
- Network connectivity tests
- Printer status checks
- System resource monitoring

## Contributing

1. Follow Python best practices
2. Use GitHub Copilot for faster development
3. Write comprehensive tests
4. Update documentation
5. Test on actual Raspberry Pi hardware
6. Consider resource constraints

## License

MIT License