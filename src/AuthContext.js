import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as loginApi, logout as logoutApi } from './api/auth/user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (localStorage.getItem('accessToken')) {
        const userData = await getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
        const response = await loginApi(credentials);
        localStorage.setItem('accessToken', response.tokens.access.token);
        localStorage.setItem('refreshToken', response.tokens.refresh.token);
        setUser(response.user);
        return response.user;
      } catch (error) {
        throw error;
      }
    };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};