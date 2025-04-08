import { ref, onValue, off, push, set, update, get } from "firebase/database";
import { firebase, serverTimestamp } from "./config";

const firebaseNotificationService = {
  // Subscribe to all notifications of a user
  subscribeToNotifications: (userId, callback) => {
    const notificationsRef = ref(firebase, `notifications/${userId}`);
    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsArray = Object.entries(snapshot.val())
          .filter(([key]) => !isNaN(key) === false)
          .map(([key, value]) => ({
            _id: key,
            ...value
          }))
          .sort((a, b) => b.created_at - a.created_at);
        
        callback(notificationsArray);
      } else {
        callback([]);
      }
    });
    return () => off(notificationsRef);
  },

  // Create a new notification
  createNotification: async (userId, notificationData) => {
    try {
      const notificationsRef = ref(firebase, `notifications/${userId}`);
      const newNotificationRef = push(notificationsRef);
      const notificationId = newNotificationRef.key;

      const cleanData = {
        content: notificationData.content || "",
        notification_type: notificationData.notification_type,
        reference_type: notificationData.reference_type || null,
        reference_id: notificationData.reference_id
          ? notificationData.reference_id.toString()
          : null,
        is_read: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await set(newNotificationRef, cleanData);
      return notificationId;
    } catch (error) {
      console.error("Firebase createNotification error:", error);
      throw error;
    }
  },

  // Mark a notification as read
  markAsRead: async (userId, notificationId) => {
    try {
      console.log("Marking as read:", userId, notificationId);
      const notificationRef = ref(
        firebase,
        `notifications/${userId}/${notificationId}`
      );
      
      // Lấy dữ liệu hiện tại của notification
      const snapshot = await get(notificationRef);
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        
        // Cập nhật chỉ is_read và updated_at
        await update(notificationRef, {
          ...currentData,
          is_read: true,
          updated_at: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error("Firebase markAsRead error:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    try {
      const notificationsRef = ref(firebase, `notifications/${userId}`);
      const snapshot = await get(notificationsRef);

      if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((childSnapshot) => {
          if (!childSnapshot.val().is_read) {
            updates[`${childSnapshot.key}/is_read`] = true;
            updates[`${childSnapshot.key}/updated_at`] = serverTimestamp();
          }
        });

        if (Object.keys(updates).length > 0) {
          await update(notificationsRef, updates);
        }
      }
      return true;
    } catch (error) {
      console.error("Firebase markAllAsRead error:", error);
      throw error;
    }
  },

  // Subscribe to unread notifications count
  subscribeToUnreadCount: (userId, callback) => {
    const notificationsRef = ref(firebase, `notifications/${userId}`);
    onValue(notificationsRef, (snapshot) => {
      let count = 0;
      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val();
        if (notification && !notification.is_read) {
          count++;
        }
      });
      callback(count);
    });
    return () => off(notificationsRef);
  },

  // Get unread notifications count
  getUnreadCount: async (userId) => {
    try {
      const notificationsRef = ref(firebase, `notifications/${userId}`);
      const snapshot = await get(notificationsRef);
      let count = 0;

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const notification = childSnapshot.val();
          if (!notification.is_read) {
            count++;
          }
        });
      }

      return count;
    } catch (error) {
      console.error("Firebase getUnreadCount error:", error);
      return 0;
    }
  },

  // Delete a notification
  deleteNotification: async (userId, notificationId) => {
    try {
      const notificationRef = ref(
        firebase,
        `notifications/${userId}/${notificationId}`
      );
      await update(notificationRef, {
        is_deleted: true,
        deleted_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Firebase deleteNotification error:", error);
      throw error;
    }
  },
};

export default firebaseNotificationService;
