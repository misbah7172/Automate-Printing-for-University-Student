import 'package:flutter/material.dart';

class Announcements extends StatelessWidget {
  const Announcements({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock announcements data
    final announcements = [
      {
        'title': 'System Maintenance',
        'message': 'Printing services will be temporarily unavailable on Sunday from 2-4 AM.',
        'type': 'warning',
        'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
      },
      {
        'title': 'New Printer Added',
        'message': 'A new color printer has been installed in the library. Location: LIB-201',
        'type': 'info',
        'timestamp': DateTime.now().subtract(const Duration(days: 1)),
      },
      {
        'title': 'Free Printing Week',
        'message': 'Get 20 free black & white pages this week! Valid until Friday.',
        'type': 'success',
        'timestamp': DateTime.now().subtract(const Duration(days: 2)),
      },
    ];

    return Container(
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
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Announcements',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () {
                    // Navigate to all announcements
                  },
                  icon: const Icon(Icons.more_horiz),
                ),
              ],
            ),
          ),
          ...announcements.map((announcement) => _buildAnnouncementItem(announcement)),
        ],
      ),
    );
  }

  Widget _buildAnnouncementItem(Map<String, dynamic> announcement) {
    final type = announcement['type'] as String;
    final title = announcement['title'] as String;
    final message = announcement['message'] as String;
    final timestamp = announcement['timestamp'] as DateTime;

    Color typeColor;
    IconData typeIcon;

    switch (type) {
      case 'warning':
        typeColor = Colors.orange;
        typeIcon = Icons.warning_rounded;
        break;
      case 'success':
        typeColor = Colors.green;
        typeIcon = Icons.celebration;
        break;
      case 'info':
      default:
        typeColor = Colors.blue;
        typeIcon = Icons.info_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.2),
            width: 1,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: typeColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              typeIcon,
              size: 16,
              color: typeColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: TextStyle(
                    color: Colors.grey[700],
                    fontSize: 13,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _formatTimestamp(timestamp),
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}