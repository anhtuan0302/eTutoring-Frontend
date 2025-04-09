import { api } from "../config";

export const createClass = async (data) => {
  return api.post("/education/classInfo", data);
};

export const getAllClasses = async () => {
  return api.get("/education/classInfo");
};

export const getClassById = async (id) => {
  return api.get(`/education/classInfo/${id}`);
};

export const updateClass = async (id, data) => {
  return api.patch(`/education/classInfo/${id}`, data);
};

export const deleteClass = async (id) => {
  return api.delete(`/education/classInfo/${id}`);
};

export const addStudentsToClass = async (classId, studentIds) => {
  return api.post(`/education/classInfo/${classId}/students`, { studentIds });
};

export const removeStudentsFromClass = async (classId, studentIds) => {
  return api.delete(`/education/classInfo/${classId}/students`, { data: { studentIds } });
};

export const addTutorsToClass = async (classId, tutorIds) => {
  return api.post(`/education/classInfo/${classId}/tutors`, { tutorIds });
};

export const removeTutorsFromClass = async (classId, tutorIds) => {
  return api.delete(`/education/classInfo/${classId}/tutors`, { data: { tutorIds } });
};

export const getClassStudents = async (classId) => {
  return api.get(`/education/classInfo/${classId}/students`);
};

export const getClassTutors = async (classId) => {
  return api.get(`/education/classInfo/${classId}/tutors`);
};
