#!/bin/bash

# Raspberry Pi Print Agent Installation Script
# This script installs and configures the print agent as a systemd service

set -e  # Exit on any error

echo "🚀 Installing Raspberry Pi Print Agent..."

# Configuration
INSTALL_DIR="/opt/raspi-print-agent"
SERVICE_NAME="raspi-print-agent"
CONFIG_DIR="/etc/raspi-print-agent"
LOG_DIR="/var/log/raspi-print-agent"
USER="pi"
GROUP="lp"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

echo "📦 Installing system dependencies..."

# Update package lists
apt-get update

# Install CUPS and development dependencies
apt-get install -y \
    cups \
    cups-client \
    libcups2-dev \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    gcc \
    g++ \
    curl

echo "📁 Creating directories..."

# Create installation directory
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"

# Set permissions
chown "$USER:$GROUP" "$INSTALL_DIR"
chown "$USER:$GROUP" "$LOG_DIR"
chmod 755 "$INSTALL_DIR"
chmod 755 "$LOG_DIR"

echo "📋 Copying application files..."

# Copy source code
cp -r src/ "$INSTALL_DIR/"
cp requirements.txt "$INSTALL_DIR/"
cp config.env.example "$CONFIG_DIR/"

# Set file permissions
chown -R "$USER:$GROUP" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/src/print_agent.py"

echo "🐍 Setting up Python virtual environment..."

# Create virtual environment
sudo -u "$USER" python3 -m venv "$INSTALL_DIR/venv"

# Activate venv and install dependencies
sudo -u "$USER" "$INSTALL_DIR/venv/bin/pip" install --upgrade pip
sudo -u "$USER" "$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"

echo "⚙️  Installing systemd service..."

# Copy and modify service file
cp raspi-print-agent.service /etc/systemd/system/
sed -i "s|/opt/raspi-print-agent|$INSTALL_DIR|g" /etc/systemd/system/raspi-print-agent.service
sed -i "s|User=pi|User=$USER|g" /etc/systemd/system/raspi-print-agent.service
sed -i "s|Group=lp|Group=$GROUP|g" /etc/systemd/system/raspi-print-agent.service

# Enable service
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

echo "🖨️  Configuring CUPS..."

# Add user to lpadmin group for printer management
usermod -a -G lpadmin "$USER"

# Enable CUPS service
systemctl enable cups
systemctl start cups

echo "📝 Setting up configuration..."

# Create default configuration if it doesn't exist
if [ ! -f "$CONFIG_DIR/config.env" ]; then
    cp "$CONFIG_DIR/config.env.example" "$CONFIG_DIR/config.env"
    echo "⚠️  Configuration file created at $CONFIG_DIR/config.env"
    echo "   Please edit this file with your backend URL and API key before starting the service."
fi

# Set config permissions
chown "$USER:$GROUP" "$CONFIG_DIR/config.env"
chmod 600 "$CONFIG_DIR/config.env"

echo "🔧 Creating utility scripts..."

# Create start/stop/status scripts
cat > /usr/local/bin/raspi-print-agent << 'EOF'
#!/bin/bash
case "$1" in
    start)
        sudo systemctl start raspi-print-agent
        ;;
    stop)
        sudo systemctl stop raspi-print-agent
        ;;
    restart)
        sudo systemctl restart raspi-print-agent
        ;;
    status)
        sudo systemctl status raspi-print-agent
        ;;
    logs)
        sudo journalctl -u raspi-print-agent -f
        ;;
    config)
        sudo nano /etc/raspi-print-agent/config.env
        ;;
    test)
        cd /opt/raspi-print-agent && python3 tests/integration_test.py
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|config|test}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/raspi-print-agent

echo "✅ Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your settings:"
echo "   sudo nano $CONFIG_DIR/config.env"
echo ""
echo "2. Update the following required settings:"
echo "   - BACKEND_URL: Your AutoPrint backend URL"
echo "   - RASPI_API_KEY: Your Raspberry Pi API key"
echo "   - PRINTER_NAME: Your CUPS printer name"
echo ""
echo "3. List available printers:"
echo "   lpstat -p"
echo ""
echo "4. Start the service:"
echo "   raspi-print-agent start"
echo ""
echo "5. Check status:"
echo "   raspi-print-agent status"
echo ""
echo "6. View logs:"
echo "   raspi-print-agent logs"
echo ""
echo "7. Test the installation:"
echo "   raspi-print-agent test"
echo ""
echo "🔧 Utility commands:"
echo "   raspi-print-agent {start|stop|restart|status|logs|config|test}"
echo ""
echo "🌐 HTTP endpoints (when running):"
echo "   http://localhost:8080/print   - Submit print jobs"
echo "   http://localhost:8080/status  - Check agent status"
echo "   http://localhost:8080/health  - Health check"