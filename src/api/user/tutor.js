import { api } from "../config";

// Hàm lấy access_token từ localStorage
const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy danh sách tutor
const getTutors = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.get("/tutor", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách tutor:", error);
        throw error;
    }
};

// Lấy thông tin tutor theo ID
const getTutorByID = async (id) => {
    try {
        if (!id) throw new Error("ID không hợp lệ"); // Kiểm tra ID trước khi gửi request
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        console.log(`Đang gửi request GET: /tutor/${id}`); // Debug ID
        const response = await api.get(`/tutor/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin tutor theo ID:", error.response?.data || error.message);
        throw error;
    }
};

// Tạo tutor mới
const createTutor = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.post("/tutor", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo tutor:", error);
        throw error;
    }
};

// Cập nhật thông tin tutor
const updateTutor = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.put(`/tutor/${data.id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật tutor:", error);
        throw error;
    }
};

// Xóa tutor
const deleteTutor = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.delete(`/tutor/${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa tutor:", error);
        throw error;
    }
};

// Xuất các API để sử dụng trong các file khác
export { getTutors, getTutorByID, createTutor, updateTutor, deleteTutor };
