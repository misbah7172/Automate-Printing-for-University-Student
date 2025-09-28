# Raspberry Pi Print Agent

A comprehensive print agent service for Raspberry Pi devices that handles automated printing from the AutoPrint backend system using CUPS (Common Unix Printing System).

## 🚀 Features

- **HTTP API Server**: Receives print job requests via REST endpoints
- **CUPS Integration**: Full integration with CUPS for professional printing
- **S3 File Download**: Downloads print files using signed S3 URLs
- **Job Monitoring**: Real-time monitoring of print job status using CUPS
- **WebSocket Client**: Real-time queue updates from backend via WebSocket
- **Error Handling**: Comprehensive error reporting with retry logic
- **File Management**: Automatic cleanup of temporary files
- **Security**: API key authentication and secure file handling
- **Logging**: Detailed logging with configurable levels
- **Systemd Service**: Runs as a system service with auto-restart
- **Health Monitoring**: Built-in health checks and status reporting

## 📋 Requirements

### Hardware
- Raspberry Pi 3B+ or newer (4GB RAM recommended)
- USB or Network printer compatible with CUPS
- SD card (32GB+ recommended)
- Stable network connection

### Software
- Raspberry Pi OS (Bullseye or newer)
- Python 3.9+
- CUPS printing system
- Network connectivity to AutoPrint backend

## 🔧 Installation

### Automatic Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/misbah7172/Automate-Printing-for-University-Student.git
   cd Automate-Printing-for-University-Student/raspi-agent
   ```

2. **Run the installation script:**
   ```bash
   sudo chmod +x install.sh
   sudo ./install.sh
   ```

3. **Configure the service:**
   ```bash
   sudo nano /etc/raspi-print-agent/config.env
   ```

4. **Start the service:**
   ```bash
   raspi-print-agent start
   ```

### Manual Installation

1. **Install system dependencies:**
   ```bash
   sudo apt update
   sudo apt install cups cups-client libcups2-dev python3-dev python3-pip python3-venv gcc g++
   ```

2. **Create installation directory:**
   ```bash
   sudo mkdir -p /opt/raspi-print-agent
   sudo cp -r src/ /opt/raspi-print-agent/
   sudo cp requirements.txt /opt/raspi-print-agent/
   ```

3. **Setup Python environment:**
   ```bash
   cd /opt/raspi-print-agent
   sudo python3 -m venv venv
   sudo venv/bin/pip install -r requirements.txt
   ```

4. **Install systemd service:**
   ```bash
   sudo cp raspi-print-agent.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable raspi-print-agent
   ```

## ⚙️ Configuration

### Environment Variables

Edit `/etc/raspi-print-agent/config.env`:

```bash
# Backend Configuration
BACKEND_URL=https://your-autoprint-backend.com
RASPI_API_KEY=your-secure-api-key-here

# Printer Configuration  
PRINTER_NAME=HP_LaserJet_Pro_M404dn
POLL_INTERVAL_SECONDS=2.0

# HTTP Server
HTTP_PORT=8080

# File Management
FILE_RETENTION_SECONDS=3600
MAX_RETRY_ATTEMPTS=3
BASE_RETRY_DELAY=2.0

# WebSocket
WEBSOCKET_RECONNECT_INTERVAL=30.0

# Logging
LOG_LEVEL=INFO
```

### CUPS Printer Setup

1. **List available printers:**
   ```bash
   lpstat -p
   ```

2. **Add a new printer (if needed):**
   ```bash
   sudo lpadmin -p PrinterName -E -v usb://HP/LaserJet%20Pro%20M404dn -m everywhere
   ```

3. **Set as default printer:**
   ```bash
   sudo lpadmin -d PrinterName
   ```

4. **Test printing:**
   ```bash
   echo "Test page" | lp -d PrinterName
   ```

## 🖥️ Usage

### Service Management

Use the built-in utility command:

```bash
# Start the service
raspi-print-agent start

# Stop the service
raspi-print-agent stop

# Restart the service
raspi-print-agent restart

# Check status
raspi-print-agent status

# View live logs
raspi-print-agent logs

# Edit configuration
raspi-print-agent config

# Run integration test
raspi-print-agent test
```

### HTTP API Endpoints

When the service is running, it provides these endpoints:

#### Submit Print Job
```bash
POST http://localhost:8080/print
Content-Type: application/json

