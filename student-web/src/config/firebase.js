// Firebase configuration for Web App
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your web app's Firebase configuration
// You need to add a web app to your Firebase project to get these credentials
const firebaseConfig = {
  apiKey: "YOUR_WEB_API_KEY", // Different from the Android API key in google-services.json
  authDomain: "automate-printing-d6943.firebaseapp.com",
  projectId: "automate-printing-d6943",
  storageBucket: "automate-printing-d6943.firebasestorage.app",
  messagingSenderId: "961221779391",
  appId: "YOUR_WEB_APP_ID" // Will be different from Android app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure authentication providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const facebookProvider = new FacebookAuthProvider();

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;