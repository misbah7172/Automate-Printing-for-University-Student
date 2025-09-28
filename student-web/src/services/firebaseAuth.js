import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, facebookProvider, db } from '../config/firebase';
import toast from 'react-hot-toast';

// Firebase Authentication Service
export class FirebaseAuthService {
  
  // Email and Password Authentication
  static async signUpWithEmail(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name if provided
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
      }
      
      // Create user document in Firestore
      await this.createUserDocument(user, userData);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || userData.name,
          emailVerified: user.emailVerified,
          ...userData
        }
      };
    } catch (error) {
      console.error('Firebase signup error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  static async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get additional user data from Firestore
      const userData = await this.getUserDocument(user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          emailVerified: user.emailVerified,
          ...userData
        }
      };
    } catch (error) {
      console.error('Firebase signin error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  // Google Authentication
  static async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists, create if not
      const existingUserData = await this.getUserDocument(user.uid);
      if (!existingUserData) {
        await this.createUserDocument(user, {
          name: user.displayName,
          role: 'student', // Default role
          upid: '', // To be filled by user
          phone: ''
        });
      }
      
      const userData = await this.getUserDocument(user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          emailVerified: user.emailVerified,
          ...userData
        }
      };
    } catch (error) {
      console.error('Google signin error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  // Facebook Authentication
  static async signInWithFacebook() {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      // Check if user document exists, create if not
      const existingUserData = await this.getUserDocument(user.uid);
      if (!existingUserData) {
        await this.createUserDocument(user, {
          name: user.displayName,
          role: 'student',
          upid: '',
          phone: ''
        });
      }
      
      const userData = await this.getUserDocument(user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          emailVerified: user.emailVerified,
          ...userData
        }
      };
    } catch (error) {
      console.error('Facebook signin error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  // Sign Out
  static async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  // Password Reset
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  // Firestore Operations
  static async createUserDocument(user, additionalData) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    
    try {
      const userDoc = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || additionalData?.name,
        role: additionalData?.role || 'student',
        upid: additionalData?.upid || '',
        phone: additionalData?.phone || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        ...additionalData
      };
      
      await setDoc(userRef, userDoc);
      return userDoc;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }
  
  static async getUserDocument(uid) {
    if (!uid) return null;
    
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }
  
  static async updateUserDocument(uid, updateData) {
    if (!uid) return null;
    
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user document:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  // Auth State Observer
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await this.getUserDocument(user.uid);
        callback({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          emailVerified: user.emailVerified,
          ...userData
        });
      } else {
        callback(null);
      }
    });
  }
  
  // Error handling
  static getErrorMessage(error) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked by browser.',
    };
    
    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }
  
  // Current user getter
  static getCurrentUser() {
    return auth.currentUser;
  }
}

export default FirebaseAuthService;