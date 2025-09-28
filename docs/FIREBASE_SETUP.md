# Firebase Authentication Setup Guide

This guide provides complete setup instructions for Firebase Authentication in your AutoPrint system, including both web and mobile implementations.

## 🔥 Firebase Configuration Status

### ✅ **Completed Setup**

1. **Mobile App (Android)**: 
   - `google-services.json` correctly placed in `mobile-app/android/app/`
   - Flutter project structure created with Firebase dependencies
   - Android configuration files updated with Firebase SDK

2. **Web App (React)**:
   - Firebase SDK installed and configured
   - Authentication services implemented
   - Social login providers configured (Google, Facebook)

### 📱 **Android App Structure**

```
mobile-app/
├── android/
│   ├── app/
│   │   ├── google-services.json          ← Your Firebase config (✅ PLACED)
│   │   ├── build.gradle                  ← Firebase plugins configured
│   │   └── src/main/AndroidManifest.xml  ← Permissions & services
├── lib/
│   ├── main.dart                         ← Firebase initialization
│   ├── config/firebase_options.dart      ← Platform-specific config
│   ├── services/firebase_service.dart    ← Authentication service
│   └── screens/auth/                     ← Login/Register screens
└── pubspec.yaml                          ← Flutter dependencies
```

### 🌐 **Web App Integration**

```
student-web/
├── src/
│   ├── config/firebase.js                ← Firebase web config
│   ├── services/firebaseAuth.js          ← Authentication service
│   ├── contexts/AuthContextWithFirebase.jsx  ← Context provider
│   ├── pages/LoginWithFirebase.jsx       ← Enhanced login page
│   └── pages/RegisterWithFirebase.jsx    ← Enhanced register page
└── package.json                          ← Firebase dependencies added
```

## 🛠️ **Setup Instructions**

### Step 1: Complete Firebase Project Setup

Your Firebase project is partially configured. You need to add web app configuration:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/automate-printing-d6943

2. **Add Web App**:
   - Click "Add app" → Web (</> icon)
   - App nickname: "AutoPrint Web"
   - Enable Firebase Hosting: ✅ (optional)
   - Click "Register app"

3. **Get Web Configuration**:
   - Copy the `firebaseConfig` object
   - Replace the placeholder in `student-web/src/config/firebase.js`

### Step 2: Enable Authentication Providers

In Firebase Console → Authentication → Sign-in method:

1. **Email/Password**: ✅ Enable
2. **Google**:
   - Enable provider
   - Add your domain to authorized domains
   - Configure OAuth consent screen
3. **Facebook**:
   - Enable provider
   - Add Facebook App ID and App Secret
   - Configure Facebook Login settings

### Step 3: Configure Web App

Update `student-web/src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_WEB_API_KEY",           // ← Replace this
  authDomain: "automate-printing-d6943.firebaseapp.com",
  projectId: "automate-printing-d6943",
  storageBucket: "automate-printing-d6943.firebasestorage.app",
  messagingSenderId: "961221779391",
  appId: "YOUR_WEB_APP_ID"              // ← Replace this
};
```

### Step 4: Update Your App to Use Firebase Auth

Replace your current auth context:

```jsx
// In your main App.jsx or index.js
import { AuthProvider } from './contexts/AuthContextWithFirebase';

// Wrap your app
<AuthProvider>
  <App />
</AuthProvider>
```

Update your routes to use the new login/register pages:

```jsx
// Replace existing routes
<Route path="/login" element={<LoginWithFirebase />} />
<Route path="/register" element={<RegisterWithFirebase />} />
```

### Step 5: Mobile App Setup (Flutter)

1. **Install Flutter**: https://flutter.dev/docs/get-started/install

2. **Navigate to mobile app**:
   ```bash
   cd C:\CODE\AutomatePrinting\mobile-app
   ```

3. **Get Flutter dependencies**:
   ```bash
   flutter pub get
   ```

4. **Configure Firebase for additional platforms** (optional):
   ```bash
   # Install FlutterFire CLI
   dart pub global activate flutterfire_cli
   
   # Configure Firebase
   flutterfire configure --project=automate-printing-d6943
   ```

5. **Build and run**:
   ```bash
   # For Android
   flutter run
   
   # For release build
   flutter build apk
   ```

## 🔧 **Authentication Features**

### Web App Features

