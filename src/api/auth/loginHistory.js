import { api } from '../config';

export const getUserLoginHistory = (userId) => {
  return api.get(`/login-history/user/${userId}`);
};

export const clearUserLoginHistory = (userId) => {
  return api.delete(`/login-history/user/${userId}`);
};

export const getLoginStatistics = () => {
  return api.get('/login-history/statistics');
};