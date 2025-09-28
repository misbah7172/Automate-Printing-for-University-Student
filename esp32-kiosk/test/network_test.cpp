/*
 * ESP32 Kiosk Network Test
 * 
 * This test program verifies network connectivity and API communication:
 * - WiFi connection
 * - HTTP client functionality
 * - API endpoint testing
 * - Error handling
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Hardware Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C
#define LED_PIN 2
#define BUZZER_PIN 25

// Network Configuration (Update these for your network)
const char* TEST_SSID = "YourWiFiName";
const char* TEST_PASSWORD = "YourWiFiPassword";
const char* API_BASE_URL = "http://192.168.1.100:3000"; // Update to your server IP
const char* API_KEY = "test-api-key";

// Global objects
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_REST);
WiFiClient wifiClient;
HTTPClient http;

// Test variables
String testResults = "";
bool wifiConnected = false;
bool apiWorking = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Kiosk Network Test ===");
  
  // Initialize hardware
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize display
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("Display initialized");
  } else {
    Serial.println("Display initialization failed!");
  }
  
  // Run network tests
  runNetworkTests();
  
  // Show results
  displayResults();
}

void loop() {
  // Continuously monitor network status
  if (wifiConnected) {
    // Test API periodically
    static unsigned long lastApiTest = 0;
    if (millis() - lastApiTest > 30000) { // Test every 30 seconds
      lastApiTest = millis();
      testApiEndpoints();
    }
  }
  
  delay(1000);
}

void runNetworkTests() {
  Serial.println("Starting network tests...");
  
  updateDisplay("Network Tests", "Starting tests...", "");
  
  // Test 1: WiFi Connection
  testWiFiConnection();
  
  // Test 2: API Endpoints (if WiFi connected)
  if (wifiConnected) {
    testApiEndpoints();
  }
  
  Serial.println("Network tests completed");
}

void testWiFiConnection() {
  Serial.println("\n1. Testing WiFi Connection...");
  updateDisplay("WiFi Test", "Connecting...", TEST_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(TEST_SSID, TEST_PASSWORD);
  
  unsigned long startTime = millis();
  int dots = 0;
  
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 15000) {
    delay(500);
    Serial.print(".");
    dots++;
    
    String dotString = "";
    for (int i = 0; i < (dots % 4); i++) {
      dotString += ".";
    }
    updateDisplay("WiFi Test", "Connecting" + dotString, TEST_SSID);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    String ip = WiFi.localIP().toString();
    Serial.println("\nWiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(ip);
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    testResults += "WiFi: PASS (" + ip + ")\n";
    updateDisplay("WiFi Test", "Connected!", ip);
    playSuccessSound();
    delay(2000);
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi connection failed!");
    testResults += "WiFi: FAIL\n";
    updateDisplay("WiFi Test", "Failed!", "Check credentials");
    playErrorSound();
    delay(2000);
  }
}

void testApiEndpoints() {
  Serial.println("\n2. Testing API Endpoints...");
  updateDisplay("API Test", "Testing endpoints...", "");
  
  bool allEndpointsWorking = true;
  
  // Test 1: Health check
  if (!testHealthEndpoint()) {
    allEndpointsWorking = false;
  }
  delay(1000);
  
  // Test 2: User lookup
  if (!testUserLookupEndpoint()) {
    allEndpointsWorking = false;
  }
  delay(1000);
  
  // Test 3: Submit print job
  if (!testSubmitJobEndpoint()) {
    allEndpointsWorking = false;
  }
  delay(1000);
  
  if (allEndpointsWorking) {
    apiWorking = true;
    testResults += "API: PASS (all endpoints)\n";
    updateDisplay("API Test", "All endpoints OK!", "");
    playSuccessSound();
  } else {
    apiWorking = false;
    testResults += "API: PARTIAL (some failures)\n";
    updateDisplay("API Test", "Some failures", "Check server");
    playErrorSound();
  }
  
  delay(2000);
}

bool testHealthEndpoint() {
  Serial.println("Testing health endpoint...");
  
  http.begin(String(API_BASE_URL) + "/api/health");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  
  int httpCode = http.GET();
  String response = http.getString();
  http.end();
  
  Serial.print("Health check - HTTP ");
  Serial.print(httpCode);
  Serial.print(": ");
  Serial.println(response);
  
  if (httpCode == 200) {
    DynamicJsonDocument doc(1024);
    if (deserializeJson(doc, response) == DeserializationError::Ok) {
      if (doc["status"] == "ok") {
        Serial.println("Health endpoint: PASS");
        return true;
      }
    }
  }
  
  Serial.println("Health endpoint: FAIL");
  return false;
}

bool testUserLookupEndpoint() {
  Serial.println("Testing user lookup endpoint...");
  
  // Test with a known UPID (using sample data)
  String testUpid = "UP001";
  
  http.begin(String(API_BASE_URL) + "/api/students/" + testUpid);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  
  int httpCode = http.GET();
  String response = http.getString();
  http.end();
  
  Serial.print("User lookup - HTTP ");
  Serial.print(httpCode);
  Serial.print(": ");
  Serial.println(response.substring(0, 100) + "...");
  
  if (httpCode == 200) {
    DynamicJsonDocument doc(1024);
    if (deserializeJson(doc, response) == DeserializationError::Ok) {
      if (doc["success"] == true && doc["user"]["upid"] == testUpid) {
        Serial.println("User lookup endpoint: PASS");
        return true;
      }
    }
  }
  
  Serial.println("User lookup endpoint: FAIL");
  return false;
}

bool testSubmitJobEndpoint() {
  Serial.println("Testing submit job endpoint...");
  
  // Create test job data
  DynamicJsonDocument doc(1024);
  doc["upid"] = "UP001";
  doc["documentId"] = "507f1f77bcf86cd799439011"; // Use sample document ID
  doc["copies"] = 1;
  doc["priority"] = "normal";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  http.begin(String(API_BASE_URL) + "/api/kiosk/submit-job");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  
  int httpCode = http.POST(jsonString);
  String response = http.getString();
  http.end();
  
  Serial.print("Submit job - HTTP ");
  Serial.print(httpCode);
  Serial.print(": ");
  Serial.println(response.substring(0, 100) + "...");
  
  if (httpCode == 201 || httpCode == 200) {
    DynamicJsonDocument responseDoc(1024);
    if (deserializeJson(responseDoc, response) == DeserializationError::Ok) {
      if (responseDoc["success"] == true) {
        Serial.println("Submit job endpoint: PASS");
        return true;
      }
    }
  }
  
  Serial.println("Submit job endpoint: FAIL");
  return false;
}

void displayResults() {
  Serial.println("\n=== Network Test Results ===");
  Serial.print(testResults);
  
  updateDisplay("Test Complete", testResults, "");
  
  if (wifiConnected && apiWorking) {
    Serial.println("All network tests passed!");
    Serial.println("ESP32 kiosk is ready for deployment");
  } else {
    Serial.println("Some network tests failed");
    Serial.println("Check configuration and try again");
  }
  
  Serial.println("============================");
}

void updateDisplay(String title, String line1, String line2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.println(title);
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Content
  display.setCursor(0, 15);
  display.println(line1);
  
  if (line2.length() > 0) {
    display.setCursor(0, 25);
    display.println(line2);
  }
  
  // Status indicators
  int y = 50;
  if (wifiConnected) {
    display.setCursor(0, y);
    display.print("WiFi: OK");
  }
  
  if (apiWorking) {
    display.setCursor(70, y);
    display.print("API: OK");
  }
  
  display.display();
}

void playSuccessSound() {
  // Two short beeps
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  
  // LED flash
  digitalWrite(LED_PIN, HIGH);
  delay(200);
  digitalWrite(LED_PIN, LOW);
}

void playErrorSound() {
  // Long low beep
  digitalWrite(BUZZER_PIN, HIGH);
  delay(500);
  digitalWrite(BUZZER_PIN, LOW);
  
  // LED blink pattern
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}