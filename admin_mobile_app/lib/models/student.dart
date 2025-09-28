class Student {
  final String id;
  final String name;
  final String email;
  final String? studentId;
  final String? photoUrl;
  final bool isBlocked;
  final DateTime createdAt;
  final DateTime? lastLoginAt;
  final int totalPrintJobs;
  final int totalPages;
  final double totalSpent;

  const Student({
    required this.id,
    required this.name,
    required this.email,
    this.studentId,
    this.photoUrl,
    this.isBlocked = false,
    required this.createdAt,
    this.lastLoginAt,
    this.totalPrintJobs = 0,
    this.totalPages = 0,
    this.totalSpent = 0.0,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? json['displayName'] ?? '',
      email: json['email'] ?? '',
      studentId: json['studentId'],
      photoUrl: json['photoUrl'],
      isBlocked: json['isBlocked'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      lastLoginAt: json['lastLoginAt'] != null ? DateTime.parse(json['lastLoginAt']) : null,
      totalPrintJobs: json['totalPrintJobs'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'studentId': studentId,
      'photoUrl': photoUrl,
      'isBlocked': isBlocked,
      'createdAt': createdAt.toIso8601String(),
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'totalPrintJobs': totalPrintJobs,
      'totalPages': totalPages,
      'totalSpent': totalSpent,
    };
  }
}