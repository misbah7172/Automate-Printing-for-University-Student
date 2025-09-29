class ApiConfig {
  // Configuration for different environments
  static const String _localUrl = 'http://192.168.0.103:3000';     // Local development
  static const String _emulatorUrl = 'http://10.0.2.2:3000';      // Android emulator
  static const String _productionUrl = 'https://your-service-name.onrender.com'; // Render production
  
  // Environment configuration
  // Set this to true for production (Render), false for local development
  static const bool _useProduction = true;
  
  // Set this to true when using Android emulator with local development
  static const bool _isEmulator = false;
  
  static String get baseUrl {
    if (_useProduction) {
      return _productionUrl;
    } else if (_isEmulator) {
      return _emulatorUrl;
    } else {
      return _localUrl;
    }
  }
  
  static String get apiUrl => '$baseUrl/api';
  
  // Environment helpers
  static bool get isProduction => _useProduction;
  static bool get isLocal => !_useProduction;
  static bool get isEmulator => _isEmulator && !_useProduction;
}