class DashboardStats {
  final int pendingPayments;
  final int jobsInQueue;
  final int jobsPrinting;
  final int completedToday;
  final int skippedFailed;
  final double todayRevenue;
  final int totalStudents;
  final int activeStudents;

  const DashboardStats({
    this.pendingPayments = 0,
    this.jobsInQueue = 0,
    this.jobsPrinting = 0,
    this.completedToday = 0,
    this.skippedFailed = 0,
    this.todayRevenue = 0.0,
    this.totalStudents = 0,
    this.activeStudents = 0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      pendingPayments: _parseInt(json['pendingPayments']),
      jobsInQueue: _parseInt(json['jobsInQueue']),
      jobsPrinting: _parseInt(json['jobsPrinting']),
      completedToday: _parseInt(json['completedToday']),
      skippedFailed: _parseInt(json['skippedFailed']),
      todayRevenue: _parseDouble(json['todayRevenue']),
      totalStudents: _parseInt(json['totalStudents']),
      activeStudents: _parseInt(json['activeStudents']),
    );
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  Map<String, dynamic> toJson() {
    return {
      'pendingPayments': pendingPayments,
      'jobsInQueue': jobsInQueue,
      'jobsPrinting': jobsPrinting,
      'completedToday': completedToday,
      'skippedFailed': skippedFailed,
      'todayRevenue': todayRevenue,
      'totalStudents': totalStudents,
      'activeStudents': activeStudents,
    };
  }
}