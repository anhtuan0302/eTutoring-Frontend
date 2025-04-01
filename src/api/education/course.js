import { api } from '../config';

export const createCourse = async (data) => {
    return api.post('/education/course', data);
};

export const getAllCourses = async () => {
    return api.get('/education/course');
};

export const getCourseById = async (id) => {
    return api.get(`/education/course/${id}`);
};

export const updateCourse = async (id, data) => {
    return api.patch(`/education/course/${id}`, data);
};

export const deleteCourse = async (id) => {
    return api.delete(`/education/course/${id}`);
};

