import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as authAPI from '../services/authAPI';
import FirebaseAuthService from '../services/firebaseAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('traditional'); // 'traditional' or 'firebase'

  useEffect(() => {
    checkAuth();
    
    // Set up Firebase auth state listener
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser && authMode === 'firebase') {
        setUser(firebaseUser);
        setLoading(false);
      } else if (!firebaseUser && authMode === 'firebase') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authMode]);

  const checkAuth = () => {
    // Check traditional auth first
    const token = localStorage.getItem('student_token');
    const userData = localStorage.getItem('student_user');
    const firebaseMode = localStorage.getItem('auth_mode') === 'firebase';
    
    if (firebaseMode) {
      setAuthMode('firebase');
      // Firebase auth state will be handled by the listener
    } else if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'student') {
          setUser(parsedUser);
          authAPI.setAuthToken(token);
          setAuthMode('traditional');
        } else {
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  // Traditional login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      
      if (response.user.role !== 'student') {
        throw new Error('Access denied. Student account required.');
      }

      const { token, user: userData } = response;
      
      localStorage.setItem('student_token', token);
      localStorage.setItem('student_user', JSON.stringify(userData));
      localStorage.setItem('auth_mode', 'traditional');
      authAPI.setAuthToken(token);
      setUser(userData);
      setAuthMode('traditional');
      
      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Firebase email/password login
  const loginWithFirebase = async (email, password) => {
    try {
      setLoading(true);
      const result = await FirebaseAuthService.signInWithEmail(email, password);
      
      if (result.success) {
        localStorage.setItem('auth_mode', 'firebase');
        setUser(result.user);
        setAuthMode('firebase');
        toast.success('Login successful');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error.message || 'Firebase login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Firebase Google login
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await FirebaseAuthService.signInWithGoogle();
      
      if (result.success) {
        localStorage.setItem('auth_mode', 'firebase');
        setUser(result.user);
        setAuthMode('firebase');
        toast.success('Google login successful');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error.message || 'Google login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Firebase Facebook login
  const loginWithFacebook = async () => {
    try {
      setLoading(true);
      const result = await FirebaseAuthService.signInWithFacebook();
      
      if (result.success) {
        localStorage.setItem('auth_mode', 'firebase');
        setUser(result.user);
        setAuthMode('firebase');
        toast.success('Facebook login successful');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error.message || 'Facebook login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Traditional registration
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register({
        ...userData,
        role: 'student'
      });
      
      const { token, user: newUser } = response;
      
      localStorage.setItem('student_token', token);
      localStorage.setItem('student_user', JSON.stringify(newUser));
      localStorage.setItem('auth_mode', 'traditional');
      authAPI.setAuthToken(token);
      setUser(newUser);
      setAuthMode('traditional');
      
      toast.success('Registration successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Firebase registration
  const registerWithFirebase = async (email, password, userData) => {
    try {
      setLoading(true);
      const result = await FirebaseAuthService.signUpWithEmail(email, password, {
        ...userData,
        role: 'student'
      });
      
      if (result.success) {
        localStorage.setItem('auth_mode', 'firebase');
        setUser(result.user);
        setAuthMode('firebase');
        toast.success('Registration successful');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error.message || 'Firebase registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    try {
      const result = await FirebaseAuthService.resetPassword(email);
      
      if (result.success) {
        toast.success('Password reset email sent');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout (handles both traditional and Firebase)
  const logout = async () => {
    if (authMode === 'firebase') {
      const result = await FirebaseAuthService.signOut();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
    }
    
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    localStorage.removeItem('auth_mode');
    authAPI.removeAuthToken();
    setUser(null);
    setAuthMode('traditional');
    toast.success('Logged out successfully');
  };

  // Update user (handles both traditional and Firebase)
  const updateUser = async (updatedUserData) => {
    if (authMode === 'firebase' && user?.uid) {
      const result = await FirebaseAuthService.updateUserDocument(user.uid, updatedUserData);
      if (result.success) {
        const updatedUser = { ...user, ...updatedUserData };
        setUser(updatedUser);
        toast.success('Profile updated successfully');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } else {
      // Traditional update
      const updatedUser = { ...user, ...updatedUserData };
      setUser(updatedUser);
      localStorage.setItem('student_user', JSON.stringify(updatedUser));
      return { success: true };
    }
  };

  const value = {
    user,
    loading,
    authMode,
    
    // Traditional auth methods
    login,
    register,
    
    // Firebase auth methods
    loginWithFirebase,
    loginWithGoogle,
    loginWithFacebook,
    registerWithFirebase,
    resetPassword,
    
    // Common methods
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};