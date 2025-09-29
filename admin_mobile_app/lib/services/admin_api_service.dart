import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/student.dart';
import '../models/print_job.dart';
import '../models/printer_status.dart';
import '../models/dashboard_stats.dart';
import '../config/api_config.dart';

class AdminApiService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  // Authentication
  static Future<String?> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final token = data['token'];
        
        // Store token securely
        await _storage.write(key: 'admin_token', value: token);
        
        return token;
      } else {
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> logout() async {
    await _storage.delete(key: 'admin_token');
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: 'admin_token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Dashboard
  static Future<DashboardStats> getDashboardStats() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/dashboard/stats'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return DashboardStats.fromJson(data);
      } else {
        throw Exception('Failed to load dashboard stats');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<List<PrintJob>> getCurrentQueue() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/queue/current'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((job) => PrintJob.fromJson(job)).toList();
      } else {
        throw Exception('Failed to load current queue');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // User Management
  static Future<List<Student>> getStudents({
    int page = 1,
    int limit = 20,
    String? search,
    String? sortBy,
    String? sortOrder,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (sortBy != null) 'sortBy': sortBy,
        if (sortOrder != null) 'sortOrder': sortOrder,
      };

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/admin/students').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: await _getHeaders());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> students = data['students'] ?? data;
        return students.map((student) => Student.fromJson(student)).toList();
      } else {
        throw Exception('Failed to load students');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> blockUser(String userId, bool block) async {
    try {
      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/students/$userId/block'),
        headers: await _getHeaders(),
        body: json.encode({'blocked': block}),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to ${block ? 'block' : 'unblock'} user');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Payment Management
  static Future<List<PrintJob>> getPendingPayments() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/payments/pending'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((job) => PrintJob.fromJson(job)).toList();
      } else {
        throw Exception('Failed to load pending payments');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> verifyPayment(String jobId, bool approve, {String? notes}) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/payments/$jobId/verify'),
        headers: await _getHeaders(),
        body: json.encode({
          'approve': approve,
          if (notes != null) 'notes': notes,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to verify payment');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Queue Management
  static Future<List<PrintJob>> getFullQueue() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/queue/full'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((job) => PrintJob.fromJson(job)).toList();
      } else {
        throw Exception('Failed to load full queue');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> skipJob(String jobId) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/queue/$jobId/skip'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to skip job');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> cancelJob(String jobId) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/queue/$jobId'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to cancel job');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> requeueJob(String jobId) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/queue/$jobId/requeue'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to requeue job');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> forcePrint(String jobId) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/printer/force-print/$jobId'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to force print job');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Printer Control
  static Future<PrinterStatus> getPrinterStatus() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/printer/status'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return PrinterStatus.fromJson(data);
      } else {
        throw Exception('Failed to load printer status');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> pausePrinting() async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/printer/pause'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to pause printing');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> resumePrinting() async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/printer/resume'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to resume printing');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> cancelCurrentPrint() async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/printer/cancel-current'),
        headers: await _getHeaders(),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to cancel current print');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Reports
  static Future<Map<String, dynamic>> getDailyReport() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/reports/daily'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load daily report');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Map<String, dynamic>> getWeeklyReport() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/reports/weekly'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load weekly report');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Map<String, dynamic>> getMonthlyReport() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/reports/monthly'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load monthly report');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Logs
  static Future<List<Map<String, dynamic>>> getJobLogs({
    int page = 1,
    int limit = 50,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      };

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/admin/logs/jobs').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: await _getHeaders());

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Failed to load job logs');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<List<Map<String, dynamic>>> getErrorLogs({
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/admin/logs/errors').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: await _getHeaders());

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Failed to load error logs');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
