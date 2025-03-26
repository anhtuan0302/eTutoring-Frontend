import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Upload file cho post
const uploadPostFile = async (formData) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/post_file", formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi upload file:", error);
        throw error;
    }
};

// Lấy files theo post ID
const getFilesByPostId = async (postId = '') => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const url = postId ? `/post_file/${postId}` : '/post_file';
        const response = await api.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy files:", error);
        throw error;
    }
};

// Xóa file
const deleteFile = async (fileId) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/post_file/${fileId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa file:", error);
        throw error;
    }
};

export { uploadPostFile, getFilesByPostId, deleteFile };