import { api } from '../config';

export const getReactions = async (postId) => {
    return api.get(`/blog/postReaction/post/${postId}`);
};

export const createReaction = async (postId, data) => {
    return api.post(`/blog/postReaction/post/${postId}`, data);
};

export const getUserReaction = async (postId) => {
    return api.get(`/blog/postReaction/post/${postId}/me`);
};