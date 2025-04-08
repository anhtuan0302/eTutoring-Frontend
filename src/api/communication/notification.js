import { api } from '../config';

export const createNotification = async (data) => {
    return api.post('/notification', data);
};

export const getUserNotifications = async () => {
    return api.get('/notification');
};

export const getUnreadCount = async () => {
    return api.get('/notification/unreadCount');
};

export const markAsRead = async (id) => {
    return api.patch(`/notification/${id}/read`);
};

export const markAllAsRead = async () => {
    return api.patch('/notification/markAllRead');
};