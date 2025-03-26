import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Tạo lượt xem mới
const createView = async (postId, userId) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/post_view", {
            post_id: postId,
            user_id: userId
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo lượt xem:", error);
        throw error;
    }
};

// Lấy lượt xem theo post
const getViewsByPost = async (postId) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get(`/post_view/post/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy lượt xem:", error);
        throw error;
    }
};

// Lấy lượt xem theo user
const getViewsByUser = async (userId) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get(`/post_view/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy lượt xem:", error);
        throw error;
    }
};

export { 
    createView as createPostView,
    getViewsByPost as getPostViewsByPost,
    getViewsByUser as getPostViewsByUser
};

// Thêm hàm để lấy tất cả views
const getAllPostViews = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/post_view", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách views:", error);
        throw error;
    }
};

export { getAllPostViews };