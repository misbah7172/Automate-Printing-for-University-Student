import 'package:flutter/material.dart';

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final actions = [
      QuickAction(
        icon: Icons.people,
        label: 'Manage Users',
        color: Colors.blue,
        onTap: () {
          // Navigate to users screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Navigate to Users screen')),
          );
        },
      ),
      QuickAction(
        icon: Icons.payment,
        label: 'Verify Payments',
        color: Colors.orange,
        onTap: () {
          // Navigate to payments screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Navigate to Payments screen')),
          );
        },
      ),
      QuickAction(
        icon: Icons.queue,
        label: 'Manage Queue',
        color: Colors.purple,
        onTap: () {
          // Navigate to queue screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Navigate to Queue screen')),
          );
        },
      ),
      QuickAction(
        icon: Icons.print,
        label: 'Printer Control',
        color: Colors.green,
        onTap: () {
          // Navigate to printer control screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Navigate to Printer Control screen')),
          );
        },
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: actions.map((action) => _buildActionCard(context, action)).toList(),
    );
  }

  Widget _buildActionCard(BuildContext context, QuickAction action) {
    return Card(
      child: InkWell(
        onTap: action.onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: action.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  action.icon,
                  size: 32,
                  color: action.color,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                action.label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}