import { api } from "../config";

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy thông tin department
const getCourseCategory = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/course_category", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin coursecategory:", error);
        throw error;
    }
};

const getCourseCategoryByID = async (id) => {
    try {
        if (!id) throw new Error("ID không hợp lệ");
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        console.log(`Đang gửi request GET: /course_category/${id}`);
        const response = await api.get(`/course_category/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Response data:', response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin course category theo ID:", error.response?.data || error.message);
        throw error;
    }
};

const createCourseCategory = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/course_category", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo coursecategory:", error);
        throw error;
    }
};

const updateCourseCategory = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        console.log('Sending update request with data:', data);
        
        const response = await api.put(`/course_category/${data._id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật course category:", error.response || error);
        throw error;
    }
}

const deletedCourseCategory = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/course_category/${data._id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa course category:", error);
        throw error;
    }
}

export{ getCourseCategory, getCourseCategoryByID, deletedCourseCategory, updateCourseCategory,createCourseCategory}