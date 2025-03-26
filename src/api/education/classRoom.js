import { api } from "../config";

// Lấy danh sách tất cả lớp học
export const getAllClassRooms = async () => {
    return api.get("/classroom").then((res) => res.data);
};

// Tạo mới một lớp học
export const createClassRoom = async (data) => {
    return api.post("/classroom", data);
};

// Cập nhật thông tin lớp học
export const updateClassRoom = async (id, data) => {
    return api.put(`/classroom/${id}`, data);
};

// Xóa lớp học
export const deleteClassRoom = async (id) => {
    return api.delete(`/classroom/${id}`);
};
