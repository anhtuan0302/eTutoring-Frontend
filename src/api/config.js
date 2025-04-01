import axios from 'axios';
import { io } from "socket.io-client";

const baseURL = 'http://localhost:8000/api';
const staticURL = 'http://localhost:8000';
let socket = null;

const api = axios.create({
  baseURL: baseURL
});

// Socket configuration
export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(baseURL.replace('/api', ''), {
    auth: {
      token: `Bearer ${token}`
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Request interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    const isLoginRequest = originalRequest.headers && 
                          originalRequest.headers['X-Login-Request'] === 'true';
    
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Tạo một instance axios mới để tránh vòng lặp vô tận
        const refreshResponse = await axios.post(
          `${baseURL}/token/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access_token } = refreshResponse.data;
        
        if (!access_token) {
          throw new Error('No access token received');
        }

        localStorage.setItem('accessToken', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        if (!isLoginRequest && window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Không thêm token cho các route public
    const publicRoutes = ['/pendingUser/verify', '/pendingUser/complete'];
    const isPublicRoute = publicRoutes.some(route => config.url.includes(route));
    
    if (!isPublicRoute) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { api, baseURL, staticURL };