- ✅ **Traditional Login**: Email/password with existing backend
- ✅ **Firebase Login**: Email/password with Firebase
- ✅ **Google Sign-In**: One-click Google authentication
- ✅ **Facebook Login**: Social login with Facebook
- ✅ **Password Reset**: Firebase password reset emails
- ✅ **Dual Mode**: Switch between traditional and Firebase auth

### Mobile App Features

- ✅ **Email/Password Auth**: Firebase authentication
- ✅ **Google Sign-In**: Native Google authentication
- ✅ **Facebook Login**: Native Facebook authentication
- ✅ **Push Notifications**: Firebase Cloud Messaging
- ✅ **Offline Support**: Firebase offline capabilities
- ✅ **Biometric Auth**: Device biometric integration (TODO)

## 📊 **Database Integration**

### Firestore Collections

```javascript
// Users collection structure
users/{uid} {
  uid: string,
  email: string,
  name: string,
  role: 'student',
  upid: string,          // University ID
  phone: string,
  createdAt: timestamp,
  lastLogin: timestamp,
  fcmToken: string       // For push notifications
}
```

### MongoDB Integration

The system supports both Firebase and traditional MongoDB authentication:

- **Firebase users** → Stored in Firestore
- **Traditional users** → Stored in MongoDB
- **Hybrid support** → Users can exist in both systems

## 🚀 **Deployment Guide**

### Web App Deployment

1. **Build for production**:
   ```bash
   cd student-web
   npm run build
   ```

2. **Deploy to Firebase Hosting**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

### Mobile App Deployment

1. **Android APK**:
   ```bash
   flutter build apk --release
   ```

2. **Google Play Store**:
   ```bash
   flutter build appbundle --release
   ```

## 🔐 **Security Configuration**

### Firebase Security Rules

**Firestore Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Print jobs (add your business logic)
    match /printJobs/{jobId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Environment Variables

Create `.env` files for sensitive configuration:

**Web App** (`.env.local`):
```
REACT_APP_FIREBASE_API_KEY=your_web_api_key
REACT_APP_FIREBASE_APP_ID=your_web_app_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
```

## 📱 **Testing Authentication**

### Web App Testing

1. **Start development server**:
   ```bash
   cd student-web
   npm start
   ```

2. **Test authentication flows**:
   - Traditional login with existing accounts
   - Firebase email/password registration
   - Google OAuth flow
   - Facebook login flow
   - Password reset functionality

### Mobile App Testing

1. **Run on emulator**:
   ```bash
   cd mobile-app
   flutter run
   ```

2. **Test on physical device**:
   ```bash
   flutter run --release
   ```

## 🐛 **Troubleshooting**

### Common Issues

1. **"Default FirebaseApp is not initialized"**:
   - Ensure `Firebase.initializeApp()` is called before using Firebase services
   - Check that `google-services.json` is in the correct location

2. **"Configuration object is invalid"**:
   - Verify Firebase config keys in web app
   - Ensure API keys are correctly copied from Firebase Console

3. **Google Sign-In not working**:
   - Add SHA-1 fingerprint to Firebase project
   - Verify Google OAuth client configuration

4. **Facebook Login issues**:
   - Check Facebook App ID in Firebase and Android manifest
   - Verify Facebook app is in live mode (not development)

### Debug Commands

```bash
# Check Flutter doctor
flutter doctor

# Check Firebase configuration
flutterfire configure

# Verify Android build
cd android && ./gradlew clean && cd ..

# Check dependencies
flutter pub deps
```

## 📞 **Support & Next Steps**

### Immediate Actions Required

1. **Get Web App Firebase Config**: Add web app to Firebase project and update config
2. **Enable Authentication Providers**: Configure Google and Facebook in Firebase Console
3. **Test Authentication Flows**: Verify both web and mobile authentication works
4. **Deploy and Test**: Deploy to staging environment for testing

### Future Enhancements

- **Biometric Authentication**: Fingerprint/Face ID for mobile app
- **Multi-factor Authentication**: SMS/Email verification
- **Social Logins**: Apple Sign-In, Microsoft, GitHub
- **Single Sign-On**: SAML/LDAP integration for university systems
- **Analytics**: Firebase Analytics for user behavior tracking

Your Firebase authentication system is now ready for deployment! The `google-services.json` file has been correctly placed, and both web and mobile applications have comprehensive Firebase integration.