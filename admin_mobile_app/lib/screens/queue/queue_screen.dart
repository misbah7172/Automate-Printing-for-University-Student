import 'package:flutter/material.dart';
import '../../models/print_job.dart';
import '../../services/admin_api_service.dart';

class QueueScreen extends StatefulWidget {
  const QueueScreen({super.key});

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  List<PrintJob> _queuedJobs = [];
  PrintJob? _currentJob;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQueue();
  }

  Future<void> _loadQueue() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final queue = await AdminApiService.getFullQueue();
      setState(() {
        _queuedJobs = queue;
        _currentJob = queue.isNotEmpty && queue.first.isPrinting ? queue.first : null;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _skipJob(String jobId) async {
    try {
      await AdminApiService.skipJob(jobId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job skipped successfully'),
          backgroundColor: Colors.orange,
        ),
      );
      _loadQueue();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _cancelJob(String jobId) async {
    try {
      await AdminApiService.cancelJob(jobId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job cancelled successfully'),
          backgroundColor: Colors.red,
        ),
      );
      _loadQueue();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _requeueJob(String jobId) async {
    try {
      await AdminApiService.requeueJob(jobId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job requeued successfully'),
          backgroundColor: Colors.green,
        ),
      );
      _loadQueue();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _forcePrint(String jobId) async {
    try {
      await AdminApiService.forcePrint(jobId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job sent to printer'),
          backgroundColor: Colors.blue,
        ),
      );
      _loadQueue();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Queue Management'),
        actions: [
          IconButton(
            icon: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _loadQueue,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadQueue,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading queue',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadQueue,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_queuedJobs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.queue, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Queue is Empty',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'No print jobs in queue at the moment',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Current Job Panel
        if (_currentJob != null) _buildCurrentJobPanel(),
        
        // Queue List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _queuedJobs.length,
            itemBuilder: (context, index) {
              final job = _queuedJobs[index];
              return _buildQueueJobCard(job, index + 1);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCurrentJobPanel() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green[400]!, Colors.green[600]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.print, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              const Text(
                'Currently Printing',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withOpacity(0.5),
                      blurRadius: 6,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                backgroundColor: Colors.white.withOpacity(0.2),
                child: Text(
                  _currentJob!.userName.substring(0, 1).toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _currentJob!.userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      _currentJob!.fileName,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQueueJobCard(PrintJob job, int position) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: position <= 3 ? Colors.blue : Colors.grey[300],
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      position.toString(),
                      style: TextStyle(
                        color: position <= 3 ? Colors.white : Colors.grey[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                CircleAvatar(
                  backgroundColor: const Color(0xFF3F51B5),
                  radius: 20,
                  child: Text(
                    job.userName.substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        job.userName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        job.fileName,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                _buildStatusChip(job.status),
              ],
            ),
            const SizedBox(height: 12),

            // Job details
            Row(
              children: [
                Icon(Icons.description, size: 16, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(
                  '${job.pages} pages',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                if (job.serialNumber != null) ...[
                  const SizedBox(width: 16),
                  Icon(Icons.tag, size: 16, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    'Serial #${job.serialNumber}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
                const Spacer(),
                PopupMenuButton<String>(
                  onSelected: (action) => _handleJobAction(action, job.id),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'skip',
                      child: Row(
                        children: [
                          Icon(Icons.skip_next, size: 20),
                          SizedBox(width: 8),
                          Text('Skip Job'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'force_print',
                      child: Row(
                        children: [
                          Icon(Icons.fast_forward, size: 20),
                          SizedBox(width: 8),
                          Text('Force Print'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'requeue',
                      child: Row(
                        children: [
                          Icon(Icons.refresh, size: 20),
                          SizedBox(width: 8),
                          Text('Requeue'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'cancel',
                      child: Row(
                        children: [
                          Icon(Icons.cancel, size: 20, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Cancel Job', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;

    switch (status.toLowerCase()) {
      case 'queued':
        color = Colors.blue;
        label = 'Queued';
        break;
      case 'printing':
        color = Colors.green;
        label = 'Printing';
        break;
      case 'waiting_confirmation':
        color = Colors.orange;
        label = 'Waiting';
        break;
      case 'error':
        color = Colors.red;
        label = 'Error';
        break;
      default:
        color = Colors.grey;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  void _handleJobAction(String action, String jobId) {
    switch (action) {
      case 'skip':
        _showConfirmDialog(
          'Skip Job',
          'Are you sure you want to skip this job? It will be moved to the end of the queue.',
          () => _skipJob(jobId),
        );
        break;
      case 'force_print':
        _showConfirmDialog(
          'Force Print',
          'Are you sure you want to force print this job immediately?',
          () => _forcePrint(jobId),
        );
        break;
      case 'requeue':
        _showConfirmDialog(
          'Requeue Job',
          'Are you sure you want to requeue this job?',
          () => _requeueJob(jobId),
        );
        break;
      case 'cancel':
        _showConfirmDialog(
          'Cancel Job',
          'Are you sure you want to cancel this job? This action cannot be undone.',
          () => _cancelJob(jobId),
          isDestructive: true,
        );
        break;
    }
  }

  void _showConfirmDialog(String title, String content, VoidCallback onConfirm, {bool isDestructive = false}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              onConfirm();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isDestructive ? Colors.red : null,
            ),
            child: Text(isDestructive ? 'Delete' : 'Confirm'),
          ),
        ],
      ),
    );
  }
}