# AutoPrint ESP32 Kiosk

Arduino/PlatformIO-based kiosk interface for on-site printing requests. Provides a physical interface for users to interact with the AutoPrint system without needing a mobile device or computer.

## Features

- **Touch Interface**: LCD touchscreen for user interaction
- **Card Reader**: Support for student ID cards and RFID/NFC cards
- **Document Selection**: Browse and select from pre-uploaded documents
- **Payment Processing**: Integrate with campus payment systems
- **Print Options**: Configure print settings through touch interface
- **Status Display**: Real-time job status and queue information
- **Offline Mode**: Limited functionality when network is unavailable
- **Multi-language**: Support for multiple languages

## Hardware Requirements

### Core Components
- **MCU**: ESP32-DevKit-V1 or ESP32-WROOM-32
- **Display**: 3.5" or 4.3" TFT LCD with touch (ILI9341/ILI9488)
- **Card Reader**: MFRC522 RFID reader or PN532 NFC module
- **Storage**: MicroSD card slot for local caching
- **Connectivity**: Built-in WiFi (ESP32)
- **Power**: 5V power supply (2A recommended)

### Optional Components
- **Buzzer**: Audio feedback for user interactions
- **LED Indicators**: Status indication (RGB LED strip)
- **Thermal Printer**: Receipt printing capability
- **External Antenna**: For better WiFi reception
- **Enclosure**: Custom 3D-printed or commercial enclosure

## Tech Stack

- **Platform**: PlatformIO with Arduino Framework
- **MCU**: ESP32 (Dual-core, WiFi, Bluetooth)
- **Display Library**: TFT_eSPI or LVGL
- **HTTP Client**: WiFiClient/HTTPClient
- **JSON Processing**: ArduinoJson
- **Card Reading**: MFRC522 library
- **File System**: SPIFFS or LittleFS
- **OTA Updates**: ESP32 OTA capability

## Quick Start

### 1. Hardware Setup
```
ESP32 Pin Connections:
├── TFT Display (SPI)
│   ├── VCC → 3.3V
│   ├── GND → GND
│   ├── CS → GPIO 5
│   ├── RST → GPIO 4
│   ├── DC → GPIO 2
│   ├── MOSI → GPIO 23
│   ├── CLK → GPIO 18
│   └── MISO → GPIO 19
├── Touch Panel
│   ├── T_CS → GPIO 21
│   ├── T_IRQ → GPIO 22
│   └── (Share MOSI, MISO, CLK with TFT)
├── RFID Reader (SPI)
│   ├── VCC → 3.3V
│   ├── GND → GND
│   ├── CS → GPIO 15
│   ├── RST → GPIO 0
│   └── (Share MOSI, MISO, CLK with TFT)
└── SD Card Slot
    ├── CS → GPIO 13
    └── (Share MOSI, MISO, CLK with TFT)
```

### 2. PlatformIO Setup
```bash
# Initialize PlatformIO project
pio project init --board esp32dev

# Install libraries
pio lib install "TFT_eSPI" "ArduinoJson" "MFRC522" "WiFi" "HTTPClient"

# Build and upload
pio run --target upload
```

### 3. Configuration
```cpp
// config.h
#define WIFI_SSID "YourWiFiNetwork"
#define WIFI_PASSWORD "YourWiFiPassword"
#define API_BASE_URL "http://autoprint-backend:3000/api"
#define API_KEY "your-kiosk-api-key"
#define KIOSK_ID "kiosk-001"
```

## Project Structure

