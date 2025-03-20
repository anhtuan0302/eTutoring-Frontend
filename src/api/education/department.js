import { api } from "../config";

// Hàm lấy access_token từ localStorage
const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy thông tin department
const getDepartment = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/department", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin department:", error);
        throw error;
    }
};

const getDepartmentByID = async (id) => {
    try {
        if (!id) throw new Error("ID không hợp lệ"); // Kiểm tra ID trước khi gửi request
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        console.log(`Đang gửi request GET: /department/${id}`); // Debug ID
        const response = await api.get(`/department/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin department theo ID:", error.response?.data || error.message);
        throw error;
    }
};


// Tạo department mới
const createDepartment = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.post("/department", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo department:", error);
        throw error;
    }
};

const updateDepartment = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.put(`/department/${data.id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Loi khi cập nhật department:", error);
        throw error;
    }
}

const deletedDepartment = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.delete(`/department/${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Loi khi xóa department:", error);
        throw error;
    }
}

export { createDepartment, getDepartment, updateDepartment, deletedDepartment, getDepartmentByID };
