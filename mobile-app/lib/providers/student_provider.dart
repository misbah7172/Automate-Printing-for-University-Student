import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/student_service.dart';

// Student state notifier
class StudentNotifier extends StateNotifier<AsyncValue<Map<String, dynamic>?>> {
  StudentNotifier() : super(const AsyncValue.loading());

  Future<void> loadStudentData(String uid) async {
    state = const AsyncValue.loading();
    try {
      final data = await StudentService.getStudentData(uid);
      state = AsyncValue.data(data);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> refreshData() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      await loadStudentData(user.uid);
    }
  }
}

// Balance state notifier
class BalanceNotifier extends StateNotifier<AsyncValue<double>> {
  BalanceNotifier() : super(const AsyncValue.loading());

  Future<void> loadBalance(String uid) async {
    state = const AsyncValue.loading();
    try {
      final balance = await StudentService.getBalance(uid);
      state = AsyncValue.data(balance);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<bool> addBalance(String uid, double amount) async {
    try {
      final success = await StudentService.addBalance(uid, amount);
      if (success) {
        await loadBalance(uid);
      }
      return success;
    } catch (error) {
      return false;
    }
  }
}

// Print history state notifier
class PrintHistoryNotifier extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>> {
  PrintHistoryNotifier() : super(const AsyncValue.loading());

  Future<void> loadHistory(String uid) async {
    state = const AsyncValue.loading();
    try {
      final history = await StudentService.getPrintHistory(uid);
      state = AsyncValue.data(history);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

// Print queue state notifier
class PrintQueueNotifier extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>> {
  PrintQueueNotifier() : super(const AsyncValue.loading());

  Future<void> loadQueue(String uid) async {
    state = const AsyncValue.loading();
    try {
      final queue = await StudentService.getPrintQueue(uid);
      state = AsyncValue.data(queue);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

// Providers
final studentProvider = StateNotifierProvider<StudentNotifier, AsyncValue<Map<String, dynamic>?>>((ref) {
  return StudentNotifier();
});

final balanceProvider = StateNotifierProvider<BalanceNotifier, AsyncValue<double>>((ref) {
  return BalanceNotifier();
});

final printHistoryProvider = StateNotifierProvider<PrintHistoryNotifier, AsyncValue<List<Map<String, dynamic>>>>((ref) {
  return PrintHistoryNotifier();
});

final printQueueProvider = StateNotifierProvider<PrintQueueNotifier, AsyncValue<List<Map<String, dynamic>>>>((ref) {
  return PrintQueueNotifier();
});