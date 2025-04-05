import { api } from '../config';

export const sendMessage = async (data) => {
    try {
      const response = await api.post("/chat/message", {
        conversation_id: data.conversation_id,
        content: data.content,
        firebase_message_id: data._id
      });
      return response;
    } catch (error) {
      throw error;
    }
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