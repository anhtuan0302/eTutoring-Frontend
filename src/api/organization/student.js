import { api } from '../config';

export const getAllStudents = async () => {
    return api.get('/student');
};

export const getStudentById = async (id) => {
    return api.get(`/student/${id}`);
};

export const updateStudent = async (id, student) => {
    return api.patch(`/student/${id}`, student);
};

export const deleteStudent = async (id) => {
    return api.delete(`/student/${id}`);
};