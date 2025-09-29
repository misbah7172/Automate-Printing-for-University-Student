import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiService {
  // Authentication endpoints
  static Future<Map<String, dynamic>> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String studentId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/auth/register'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          'studentId': studentId,
          'role': 'student',
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/auth/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // User profile
  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/user/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to fetch profile',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Payment endpoints
  static Future<Map<String, dynamic>> submitPayment({
    required String token,
    required String txId,
    required String amount,
    required String documentId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/payment/submit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'txId': txId,
          'amount': amount,
          'documentId': documentId,
          'paymentMethod': 'bkash',
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Payment submission failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Print job endpoints
  static Future<Map<String, dynamic>> createPrintJob({
    required String token,
    required String documentPath,
    required Map<String, dynamic> printSettings,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.apiUrl}/print/create'),
      );
      
      request.headers['Authorization'] = 'Bearer $token';
      
      // Add document file
      request.files.add(await http.MultipartFile.fromPath(
        'document',
        documentPath,
      ));
      
      // Add print settings
      request.fields['printSettings'] = jsonEncode(printSettings);
      
      final response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final data = jsonDecode(responseBody);
      
      if (response.statusCode == 201) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to create print job',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get print queue
  static Future<Map<String, dynamic>> getPrintQueue(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/print/queue'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to fetch queue',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get print history
  static Future<Map<String, dynamic>> getPrintHistory(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/print/history'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to fetch history',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get current print job
  static Future<Map<String, dynamic>> getCurrentPrintJob(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/print/current'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'job': data['job'],
          'currentSerial': data['currentSerial'],
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to fetch current job',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get print jobs with pagination
  static Future<Map<String, dynamic>> getPrintJobs(String token, {int page = 1, int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/print/jobs?page=$page&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'jobs': data['jobs'],
          'currentPage': data['currentPage'],
          'totalPages': data['totalPages'],
          'totalJobs': data['totalJobs'],
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to fetch print jobs',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Confirm print job
  static Future<Map<String, dynamic>> confirmPrint(String token, String jobId) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/print/confirm/$jobId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to confirm print',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }
}
