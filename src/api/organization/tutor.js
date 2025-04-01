import { api } from '../config';

export const getAllTutors = async () => {
    return api.get('/tutor');
};

export const getTutorById = async (id) => {
    return api.get(`/tutor/${id}`);
};

export const updateTutor = async (id, tutor) => {
    return api.patch(`/tutor/${id}`, tutor);
};

export const deleteTutor = async (id) => {
    return api.delete(`/tutor/${id}`);
};