import { api } from '../config';

export const createPendingUser = (userData) => {
  return api.post('/pendingUser', userData);
};

export const verifyInvitation = (token) => {
  return api.get(`/pendingUser/verify/${token}`);
};

export const completeRegistration = (token, data) => {
  // Tạo FormData để gửi cả file và dữ liệu
  const formData = new FormData();
  formData.append('password', data.password);
  formData.append('confirm_password', data.confirm_password);
  
  // Thêm file avatar nếu có
  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }

  return api.post(`/pendingUser/complete/${token}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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