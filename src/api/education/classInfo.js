import { api } from '../config';

export const createClass = async (data) => {
    return api.post('/education/classInfo', data);
};

export const getAllClasses = async () => {
    return api.get('/education/classInfo');
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

