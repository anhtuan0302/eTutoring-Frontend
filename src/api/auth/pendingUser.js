import { api } from '../config';

export const createPendingUser = (userData) => {
  return api.post('/pending-user', userData);
};

export const verifyInvitation = (token) => {
  return api.get(`/pending-user/verify/${token}`);
};

export const completeRegistration = (token, data) => {
  return api.post(`/pending-user/complete/${token}`, data);
};

export const getPendingUsers = () => {
  return api.get('/pending-user');
};

export const cancelInvitation = (id) => {
  return api.delete(`/pending-user/${id}`);
};

export const resendInvitation = (id) => {
  return api.post(`/pending-user/${id}/resend`);
};