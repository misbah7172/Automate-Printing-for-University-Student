import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class FirebaseAuthService {
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static final GoogleSignIn _googleSignIn = GoogleSignIn();

  // Get current Firebase user
  static User? get currentUser => _auth.currentUser;

  // Check if user is logged in
  static bool get isLoggedIn => _auth.currentUser != null;

  // Auth state stream
  static Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Check if email is university email (ends with ac.bd)
  static bool _isUniversityEmail(String email) {
    return email.toLowerCase().endsWith('ac.bd');
  }

  // Sign in with Google (Only university emails allowed)
  static Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      // Sign out from Google first to ensure account selection
      await _googleSignIn.signOut();
      
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return {'success': false, 'error': 'Google sign in cancelled'};
      }

      // Check if email is university email
      if (!_isUniversityEmail(googleUser.email)) {
        await _googleSignIn.signOut();
        return {
          'success': false, 
          'error': 'Only university emails ending with "ac.bd" are allowed. Please use your university email.'
        };
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Create a new credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with the Google credential
      final UserCredential result = await _auth.signInWithCredential(credential);
      final User? user = result.user;

      if (user == null) {
        return {'success': false, 'error': 'Google sign in failed'};
      }

      // Get Firebase ID token
      final String? idToken = await user.getIdToken();

      // Check or create user in MongoDB
      final mongoResult = await _syncUserToMongoDB(
        firebaseUid: user.uid,
        email: user.email!,
        name: user.displayName ?? 'Unknown User',
        photoUrl: user.photoURL,
        idToken: idToken,
      );

      if (!mongoResult['success']) {
        await signOut();
        return mongoResult;
      }

      // Store tokens securely
      await _storage.write(key: 'firebase_token', value: idToken);
      await _storage.write(key: 'mongodb_token', value: mongoResult['token']);
      await _storage.write(key: 'user_data', value: jsonEncode(mongoResult['user']));

      return {
        'success': true,
        'user': mongoResult['user'],
        'firebase_user': user,
      };
    } on FirebaseAuthException catch (e) {
      await _googleSignIn.signOut();
      return {'success': false, 'error': _getFirebaseErrorMessage(e)};
    } catch (e) {
      await _googleSignIn.signOut();
      return {'success': false, 'error': 'Google sign in failed: ${e.toString()}'};
    }
  }

  // Sync user to MongoDB
  static Future<Map<String, dynamic>> _syncUserToMongoDB({
    required String firebaseUid,
    required String email,
    required String name,
    String? photoUrl,
    String? idToken,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google-signin'),
        headers: {
          'Content-Type': 'application/json',
          if (idToken != null) 'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'firebaseUid': firebaseUid,
          'email': email,
          'name': name,
          'photoUrl': photoUrl,
          'authProvider': 'google',
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'user': data['user'],
          'token': data['token'],
          'isNewUser': data['isNewUser'] ?? false,
        };
      } else {
        return {
          'success': false,
          'error': data['message'] ?? 'Failed to sync with database',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Database connection failed: ${e.toString()}',
      };
    }
  }

  // Get user data from MongoDB
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final userData = await _storage.read(key: 'user_data');
      if (userData != null) {
        return jsonDecode(userData);
      }

      // If not in storage, fetch from MongoDB
      final token = await _storage.read(key: 'mongodb_token');
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/auth/profile'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storage.write(key: 'user_data', value: jsonEncode(data['user']));
        return data['user'];
      }
    } catch (e) {
      print('Error getting user data: $e');
    }
    return null;
  }

  // Sign out
  static Future<void> signOut() async {
    try {
      // Clear secure storage
      await _storage.deleteAll();
      
      // Sign out from Google
      await _googleSignIn.signOut();
      
      // Sign out from Firebase
      await _auth.signOut();
    } catch (e) {
      print('Sign out error: $e');
    }
  }

  // Get Firebase error message
  static String _getFirebaseErrorMessage(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No user found for that email.';
      case 'wrong-password':
        return 'Wrong password provided.';
      case 'user-disabled':
        return 'User account has been disabled.';
      case 'too-many-requests':
        return 'Too many requests. Try again later.';
      case 'operation-not-allowed':
        return 'Signing in with Email and Password is not enabled.';
      case 'account-exists-with-different-credential':
        return 'Account exists with different credentials.';
      case 'invalid-credential':
        return 'The credential received is invalid.';
      default:
        return e.message ?? 'An unknown error occurred.';
    }
  }

  // Initialize Firebase (if needed)
  static Future<void> initialize() async {
    // Firebase is automatically initialized with Firebase.initializeApp()
    // This method can be used for any additional setup if needed
  }
}