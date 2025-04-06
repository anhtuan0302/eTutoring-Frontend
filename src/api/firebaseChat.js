import {
  ref,
  onValue,
  off,
  push,
  set,
  update,
  remove,
  get,
  onDisconnect,
} from "firebase/database";
import { firebase, serverTimestamp } from "./config";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const firebaseChatService = {
  // Authentication
  initializeFirebase: async (customToken) => {
    try {
      const auth = getAuth();
      await signInWithCustomToken(auth, customToken);
    } catch (error) {
      throw error;
    }
  },

  // Thêm một hàm mới để kiểm tra/tạo cấu trúc dữ liệu nếu chưa tồn tại
  initializeFirebaseStructure: async () => {
    try {
      // Kiểm tra cấu trúc dữ liệu cơ bản
      const rootRef = ref(firebase);
      const snapshot = await get(rootRef);
      const data = snapshot.val() || {};

      // Đảm bảo các nút cần thiết tồn tại
      const updates = {};

      if (!data.conversations) {
        updates["conversations"] = {};
      }

      if (!data.messages) {
        updates["messages"] = {};
      }

      if (!data.presence) {
        updates["presence"] = {};
      }

      if (!data.typing) {
        updates["typing"] = {};
      }

      // Chỉ cập nhật nếu cần
      if (Object.keys(updates).length > 0) {
        await update(rootRef, updates);
        console.log("Firebase structure initialized");
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize Firebase structure:", error);
      return false;
    }
  },

  // Conversations
  subscribeToAllConversations: (userId, callback) => {
    console.log("Setting up conversation subscription for user:", userId);

    const conversationsRef = ref(firebase, "conversations");

    onValue(conversationsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        console.log("Raw Firebase conversations data:", data);

        if (!data) {
          console.log("No conversations data found");
          callback([]);
          return;
        }

        const conversationsArray = Object.entries(data)
          .map(([id, conv]) => {
            if (!conv || !conv.user1_id || !conv.user2_id) {
              console.log("Invalid conversation structure:", conv);
              return null;
            }

            return {
              _id: conv._id || id,
              created_at: conv.created_at || Date.now(),
              updated_at: conv.updated_at || Date.now(),
              last_message: conv.last_message || "",
              last_message_at: conv.last_message_at || null,
              user1_id: {
                _id: conv.user1_id._id,
                email: conv.user1_id.email || "",
                first_name: conv.user1_id.first_name || "",
                last_name: conv.user1_id.last_name || "",
                avatar_path: conv.user1_id.avatar_path || null,
              },
              user2_id: {
                _id: conv.user2_id._id,
                email: conv.user2_id.email || "",
                first_name: conv.user2_id.first_name || "",
                last_name: conv.user2_id.last_name || "",
                avatar_path: conv.user2_id.avatar_path || null,
              },
            };
          })
          .filter((conv) => {
            if (!conv) return false;
            const isParticipant =
              conv.user1_id._id === userId || conv.user2_id._id === userId;
            console.log(
              "Checking conversation:",
              conv._id,
              "isParticipant:",
              isParticipant
            );
            return isParticipant;
          })
          .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

        console.log("Processed conversations:", conversationsArray);
        callback(conversationsArray);
      } catch (error) {
        console.error("Error in subscribeToAllConversations:", error);
        callback([]);
      }
    });

    return () => off(conversationsRef);
  },

  subscribeToConversation: (conversationId, callback) => {
    const conversationRef = ref(firebase, `conversations/${conversationId}`);
    onValue(conversationRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(conversationRef);
  },

  updateConversation: async (conversationId, updates) => {
    try {
      if (!conversationId || typeof conversationId !== "string") {
        console.error("Invalid conversation ID:", conversationId);
        return false;
      }

      const conversationRef = ref(firebase, `conversations/${conversationId}`);

      // Tạo một bản sao của updates mà không có các thuộc tính null/undefined
      const cleanUpdates = Object.entries(updates || {}).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === "object" && value !== null) {
              // Xử lý đặc biệt cho các đối tượng lồng nhau như user1_id và user2_id
              acc[key] = Object.entries(value).reduce((obj, [k, v]) => {
                if (v !== undefined && v !== null) {
                  obj[k] = v;
                }
                return obj;
              }, {});
            } else {
              acc[key] = value;
            }
          }
          return acc;
        },
        {}
      );

      // Đảm bảo key quan trọng không bị thiếu
      cleanUpdates._id = cleanUpdates._id || conversationId;
      cleanUpdates.updated_at = Date.now();

      console.log(
        `Saving conversation to Firebase: ${conversationId}`,
        cleanUpdates
      );

      // Check if the conversation exists
      const snapshot = await get(conversationRef);
      if (snapshot.exists()) {
        // Update existing conversation
        await update(conversationRef, cleanUpdates);
      } else {
        // Create new conversation
        await set(conversationRef, cleanUpdates);
      }

      return true;
    } catch (error) {
      console.error("Firebase updateConversation error:", error);
      return false;
    }
  },

  // Messages
  sendMessage: async (conversationId, messageData) => {
    const cleanData = Object.entries(messageData).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    if (cleanData.sender) {
      cleanData.sender = Object.entries(cleanData.sender).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );
    }

    if (cleanData.attachment) {
      cleanData.attachment = Object.entries(cleanData.attachment).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );
    }

    const messagesRef = ref(firebase, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      ...cleanData,
      _id: newMessageRef.key,
      created_at: serverTimestamp(),
    });
    return newMessageRef.key;
  },

  subscribeToMessages: (conversationId, callback) => {
    const messagesRef = ref(firebase, `messages/${conversationId}`);

    onValue(messagesRef, (snapshot) => {
      try {
        const messages = [];

        snapshot.forEach((childSnapshot) => {
          const message = {
            ...childSnapshot.val(),
            firebaseKey: childSnapshot.key,
          };
          messages.push(message);
        });

        // Sắp xếp tin nhắn theo thời gian tạo
        const sortedMessages = messages.sort((a, b) => {
          const timeA = a.created_at || 0;
          const timeB = b.created_at || 0;
          return timeA - timeB;
        });

        callback(sortedMessages);
      } catch (error) {
        console.error("Error in subscribeToMessages:", error);
        callback([]);
      }
    });

    return () => off(messagesRef);
  },

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

  updateMessage: async (conversationId, messageId, updates) => {
    try {
      const messageRef = ref(
        firebase,
        `messages/${conversationId}/${messageId}`
      );
      const snapshot = await get(messageRef);

      if (!snapshot.exists()) {
        throw new Error("Message not found");
      }

      const updateData = {
        ...updates,
        is_edited: true,
        updated_at: serverTimestamp(),
      };

      await update(messageRef, updateData);

      return true;
    } catch (error) {
      console.error("Firebase updateMessage error:", error);
      throw error;
    }
  },

  deleteMessage: async (conversationId, messageId, deletedBy) => {
    try {
      const messageRef = ref(
        firebase,
        `messages/${conversationId}/${messageId}`
      );
      const snapshot = await get(messageRef);

      if (!snapshot.exists()) {
        throw new Error("Message not found");
      }

      const updateData = {
        content: null,
        attachment: null,
        is_deleted: true,
        deleted_at: serverTimestamp(),
        deleted_by: deletedBy || null,
        updated_at: serverTimestamp(),
      };

      await update(messageRef, updateData);

      return true;
    } catch (error) {
      console.error("Firebase deleteMessage error:", error);
      throw error;
    }
  },

  // Presence
  subscribeToAllUsersPresence: (callback) => {
    const presenceRef = ref(firebase, "presence");
    onValue(presenceRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(presenceRef);
  },

  updateUserPresence: async (userId, userData) => {
    const cleanUserData = Object.entries(userData).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    const presenceRef = ref(firebase, `presence/${userId}`);
    const presenceData = {
      ...cleanUserData,
      status: "online",
      lastActive: serverTimestamp(),
      userId,
    };

    await set(presenceRef, presenceData);

    const connectedRef = ref(firebase, ".info/connected");
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        const onDisconnectRef = onDisconnect(presenceRef);
        onDisconnectRef.update({
          ...cleanUserData,
          status: "offline",
          lastActive: serverTimestamp(),
          userId,
        });
      }
    });

    const cleanup = async () => {
      try {
        await update(presenceRef, {
          ...cleanUserData,
          status: "offline",
          lastActive: serverTimestamp(),
          userId,
        });
      } catch (error) {
        // Silent error
      }
    };

    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  },

  // Typing Status
  subscribeToTyping: (conversationId, callback) => {
    const typingRef = ref(firebase, `typing/${conversationId}`);
    onValue(typingRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(typingRef);
  },

  updateTypingStatus: async (conversationId, typingData) => {
    const typingRef = ref(
      firebase,
      `typing/${conversationId}/${typingData.userId}`
    );
    if (typingData.isTyping) {
      await set(typingRef, {
        ...typingData,
        timestamp: serverTimestamp(),
      });
    } else {
      await remove(typingRef);
    }
  },
};

export default firebaseChatService;
