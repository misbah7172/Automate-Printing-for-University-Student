import 'package:flutter/material.dart';
import '../models/dashboard_stats.dart';
import '../models/print_job.dart';
import '../models/printer_status.dart';
import '../services/admin_api_service.dart';

class DashboardProvider with ChangeNotifier {
  DashboardStats? _stats;
  List<PrintJob> _currentQueue = [];
  PrinterStatus? _printerStatus;
  bool _isLoading = false;
  String? _error;

  DashboardStats? get stats => _stats;
  List<PrintJob> get currentQueue => _currentQueue;
  PrinterStatus? get printerStatus => _printerStatus;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> refreshDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Load all dashboard data in parallel
      final futures = await Future.wait([
        AdminApiService.getDashboardStats(),
        AdminApiService.getCurrentQueue(),
        AdminApiService.getPrinterStatus(),
      ]);

      _stats = futures[0] as DashboardStats;
      _currentQueue = futures[1] as List<PrintJob>;
      _printerStatus = futures[2] as PrinterStatus;
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshStats() async {
    try {
      _stats = await AdminApiService.getDashboardStats();
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<void> refreshQueue() async {
    try {
      _currentQueue = await AdminApiService.getCurrentQueue();
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<void> refreshPrinterStatus() async {
    try {
      _printerStatus = await AdminApiService.getPrinterStatus();
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}