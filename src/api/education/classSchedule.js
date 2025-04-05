import { api } from "../config";

export const getAllSchedules = async () => {
  return api.get("/education/classSchedule");
};

export const createSchedule = async (data) => {
  return api.post("/education/classSchedule", data);
};

export const getScheduleByClassId = async (classId) => {
  return api.get(`/education/classSchedule/class/${classId}`);
};

export const getScheduleById = async (id) => {
  return api.get(`/education/classSchedule/${id}`);
};

export const updateSchedule = async (scheduleId, data) => {
  return api.put(`/education/classSchedule/${scheduleId}`, data);
};

export const deleteSchedule = async (scheduleId) => {
  return api.delete(`/education/classSchedule/${scheduleId}`);
};
