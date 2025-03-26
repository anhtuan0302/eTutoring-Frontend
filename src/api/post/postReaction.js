import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy tất cả reactions
const getAllReactions = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/post_reaction", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách reactions:", error);
        throw error;
    }
};

// Tạo reaction mới
const createReaction = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/post_reaction", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo reaction:", error);
        throw error;
    }
};

// Cập nhật reaction
const updateReaction = async (id, data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.put(`/post_reaction/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật reaction:", error);
        throw error;
    }
};

// Xóa reaction
const deleteReaction = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/post_reaction/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa reaction:", error);
        throw error;
    }
};

const getReactionById = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get(`/post_reaction/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin reaction:", error);
        throw error;
    }
};

export { 
    getAllReactions as getAllPostReaction,
    createReaction as createPostReaction,
    updateReaction as updatePostReaction,
    deleteReaction as deletePostReaction,
    getReactionById as getPostReactionById
};