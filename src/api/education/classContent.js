import { api } from "../config";

export const createClassContent = async (data) => {
  return api.post("/education/classContent", data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getContentByClassId = async (id) => {
  return api.get(`/education/classContent/class/${id}`);
};

export const getContentById = async (id) => {
  return api.get(`/education/classContent/${id}`);
};

export const updateContent = async (id, data) => {
  return api.put(`/education/classContent/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteContent = async (id) => {
  try {
    const response = await api.delete(`/education/classContent/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
};


