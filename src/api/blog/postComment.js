import { api } from '../config';

export const getComments = async (postId) => {
    return api.get(`/blog/postComment/post/${postId}`);
};

export const createComment = async (postId, data) => {
    return api.post(`/blog/postComment/post/${postId}`, data);
};

export const updateComment = async (postId, commentId, data) => {
    return api.patch(`/blog/postComment/post/${postId}/${commentId}`, data);
};

export const deleteComment = async (postId, commentId) => {
    return api.delete(`/blog/postComment/post/${postId}/${commentId}`);
};