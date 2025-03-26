import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

const getAllPostComment = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/post_comment", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách comments:", error);
        throw error;
    }
};

const createPostComment = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized");
        
        const response = await api.post("/post_comment", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updatePostComment = async (id, data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized");
        
        const response = await api.put(`/post_comment/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const deletePostComment = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized");
        
        const response = await api.delete(`/post_comment/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getPostCommentById = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized");
        
        const response = await api.get(`/post_comment/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export { 
    getAllPostComment,
    createPostComment,
    updatePostComment,
    deletePostComment,
    getPostCommentById
};