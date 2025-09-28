import 'api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PaymentService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  
  // bKash merchant details - update these with your actual details
  static const String bkashMerchantNumber = '01712345678'; // Your bKash number
  static const String bkashQRCode = 'your_bkash_qr_code_data'; // Your QR code data

  // Submit payment with Transaction ID
  static Future<Map<String, dynamic>> submitPayment({
    required String txId,
    required double amount,
    required String documentId,
  }) async {
    try {
      final token = await _storage.read(key: 'mongodb_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'User not authenticated',
        };
      }

      final result = await ApiService.submitPayment(
        token: token,
        txId: txId,
        amount: amount.toString(),
        documentId: documentId,
      );

      return result;
    } catch (e) {
      return {
        'success': false,
        'error': 'Payment submission error: ${e.toString()}',
      };
    }
  }

  // Get payment instructions
  static Map<String, String> getPaymentInstructions(double amount) {
    return {
      'merchantNumber': bkashMerchantNumber,
      'amount': amount.toStringAsFixed(2),
      'instructions': '''
📱 bKash Payment Instructions:

1. Open your bKash app
2. Tap "Send Money"
3. Enter merchant number: $bkashMerchantNumber
4. Enter amount: ৳${amount.toStringAsFixed(2)}
5. Complete the payment
6. Copy the Transaction ID (TxID) from SMS
7. Return to app and enter the TxID

Or scan the QR code below for quick payment.
      ''',
    };
  }

  // Validate transaction ID format
  static bool isValidTxId(String txId) {
    // bKash Transaction ID format: Usually starts with BK or similar, followed by numbers
    // Example: BKD1234567890, BK123456789, etc.
    if (txId.isEmpty || txId.length < 6) return false;
    
    // Check if it contains at least some numbers
    final hasNumbers = RegExp(r'\d').hasMatch(txId);
    final hasLetters = RegExp(r'[A-Za-z]').hasMatch(txId);
    
    return hasNumbers && hasLetters && txId.length >= 6 && txId.length <= 20;
  }

  // Calculate print cost based on settings
  static double calculatePrintCost({
    required int pages,
    required bool isColor,
    required bool isDoubleSided,
    String paperSize = 'A4',
  }) {
    // Base costs (update with your actual pricing)
    double baseCostPerPage = 2.0; // ৳2 per page for black & white
    double colorMultiplier = 3.0; // 3x cost for color
    double doubleSidedDiscount = 0.8; // 20% discount for double-sided
    
    double totalCost = pages * baseCostPerPage;
    
    if (isColor) {
      totalCost *= colorMultiplier;
    }
    
    if (isDoubleSided) {
      totalCost *= doubleSidedDiscount;
    }
    
    // Add paper size cost if not A4
    if (paperSize != 'A4') {
      totalCost *= 1.5; // 50% extra for non-A4 sizes
    }
    
    return totalCost;
  }

  // Payment status tracking
  static Future<Map<String, dynamic>> checkPaymentStatus(String paymentId) async {
    try {
      final token = await _storage.read(key: 'mongodb_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'User not authenticated',
        };
      }

      // This would call your backend to check payment status
      // For now, returning a placeholder
      return {
        'success': true,
        'data': {
          'status': 'pending', // pending, verified, rejected
          'txId': '',
          'amount': 0.0,
          'verifiedAt': null,
        },
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Status check error: ${e.toString()}',
      };
    }
  }
}