import { api } from "../config";

export const createClassContent = async (data) => {
  return api.post("/education/classContent", data);
};

export const getContentByClassId = async (id) => {
  return api.get(`/education/classContent/class/${id}`);
};

export const getContentById = async (id) => {
  return api.get(`/education/classContent/${id}`);
};

export const updateContent = async (id, data) => {
  return api.put(`/education/classContent/${id}`, data);
};

export const deleteContent = async (id) => {
  return api.delete(`/education/classContent/${id}`);
};


