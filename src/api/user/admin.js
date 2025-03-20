import { api } from "../config";

const login = async (email, password) => {
    try {
        const response = await api.post("/user/login", { email, password });
        const { access_token, refresh_token } = response.data;
        
        // Lưu token vào localStorage
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        
        // Thiết lập header Authorization cho các request tiếp theo
        api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        
        return response.data;
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        throw error;
    }
};

// Kiểm tra xem người dùng đã đăng nhập chưa
const isAuthenticated = () => {
    return localStorage.getItem("access_token") !== null;
};

// Lấy thông tin admin
const getAdmin = async () => {
    try {
        const response = await api.get("/admin");
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin admin:", error);
        throw error;
    }
};

export { login, getAdmin, isAuthenticated };
