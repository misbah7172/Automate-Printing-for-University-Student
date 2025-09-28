import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as authAPI from '../services/authAPI';

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('student_token');
    const userData = localStorage.getItem('student_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'student') {
          setUser(parsedUser);
          authAPI.setAuthToken(token);
        } else {
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
      }
    }
    setLoading(false);
  };

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
      authAPI.setAuthToken(token);
      setUser(userData);
      
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
      authAPI.setAuthToken(token);
      setUser(newUser);
      
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

  const logout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    authAPI.removeAuthToken();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('student_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
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