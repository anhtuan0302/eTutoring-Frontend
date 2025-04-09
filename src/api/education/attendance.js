import { api } from "../config";

export const createAttendance = async (data) => {
    return api.post("/education/attendance", data);
};

export const getAttendanceBySchedule = async (scheduleId) => {
    return api.get(`/education/attendance/schedule/${scheduleId}`);
};

export const getStudentAttendance = async (classId, studentId) => {
    return api.get(`/education/attendance/class/${classId}/student/${studentId}`);
};

export const updateAttendance = async (id, data) => {
    return api.patch(`/education/attendance/${id}`, data);
};

export const deleteAttendance = async (id) => {
    return api.delete(`/education/attendance/${id}`);
};

export const bulkAttendance = async (data) => {
    return api.post("/education/attendance/bulk", data);
};