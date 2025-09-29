import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

class PrintService {

  static Future<Map<String, dynamic>?> submitPrintJob({
    required String studentId,
    required String fileName,
    required String fileUrl,
    required Map<String, dynamic> printSettings,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/student/print-job'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'studentId': studentId,
          'fileName': fileName,
          'fileUrl': fileUrl,
          'printSettings': printSettings,
          'timestamp': DateTime.now().toIso8601String(),
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

  static Future<bool> cancelPrintJob(String jobId) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.apiUrl}/student/print-job/$jobId'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error cancelling print job: $e');
      return false;
    }
  }

  static Future<List<Map<String, dynamic>>> getAvailablePrinters() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/printers'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['printers'] ?? []);
      }
      return [];
    } catch (e) {
      print('Error getting printers: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>?> getPrinterStatus(String printerId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/printer/$printerId/status'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error getting printer status: $e');
      return null;
    }
  }

  static double calculateCost({
    required int pages,
    required int copies,
    required bool isColorPrint,
    required bool isDoubleSided,
  }) {
    final double baseCostPerPage = isColorPrint ? 0.25 : 0.10;
    final int totalPages = pages * copies;
    final int actualSheets = isDoubleSided ? (totalPages / 2).ceil() : totalPages;
    
    return baseCostPerPage * actualSheets;
  }
}
