import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Kiểm tra header đặc biệt để biết đây có phải là request đăng nhập không
    const isLoginRequest = originalRequest.headers && 
                          originalRequest.headers['X-Login-Request'] === 'true';
    
    // Chỉ xử lý refresh token nếu không phải là request đăng nhập
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await api.post('/token/refresh', { 
          refresh_token: refreshToken 
        });

        const { access_token } = response;
        localStorage.setItem('accessToken', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (err) {
        // Xóa token từ local storage
        localStorage.clear();
        
        // Chỉ chuyển hướng nếu không phải đang ở trang đăng nhập
        // và không phải là request đăng nhập
        if (!isLoginRequest && window.location.pathname !== '/') {
          window.location.href = '/';
        }
        
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export { api };