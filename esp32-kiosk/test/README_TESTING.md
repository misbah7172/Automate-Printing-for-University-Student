# ESP32 Kiosk Testing Guide

This directory contains comprehensive test programs to verify the ESP32 kiosk hardware and network functionality before deployment.

## Test Programs

### 1. Hardware Test (`hardware_test.cpp`)

**Purpose**: Verify all hardware components are functioning correctly.

**Components Tested**:
- ✅ OLED Display (SSD1306)
- ✅ 4x4 Matrix Keypad
- ✅ LED Indicator
- ✅ Buzzer
- ✅ WiFi Module

**How to Run**:
1. Copy `hardware_test.cpp` to `src/main.cpp`
2. Upload to ESP32
3. Open Serial Monitor (115200 baud)
4. Follow the test prompts

**Expected Results**:
- LED blinks 5 times
- Buzzer beeps 3 times
- Display shows test patterns and borders
- Keypad responds to key presses
- WiFi scan finds available networks

### 2. Network Test (`network_test.cpp`)

**Purpose**: Verify network connectivity and API communication.

**Components Tested**:
- ✅ WiFi Connection
- ✅ HTTP Client
- ✅ API Endpoint Communication
- ✅ JSON Parsing
- ✅ Error Handling

**Configuration Required**:
```cpp
// Update these values in network_test.cpp
const char* TEST_SSID = "YourWiFiName";
const char* TEST_PASSWORD = "YourWiFiPassword";
const char* API_BASE_URL = "http://192.168.1.100:3000";
const char* API_KEY = "test-api-key";
```

**API Endpoints Tested**:
- `GET /api/health` - Server health check
- `GET /api/students/{upid}` - User lookup
- `POST /api/kiosk/submit-job` - Print job submission

**How to Run**:
1. Update network credentials in `network_test.cpp`
2. Ensure MongoDB backend is running
3. Copy `network_test.cpp` to `src/main.cpp`
4. Upload to ESP32
5. Open Serial Monitor (115200 baud)

## Test Procedures

### Pre-Test Setup

1. **Hardware Assembly**:
   ```
   ESP32 DevKit v1 Connections:
   - OLED SDA → GPIO 21
   - OLED SCL → GPIO 22
   - OLED VCC → 3.3V
   - OLED GND → GND
   
   Keypad Connections:
   - Row pins: 19, 18, 5, 17
   - Col pins: 16, 4, 2, 15
   
   Other Components:
   - LED → GPIO 2 (+ resistor)
   - Buzzer → GPIO 25
   ```

2. **Software Setup**:
   - Install PlatformIO
   - Install required libraries
   - Configure serial monitor

### Running Hardware Tests

1. **Upload Hardware Test**:
   ```bash
   # In esp32-kiosk directory
   cp test/hardware_test.cpp src/main.cpp
   pio run --target upload
   pio device monitor
   ```

2. **Test Sequence**:
   - LED blink test (automatic)
   - Buzzer beep test (automatic)
   - Display pattern test (automatic)
   - Keypad matrix test (press any key)
   - WiFi scan test (automatic)

3. **Expected Serial Output**:
   ```
   === ESP32 Kiosk Hardware Test ===
   Starting hardware tests...
   
   1. Testing LED...
   LED test completed
   
   2. Testing Buzzer...
   Buzzer test completed
   
   3. Testing Display...
   Display initialized successfully
   
   4. Testing Keypad...
   Key detected: 1
   Keypad test completed - Key detected
   
   5. Testing WiFi...
   WiFi networks found: 5
   
   === Test Results ===
   LED: PASS
   Buzzer: PASS
   Display: PASS
   Keypad: PASS
   WiFi: PASS (5 networks)
   ======================
   ```

### Running Network Tests

1. **Setup Backend**:
   ```bash
   # Ensure MongoDB is running
   cd C:\CODE\AutomatePrinting
   npm start
   ```

2. **Configure Network Test**:
   - Update WiFi credentials
   - Update API base URL
   - Verify API key matches backend

3. **Upload Network Test**:
   ```bash
   cp test/network_test.cpp src/main.cpp
   pio run --target upload
   pio device monitor
   ```

4. **Test Sequence**:
   - WiFi connection test
   - API health check
   - User lookup test (UPID: UP001)
   - Print job submission test

5. **Expected Serial Output**:
   ```
   === ESP32 Kiosk Network Test ===
   Starting network tests...
   
   1. Testing WiFi Connection...
   WiFi connected successfully!
   IP address: 192.168.1.150
   Signal strength: -45 dBm
   
   2. Testing API Endpoints...
   Testing health endpoint...
   Health check - HTTP 200: {"status":"ok"}
   Health endpoint: PASS
   
   Testing user lookup endpoint...
   User lookup - HTTP 200: {"success":true,"user":{"upid":"UP001"...
   User lookup endpoint: PASS
   
   Testing submit job endpoint...
   Submit job - HTTP 201: {"success":true,"jobId":"...
   Submit job endpoint: PASS
   
   === Network Test Results ===
   WiFi: PASS (192.168.1.150)
   API: PASS (all endpoints)
   
   All network tests passed!
   ESP32 kiosk is ready for deployment
   ```

## Troubleshooting

### Hardware Issues

**OLED Display Not Working**:
- Check I2C connections (SDA/SCL)
- Verify 3.3V power supply
- Try different I2C address (0x3D)

**Keypad Not Responding**:
- Check row/column pin connections
- Verify GPIO pin assignments
- Test individual keys with multimeter

**LED/Buzzer Not Working**:
- Check GPIO pin connections
- Verify current limiting resistor for LED
- Test with different GPIO pins

### Network Issues

**WiFi Connection Failed**:
- Verify SSID and password
- Check signal strength
- Try different WiFi network
- Reset ESP32 and try again

**API Connection Failed**:
- Verify backend server is running
- Check API base URL and port
- Verify API key matches
- Check firewall settings

**Partial API Failures**:
- Check MongoDB connection
- Verify sample data is loaded
- Check API endpoint implementations
- Review server logs

## Deployment Checklist

After successful testing:

- [ ] Hardware test passes all components
- [ ] Network test connects to production WiFi
- [ ] All API endpoints respond correctly
- [ ] Display shows clear, readable text
- [ ] Keypad responds to all key presses
- [ ] Audio feedback works properly
- [ ] Production credentials configured
- [ ] Enclosure properly assembled
- [ ] Power supply stable
- [ ] Network connectivity reliable

## Test Results Log

Document test results for each ESP32 unit:

```
Unit ID: ESP32-001
Date: [Date]
Hardware Test: PASS/FAIL
Network Test: PASS/FAIL
Notes: [Any issues or observations]
Tester: [Name]
```

## Next Steps

Once testing is complete:

1. **Deploy Main Program**: Copy `main.cpp` back to source
2. **Production Configuration**: Update WiFi and API settings
3. **Install in Kiosk**: Mount in physical enclosure
4. **Final Testing**: Verify operation in deployment location
5. **User Training**: Train staff on kiosk operation and maintenance