import 'dart:io';

class ApiConfig {
  static String get baseUrl {
    // Check if running on Android emulator
    if (Platform.isAndroid) {
      // Check if it's an emulator by looking at the device fingerprint
      // Emulators typically have specific characteristics
      try {
        // For emulator, use 10.0.2.2 (Android emulator's host loopback)
        // For real device, use the actual computer IP address
        
        // You can also check environment or use a debug flag
        const bool isEmulator = bool.fromEnvironment('IS_EMULATOR', defaultValue: false);
        
        if (isEmulator) {
          return 'http://10.0.2.2:3000';  // Android emulator
        } else {
          return 'http://192.168.0.103:3000';  // Real device - your computer's IP
        }
      } catch (e) {
        // Default to real device IP
        return 'http://192.168.0.103:3000';
      }
    } else if (Platform.isIOS) {
      // iOS simulator uses localhost, real device uses IP
      return 'http://192.168.0.103:3000';  // Change this to your computer's IP
    } else {
      // Web or other platforms
      return 'http://localhost:3000';
    }
  }
  
  // Alternative: You can also provide both URLs and let user choose
  static const String emulatorUrl = 'http://10.0.2.2:3000';
  static const String deviceUrl = 'http://192.168.0.103:3000';
  static const String localUrl = 'http://localhost:3000';
}