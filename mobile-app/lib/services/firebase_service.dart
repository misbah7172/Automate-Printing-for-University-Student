import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';

class FirebaseService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final GoogleSignIn _googleSignIn = GoogleSignIn();

  // Initialize Firebase services
  static Future<void> initialize() async {
    // Request notification permissions
    await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');

      if (message.notification != null) {
        print('Message also contained a notification: ${message.notification}');
      }
    });
  }

  // Get current user
  static User? get currentUser => _auth.currentUser;

  // Auth state stream
  static Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Email/Password Authentication
  static Future<UserCredential?> signInWithEmail(String email, String password) async {
    try {
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      await _updateUserDocument(userCredential.user!);
      await _updateFCMToken(userCredential.user!);
      
      return userCredential;
    } on FirebaseAuthException catch (e) {
      print('Sign in error: ${e.message}');
      rethrow;
    }
  }

  static Future<UserCredential?> signUpWithEmail(
    String email, 
    String password, 
    Map<String, dynamic> userData
  ) async {
    try {
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update display name
      if (userData['name'] != null) {
        await userCredential.user!.updateDisplayName(userData['name']);
      }
      
      // Create user document
      await _createUserDocument(userCredential.user!, userData);
      await _updateFCMToken(userCredential.user!);
      
      return userCredential;
    } on FirebaseAuthException catch (e) {
      print('Sign up error: ${e.message}');
      rethrow;
    }
  }

  // Google Sign In
  static Future<UserCredential?> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        return null; // User cancelled
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Create a new credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with the Google credential
      UserCredential userCredential = await _auth.signInWithCredential(credential);
      
      // Check if user document exists, create if not
      await _ensureUserDocument(userCredential.user!);
      await _updateFCMToken(userCredential.user!);
      
      return userCredential;
    } catch (e) {
      print('Google sign in error: $e');
      rethrow;
    }
  }

  // Facebook Sign In
  static Future<UserCredential?> signInWithFacebook() async {
    try {
      // Trigger the sign-in flow
      final LoginResult loginResult = await FacebookAuth.instance.login();
      
      if (loginResult.status != LoginStatus.success) {
        return null; // User cancelled or error
      }

      // Create a credential from the access token
      final OAuthCredential facebookAuthCredential = 
          FacebookAuthProvider.credential(loginResult.accessToken!.token);

      // Sign in to Firebase with the Facebook credential
      UserCredential userCredential = await _auth.signInWithCredential(facebookAuthCredential);
      
      // Check if user document exists, create if not
      await _ensureUserDocument(userCredential.user!);
      await _updateFCMToken(userCredential.user!);
      
      return userCredential;
    } catch (e) {
      print('Facebook sign in error: $e');
      rethrow;
    }
  }

  // Password Reset
  static Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      print('Password reset error: ${e.message}');
      rethrow;
    }
  }

  // Sign Out
  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await FacebookAuth.instance.logOut();
      await _auth.signOut();
    } catch (e) {
      print('Sign out error: $e');
      rethrow;
    }
  }

  // Firestore Operations
  static Future<void> _createUserDocument(User user, Map<String, dynamic> additionalData) async {
    final userRef = _firestore.collection('users').doc(user.uid);
    
    final userData = {
      'uid': user.uid,
      'email': user.email,
      'name': user.displayName ?? additionalData['name'] ?? '',
      'role': 'student',
      'upid': additionalData['upid'] ?? '',
      'phone': additionalData['phone'] ?? '',
      'createdAt': FieldValue.serverTimestamp(),
      'lastLogin': FieldValue.serverTimestamp(),
      'fcmToken': await _messaging.getToken(),
      ...additionalData,
    };
    
    await userRef.set(userData);
  }

  static Future<void> _updateUserDocument(User user) async {
    final userRef = _firestore.collection('users').doc(user.uid);
    
    await userRef.update({
      'lastLogin': FieldValue.serverTimestamp(),
    });
  }

  static Future<void> _ensureUserDocument(User user) async {
    final userRef = _firestore.collection('users').doc(user.uid);
    final doc = await userRef.get();
    
    if (!doc.exists) {
      await _createUserDocument(user, {
        'name': user.displayName ?? '',
        'upid': '', // To be filled by user
        'phone': '',
      });
    } else {
      await _updateUserDocument(user);
    }
  }

  static Future<void> _updateFCMToken(User user) async {
    final token = await _messaging.getToken();
    if (token != null) {
      final userRef = _firestore.collection('users').doc(user.uid);
      await userRef.update({'fcmToken': token});
    }
  }

  // Get user document
  static Future<Map<String, dynamic>?> getUserDocument(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      print('Error getting user document: $e');
      return null;
    }
  }

  // Update user document
  static Future<void> updateUserDocument(String uid, Map<String, dynamic> data) async {
    try {
      await _firestore.collection('users').doc(uid).update({
        ...data,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error updating user document: $e');
      rethrow;
    }
  }

  // Get FCM token
  static Future<String?> getFCMToken() async {
    return await _messaging.getToken();
  }
}

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print("Handling a background message: ${message.messageId}");
}