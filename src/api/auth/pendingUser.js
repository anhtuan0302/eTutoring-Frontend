import { api } from '../config';

export const createPendingUser = (userData) => {
  return api.post('/pendingUser', userData);
};

export const verifyInvitation = (token) => {
  return api.get(`/pendingUser/verify/${token}`);
};

export const completeRegistration = (token, data) => {
  return api.post(`/pendingUser/complete/${token}`, data);
};

export const getPendingUsers = () => {
  return api.get('/pendingUser');
};

export const cancelInvitation = (id) => {
  return api.delete(`/pendingUser/${id}`);
};

export const resendInvitation = (id) => {
  return api.post(`/pendingUser/${id}/resend`);
};