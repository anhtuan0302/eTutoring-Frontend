import { api } from '../config';

export const getAllDepartments = async () => {
    return api.get('/department');
};

export const getDepartmentById = async (id) => {
    return api.get(`/department/${id}`);
};

export const createDepartment = async (department) => {
    return api.post('/department', department);
};

export const updateDepartment = async (id, department) => {
    return api.patch(`/department/${id}`, department);
};

export const deleteDepartment = async (id) => {
    return api.delete(`/department/${id}`);
};

