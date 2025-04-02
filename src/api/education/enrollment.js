import { api } from '../config';

export const enrollStudent = async (data) => {
    return api.post('/education/enrollment', data);
};

export const getStudentsByClass = async (classInfo_id) => {
    try {
        console.log('Calling getStudentsByClass with:', classInfo_id);
        const response = await api.get(`/education/enrollment/class/${classInfo_id}`);
        console.log('getStudentsByClass raw response:', response);
        
        if (Array.isArray(response)) {
            return response;
        } else if (response && response.data) {
            return response.data;
        }
        return [];
        
    } catch (error) {
        console.error('Error in getStudentsByClass:', error);
        return [];
    }
};

export const getClassesByStudent = async (student_id) => {
    return api.get(`/education/enrollment/student/${student_id}`);
};

export const checkEnrollment = async (classInfo_id, student_id) => {
    return api.get(`/education/enrollment/check/${classInfo_id}/${student_id}`);
};

export const unenrollStudent = async (id) => {
    return api.delete(`/education/enrollment/${id}`);
};

export const reviewClass = async (id, data) => {
    return api.post(`/education/enrollment/${id}/review`, data);
};