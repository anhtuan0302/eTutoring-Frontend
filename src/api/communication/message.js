import { api } from "../config";

export const sendMessage = async (data) => {
  try {
    console.log("Sending message data:", data);
    
    if (data instanceof FormData) {
      const response = await api.post("/chat/message", data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Message with attachment response:", response);
      return response;
    } else {
      const response = await api.post("/chat/message", {
        conversation_id: data.conversation_id,
        content: data.content,
      });
      console.log("Text message response:", response);
      return response;
    }
  } catch (error) {
    console.error("Send message API error:", error);
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
