import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PrintTrackingScreen extends StatefulWidget {
  const PrintTrackingScreen({super.key});

  @override
  State<PrintTrackingScreen> createState() => _PrintTrackingScreenState();
}

class _PrintTrackingScreenState extends State<PrintTrackingScreen> {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  
  List<Map<String, dynamic>> printJobs = [];
  bool isLoading = true;
  int currentPage = 1;
  int totalPages = 1;
  final int itemsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadPrintJobs();
  }

  Future<void> _loadPrintJobs() async {
    setState(() {
      isLoading = true;
    });

    try {
      final token = await _storage.read(key: 'mongodb_token');
      if (token != null) {
        final result = await ApiService.getPrintJobs(
          token, 
          page: currentPage, 
          limit: itemsPerPage
        );
        
        if (result['success']) {
          setState(() {
            printJobs = List<Map<String, dynamic>>.from(result['jobs'] ?? []);
            totalPages = (result['totalPages'] ?? 1).toInt();
          });
        }
      }
    } catch (e) {
      print('Error loading print jobs: $e');
      _showErrorSnackBar('Failed to load print jobs');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'uploaded':
        return 'Uploaded';
      case 'pending_payment':
        return 'Payment Required';
      case 'payment_verification':
        return 'Verifying Payment';
      case 'queued':
        return 'Queued';
      case 'waiting_confirmation':
        return 'Awaiting Confirmation';
      case 'skipped':
        return 'Skipped';
      case 'printing':
        return 'Printing';
      case 'printed':
        return 'Printed';
      case 'error':
        return 'Error';
      case 'expired':
        return 'Expired';
      default:
        return status.toUpperCase();
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'uploaded':
      case 'pending_payment':
        return Colors.orange;
      case 'payment_verification':
        return Colors.blue;
      case 'queued':
        return Colors.purple;
      case 'waiting_confirmation':
        return Colors.green;
      case 'skipped':
        return Colors.amber;
      case 'printing':
        return Colors.indigo;
      case 'printed':
        return Colors.green;
      case 'error':
      case 'expired':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'uploaded':
        return Icons.cloud_upload;
      case 'pending_payment':
        return Icons.payment;
      case 'payment_verification':
        return Icons.verified;
      case 'queued':
        return Icons.queue;
      case 'waiting_confirmation':
        return Icons.notification_important;
      case 'skipped':
        return Icons.skip_next;
      case 'printing':
        return Icons.print;
      case 'printed':
        return Icons.check_circle;
      case 'error':
        return Icons.error;
      case 'expired':
        return Icons.schedule;
      default:
        return Icons.help;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Print Tracking'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            onPressed: _loadPrintJobs,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadPrintJobs,
        child: Column(
          children: [
            // Summary Card
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).primaryColor,
                    Theme.of(context).primaryColor.withOpacity(0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Your Print Jobs',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Page $currentPage of $totalPages',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${printJobs.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Print Jobs List
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : printJobs.isEmpty
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
                                'No print jobs found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Start by uploading a document',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: printJobs.length,
                          itemBuilder: (context, index) {
                            final job = printJobs[index];
                            return _buildJobCard(job);
                          },
                        ),
            ),

            // Pagination
            if (totalPages > 1) _buildPagination(),
          ],
        ),
      ),
    );
  }

  Widget _buildJobCard(Map<String, dynamic> job) {
    final status = job['status'] ?? 'unknown';
    final fileName = job['fileName'] ?? 'Unknown file';
    final serialNumber = job['serialNumber'];
    final createdAt = job['createdAt'] != null 
        ? DateTime.parse(job['createdAt'])
        : DateTime.now();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getStatusColor(status).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getStatusIcon(status),
            color: _getStatusColor(status),
            size: 24,
          ),
        ),
        title: Text(
          fileName,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getStatusText(status),
                style: TextStyle(
                  color: _getStatusColor(status),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (serialNumber != null) ...[
                  Icon(
                    Icons.confirmation_number,
                    size: 14,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Serial: $serialNumber',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Icon(
                  Icons.schedule,
                  size: 14,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  '${createdAt.day}/${createdAt.month} ${createdAt.hour}:${createdAt.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: status == 'waiting_confirmation'
            ? ElevatedButton(
                onPressed: () => _confirmPrint(job['_id']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(60, 30),
                ),
                child: const Text(
                  'Confirm',
                  style: TextStyle(fontSize: 12),
                ),
              )
            : null,
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: currentPage > 1 ? () => _changePage(currentPage - 1) : null,
            icon: const Icon(Icons.chevron_left),
          ),
          ...List.generate(
            totalPages > 5 ? 5 : totalPages,
            (index) {
              int pageNum;
              if (totalPages <= 5) {
                pageNum = index + 1;
              } else {
                if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
              }
              
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                child: InkWell(
                  onTap: () => _changePage(pageNum),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: currentPage == pageNum
                          ? Theme.of(context).primaryColor
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      pageNum.toString(),
                      style: TextStyle(
                        color: currentPage == pageNum
                            ? Colors.white
                            : Colors.black54,
                        fontWeight: currentPage == pageNum
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          IconButton(
            onPressed: currentPage < totalPages ? () => _changePage(currentPage + 1) : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }

  void _changePage(int newPage) {
    if (newPage >= 1 && newPage <= totalPages && newPage != currentPage) {
      setState(() {
        currentPage = newPage;
      });
      _loadPrintJobs();
    }
  }

  Future<void> _confirmPrint(String jobId) async {
    try {
      final token = await _storage.read(key: 'mongodb_token');
      if (token != null) {
        final result = await ApiService.confirmPrint(token, jobId);
        if (result['success']) {
          _showSuccessSnackBar('Print confirmed successfully');
          _loadPrintJobs(); // Refresh the list
        } else {
          _showErrorSnackBar(result['error'] ?? 'Failed to confirm print');
        }
      }
    } catch (e) {
      _showErrorSnackBar('Error confirming print: $e');
    }
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}