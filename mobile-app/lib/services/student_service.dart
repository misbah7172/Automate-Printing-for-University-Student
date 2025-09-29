import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

class StudentService {

  static Future<Map<String, dynamic>?> getStudentData(String uid) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/student/$uid'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error getting student data: $e');
      return null;
    }
  }

  static Future<double> getBalance(String uid) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/student/$uid/balance'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['balance'] ?? 0.0).toDouble();
      }
      return 0.0;
    } catch (e) {
      print('Error getting balance: $e');
      return 0.0;
    }
  }

  static Future<List<Map<String, dynamic>>> getPrintHistory(String uid) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/student/$uid/history'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['history'] ?? []);
      }
      return [];
    } catch (e) {
      print('Error getting print history: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getPrintQueue(String uid) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/student/$uid/queue'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['queue'] ?? []);
      }
      return [];
    } catch (e) {
      print('Error getting print queue: $e');
      return [];
    }
  }

  static Future<bool> addBalance(String uid, double amount) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/student/$uid/add-balance'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'amount': amount}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error adding balance: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> submitPrintJob({
    required String uid,
    required String fileName,
    required String fileUrl,
    required Map<String, dynamic> printSettings,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/student/print-job'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'studentId': uid,
          'fileName': fileName,
          'fileUrl': fileUrl,
          'printSettings': printSettings,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error submitting print job: $e');
      return null;
    }
  }
}

// Provider for student service
final studentServiceProvider = Provider<StudentService>((ref) {
  return StudentService();
});
