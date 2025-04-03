import { api } from '../config';

export const assignTutor = async (data) => {
    return api.post('/education/classTutor', data);
};

export const getTutorsByClass = async (classId) => {
    return api.get(`/education/classTutor/class/${classId}`);
};

export const getClassesByTutor = async (tutorId) => {
    return api.get(`/education/classTutor/tutor/${tutorId}`);
};

export const updateTutorRole = async (id, data) => {
    return api.patch(`/education/classTutor/${id}`, data);
};

export const removeTutor = async (id) => {
    return api.delete(`/education/classTutor/${id}`);
};
