import { ref, onValue, off, push, set, update, remove, query, orderByChild, equalTo, get, onDisconnect } from "firebase/database";
import { firebase, serverTimestamp } from "./config";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const firebaseChatService = {
  initializeFirebase: async (customToken) => {
    try {
      const auth = getAuth();
      await signInWithCustomToken(auth, customToken);
    } catch (error) {
      console.error('Firebase authentication error:', error);
      throw error;
    }
  },

  subscribeToAllConversations: (userId, callback) => {
    const conversationsRef = ref(firebase, 'conversations');
    
    onValue(conversationsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (!data) {
          console.log('No conversations data');
          callback([]);
          return;
        }
  
        console.log('Raw conversations data:', data);
  
        const conversationsArray = Object.entries(data)
          .map(([id, conv]) => {
            // Kiểm tra dữ liệu conversation
            if (!conv) {
              console.warn(`Null conversation for id: ${id}`);
              return null;
            }
  
            // Kiểm tra user1_id và user2_id
            if (!conv.user1_id || !conv.user2_id) {
              console.warn(`Missing user data in conversation ${id}:`, conv);
              return null;
            }
  
            // Đảm bảo các trường bắt buộc tồn tại
            return {
              _id: conv._id || id,
              created_at: conv.created_at || Date.now(),
              updated_at: conv.updated_at || Date.now(),
              last_message: conv.last_message || '',
              last_message_at: conv.last_message_at || null,
              user1_id: {
                _id: conv.user1_id._id,
                email: conv.user1_id.email || '',
                first_name: conv.user1_id.first_name || '',
                last_name: conv.user1_id.last_name || '',
                avatar_path: conv.user1_id.avatar_path || null
              },
              user2_id: {
                _id: conv.user2_id._id,
                email: conv.user2_id.email || '',
                first_name: conv.user2_id.first_name || '',
                last_name: conv.user2_id.last_name || '',
                avatar_path: conv.user2_id.avatar_path || null
              }
            };
          })
          .filter(conv => {
            if (!conv) return false;
            
            // Kiểm tra xem user có trong conversation không
            const isUser1 = conv.user1_id._id === userId;
            const isUser2 = conv.user2_id._id === userId;
            return isUser1 || isUser2;
          });
  
        console.log('Processed conversations:', conversationsArray);
        callback(conversationsArray);
      } catch (error) {
        console.error('Error processing conversations:', error);
        callback([]);
      }
    });
  
    return () => off(conversationsRef);
  },

  subscribeToAllUsersPresence: (callback) => {
    const presenceRef = ref(firebase, 'presence');
    
    onValue(presenceRef, (snapshot) => {
      try {
        const presenceData = snapshot.val();
        console.log('Raw presence data:', presenceData);
        callback(presenceData);
      } catch (error) {
        console.error('Error processing presence data:', error);
        callback(null);
      }
    });
  
    return () => off(presenceRef);
  },

  updateConversation: async (conversationId, data) => {
    try {
      const conversationRef = ref(firebase, `conversations/${conversationId}`);
      await set(conversationRef, data);
      console.log('Conversation updated successfully:', conversationId);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },

  updateUserPresence: async (userId, userData) => {
    const cleanUserData = Object.entries(userData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
  
    const presenceRef = ref(firebase, `presence/${userId}`);
    const presenceData = {
      ...cleanUserData,
      status: 'online',
      lastActive: serverTimestamp(),
      userId
    };
  
    try {
      // Cập nhật trạng thái online
      await set(presenceRef, presenceData);
      
      // Thiết lập offline status khi disconnect
      const connectedRef = ref(firebase, '.info/connected');
      onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
          const onDisconnectRef = onDisconnect(presenceRef);
          onDisconnectRef.update({
            ...cleanUserData, // Giữ lại thông tin user
            status: 'offline',
            lastActive: serverTimestamp(),
            userId
          });
        }
      });
  
      // Cleanup function
      const cleanup = async () => {
        try {
          await update(presenceRef, {
            ...cleanUserData, // Giữ lại thông tin user
            status: 'offline',
            lastActive: serverTimestamp(),
            userId
          });
        } catch (error) {
          console.error('Error updating offline status:', error);
        }
      };
  
      window.addEventListener('beforeunload', cleanup);
      
      return () => {
        window.removeEventListener('beforeunload', cleanup);
        cleanup();
      };
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  },

  subscribeToUserPresence: (userId, callback) => {
    const presenceRef = ref(firebase, `presence/${userId}`);
    onValue(presenceRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(presenceRef);
  },

  // Gửi tin nhắn mới
// Sửa lại hàm sendMessage
sendMessage: async (conversationId, messageData) => {
  // Loại bỏ các giá trị undefined trước khi gửi
  const cleanData = Object.entries(messageData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  // Đảm bảo sender object không có giá trị undefined
  if (cleanData.sender) {
    cleanData.sender = Object.entries(cleanData.sender).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  // Đảm bảo attachment object không có giá trị undefined
  if (cleanData.attachment) {
    cleanData.attachment = Object.entries(cleanData.attachment).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  const messagesRef = ref(firebase, `messages/${conversationId}`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, {
    ...cleanData,
    _id: newMessageRef.key,
    created_at: serverTimestamp()
  });
  return newMessageRef.key;
},

  // Lắng nghe tin nhắn của một cuộc trò chuyện
  subscribeToMessages: (conversationId, callback) => {
    const messagesRef = ref(firebase, `messages/${conversationId}`);
    onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          ...childSnapshot.val(),
          firebaseKey: childSnapshot.key
        });
      });
      callback(messages);
    });

    return () => off(messagesRef);
  },

  // Đánh dấu tin nhắn đã đọc
  markMessagesAsRead: async (conversationId, userId) => {
    const messagesRef = ref(firebase, `messages/${conversationId}`);
    const snapshot = await get(messagesRef);
    
    const updates = {};
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (!message.is_read && message.sender_id !== userId) {
        updates[`${childSnapshot.key}/is_read`] = true;
        updates[`${childSnapshot.key}/read_at`] = serverTimestamp();
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(messagesRef, updates);
    }
  },

  // Cập nhật tin nhắn
  updateMessage: async (conversationId, messageId, updates) => {
    const messageRef = ref(firebase, `messages/${conversationId}/${messageId}`);
    await update(messageRef, {
      ...updates,
      is_edited: true,
      updated_at: serverTimestamp()
    });
  },

  // Xóa tin nhắn (thu hồi)
  deleteMessage: async (conversationId, messageId) => {
    const messageRef = ref(firebase, `messages/${conversationId}/${messageId}`);
    await update(messageRef, {
      content: null,
      attachment: null,
      is_deleted: true,
      deleted_at: serverTimestamp()
    });
  },

  // Lắng nghe trạng thái typing
  subscribeToTyping: (conversationId, callback) => {
    const typingRef = ref(firebase, `typing/${conversationId}`);
    onValue(typingRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(typingRef);
  },

  // Cập nhật trạng thái typing
  updateTypingStatus: async (conversationId, typingData) => {
    const typingRef = ref(firebase, `typing/${conversationId}/${typingData.userId}`);
    if (typingData.isTyping) {
      await set(typingRef, {
        ...typingData,
        timestamp: serverTimestamp()
      });
    } else {
      await remove(typingRef);
    }
  },

  // Lắng nghe thay đổi của một cuộc trò chuyện
  subscribeToConversation: (conversationId, callback) => {
    const conversationRef = ref(firebase, `conversations/${conversationId}`);
    onValue(conversationRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(conversationRef);
  },

  // Cập nhật thông tin cuộc trò chuyện
  updateConversation: async (conversationId, updates) => {
    const conversationRef = ref(firebase, `conversations/${conversationId}`);
    await update(conversationRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
  }
};

export default firebaseChatService;