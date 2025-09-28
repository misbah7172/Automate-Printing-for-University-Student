# ESP32 AutoPrint Kiosk

An ESP32-based kiosk system for the AutoPrint university printing service. This device allows students to submit print jobs by entering their UPID (Unique Print ID) using a 4x4 keypad and viewing status on an OLED display.

## 🚀 Features

- **4x4 Keypad Input**: Enter UPID using membrane keypad
- **OLED Display**: 128x64 SSD1306 display for user interface
- **WiFi Connectivity**: Connect to campus WiFi with captive portal setup
- **HTTP Client**: Send print requests to Raspberry Pi or backend
- **Status Feedback**: Visual and audio feedback with LED and buzzer
- **Timeout Handling**: Automatic session timeout and retry logic
- **Configuration Portal**: Web-based WiFi setup via captive portal
- **Persistent Settings**: Store WiFi credentials in ESP32 flash memory

## 📋 Hardware Requirements

### Core Components
- **ESP32 Development Board** (ESP32-DevKitC or similar)
- **128x64 OLED Display** (SSD1306, I2C interface)
- **4x4 Matrix Keypad** (Membrane type recommended)
- **Passive Buzzer** (3V compatible)
- **LED** (Built-in LED on GPIO 2)
- **Breadboard and Jumper Wires**

### Optional Components
- **Enclosure** (3D printed or acrylic case)
- **Power Supply** (5V USB or external adapter)
- **Pull-up Resistors** (10kΩ for keypad if needed)

## 🔌 Wiring Diagram

### Pin Connections

```
ESP32 Pin    │ Component        │ Description
─────────────┼──────────────────┼─────────────────
3.3V         │ OLED VCC        │ Power supply
GND          │ OLED GND        │ Ground
GPIO 21      │ OLED SDA        │ I2C Data
GPIO 22      │ OLED SCL        │ I2C Clock
─────────────┼──────────────────┼─────────────────
GPIO 19      │ Keypad Row 1    │ Keypad matrix
GPIO 18      │ Keypad Row 2    │ Keypad matrix
GPIO 5       │ Keypad Row 3    │ Keypad matrix
GPIO 17      │ Keypad Row 4    │ Keypad matrix
GPIO 16      │ Keypad Col 1    │ Keypad matrix
GPIO 4       │ Keypad Col 2    │ Keypad matrix
GPIO 2       │ Keypad Col 3    │ Keypad matrix
GPIO 15      │ Keypad Col 4    │ Keypad matrix
─────────────┼──────────────────┼─────────────────
GPIO 2       │ Status LED      │ Built-in LED
GPIO 25      │ Buzzer          │ Audio feedback
```

### Detailed Wiring

```
     ESP32                           4x4 Keypad
   ┌─────────┐                    ┌─────────────┐
   │         │                    │  1  2  3  A │
   │     3V3 ├────────────────────┤ VCC         │
   │     GND ├────────────────────┤ GND         │
   │         │                    │  4  5  6  B │
   │  GPIO21 ├──────┐             │             │
   │  GPIO22 ├────┐ │             │  7  8  9  C │
   │         │    │ │             │             │
   │  GPIO19 ├────┼─┼─────────────┤ R1          │
   │  GPIO18 ├────┼─┼─────────────┤ R2  *  0  # D│
   │   GPIO5 ├────┼─┼─────────────┤ R3          │
   │  GPIO17 ├────┼─┼─────────────┤ R4          │
   │         │    │ │             │             │
   │  GPIO16 ├────┼─┼─────────────┤ C1          │
   │   GPIO4 ├────┼─┼─────────────┤ C2          │
   │   GPIO2 ├────┼─┼─────────────┤ C3          │
   │  GPIO15 ├────┼─┼─────────────┤ C4          │
   │         │    │ │             └─────────────┘
   │   GPIO2 ├────┼─┼───[LED]───
   │  GPIO25 ├────┼─┼───[BUZZER]─
   │         │    │ │
   └─────────┘    │ └─── OLED SCL (Clock)
                  └───── OLED SDA (Data)
```

## ⚙️ Software Setup

### 1. Install PlatformIO

