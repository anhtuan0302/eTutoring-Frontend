import {
  ref,
  onValue,
  off,
  push,
  set,
  update,
  remove,
  get,
} from "firebase/database";
import { firebase, serverTimestamp } from "./config";
import {
  AiOutlineLike,
  AiFillLike,
  AiFillHeart,
  AiOutlineHeart,
} from "react-icons/ai";
import {
  BsEmojiLaughingFill,
  BsEmojiLaughing,
  BsEmojiAstonishedFill,
  BsEmojiAstonished,
  BsEmojiFrownFill,
  BsEmojiFrown,
  BsEmojiAngryFill,
  BsEmojiAngry,
} from "react-icons/bs";

// Định nghĩa các loại reaction dưới dạng enum
export const REACTION_TYPES = Object.freeze({
  LIKE: "like",
  LOVE: "love",
  HAHA: "haha",
  WOW: "wow",
  SAD: "sad",
  ANGRY: "angry",
});

// Validation function cho reaction types
export const isValidReactionType = (type) => {
  return Object.values(REACTION_TYPES).includes(type);
};

// Thông tin chi tiết cho mỗi loại reaction với validation
export const REACTION_INFO = Object.freeze({
  [REACTION_TYPES.LIKE]: {
    activeIcon: AiFillLike,
    inactiveIcon: AiOutlineLike,
    label: "Thích",
    color: "#2078f4",
    value: REACTION_TYPES.LIKE,
  },
  [REACTION_TYPES.LOVE]: {
    activeIcon: AiFillHeart,
    inactiveIcon: AiOutlineHeart,
    label: "Yêu thích",
    color: "#f33e58",
    value: REACTION_TYPES.LOVE,
  },
  [REACTION_TYPES.HAHA]: {
    activeIcon: BsEmojiLaughingFill,
    inactiveIcon: BsEmojiLaughing,
    label: "Haha",
    color: "#f7b125",
    value: REACTION_TYPES.HAHA,
  },
  [REACTION_TYPES.WOW]: {
    activeIcon: BsEmojiAstonishedFill,
    inactiveIcon: BsEmojiAstonished,
    label: "Wow",
    color: "#f7b125",
    value: REACTION_TYPES.WOW,
  },
  [REACTION_TYPES.SAD]: {
    activeIcon: BsEmojiFrownFill,
    inactiveIcon: BsEmojiFrown,
    label: "Buồn",
    color: "#f7b125",
    value: REACTION_TYPES.SAD,
  },
  [REACTION_TYPES.ANGRY]: {
    activeIcon: BsEmojiAngryFill,
    inactiveIcon: BsEmojiAngry,
    label: "Phẫn nộ",
    color: "#e9710f",
    value: REACTION_TYPES.ANGRY,
  },
});

