import 'package:flutter/material.dart';
import '../models/admin.dart';
import '../services/admin_api_service.dart';

class AuthProvider with ChangeNotifier {
  Admin? _currentAdmin;
  bool _isLoading = false;
  String? _error;

  Admin? get currentAdmin => _currentAdmin;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentAdmin != null;

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await AdminApiService.login(username, password);
      if (token != null) {
        // Create a temporary admin object until we fetch the real profile
        _currentAdmin = Admin(
          id: '1',
          username: username,
          email: '$username@admin.local',
          role: 'admin',
          createdAt: DateTime.now(),
        );
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Invalid credentials';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await AdminApiService.logout();
      _currentAdmin = null;
      _error = null;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    final token = await AdminApiService.getToken();
    if (token != null) {
      // We have a token, assume we're authenticated
      // In a real app, you'd verify the token with the server
      _currentAdmin = Admin(
        id: '1',
        username: 'admin',
        email: 'admin@admin.local',
        role: 'admin',
        createdAt: DateTime.now(),
      );
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}