Install [PlatformIO IDE](https://platformio.org/platformio-ide) or use the VS Code extension.

### 2. Clone and Build

```bash
git clone https://github.com/misbah7172/Automate-Printing-for-University-Student.git
cd Automate-Printing-for-University-Student/esp32-kiosk
pio run
```

### 3. Configure Hardware

Edit the pin definitions in `src/main.cpp` if using different GPIO pins:

```cpp
// Keypad pin configuration
byte rowPins[ROWS] = {19, 18, 5, 17};
byte colPins[COLS] = {16, 4, 2, 15};

// Other hardware pins
#define LED_PIN 2
#define BUZZER_PIN 25
```

### 4. Update Network Settings

Modify the default values in `src/main.cpp`:

```cpp
// Default WiFi (can be changed via captive portal)
#define DEFAULT_SSID "YourCampusWiFi"
#define DEFAULT_PASSWORD "YourWiFiPassword"

// Raspberry Pi configuration
#define RASPI_HOST "192.168.1.100"  // Your Pi's IP
#define RASPI_PORT 8080
#define DEVICE_API_KEY "esp32-kiosk-key-123"  // Secure key
```

### 5. Upload to ESP32

```bash
pio run --target upload
```

## 🖥️ Usage

### First Time Setup

1. **Power on the ESP32** - Device will boot and show "AutoPrint Kiosk"
2. **WiFi Setup** - If no saved WiFi credentials, device enters setup mode
3. **Connect to Setup Network**:
   - Network: `AutoPrint-Setup`
   - Password: `setup123`
4. **Open Browser** - Navigate to any website (will redirect to setup)
5. **Enter WiFi Credentials** - Input your campus WiFi details
6. **Save and Restart** - Device will connect to WiFi and be ready

### Normal Operation

1. **Ready Screen** - Display shows "Ready for UPID"
2. **Enter UPID** - Press any key to start entering UPID
3. **Input UPID** - Use keypad to enter your unique print ID
   - Numbers `0-9`: Enter digits
   - `*`: Clear current input
   - `#`: Submit UPID
   - `A, B, C, D`: Reserved for future features
4. **Processing** - Device sends request to Raspberry Pi/backend
5. **Result** - Success or error message displayed
6. **Auto Reset** - Returns to ready screen after 3 seconds

### Keypad Layout

```
┌─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  A  │
├─────┼─────┼─────┼─────┤
│  4  │  5  │  6  │  B  │
├─────┼─────┼─────┼─────┤
│  7  │  8  │  9  │  C  │
├─────┼─────┼─────┼─────┤
│  *  │  0  │  #  │  D  │
└─────┴─────┴─────┴─────┘

*  = Clear input
#  = Submit UPID
A-D = Future features
```

### Status Indicators

- **LED Solid**: Processing request
- **LED Blinking**: Boot sequence
- **Single Beep**: Key press
- **Double Beep**: Success
- **Long Beep**: Error or timeout

## 🔧 Configuration

### WiFi Setup via Captive Portal

When the device has no saved WiFi credentials or fails to connect:

1. Device creates access point: `AutoPrint-Setup` (password: `setup123`)
2. Connect to this network with phone/laptop
3. Open any website in browser (will redirect to setup page)
4. Enter campus WiFi SSID and password
5. Click "Connect to WiFi"
6. Device saves settings and restarts

## 🧪 Testing

### Hardware Test

1. **Display Test**: Check OLED shows boot message
2. **Keypad Test**: Press keys and verify beeps/display response
3. **LED Test**: Verify LED blinks during boot
4. **Buzzer Test**: Verify audio feedback on key press

### Network Test

1. **WiFi Connection**: Check device connects to network
2. **HTTP Request**: Test with valid UPID
3. **Error Handling**: Test with invalid UPID
4. **Timeout Test**: Test network disconnection scenarios

### Integration Test

```bash
# Test HTTP endpoint (if Raspberry Pi is running)
curl -X POST http://raspberry-pi-ip:8080/print \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer esp32-kiosk-key-123" \
  -d '{"upid": "TEST1234", "device_id": "ESP32_KIOSK_001"}'
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.