const firebaseBlogService = {
  // Posts
  subscribeToPost: (postId, callback) => {
    const postRef = ref(firebase, `posts/${postId}`);
    onValue(postRef, (snapshot) => {
      const post = snapshot.val();
      if (post) {
        callback({ ...post, _id: postId });
      } else {
        callback(null);
      }
    });
    return () => off(postRef);
  },

  subscribeToAllPosts: (callback) => {
    const postsRef = ref(firebase, "posts");
    onValue(postsRef, (snapshot) => {
      const posts = [];
      snapshot.forEach((childSnapshot) => {
        const post = childSnapshot.val();
        if (post && !post.is_deleted) {
          posts.push({
            ...post,
            _id: childSnapshot.key,
          });
        }
      });
      callback(posts.sort((a, b) => b.created_at - a.created_at));
    });
    return () => off(postsRef);
  },

  createPost: async (postData) => {
    try {
      const postsRef = ref(firebase, "posts");
      const newPostRef = push(postsRef);
      const postId = newPostRef.key;

      const cleanData = {
        ...postData,
        _id: postId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_deleted: false,
      };

      await set(newPostRef, cleanData);
      return postId;
    } catch (error) {
      console.error("Firebase createPost error:", error);
      throw error;
    }
  },

  updatePost: async (postId, updates) => {
    try {
      const postRef = ref(firebase, `posts/${postId}`);
      const updateData = {
        ...updates,
        updated_at: serverTimestamp(),
      };
  
      // Làm sạch attachments nếu có
      if (updates.attachments) {
        updateData.attachments = updates.attachments.map(attachment => ({
          name: attachment.name || '',
          file_name: attachment.file_name || '',
          file_path: attachment.file_path || '',
          url: attachment.url || '',
          type: attachment.type || ''
        }));
      }
  
      // Làm sạch thông tin moderator nếu có
      if (updates.moderator) {
        updateData.moderator = {
          _id: updates.moderator._id || '',
          first_name: updates.moderator.first_name || '',
          last_name: updates.moderator.last_name || '',
          role: updates.moderator.role || '',
          moderated_at: updates.moderator.moderated_at || serverTimestamp()
        };
        
        if (updates.moderator.avatar_path) {
          updateData.moderator.avatar_path = updates.moderator.avatar_path;
        }
      }
  
      await update(postRef, updateData);
      return true;
    } catch (error) {
      console.error("Firebase updatePost error:", error);
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      const postRef = ref(firebase, `posts/${postId}`);
      await update(postRef, {
        is_deleted: true,
        deleted_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Firebase deletePost error:", error);
      throw error;
    }
  },

  // Comments
  subscribeToComments: (postId, callback) => {
    const commentsRef = ref(firebase, `comments/${postId}`);
    
    onValue(commentsRef, (snapshot) => {
      const comments = [];
      snapshot.forEach((childSnapshot) => {
        const comment = childSnapshot.val();
        if (comment) { // Bỏ điều kiện !comment.is_deleted vì chúng ta sẽ xóa comment hoàn toàn
          comments.push({
            _id: childSnapshot.key,
            content: comment.content || "",
            user_id: comment.user_id || "",
            post_id: comment.post_id || postId,
            created_at: comment.created_at || Date.now(),
            updated_at: comment.updated_at || Date.now(),
            author: {
              _id: comment.author?._id || "",
              first_name: comment.author?.first_name || "",
              last_name: comment.author?.last_name || "",
              avatar_path: comment.author?.avatar_path || null,
              role: comment.author?.role || "user"
            }
          });
        }
      });
      
      // Sort comments by created_at in descending order (newest first)
      comments.sort((a, b) => b.created_at - a.created_at);
      callback(comments);
    });
  
    return () => off(commentsRef);
  },

  createComment: async (postId, commentData) => {
    try {
      const commentsRef = ref(firebase, `comments/${postId}`);
      const newCommentRef = push(commentsRef);
      const commentId = newCommentRef.key;
  
      // Đảm bảo dữ liệu không có undefined
      const cleanedCommentData = {
        ...commentData,
        _id: commentId,
        content: commentData.content || "",
        user_id: commentData.user_id || "",
        post_id: postId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        author: {
          _id: commentData.author._id || "",
          first_name: commentData.author.first_name || "",
          last_name: commentData.author.last_name || "",
          avatar_path: commentData.author.avatar_path || null,
          role: commentData.author.role || "user"
        },
        is_deleted: false
      };
  
      await set(newCommentRef, cleanedCommentData);
      return commentId;
    } catch (error) {
      console.error("Firebase createComment error:", error);
      throw error;
    }
  },

  updateComment: async (postId, commentId, updatedData) => {
    try {
      const commentRef = ref(firebase, `comments/${postId}/${commentId}`);
      await update(commentRef, {
        ...updatedData,
        updated_at: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Firebase updateComment error:", error);
      throw error;
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      console.log("Deleting comment:", postId, commentId); // Thêm log để debug
      const commentRef = ref(firebase, `comments/${postId}/${commentId}`);
      // Thay vì cập nhật is_deleted, chúng ta sẽ xóa comment hoàn toàn
      await remove(commentRef);
      return true;
    } catch (error) {
      console.error("Firebase deleteComment error:", error);
      throw error;
    }
  },

  // Reactions
  subscribeToReactions: (postId, callback) => {
    const reactionsRef = ref(firebase, `reactions/${postId}`);
    onValue(reactionsRef, (snapshot) => {
      const reactions = {};
      snapshot.forEach((childSnapshot) => {
        const reaction = childSnapshot.val();
        if (reaction) {
          reactions[reaction.user_id] = {
            ...reaction,
            _id: childSnapshot.key,
          };
        }
      });
      callback(reactions);
    });
    return () => off(reactionsRef);
  },

  createReaction: async (postId, userId, reactionType, userData) => {
    try {
      if (!isValidReactionType(reactionType)) {
        throw new Error(
          `Invalid reaction type. Must be one of: ${Object.values(
            REACTION_TYPES
          ).join(", ")}`
        );
      }
  
      const userReactionRef = ref(firebase, `reactions/${postId}/${userId}`);
      const snapshot = await get(userReactionRef);
  
      if (snapshot.exists()) {
        // Nếu reaction hiện tại giống với reaction mới -> xóa reaction (unlike)
        if (snapshot.val().reaction_type === reactionType) {
          await remove(userReactionRef);
          return null;
        }
        // Nếu khác -> cập nhật reaction type mới
        await update(userReactionRef, {
          reaction_type: reactionType,
          updated_at: serverTimestamp(),
        });
      } else {
        // Tạo reaction mới nếu chưa tồn tại
        const cleanReactionData = {
          user_id: userId,
          reaction_type: reactionType,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          user: {
            _id: userData._id || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'user',
          }
        };
  
        if (userData.avatar_path) {
          cleanReactionData.user.avatar_path = userData.avatar_path;
        }
  
        await set(userReactionRef, cleanReactionData);
      }
      return userId;
    } catch (error) {
      console.error("Firebase createReaction error:", error);
      throw error;
    }
  },

  updateReaction: async (postId, reactionId, reactionType) => {
    try {
      if (!isValidReactionType(reactionType)) {
        throw new Error(
          `Invalid reaction type. Must be one of: ${Object.values(
            REACTION_TYPES
          ).join(", ")}`
        );
      }

      await update(ref(firebase, `reactions/${postId}/${reactionId}`), {
        reaction_type: reactionType,
        updated_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Firebase updateReaction error:", error);
      throw error;
    }
  },

  removeReaction: async (postId, reactionId) => {
    try {
      await remove(ref(firebase, `reactions/${postId}/${reactionId}`));
      return true;
    } catch (error) {
      console.error("Firebase removeReaction error:", error);
      throw error;
    }
  },

  subscribeToReactions: (postId, callback) => {
    try {
      const reactionsRef = ref(firebase, `reactions/${postId}`);
      const unsubscribe = onValue(reactionsRef, (snapshot) => {
        const reactionsData = snapshot.val();
        if (!reactionsData) {
          callback([]);
          return;
        }
  
        // Chuyển đổi object thành array và đảm bảo dữ liệu user đầy đủ
        const reactions = Object.entries(reactionsData).map(([userId, reaction]) => ({
          _id: userId, // Sử dụng userId làm _id
          user: {
            _id: reaction.user?._id || reaction.user_id || '',
            first_name: reaction.user?.first_name || '',
            last_name: reaction.user?.last_name || '',
            avatar_path: reaction.user?.avatar_path || null,
            role: reaction.user?.role || 'user'
          },
          reaction_type: reaction.reaction_type,
          created_at: reaction.created_at,
        }));
  
        // Sắp xếp theo thời gian mới nhất
        reactions.sort((a, b) => b.created_at - a.created_at);
        callback(reactions);
      });
  
      return unsubscribe;
    } catch (error) {
      console.error("Subscribe to reactions error:", error);
      callback([]);
    }
  },

  // Helper functions
  getReactionCounts: async (postId) => {
    try {
      const snapshot = await get(ref(firebase, `reactions/${postId}`));
      const reactions = snapshot.val() || {};

      // Khởi tạo counts với tất cả các loại reaction = 0
      const counts = Object.values(REACTION_TYPES).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {});

      // Đếm số lượng mỗi loại
      Object.values(reactions).forEach((reaction) => {
        if (counts.hasOwnProperty(reaction.reaction_type)) {
          counts[reaction.reaction_type]++;
        }
      });

      return counts;
    } catch (error) {
      console.error("Firebase getReactionCounts error:", error);
      return Object.values(REACTION_TYPES).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {});
    }
  },

  getUserReaction: async (postId, userId) => {
    try {
      const snapshot = await get(ref(firebase, `reactions/${postId}`));
      const reactions = snapshot.val() || {};

      const userReaction = Object.entries(reactions).find(
        ([_, reaction]) => reaction.user_id === userId
      );

      return userReaction
        ? {
            _id: userReaction[0],
            ...userReaction[1],
          }
        : null;
    } catch (error) {
      console.error("Firebase getUserReaction error:", error);
      return null;
    }
  },

   // Views
   addView: async (postId, userData) => {
    try {
      console.log("Adding view for post:", postId, "user:", userData._id);
  
      // Tạo clean data object, loại bỏ các giá trị undefined
      const cleanUserData = {
        user_id: userData._id || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role || 'user',
        viewed_at: serverTimestamp()
      };
  
      // Chỉ thêm avatar_path nếu nó tồn tại
      if (userData.avatar_path) {
        cleanUserData.avatar_path = userData.avatar_path;
      }
  
      const viewsRef = ref(firebase, `views/${postId}/${userData._id}`);
      const viewSnapshot = await get(viewsRef);
      
      // Kiểm tra xem user đã xem bài post này chưa
      if (!viewSnapshot.exists()) {
        console.log("New view - updating counts");
        
        // Thêm view mới với dữ liệu đã được làm sạch
        await set(viewsRef, cleanUserData);
        
        // Cập nhật view_count trong post
        const postRef = ref(firebase, `posts/${postId}`);
        const postSnapshot = await get(postRef);
        const currentViews = postSnapshot.val()?.view_count || 0;
        
        await update(postRef, {
          view_count: currentViews + 1
        });
  
        console.log("View count updated successfully");
      } else {
        console.log("User already viewed this post");
        // Nếu user đã xem rồi, chỉ cập nhật thời gian xem
        await update(viewsRef, {
          viewed_at: serverTimestamp()
        });
      }
  
      return true;
    } catch (error) {
      console.error("Firebase addView error:", error);
      throw error;
    }
  },

  getViewers: async (postId) => {
    try {
      const viewsRef = ref(firebase, `views/${postId}`);
      const snapshot = await get(viewsRef);
      const viewers = [];
      
      snapshot.forEach((childSnapshot) => {
        const viewer = childSnapshot.val();
        viewers.push({
          ...viewer,
          _id: childSnapshot.key
        });
      });

      // Sắp xếp theo thời gian xem gần nhất
      return viewers.sort((a, b) => b.viewed_at - a.viewed_at);
    } catch (error) {
      console.error("Firebase getViewers error:", error);
      return [];
    }
  },

  subscribeToViews: (postId, callback) => {
    const viewsRef = ref(firebase, `views/${postId}`);
    onValue(viewsRef, (snapshot) => {
      const viewers = [];
      snapshot.forEach((childSnapshot) => {
        const viewer = childSnapshot.val();
        viewers.push({
          ...viewer,
          _id: childSnapshot.key
        });
      });
      callback(viewers.sort((a, b) => b.viewed_at - a.viewed_at));
    });
    return () => off(viewsRef);
  }
};


export default firebaseBlogService;