{
  "upid": "ABC12345"
}
```

#### Check Agent Status
```bash
GET http://localhost:8080/status
```

Response:
```json
{
  "status": "healthy",
  "statistics": {
    "jobs_processed": 42,
    "jobs_successful": 40,
    "jobs_failed": 2,
    "pages_printed": 125,
    "uptime_seconds": 86400,
    "success_rate": 95.24
  },
  "printer_info": {
    "printer-name": "HP_LaserJet_Pro_M404dn",
    "printer-state": 3,
    "printer-info": "HP LaserJet Pro M404dn"
  }
}
```

#### Health Check
```bash
GET http://localhost:8080/health
```

### Print Workflow

1. **Job Submission**: Kiosk/ESP32 sends UPID to `/print` endpoint
2. **Job Fetch**: Agent fetches job details from backend using UPID
3. **File Download**: Agent downloads PDF from signed S3 URL
4. **Print Submission**: Agent submits job to CUPS with specified options
5. **Job Monitoring**: Agent monitors CUPS job status until completion
6. **Status Reporting**: Agent reports success/failure back to backend
7. **Cleanup**: Temporary files are automatically cleaned up

## 🧪 Testing

### Integration Test

Run the comprehensive integration test:

```bash
raspi-print-agent test
```

This test includes:
- Mock backend server setup
- Print job fetch simulation
- File download testing
- CUPS integration (mocked)
- Status reporting verification

### Manual Testing

1. **Test HTTP endpoint:**
   ```bash
   curl -X POST http://localhost:8080/print \
     -H "Content-Type: application/json" \
     -d '{"upid": "TEST12345"}'
   ```

2. **Check service status:**
   ```bash
   curl http://localhost:8080/status
   ```

3. **Monitor logs:**
   ```bash
   raspi-print-agent logs
   ```

## 🐳 Docker Deployment (Optional)

Build and run using Docker:

```bash
# Build image
docker build -t raspi-print-agent .

# Run container
docker run -d \
  --name print-agent \
  -p 8080:8080 \
  -v /var/run/cups:/var/run/cups \
  -e BACKEND_URL=https://your-backend.com \
  -e RASPI_API_KEY=your-api-key \
  -e PRINTER_NAME=Your_Printer \
  raspi-print-agent
```

## 📊 Monitoring

### Logs

- **Service logs**: `journalctl -u raspi-print-agent -f`
- **Application logs**: `/var/log/raspi-print-agent/app.log`
- **CUPS logs**: `/var/log/cups/`

### Metrics

The status endpoint provides operational metrics:
- Jobs processed/successful/failed
- Pages printed
- Uptime and success rate
- Current printer status

### Health Checks

- HTTP health endpoint: `GET /health`
- Systemd service status: `systemctl status raspi-print-agent`
- CUPS printer status: `lpstat -p`

## 🔧 Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   # Check configuration
   raspi-print-agent config
   
   # Check logs
   raspi-print-agent logs
   
   # Verify printer
   lpstat -p
   ```

2. **Print jobs failing:**
   ```bash
   # Test CUPS directly
   echo "Test" | lp -d YourPrinter
   
   # Check printer queue
   lpq
   
   # Clear print queue
   sudo cancel -a
   ```

3. **Network issues:**
   ```bash
   # Test backend connectivity
   curl -H "X-API-KEY: your-key" "https://backend.com/api/print/fetch?upid=TEST"
   
   # Check DNS resolution
   nslookup backend.com
   ```

4. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R pi:lp /opt/raspi-print-agent
   
   # Add user to groups
   sudo usermod -a -G lp,lpadmin pi
   ```

### Log Analysis

Enable debug logging:
```bash
# Edit config
sudo nano /etc/raspi-print-agent/config.env
# Set: LOG_LEVEL=DEBUG

# Restart service
raspi-print-agent restart
```

## 🔒 Security

- **API Key Authentication**: All backend requests use API key authentication
- **File Security**: Temporary files are created with restricted permissions
- **Network Security**: HTTPS connections to backend (recommended)
- **User Isolation**: Service runs as non-root user with minimal permissions
- **File Cleanup**: Automatic cleanup prevents disk space issues

## 📚 API Reference

### Print Job Data Structure

```json
{
  "jobNumber": "APR-2024-001",
  "upid": "ABC12345",
  "originalName": "document.pdf",
  "fileUrl": "https://s3.amazonaws.com/signed-url",
  "copies": 1,
  "doubleSided": false,
  "paperSize": "A4",
  "orientation": "portrait", 
  "colorMode": "blackwhite",
  "printQuality": "normal",
  "totalPages": 5
}
```

### Print Options

- **Paper Sizes**: A4, Letter, Legal, A3
- **Orientations**: portrait, landscape  
- **Color Modes**: blackwhite, color
- **Print Quality**: draft, normal, high
- **Duplex**: true/false for double-sided printing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/misbah7172/Automate-Printing-for-University-Student/issues)
- **Documentation**: [Project Wiki](https://github.com/misbah7172/Automate-Printing-for-University-Student/wiki)
- **Email**: Support contact information