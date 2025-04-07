import { api } from '../config';

export const getUserLoginHistory = (userId) => {
  return api.get(`/loginHistory/user/${userId}`);
};

export const deleteLoginHistory = (historyId) => {
  return api.delete(`/loginHistory/${historyId}`);
};

export const clearUserLoginHistory = (userId) => {
  return api.delete(`/loginHistory/user/${userId}`);
};

export const getLoginStatistics = () => {
  return api.get('/loginHistory/statistics');
};