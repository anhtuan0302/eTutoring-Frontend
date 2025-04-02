import { api } from '../config';

export const createClass = async (data) => {
    return api.post('/education/classInfo', data);
};

export const getAllClasses = async () => {
    try {
        console.log('Calling getAllClasses');
        const response = await api.get('/education/classInfo');
        console.log('getAllClasses raw response:', response);
        // Kiểm tra và trả về dữ liệu
        if (Array.isArray(response)) {
            return response;
        } else if (Array.isArray(response.data)) {
            return response.data;
        }
        console.error('Unexpected response format:', response);
        return [];
    } catch (error) {
        console.error('Error in getAllClasses:', error);
        return [];
    }
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

