import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../screens/print/print_tracking_screen.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PrintTrackingCard extends StatefulWidget {
  const PrintTrackingCard({super.key});

  @override
  State<PrintTrackingCard> createState() => _PrintTrackingCardState();
}

class _PrintTrackingCardState extends State<PrintTrackingCard> {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  Map<String, dynamic>? currentJob;
  int currentSerial = 0;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCurrentJob();
  }

  Future<void> _loadCurrentJob() async {
    setState(() {
      isLoading = true;
    });

    try {
      final token = await _storage.read(key: 'mongodb_token');
      if (token != null) {
        // Get current print job status
        final result = await ApiService.getCurrentPrintJob(token);
        if (result['success']) {
          setState(() {
            currentJob = result['job'];
            currentSerial = result['currentSerial'] ?? 0;
          });
        }
      }
    } catch (e) {
      print('Error loading current job: $e');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  String _getStatusText() {
    if (currentJob == null) return 'No active prints';
    
    final status = currentJob!['status'] ?? 'unknown';
    final serialNumber = currentJob!['serialNumber'];
    
    switch (status) {
      case 'uploaded':
        return 'File uploaded, awaiting payment';
      case 'pending_payment':
        return 'Payment required';
      case 'payment_verification':
        return 'Verifying payment...';
      case 'queued':
        return 'Serial #$serialNumber - Queued';
      case 'waiting_confirmation':
        return 'Your turn! Confirm now';
      case 'skipped':
        return 'Skipped - Back in queue';
      case 'printing':
        return 'Printing in progress...';
      case 'printed':
        return 'Ready for collection!';
      case 'error':
        return 'Print error occurred';
      case 'expired':
        return 'Job expired';
      default:
        return 'Status: $status';
    }
  }

  Color _getStatusColor() {
    if (currentJob == null) return Colors.grey;
    
    final status = currentJob!['status'] ?? 'unknown';
    
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

  IconData _getStatusIcon() {
    if (currentJob == null) return Icons.print_disabled;
    
    final status = currentJob!['status'] ?? 'unknown';
    
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
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const PrintTrackingScreen(),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              _getStatusColor(),
              _getStatusColor().withOpacity(0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getStatusIcon(),
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Print Tracking',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (isLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      strokeWidth: 2,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              _getStatusText(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    icon: Icons.format_list_numbered,
                    label: 'Current Serial',
                    value: currentSerial.toString(),
                  ),
                ),
                if (currentJob != null && currentJob!['serialNumber'] != null)
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.confirmation_number,
                      label: 'Your Serial',
                      value: currentJob!['serialNumber'].toString(),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            const Row(
              children: [
                Icon(
                  Icons.touch_app,
                  color: Colors.white70,
                  size: 16,
                ),
                SizedBox(width: 4),
                Text(
                  'Tap to view all prints',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              icon,
              color: Colors.white70,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}