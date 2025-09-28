/*
 * ESP32 AutoPrint Kiosk
 * 
 * Hardware Setup:
 * ===============
 * 
 * OLED Display (SSD1306 128x64):
 * - VCC -> 3.3V
 * - GND -> GND
 * - SDA -> GPIO 21 (I2C Data)
 * - SCL -> GPIO 22 (I2C Clock)
 * 
 * 4x4 Keypad:
 * - Row pins: GPIO 19, 18, 5, 17
 * - Column pins: GPIO 16, 4, 2, 15
 * 
 * Status LED:
 * - Anode -> GPIO 2 (built-in LED)
 * - Cathode -> GND
 * 
 * Buzzer (optional):
 * - Positive -> GPIO 25
 * - Negative -> GND
 * 
 * Wiring Diagram:
 * 
 *     ESP32                     4x4 Keypad
 *   ┌─────────┐               ┌─────────────┐
 *   │     3V3 ├───────────────┤ VCC         │
 *   │     GND ├───────────────┤ GND         │
 *   │  GPIO21 ├───────────────┤ SDA (OLED)  │
 *   │  GPIO22 ├───────────────┤ SCL (OLED)  │
 *   │  GPIO19 ├───────────────┤ ROW1        │
 *   │  GPIO18 ├───────────────┤ ROW2        │
 *   │   GPIO5 ├───────────────┤ ROW3        │
 *   │  GPIO17 ├───────────────┤ ROW4        │
 *   │  GPIO16 ├───────────────┤ COL1        │
 *   │   GPIO4 ├───────────────┤ COL2        │
 *   │   GPIO2 ├───────────────┤ COL3        │
 *   │  GPIO15 ├───────────────┤ COL4        │
 *   │   GPIO2 ├─[LED]─────────┤             │
 *   │  GPIO25 ├─[BUZZER]──────┤             │
 *   └─────────┘               └─────────────┘
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Keypad.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>

// ===== CONFIGURATION =====
// WiFi Configuration (can be set via captive portal)
#define DEFAULT_SSID "YourCampusWiFi"
#define DEFAULT_PASSWORD "YourWiFiPassword"

// Hardware Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

// Keypad Configuration
#define ROWS 4
#define COLS 4
#define LED_PIN 2
#define BUZZER_PIN 25

// Network Configuration
#define RASPI_HOST "192.168.1.100"  // Raspberry Pi IP
#define RASPI_PORT 8080
#define DEVICE_API_KEY "esp32-kiosk-key-123"
#define MAX_UPID_LENGTH 8
#define HTTP_TIMEOUT 10000
#define MAX_RETRIES 3
#define RETRY_DELAY 2000

// Captive Portal Configuration
#define AP_SSID "AutoPrint-Setup"
#define AP_PASSWORD "setup123"
#define DNS_PORT 53
#define WEB_PORT 80

// ===== GLOBAL OBJECTS =====
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Preferences preferences;
WebServer server(WEB_PORT);
DNSServer dnsServer;

// Keypad setup
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

byte rowPins[ROWS] = {19, 18, 5, 17};
byte colPins[COLS] = {16, 4, 2, 15};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ===== GLOBAL VARIABLES =====
String currentUPID = "";
String wifiSSID = DEFAULT_SSID;
String wifiPassword = DEFAULT_PASSWORD;
bool isConfigMode = false;
bool isConnected = false;
unsigned long lastInputTime = 0;
unsigned long displayTimeout = 30000; // 30 seconds

enum SystemState {
  STATE_BOOT,
  STATE_CONFIG,
  STATE_CONNECTING,
  STATE_READY,
  STATE_INPUT,
  STATE_PROCESSING,
  STATE_SUCCESS,
  STATE_ERROR,
  STATE_TIMEOUT
};

SystemState currentState = STATE_BOOT;
String statusMessage = "";
unsigned long stateChangeTime = 0;

// ===== FUNCTION DECLARATIONS =====
void setupDisplay();
void setupKeypad();
void setupWiFi();
void setupCaptivePortal();
void handleCaptivePortal();
void loadConfig();
void saveConfig();
void displayMessage(String title, String message, bool clearAfter = false);
void displayUPIDInput();
void displayStatus(String status);
void handleKeypadInput();
void processUPID();
void sendPrintRequest(String upid);
void playBeep(int duration = 100);
void playSuccessBeep();
void playErrorBeep();
void setLED(bool state);
void blinkLED(int times = 1, int delay_ms = 200);
void changeState(SystemState newState, String message = "");
void updateDisplay();
void checkTimeout();
void resetInput();

// ===== SETUP FUNCTION =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== ESP32 AutoPrint Kiosk Starting ===");
  
  // Initialize hardware
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Boot indication
  blinkLED(3, 100);
  playBeep(200);
  
  // Initialize components
  setupDisplay();
  setupKeypad();
  
  changeState(STATE_BOOT, "Initializing...");
  delay(1000);
  
  // Load saved configuration
  loadConfig();
  
  // Setup WiFi
  setupWiFi();
  
  Serial.println("Setup complete!");
}

// ===== MAIN LOOP =====
void loop() {
  // Handle different states
  switch (currentState) {
    case STATE_CONFIG:
      handleCaptivePortal();
      break;
      
    case STATE_CONNECTING:
      if (WiFi.status() == WL_CONNECTED) {
        isConnected = true;
        changeState(STATE_READY, "Ready for UPID");
        playSuccessBeep();
      } else if (millis() - stateChangeTime > 30000) {
        // Connection timeout
        changeState(STATE_ERROR, "WiFi Failed");
        delay(3000);
        setupCaptivePortal();
      }
      break;
      
    case STATE_READY:
    case STATE_INPUT:
      if (WiFi.status() != WL_CONNECTED) {
        changeState(STATE_CONNECTING, "Reconnecting...");
        setupWiFi();
      } else {
        handleKeypadInput();
        checkTimeout();
      }
      break;
      
    case STATE_PROCESSING:
      // Processing is handled in sendPrintRequest()
      break;
      
    case STATE_SUCCESS:
    case STATE_ERROR:
      // Auto-return to ready state after showing result
      if (millis() - stateChangeTime > 3000) {
        resetInput();
        changeState(STATE_READY, "Ready for UPID");
      }
      break;
      
    case STATE_TIMEOUT:
      if (millis() - stateChangeTime > 5000) {
        resetInput();
        changeState(STATE_READY, "Ready for UPID");
      }
      break;
  }
  
  // Update display
  updateDisplay();
  
  // Small delay to prevent overwhelming the CPU
  delay(50);
}

// ===== DISPLAY FUNCTIONS =====
void setupDisplay() {
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("SSD1306 allocation failed");
    for (;;); // Stop execution
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("AutoPrint Kiosk");
  display.println("Initializing...");
  display.display();
  
  Serial.println("Display initialized");
}

void displayMessage(String title, String message, bool clearAfter) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.println(title);
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Message
  display.setCursor(0, 20);
  display.println(message);
  
  // Footer with WiFi status
  display.setCursor(0, 56);
  if (isConnected) {
    display.print("WiFi: Connected");
  } else {
    display.print("WiFi: Disconnected");
  }
  
  display.display();
  
  if (clearAfter) {
    delay(2000);
    display.clearDisplay();
    display.display();
  }
}

void displayUPIDInput() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Header
  display.setCursor(0, 0);
  display.println("Enter UPID:");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // UPID input field
  display.setTextSize(2);
  display.setCursor(0, 20);
  
  // Show current input with cursor
  String displayUPID = currentUPID;
  if (displayUPID.length() < MAX_UPID_LENGTH) {
    displayUPID += "_";
  }
  display.println(displayUPID);
  
  // Instructions
  display.setTextSize(1);
  display.setCursor(0, 45);
  display.println("* = Clear  # = Submit");
  
  // Footer
  display.setCursor(0, 56);
  display.print(currentUPID.length());
  display.print("/");
  display.print(MAX_UPID_LENGTH);
  display.print(" chars");
  
  display.display();
}

void displayStatus(String status) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Status message
  display.setCursor(0, 20);
  display.println(status);
  
  // Loading animation
  int dots = (millis() / 500) % 4;
  display.setCursor(0, 35);
  for (int i = 0; i < dots; i++) {
    display.print(".");
  }
  
  display.display();
}

void updateDisplay() {
  switch (currentState) {
    case STATE_BOOT:
    case STATE_CONNECTING:
    case STATE_PROCESSING:
      displayStatus(statusMessage);
      break;
      
    case STATE_READY:
      displayMessage("AutoPrint Kiosk", "Press any key to\nenter UPID");
      break;
      
    case STATE_INPUT:
      displayUPIDInput();
      break;
      
    case STATE_SUCCESS:
      displayMessage("Success!", statusMessage, false);
      break;
      
    case STATE_ERROR:
      displayMessage("Error", statusMessage, false);
      break;
      
    case STATE_CONFIG:
      displayMessage("Setup Mode", "Connect to WiFi:\n" + String(AP_SSID) + "\nPassword: " + String(AP_PASSWORD));
      break;
      
    case STATE_TIMEOUT:
      displayMessage("Timeout", "Session expired\nReturning to menu...");
      break;
  }
}

// ===== KEYPAD FUNCTIONS =====
void setupKeypad() {
  Serial.println("Keypad initialized");
}

void handleKeypadInput() {
  char key = keypad.getKey();
  
  if (key) {
    playBeep(50);
    lastInputTime = millis();
    
    Serial.print("Key pressed: ");
    Serial.println(key);
    
    if (currentState == STATE_READY) {
      changeState(STATE_INPUT, "");
    }
    
    if (currentState == STATE_INPUT) {
      if (key == '*') {
        // Clear input
        resetInput();
        Serial.println("Input cleared");
      } else if (key == '#') {
        // Submit UPID
        if (currentUPID.length() > 0) {
          processUPID();
        } else {
          playErrorBeep();
          Serial.println("Empty UPID");
        }
      } else if (key == 'A' || key == 'B' || key == 'C' || key == 'D') {
        // Special keys - could be used for future features
        playBeep(200);
      } else {
        // Regular character input
        if (currentUPID.length() < MAX_UPID_LENGTH) {
          currentUPID += key;
          Serial.print("Current UPID: ");
          Serial.println(currentUPID);
        } else {
          playErrorBeep();
          Serial.println("UPID max length reached");
        }
      }
    }
  }
}

void processUPID() {
  if (currentUPID.length() == 0) {
    changeState(STATE_ERROR, "Empty UPID");
    playErrorBeep();
    return;
  }
  
  changeState(STATE_PROCESSING, "Sending request...");
  setLED(true);
  
  Serial.print("Processing UPID: ");
  Serial.println(currentUPID);
  
  sendPrintRequest(currentUPID);
}

void resetInput() {
  currentUPID = "";
  lastInputTime = 0;
}

// ===== NETWORK FUNCTIONS =====
void setupWiFi() {
  if (wifiSSID.length() == 0) {
    Serial.println("No WiFi credentials, starting config mode");
    setupCaptivePortal();
    return;
  }
  
  changeState(STATE_CONNECTING, "Connecting to WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(wifiSSID);
  
  stateChangeTime = millis();
}

void setupCaptivePortal() {
  Serial.println("Starting captive portal for WiFi setup");
  
  changeState(STATE_CONFIG, "Setup Mode");
  isConfigMode = true;
  
  // Start Access Point
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  
  // Start DNS server for captive portal
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  
  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/configure", handleConfigure);
  server.onNotFound(handleNotFound);
  
  server.begin();
  
  Serial.print("Access Point started: ");
  Serial.println(AP_SSID);
  Serial.print("IP address: ");
  Serial.println(WiFi.softAPIP());
}

void handleCaptivePortal() {
  dnsServer.processNextRequest();
  server.handleClient();
}

// ===== WEB SERVER HANDLERS =====
void handleRoot() {
  String html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>AutoPrint Kiosk Setup</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        input[type="text"], input[type="password"] { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; }
        button { width: 100%; padding: 15px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .info { background: #e7f3ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>AutoPrint Kiosk Setup</h2>
        <div class="info">
            <strong>Configure WiFi connection for your kiosk device.</strong>
        </div>
        <form action="/configure" method="POST">
            <label for="ssid">WiFi Network Name (SSID):</label>
            <input type="text" id="ssid" name="ssid" required placeholder="Enter WiFi network name">
            
            <label for="password">WiFi Password:</label>
            <input type="password" id="password" name="password" placeholder="Enter WiFi password">
            
            <button type="submit">Connect to WiFi</button>
        </form>
        
        <div style="margin-top: 20px; text-align: center; color: #666;">
            <small>AutoPrint Kiosk v1.0</small>
        </div>
    </div>
</body>
</html>
  )";
  
  server.send(200, "text/html", html);
}

void handleConfigure() {
  if (server.hasArg("ssid")) {
    wifiSSID = server.arg("ssid");
    wifiPassword = server.arg("password");
    
    saveConfig();
    
    String html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>Configuration Saved</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; text-align: center; }
        .success { color: #28a745; font-size: 18px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Configuration Saved</h2>
        <div class="success">✓ WiFi settings have been saved!</div>
        <p>The kiosk will now restart and connect to the WiFi network.</p>
        <p><strong>Network:</strong> )" + wifiSSID + R"(</p>
        <div style="margin-top: 30px; color: #666;">
            <small>You can close this window. The device will restart automatically.</small>
        </div>
    </div>
    <script>
        setTimeout(function() {
            window.close();
        }, 5000);
    </script>
</body>
</html>
    )";
    
    server.send(200, "text/html", html);
    
    Serial.println("Configuration saved, restarting...");
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Missing SSID");
  }
}

void handleNotFound() {
  // Redirect all requests to root for captive portal
  server.sendHeader("Location", "http://" + WiFi.softAPIP().toString(), true);
  server.send(302, "text/plain", "");
}

// ===== HTTP CLIENT FUNCTIONS =====
void sendPrintRequest(String upid) {
  if (!isConnected) {
    changeState(STATE_ERROR, "No WiFi connection");
    setLED(false);
    playErrorBeep();
    return;
  }
  
  HTTPClient http;
  bool success = false;
  String errorMessage = "";
  
  for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    Serial.print("Attempt ");
    Serial.print(attempt);
    Serial.print(" of ");
    Serial.println(MAX_RETRIES);
    
    // Prepare request URL
    String url = "http://" + String(RASPI_HOST) + ":" + String(RASPI_PORT) + "/print";
    
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + String(DEVICE_API_KEY));
    
    // Prepare JSON payload
    DynamicJsonDocument doc(1024);
    doc["upid"] = upid;
    doc["device_id"] = "ESP32_KIOSK_001";
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.print("Sending request to: ");
    Serial.println(url);
    Serial.print("Payload: ");
    Serial.println(jsonString);
    
    // Send request
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      
      Serial.print("Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response: ");
      Serial.println(response);
      
      if (httpResponseCode == 200) {
        // Parse response
        DynamicJsonDocument responseDoc(1024);
        DeserializationError error = deserializeJson(responseDoc, response);
        
        if (!error) {
          String message = responseDoc["message"] | "Print job queued";
          changeState(STATE_SUCCESS, message);
          playSuccessBeep();
          success = true;
          break;
        } else {
          errorMessage = "Invalid response";
        }
      } else if (httpResponseCode == 400) {
        errorMessage = "Invalid UPID";
      } else if (httpResponseCode == 404) {
        errorMessage = "UPID not found";
      } else if (httpResponseCode == 401) {
        errorMessage = "Unauthorized";
      } else {
        errorMessage = "Server error: " + String(httpResponseCode);
      }
    } else {
      errorMessage = "Connection failed";
      Serial.print("HTTP Error: ");
      Serial.println(http.errorToString(httpResponseCode));
    }
    
    http.end();
    
    if (success) break;
    
    if (attempt < MAX_RETRIES) {
      Serial.print("Retrying in ");
      Serial.print(RETRY_DELAY / 1000);
      Serial.println(" seconds...");
      delay(RETRY_DELAY);
    }
  }
  
  if (!success) {
    changeState(STATE_ERROR, errorMessage);
    playErrorBeep();
  }
  
  setLED(false);
}

// ===== CONFIGURATION FUNCTIONS =====
void loadConfig() {
  preferences.begin("autoprint", false);
  
  wifiSSID = preferences.getString("ssid", DEFAULT_SSID);
  wifiPassword = preferences.getString("password", DEFAULT_PASSWORD);
  
  preferences.end();
  
  Serial.println("Configuration loaded:");
  Serial.print("SSID: ");
  Serial.println(wifiSSID);
}

void saveConfig() {
  preferences.begin("autoprint", false);
  
  preferences.putString("ssid", wifiSSID);
  preferences.putString("password", wifiPassword);
  
  preferences.end();
  
  Serial.println("Configuration saved");
}

// ===== UTILITY FUNCTIONS =====
void changeState(SystemState newState, String message) {
  currentState = newState;
  statusMessage = message;
  stateChangeTime = millis();
  
  Serial.print("State changed to: ");
  Serial.print(newState);
  Serial.print(" - ");
  Serial.println(message);
}

void checkTimeout() {
  if (currentState == STATE_INPUT && lastInputTime > 0) {
    if (millis() - lastInputTime > displayTimeout) {
      changeState(STATE_TIMEOUT, "Session timeout");
      playBeep(500);
    }
  }
}

void playBeep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void playSuccessBeep() {
  playBeep(100);
  delay(50);
  playBeep(100);
  delay(50);
  playBeep(200);
}

void playErrorBeep() {
  playBeep(500);
  delay(100);
  playBeep(500);
}

void setLED(bool state) {
  digitalWrite(LED_PIN, state ? HIGH : LOW);
}

void blinkLED(int times, int delay_ms) {
  for (int i = 0; i < times; i++) {
    setLED(true);
    delay(delay_ms);
    setLED(false);
    delay(delay_ms);
  }
}