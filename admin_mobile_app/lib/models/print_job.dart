class PrintJob {
  final String id;
  final String userId;
  final String userName;
  final String? docId;
  final String fileName;
  final int pages;
  final double fileSize;
  final String status;
  final int? serialNumber;
  final int? queuePos;
  final String? verifiedBy;
  final DateTime createdAt;
  final DateTime? verifiedAt;
  final DateTime? queuedAt;
  final DateTime? printStartedAt;
  final DateTime? completedAt;
  final List<PrintJobLog> logs;
  final Payment? payment;

  const PrintJob({
    required this.id,
    required this.userId,
    required this.userName,
    this.docId,
    required this.fileName,
    required this.pages,
    required this.fileSize,
    required this.status,
    this.serialNumber,
    this.queuePos,
    this.verifiedBy,
    required this.createdAt,
    this.verifiedAt,
    this.queuedAt,
    this.printStartedAt,
    this.completedAt,
    this.logs = const [],
    this.payment,
  });

  factory PrintJob.fromJson(Map<String, dynamic> json) {
    // Handle userId which might be an object with populated user data
    String userId = '';
    String userName = 'Unknown User';
    
    if (json['userId'] is String) {
      userId = json['userId'];
    } else if (json['userId'] is Map<String, dynamic>) {
      final userObj = json['userId'] as Map<String, dynamic>;
      userId = userObj['_id'] ?? userObj['id'] ?? '';
      // Handle firstName/lastName or name field
      if (userObj['firstName'] != null && userObj['lastName'] != null) {
        userName = '${userObj['firstName']} ${userObj['lastName']}';
      } else if (userObj['name'] != null) {
        userName = userObj['name'];
      }
    }
    
    return PrintJob(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      userName: userName,
      docId: json['docId'] ?? json['documentId'],
      fileName: json['fileName'] ?? '',
      pages: _parseInt(json['pages'] ?? json['totalPages'] ?? json['pagesToPrint']),
      fileSize: _parseDouble(json['fileSize']),
      status: json['status'] ?? 'uploaded',
      serialNumber: _parseIntNullable(json['serialNumber']),
      queuePos: _parseIntNullable(json['queuePos']),
      verifiedBy: json['verifiedBy'],
      createdAt: _parseDateTime(json['createdAt']),
      verifiedAt: _parseDateTimeNullable(json['verifiedAt']),
      queuedAt: _parseDateTimeNullable(json['queuedAt']),
      printStartedAt: _parseDateTimeNullable(json['printStartedAt']),
      completedAt: _parseDateTimeNullable(json['completedAt'] ?? json['printedAt']),
      logs: (json['logs'] as List<dynamic>?)?.map((log) => PrintJobLog.fromJson(log)).toList() ?? [],
      payment: json['payment'] != null ? Payment.fromJson(json['payment']) : null,
    );
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 1;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 1;
    if (value is double) return value.toInt();
    return 1;
  }

  static int? _parseIntNullable(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    if (value is double) return value.toInt();
    return null;
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  static DateTime? _parseDateTimeNullable(dynamic value) {
    if (value == null) return null;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'docId': docId,
      'fileName': fileName,
      'pages': pages,
      'fileSize': fileSize,
      'status': status,
      'serialNumber': serialNumber,
      'queuePos': queuePos,
      'verifiedBy': verifiedBy,
      'createdAt': createdAt.toIso8601String(),
      'verifiedAt': verifiedAt?.toIso8601String(),
      'queuedAt': queuedAt?.toIso8601String(),
      'printStartedAt': printStartedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'logs': logs.map((log) => log.toJson()).toList(),
      'payment': payment?.toJson(),
    };
  }

  bool get isPending => status == 'pending_payment';
  bool get isQueued => status == 'queued';
  bool get isPrinting => status == 'printing';
  bool get isCompleted => status == 'printed';
  bool get hasError => status == 'error';
  bool get isWaitingConfirmation => status == 'waiting_confirmation';
}

class PrintJobLog {
  final String status;
  final DateTime timestamp;
  final String? notes;
  final String? adminId;

  const PrintJobLog({
    required this.status,
    required this.timestamp,
    this.notes,
    this.adminId,
  });

  factory PrintJobLog.fromJson(Map<String, dynamic> json) {
    return PrintJobLog(
      status: json['status'] ?? '',
      timestamp: DateTime.parse(json['timestamp'] ?? json['time'] ?? DateTime.now().toIso8601String()),
      notes: json['notes'],
      adminId: json['adminId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'timestamp': timestamp.toIso8601String(),
      'notes': notes,
      'adminId': adminId,
    };
  }
}

class Payment {
  final String id;
  final String userId;
  final String txId;
  final double amount;
  final String status;
  final String? verifiedBy;
  final DateTime createdAt;
  final DateTime? verifiedAt;

  const Payment({
    required this.id,
    required this.userId,
    required this.txId,
    required this.amount,
    required this.status,
    this.verifiedBy,
    required this.createdAt,
    this.verifiedAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      txId: json['txId'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      verifiedBy: json['verifiedBy'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'txId': txId,
      'amount': amount,
      'status': status,
      'verifiedBy': verifiedBy,
      'createdAt': createdAt.toIso8601String(),
      'verifiedAt': verifiedAt?.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
  bool get isVerified => status == 'verified';
  bool get isRejected => status == 'rejected';
}