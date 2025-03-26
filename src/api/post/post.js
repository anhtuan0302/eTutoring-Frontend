import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy tất cả posts
const getAllPosts = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/post", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách posts:", error);
        throw error;
    }
};

// Lấy post theo ID
const getPostById = async (id) => {
    try {
        if (!id) throw new Error("ID không hợp lệ");
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.get(`/post/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin post:", error);
        throw error;
    }
};

// Tạo post mới
const createPost = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        // Thêm log để kiểm tra dữ liệu
        console.log('Data being sent:', data);
        console.log('Token:', token);
        
        const response = await api.post("/post", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        // Log chi tiết hơn về lỗi
        console.error("Lỗi khi tạo post:", error);
        console.error("Error response:", error.response?.data);
        throw error;
    }
};

// Cập nhật post
const updatePost = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.put(`/post/${data._id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật post:", error);
        throw error;
    }
};

// Xóa post
const deletePost = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/post/${data._id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa post:", error);
        throw error;
    }
};

export { getAllPosts, getPostById, createPost, updatePost, deletePost };