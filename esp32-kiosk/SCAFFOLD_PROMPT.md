Implement an ESP32 kiosk program (Arduino/PlatformIO) with the following:

1) Connect to campus WiFi (config via captive portal or hardcoded for MVP).
2) Simple input methods:
   - Read UPID from 4x4 keypad OR
   - Read QR code via attached camera (optional, later).
3) Display output to an OLED or small TFT screen: prompt "Enter UPID", show status messages.
4) When user enters UPID, ESP32 sends HTTP POST to Raspberry Pi local endpoint (or directly to backend if Pi not used) with body { upid } and Authorization header with device API key.
5) Show success/invalid messages returned from Pi/backend.
6) Implement timeout and retry logic if network is down.
7) Provide simple wiring diagram comments for keypad and OLED.
