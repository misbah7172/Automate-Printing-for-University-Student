import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    return token != null && token.isNotEmpty;
  }

  // Get stored token
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  // Get stored user data
  static Future<Map<String, dynamic>?> getUserData() async {
    final userData = await _storage.read(key: _userKey);
    if (userData != null) {
      try {
        return jsonDecode(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Sign up new user
  static Future<Map<String, dynamic>> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String studentId,
  }) async {
    try {
      final result = await ApiService.signUp(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        studentId: studentId,
      );

      if (result['success'] == true) {
        // Store token and user data
        final data = result['data'];
        if (data['token'] != null) {
          await _storage.write(key: _tokenKey, value: data['token']);
        }
        if (data['user'] != null) {
          await _storage.write(key: _userKey, value: jsonEncode(data['user']));
        }
      }

      return result;
    } catch (e) {
      return {
        'success': false,
        'error': 'Authentication error: ${e.toString()}',
      };
    }
  }

  // Sign in existing user
  static Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final result = await ApiService.signIn(
        email: email,
        password: password,
      );

      if (result['success'] == true) {
        // Store token and user data
        final data = result['data'];
        if (data['token'] != null) {
          await _storage.write(key: _tokenKey, value: data['token']);
        }
        if (data['user'] != null) {
          await _storage.write(key: _userKey, value: jsonEncode(data['user']));
        }
      }

      return result;
    } catch (e) {
      return {
        'success': false,
        'error': 'Authentication error: ${e.toString()}',
      };
    }
  }

  // Sign out user
  static Future<void> signOut() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }

  // Refresh user profile
  static Future<Map<String, dynamic>> refreshProfile() async {
    try {
      final token = await getToken();
      if (token == null) {
        return {
          'success': false,
          'error': 'No authentication token found',
        };
      }

      final result = await ApiService.getUserProfile(token);
      
      if (result['success'] == true) {
        // Update stored user data
        final userData = result['data'];
        await _storage.write(key: _userKey, value: jsonEncode(userData));
      }

      return result;
    } catch (e) {
      return {
        'success': false,
        'error': 'Profile refresh error: ${e.toString()}',
      };
    }
  }
}