```
esp32-kiosk/
├── platformio.ini             # PlatformIO configuration
├── src/
│   ├── main.cpp              # Main application entry
│   ├── config.h              # Configuration constants
│   ├── ui/                   # User interface components
│   │   ├── screens.h         # Screen definitions
│   │   ├── home_screen.cpp   # Home/welcome screen
│   │   ├── login_screen.cpp  # Card/PIN login
│   │   ├── doc_screen.cpp    # Document selection
│   │   ├── print_screen.cpp  # Print options
│   │   └── status_screen.cpp # Job status display
│   ├── services/             # Service layer
│   │   ├── api_service.cpp   # Backend API communication
│   │   ├── card_service.cpp  # Card reader management
│   │   ├── display_service.cpp # Display management
│   │   └── wifi_service.cpp  # WiFi connectivity
│   ├── models/               # Data structures
│   │   ├── user.h           # User data model
│   │   ├── document.h       # Document model
│   │   └── print_job.h      # Print job model
│   └── utils/               # Utility functions
│       ├── json_utils.cpp   # JSON parsing helpers
│       ├── storage_utils.cpp # Local storage
│       └── crypto_utils.cpp # Security functions
├── lib/                     # Local libraries
├── data/                    # SPIFFS data files
│   ├── index.html          # Web configuration interface
│   ├── style.css           # Styling
│   └── config.json         # Runtime configuration
├── test/                   # Unit tests
└── docs/                   # Documentation
    ├── assembly.md         # Hardware assembly guide
    ├── wiring.md          # Wiring diagrams
    └── enclosure.md       # Enclosure design
```

## User Interface Screens

### 1. Welcome Screen
- Institution logo and branding
- Touch to start interaction
- Status indicators (WiFi, printer queue)
- Multi-language selection

### 2. Authentication Screen
- Card tap interface
- PIN entry keypad
- User verification feedback
- Error handling and retry

### 3. Document Selection
- Scrollable document list
- Document preview thumbnails
- Search and filter options
- Recently used documents

### 4. Print Configuration
- Copy count selection
- Color/grayscale toggle
- Paper size options
- Double-sided printing
- Cost estimation display

### 5. Payment Screen
- Cost breakdown
- Payment method selection
- Balance display
- Payment confirmation

### 6. Status Screen
- Job submission confirmation
- Queue position
- Estimated completion time
- Cancel job option

## Using GitHub Copilot for Development

The ESP32 kiosk project is structured for effective GitHub Copilot assistance:

### 1. UI Screen Development
```cpp
// Example: Generate touch screen interface
class HomeScreen {
public:
    void draw();
    void handleTouch(int x, int y);
    void updateStatus();
private:
    // Copilot will suggest member variables and helper methods
};

void HomeScreen::draw() {
    // Copilot will suggest TFT drawing commands
    tft.fillScreen(TFT_WHITE);
    tft.setTextColor(TFT_BLACK);
    // Additional UI elements
}
```

### 2. API Communication
```cpp
// Example: HTTP API client
class APIService {
public:
    bool authenticateUser(String cardId);
    std::vector<Document> getUserDocuments(String userId);
    bool submitPrintJob(PrintJob job);
private:
    // Copilot will suggest HTTP client implementation
};

bool APIService::authenticateUser(String cardId) {
    // HTTP request implementation with error handling
    HTTPClient http;
    http.begin(API_BASE_URL "/auth/card");
    // Copilot will suggest complete implementation
}
```

### 3. Card Reader Integration
```cpp
// Example: RFID card reading
class CardService {
public:
    bool initializeReader();
    String readCard();
    bool isCardPresent();
private:
    MFRC522 mfrc522;
    // Copilot will suggest card reading logic
};

String CardService::readCard() {
    // RFID reading implementation
    if (mfrc522.PICC_IsNewCardPresent()) {
        // Copilot will suggest card processing
    }
}
```

### 4. State Management
```cpp
// Example: Application state management
enum KioskState {
    STATE_WELCOME,
    STATE_AUTH,
    STATE_DOCUMENTS,
    STATE_PRINT_OPTIONS,
    STATE_PAYMENT,
    STATE_STATUS
};

class StateManager {
public:
    void setState(KioskState newState);
    void update();
    KioskState getCurrentState();
private:
    KioskState currentState;
    // Copilot will suggest state transition logic
};
```

### 5. Display Management
```cpp
// Example: TFT display control
class DisplayService {
public:
    void initialize();
    void drawButton(int x, int y, int w, int h, String text);
    void drawProgressBar(int progress);
    bool checkTouch(int &x, int &y);
private:
    TFT_eSPI tft;
    // Copilot will suggest display utilities
};
```

## Configuration Management

### platformio.ini
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600

