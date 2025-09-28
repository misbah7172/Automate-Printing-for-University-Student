class CurrentJob {
  final String id;
  final String fileName;
  final String studentName;
  final int progress;
  final DateTime startedAt;

  const CurrentJob({
    required this.id,
    required this.fileName,
    required this.studentName,
    required this.progress,
    required this.startedAt,
  });

  factory CurrentJob.fromJson(Map<String, dynamic> json) {
    return CurrentJob(
      id: json['id'] ?? '',
      fileName: json['fileName'] ?? '',
      studentName: json['studentName'] ?? '',
      progress: json['progress'] ?? 0,
      startedAt: DateTime.parse(json['startedAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class PrinterStatus {
  final String status; // 'idle', 'printing', 'error', 'offline'
  final CurrentJob? currentJob;
  final int queueCount;
  final int paperLevel;
  final int inkLevel;
  final String? lastError;
  final int uptime;

  const PrinterStatus({
    required this.status,
    this.currentJob,
    required this.queueCount,
    required this.paperLevel,
    required this.inkLevel,
    this.lastError,
    required this.uptime,
  });

  factory PrinterStatus.fromJson(Map<String, dynamic> json) {
    return PrinterStatus(
      status: json['status'] ?? 'offline',
      currentJob: json['currentJob'] != null 
          ? CurrentJob.fromJson(json['currentJob']) 
          : null,
      queueCount: json['queueCount'] ?? 0,
      paperLevel: json['paperLevel'] ?? 0,
      inkLevel: json['inkLevel'] ?? 0,
      lastError: json['lastError'],
      uptime: json['uptime'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'currentJob': currentJob?.toJson(),
      'queueCount': queueCount,
      'paperLevel': paperLevel,
      'inkLevel': inkLevel,
      'lastError': lastError,
      'uptime': uptime,
    };
  }

  bool get isOnline => status != 'offline';
  bool get isIdle => status == 'idle';
  bool get isPrinting => status == 'printing';
  bool get hasError => status == 'error';
}

extension CurrentJobExtension on CurrentJob {
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fileName': fileName,
      'studentName': studentName,
      'progress': progress,
      'startedAt': startedAt.toIso8601String(),
    };
  }
}