import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy tất cả comment reactions
const getAllCommentReactions = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/post_comment_reaction", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách comment reactions:", error);
        throw error;
    }
};

// Tạo comment reaction mới
const createCommentReaction = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/post_comment_reaction", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo comment reaction:", error);
        throw error;
    }
};

// Cập nhật comment reaction
const updateCommentReaction = async (id, data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.put(`/post_comment_reaction/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật comment reaction:", error);
        throw error;
    }
};

// Xóa comment reaction
const deleteCommentReaction = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/post_comment_reaction/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa comment reaction:", error);
        throw error;
    }
};

const getCommentReactionById = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get(`/post_comment_reaction/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin reaction:", error);
        throw error;
    }
};

export { 
    getAllCommentReactions as getAllPostCommentReaction,
    createCommentReaction as createPostCommentReaction,
    updateCommentReaction as updatePostCommentReaction,
    deleteCommentReaction as deletePostCommentReaction,
    getCommentReactionById as getPostCommentReactionById
};