import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as loginApi, logout as logoutApi } from './api/auth/user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }
      const userData = await getCurrentUser();
      setUser(userData);
      setAccessToken(token); // Thêm dòng này để đồng bộ accessToken
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.clear();
      setUser(null);
      setAccessToken(null); // Thêm dòng này để reset accessToken
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const token = response.tokens.access.token;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', response.tokens.refresh.token);
      setAccessToken(token);
      if (credentials.remember) {
        localStorage.setItem('remember', 'true');
      }
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi();
    } finally {
      localStorage.clear();
      setUser(null);
      setAccessToken(null); // Thêm dòng này để reset accessToken
      setLoading(false);
    }
  };

  // Chỉ giữ lại một khai báo value
  const value = {
    user,
    accessToken,
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