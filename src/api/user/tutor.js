import { api } from "../config";

// Hàm lấy access_token từ localStorage
const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Lấy thông tin tutor
const getTutor = async () => {
    try {
        const token = getAccessToken();
        if (!token) throw new Error("Unauthorized: No access token available");
        
        const response = await api.get("/tutor", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin tutor:", error);
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

export { createTutor, getTutor };
