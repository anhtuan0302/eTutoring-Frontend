import { api } from '../config';

// Auth APIs
export const login = (credentials) => {
  return api.post('/user/login', credentials, {
    headers: {
      'X-Login-Request': 'true'
    }
  });
};

export const logout = () => {
  return api.post('/user/logout');
};

// User Profile APIs
export const getCurrentUser = () => {
  return api.get('/user/me');
};

export const updateProfile = (data) => {
  return api.put('/user/me', data);
};

export const changePassword = (data) => {
  return api.post('/user/changePassword', data);
};

export const updateAvatar = (formData) => {
  return api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Admin APIs
export const getAllUsers = (params) => {
  return api.get('/user', { params });
};

export const getUserById = (id) => {
  return api.get(`/user/${id}`);
};

export const getStudentByUserId = (userId) => {
  return api.get(`/user/student/${userId}`);
};

export const getTutorByUserId = (userId) => {
  return api.get(`/user/tutor/${userId}`);
};
