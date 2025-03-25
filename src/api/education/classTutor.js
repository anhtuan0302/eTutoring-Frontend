import { api } from "../config";

// Hàm lấy access_token từ localStorage
const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy danh sách class tutor
const getClassTutors = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.get("/class_tutor", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách class tutor:", error);
        throw error;
    }
};

// Lấy class tutor theo ID
const getClassTutorById = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.get(`/class_tutor/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy class tutor theo ID:", error);
        throw error;
    }
};

// Tạo class tutor mới
const createClassTutor = async (data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.post("/class_tutor", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo class tutor:", error);
        throw error;
    }
};

// Cập nhật class tutor
const updateClassTutor = async (id, data) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.put(`/class_tutor/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật class tutor:", error);
        throw error;
    }
};

// Xóa class tutor
const deleteClassTutor = async (id) => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");

        const response = await api.delete(`/class_tutor/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa class tutor:", error);
        throw error;
    }
};

export { getClassTutors, getClassTutorById, createClassTutor, updateClassTutor, deleteClassTutor };
