import { api } from '../config';

export const getAllStaffs = async () => {
    return api.get('/staff');
};

export const getStaffById = async (id) => {
    return api.get(`/staff/${id}`);
};

export const updateStaff = async (id, staff) => {
    return api.patch(`/staff/${id}`, staff);
};