lib_deps = 
    bodmer/TFT_eSPI@^2.5.0
    bblanchon/ArduinoJson@^6.21.0
    miguelbalboa/MFRC522@^1.4.10
    
build_flags = 
    -DUSER_SETUP_LOADED=1
    -DILI9341_DRIVER=1
    -DTFT_MISO=19
    -DTFT_MOSI=23
    -DTFT_SCLK=18
    -DTFT_CS=5
    -DTFT_DC=2
    -DTFT_RST=4
    -DTOUCH_CS=21
    -DSPI_FREQUENCY=27000000
```

### Runtime Configuration
```json
{
  "wifi": {
    "ssid": "Campus-WiFi",
    "password": "password",
    "timeout": 10000
  },
  "api": {
    "base_url": "https://api.autoprint.edu",
    "key": "kiosk-api-key",
    "timeout": 5000
  },
  "display": {
    "brightness": 200,
    "timeout": 30000,
    "language": "en"
  },
  "kiosk": {
    "id": "library-kiosk-01",
    "location": "Main Library",
    "features": ["color_print", "duplex", "stapling"]
  }
}
```

## Key Features Implementation

### 1. Touch Interface
- Calibrated touch screen with debouncing
- Virtual keyboard for text input
- Scrollable lists and menus
- Visual feedback for touch events

### 2. Card Authentication
- RFID/NFC card reading
- Card ID validation with backend
- User session management
- Timeout handling

### 3. Document Management
- API integration for document lists
- Local caching for performance
- Thumbnail generation and display
- Document metadata handling

### 4. Print Job Processing
- Real-time cost calculation
- Job submission with validation
- Status polling and updates
- Error handling and user feedback

### 5. Offline Capabilities
- Local configuration storage
- Cached user authentication
- Offline mode indication
- Queue jobs for later submission

## Security Considerations

### Network Security
- WPA2/WPA3 WiFi encryption
- HTTPS/TLS for API communication
- Certificate validation
- API key protection

### Physical Security
- Tamper detection
- Secure mounting
- Card reader protection
- Emergency shutdown

### Data Protection
- No sensitive data storage
- Secure session handling
- Automatic logout
- Audit logging

## Testing and Debugging

### Serial Debugging
```cpp
// Debug macros for development
#ifdef DEBUG
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif
```

### Unit Testing
- Mock hardware interfaces
- API client testing
- State machine validation
- UI component testing

## Deployment and Management

### Over-the-Air Updates
- Firmware updates via WiFi
- Configuration updates
- Rollback capability
- Update scheduling

### Remote Monitoring
- Health status reporting
- Usage statistics
- Error logging
- Performance metrics

### Maintenance Mode
- Diagnostic interface
- Configuration reset
- Network diagnostics
- Hardware testing

## Development Guidelines

### Code Organization
- Modular design with clear separation
- Header files for interfaces
- Consistent naming conventions
- Comprehensive comments
- Memory-efficient coding

### Performance Optimization
- Efficient memory usage
- Fast screen updates
- Responsive touch handling
- Optimized API calls
- Battery consideration (if applicable)

### Error Handling
- Graceful degradation
- User-friendly error messages
- Automatic recovery
- Comprehensive logging
- Failsafe operations

## Troubleshooting

### Common Issues
- WiFi connectivity problems
- Touch calibration issues
- Card reader malfunctions
- Display artifacts
- Memory overflow

### Diagnostic Tools
- Serial monitor debugging
- Built-in diagnostic screens
- Network connectivity tests
- Hardware status checks
- Memory usage monitoring

## Enclosure Design

### 3D Printing Files
- STL files for custom enclosure
- Assembly instructions
- Bill of materials
- Mounting options
- Ventilation considerations

### Commercial Options
- Compatible commercial enclosures
- Modification requirements
- Mounting hardware
- Security features
- Weatherproofing (if needed)

## Contributing

1. Follow Arduino/C++ best practices
2. Use GitHub Copilot for faster development
3. Test on actual ESP32 hardware
4. Document hardware connections
5. Consider power consumption
6. Implement proper error handling

## License

MIT License