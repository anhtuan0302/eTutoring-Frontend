import { api } from '../config';

export const refreshToken = (refreshToken) => {
  return api.post('/token/refresh', { refresh_token: refreshToken });
};

export const revokeToken = (token) => {
  return api.post(`/token/${token}/revoke`);
};

export const requestPasswordReset = (email) => {
  return api.post('/token/password-reset', { email });
};

export const verifyPasswordResetToken = (token) => {
  return api.get(`/token/password-reset/${token}`);
};

export const resetPassword = (token, data) => {
  return api.post(`/token/password-reset/${token}`, data);
};