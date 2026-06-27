import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = authAPI.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login(credentials);
      // Backend returns: { message, data: { id, full_name, email, role, token } }
      const userData = response.data?.data;
      const token = userData?.token;

      if (token) {
        localStorage.setItem('authToken', token);
      }

      if (userData) {
        authAPI.setCurrentUser(userData);
        setUser(userData);
      }

      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.register(userData);
      // Backend returns: { message, data: { id, full_name, email, role, token } }
      const newUser = response.data?.data;
      const token = newUser?.token;

      if (token) {
        localStorage.setItem('authToken', token);
      }

      if (newUser) {
        authAPI.setCurrentUser(newUser);
        setUser(newUser);
      }

      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
