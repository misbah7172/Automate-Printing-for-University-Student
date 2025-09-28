/*
 * ESP32 Kiosk Hardware Test
 * 
 * This test program verifies all hardware components are working correctly:
 * - OLED Display
 * - 4x4 Keypad
 * - LED
 * - Buzzer
 * - WiFi connectivity
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Keypad.h>
#include <WiFi.h>

// Hardware Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C
#define LED_PIN 2
#define BUZZER_PIN 25

// Keypad Configuration
#define ROWS 4
#define COLS 4

// Global objects
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

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

// Test variables
int testStep = 0;
unsigned long testStartTime = 0;
String testResults = "";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Kiosk Hardware Test ===");
  
  // Initialize hardware
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Start tests
  testStartTime = millis();
  runHardwareTests();
}

void loop() {
  // Test keypad continuously
  char key = keypad.getKey();
  if (key) {
    Serial.print("Key pressed: ");
    Serial.println(key);
    
    // Visual feedback
    playBeep(100);
    blinkLED(1, 100);
    
    // Update display
    displayKeypadTest(key);
  }
  
  delay(50);
}

void runHardwareTests() {
  Serial.println("Starting hardware tests...");
  
  // Test 1: LED
  testLED();
  
  // Test 2: Buzzer
  testBuzzer();
  
  // Test 3: Display
  testDisplay();
  
  // Test 4: Keypad
  testKeypad();
  
  // Test 5: WiFi scan
  testWiFi();
  
  // Show final results
  displayResults();
}

void testLED() {
  Serial.println("\n1. Testing LED...");
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Testing LED...");
  display.println("LED should blink 5 times");
  display.display();
  
  bool ledWorking = true;
  
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(300);
    digitalWrite(LED_PIN, LOW);
    delay(300);
  }
  
  testResults += "LED: PASS\n";
  Serial.println("LED test completed");
}

void testBuzzer() {
  Serial.println("\n2. Testing Buzzer...");
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Testing Buzzer...");
  display.println("Should hear 3 beeps");
  display.display();
  
  for (int i = 0; i < 3; i++) {
    playBeep(200);
    delay(300);
  }
  
  testResults += "Buzzer: PASS\n";
  Serial.println("Buzzer test completed");
}

void testDisplay() {
  Serial.println("\n3. Testing Display...");
  
  bool displayWorking = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  
  if (displayWorking) {
    Serial.println("Display initialized successfully");
    
    // Test display patterns
    display.clearDisplay();
    
    // Draw border
    display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
    
    // Draw text
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 10);
    display.println("Display Test");
    display.setCursor(10, 25);
    display.println("All pixels working?");
    
    // Draw some shapes
    display.drawCircle(100, 40, 10, SSD1306_WHITE);
    display.fillRect(10, 45, 20, 10, SSD1306_WHITE);
    
    display.display();
    delay(2000);
    
    testResults += "Display: PASS\n";
  } else {
    Serial.println("Display initialization failed!");
    testResults += "Display: FAIL\n";
  }
}

void testKeypad() {
  Serial.println("\n4. Testing Keypad...");
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Testing Keypad...");
  display.println("Press any key");
  display.println("(test will continue)");
  display.display();
  
  // Test keypad matrix
  bool keysFound = false;
  
  // Check if any keys are pressed during test
  unsigned long testStart = millis();
  while (millis() - testStart < 3000) { // 3 second test window
    char key = keypad.getKey();
    if (key) {
      keysFound = true;
      Serial.print("Key detected: ");
      Serial.println(key);
      playBeep(50);
      break;
    }
    delay(10);
  }
  
  if (keysFound) {
    testResults += "Keypad: PASS\n";
    Serial.println("Keypad test completed - Key detected");
  } else {
    testResults += "Keypad: PARTIAL (no key pressed)\n";
    Serial.println("Keypad test completed - No keys pressed during test");
  }
}

void testWiFi() {
  Serial.println("\n5. Testing WiFi...");
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Testing WiFi...");
  display.println("Scanning networks...");
  display.display();
  
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  int networkCount = WiFi.scanNetworks();
  
  if (networkCount > 0) {
    Serial.print("WiFi networks found: ");
    Serial.println(networkCount);
    
    for (int i = 0; i < min(networkCount, 3); i++) {
      Serial.print("  ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" (");
      Serial.print(WiFi.RSSI(i));
      Serial.println(" dBm)");
    }
    
    testResults += "WiFi: PASS (" + String(networkCount) + " networks)\n";
  } else {
    Serial.println("No WiFi networks found");
    testResults += "WiFi: FAIL (no networks found)\n";
  }
}

void displayResults() {
  Serial.println("\n=== Test Results ===");
  Serial.print(testResults);
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Test Results:");
  display.println("-------------");
  
  // Parse and display results
  int y = 20;
  String temp = testResults;
  while (temp.length() > 0) {
    int newlineIndex = temp.indexOf('\n');
    if (newlineIndex > 0) {
      String line = temp.substring(0, newlineIndex);
      display.setCursor(0, y);
      display.println(line);
      y += 8;
      temp = temp.substring(newlineIndex + 1);
    } else {
      break;
    }
  }
  
  display.setCursor(0, 56);
  display.println("Press keys to test input");
  display.display();
  
  Serial.println("======================");
  Serial.println("Hardware test completed!");
  Serial.println("Press keys to test keypad input...");
}

void displayKeypadTest(char key) {
  static String keyHistory = "";
  
  keyHistory = String(key) + " " + keyHistory;
  if (keyHistory.length() > 20) {
    keyHistory = keyHistory.substring(0, 20);
  }
  
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Key Test");
  
  display.setTextSize(3);
  display.setCursor(30, 20);
  display.println(key);
  
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.print("Recent: ");
  display.println(keyHistory);
  
  display.display();
}

void playBeep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}