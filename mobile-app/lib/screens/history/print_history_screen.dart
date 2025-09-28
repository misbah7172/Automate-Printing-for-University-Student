import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

class PrintHistoryScreen extends StatefulWidget {
  const PrintHistoryScreen({super.key});

  @override
  State<PrintHistoryScreen> createState() => _PrintHistoryScreenState();
}

class _PrintHistoryScreenState extends State<PrintHistoryScreen> {
  List<Map<String, dynamic>> _printJobs = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPrintHistory();
  }

  Future<void> _loadPrintHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final token = await AuthService.getToken();
      if (token == null) {
        setState(() {
          _error = 'Please login again';
          _isLoading = false;
        });
        return;
      }

      final result = await ApiService.getPrintHistory(token);
      
      if (result['success'] == true) {
        setState(() {
          _printJobs = List<Map<String, dynamic>>.from(result['data'] ?? []);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result['error'] ?? 'Failed to load print history';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: ${e.toString()}';
        _isLoading = false;
      });
    }
  }



  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Icons.check_circle;
      case 'pending':
        return Icons.schedule;
      case 'failed':
      case 'rejected':
        return Icons.error;
      case 'processing':
        return Icons.print;
      default:
        return Icons.help_outline;
    }
  }

  Color _getStatusColorObj(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'failed':
      case 'rejected':
        return Colors.red;
      case 'processing':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Print History'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _loadPrintHistory,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadPrintHistory,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _printJobs.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.print_disabled,
                            size: 64,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'No print jobs yet',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Your print history will appear here',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadPrintHistory,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _printJobs.length,
                        itemBuilder: (context, index) {
                          final job = _printJobs[index];
                          final status = job['status'] ?? 'unknown';
                          final upid = job['upid'] ?? 'N/A';
                          final amount = job['amount']?.toString() ?? '0';
                          final createdAt = job['createdAt'] ?? '';
                          final fileName = job['fileName'] ?? 'Document';
                          final pages = job['pages']?.toString() ?? '0';
                          final isColor = job['isColor'] ?? false;
                          final isDoubleSided = job['isDoubleSided'] ?? false;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Header with status
                                  Row(
                                    children: [
                                      Icon(
                                        _getStatusIcon(status),
                                        color: _getStatusColorObj(status),
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        status.toUpperCase(),
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: _getStatusColorObj(status),
                                          fontSize: 12,
                                        ),
                                      ),
                                      const Spacer(),
                                      Text(
                                        '৳$amount',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 12),
                                  
                                  // File info
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.description,
                                        size: 16,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          fileName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w500,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 8),
                                  
                                  // Print details
                                  Row(
                                    children: [
                                      _buildDetailChip(
                                        '$pages pages',
                                        Icons.article,
                                      ),
                                      const SizedBox(width: 8),
                                      _buildDetailChip(
                                        isColor ? 'Color' : 'B&W',
                                        isColor ? Icons.palette : Icons.circle,
                                      ),
                                      const SizedBox(width: 8),
                                      _buildDetailChip(
                                        isDoubleSided ? 'Double-sided' : 'Single-sided',
                                        Icons.flip_to_back,
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 12),
                                  
                                  // UPID and date
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'UPID',
                                              style: TextStyle(
                                                fontSize: 10,
                                                color: Colors.grey,
                                              ),
                                            ),
                                            Text(
                                              upid,
                                              style: const TextStyle(
                                                fontFamily: 'monospace',
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          const Text(
                                            'Date',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: Colors.grey,
                                            ),
                                          ),
                                          Text(
                                            _formatDate(createdAt),
                                            style: const TextStyle(fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildDetailChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'Unknown';
    }
  }
}