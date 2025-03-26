import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy thông tin department
const getPostCategory = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/post_category", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin postcategory:", error);
        throw error;
    }
};

const getPostCategoryByID = async (id) => {
    try {
        if (!id) throw new Error("ID không hợp lệ");
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        console.log(`Đang gửi request GET: /post_category/${id}`);
        const response = await api.get(`/post_category/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Response data:', response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin course category theo ID:", error.response?.data || error.message);
        throw error;
    }
};

const createPostCategory = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/post_category", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo postcategory:", error);
        throw error;
    }
};

const updatePostCategory = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        console.log('Sending update request with data:', data);
        
        const response = await api.put(`/post_category/${data._id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật course category:", error.response || error);
        throw error;
    }
}

const deletedPostCategory = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/post_category/${data._id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa post_category:", error);
        throw error;
    }
}

export{ getPostCategory, getPostCategoryByID, createPostCategory, updatePostCategory, deletedPostCategory}