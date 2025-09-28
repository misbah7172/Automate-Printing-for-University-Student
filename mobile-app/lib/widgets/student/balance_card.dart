import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../providers/student_provider.dart';

class BalanceCard extends ConsumerStatefulWidget {
  const BalanceCard({super.key});

  @override
  ConsumerState<BalanceCard> createState() => _BalanceCardState();
}

class _BalanceCardState extends ConsumerState<BalanceCard> {
  @override
  void initState() {
    super.initState();
    _loadBalance();
  }

  void _loadBalance() {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      ref.read(balanceProvider.notifier).loadBalance(user.uid);
    }
  }

  @override
  Widget build(BuildContext context) {
    final balance = ref.watch(balanceProvider);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Account Balance',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Icon(
                Icons.account_balance_wallet,
                color: Colors.white.withOpacity(0.8),
                size: 24,
              ),
            ],
          ),
          const SizedBox(height: 12),
          balance.when(
            data: (amount) => Text(
              '\$${amount.toStringAsFixed(2)}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            loading: () => const SizedBox(
              height: 40,
              width: 100,
              child: Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              ),
            ),
            error: (error, stack) => const Text(
              '\$0.00',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showAddBalanceDialog(context),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Balance'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Theme.of(context).primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddBalanceDialog(BuildContext context) {
    final TextEditingController amountController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Add Balance'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  prefixText: '\$',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildQuickAmountButton(amountController, 5.00),
                  _buildQuickAmountButton(amountController, 10.00),
                  _buildQuickAmountButton(amountController, 20.00),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => _addBalance(context, amountController.text),
              child: const Text('Add Balance'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildQuickAmountButton(TextEditingController controller, double amount) {
    return ElevatedButton(
      onPressed: () => controller.text = amount.toStringAsFixed(2),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.grey[200],
        foregroundColor: Colors.black87,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      child: Text('\$${amount.toStringAsFixed(0)}'),
    );
  }

  void _addBalance(BuildContext context, String amountText) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      _showMessage(context, 'Please enter a valid amount');
      return;
    }

    Navigator.of(context).pop();
    
    final success = await ref.read(balanceProvider.notifier).addBalance(user.uid, amount);
    
    if (success) {
      _showMessage(context, 'Balance added successfully!');
    } else {
      _showMessage(context, 'Failed to add balance. Please try again.');
    }
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}