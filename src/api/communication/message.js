import { api } from '../config';

export const sendMessage = async (data) => {
    return api.post('/chat/message', data);
};

export const getMessages = async (conversationId) => {
    return api.get(`/chat/message/${conversationId}`);
};

export const updateMessage = async (id, data) => {
    return api.patch(`/chat/message/${id}`, data);
};

export const deleteMessage = async (id) => {
    return api.delete(`/chat/message/${id}`);
};

export const checkAttachment = async (id) => {
    return api.get(`/chat/message/attachment/${id}`);
};

export const downloadAttachment = async (id) => {
    return api.get(`/chat/message/attachment/download/${id}`);
};