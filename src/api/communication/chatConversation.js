import { api } from '../config';

export const createConversation = async (data) => {
    return api.post('/chat/conversation', data);
};

export const getConversations = async () => {
    return api.get('/chat/conversation');
};

export const deleteConversation = async (id) => {
    return api.delete(`/chat/conversation/${id}`);
};