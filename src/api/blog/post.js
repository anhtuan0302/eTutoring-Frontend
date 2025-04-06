import { api } from '../config';

export const getAllPosts = async () => {
    return api.get('/blog/post');
};

export const getPostById = async (id) => {
    return api.get(`/blog/post/${id}`);
};

export const createPost = async (formData) => {
    console.log("Creating post with data:");
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? value.name : value);
    }

    return api.post('/blog/post', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
        }
    });
};

export const updatePost = async (id, formData) => {
    return api.patch(`/blog/post/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const deletePost = async (id) => {
    return api.delete(`/blog/post/${id}`);
};

export const moderatePost = async (id, data) => {
    return api.patch(`/blog/post/${id}/moderate`, data);
};

export const removeAttachment = async (id, attachmentPath) => {
    return api.delete(`/blog/post/${id}/attachments/${attachmentPath}`);
};

export const addView = async (postId) => {
    return api.post(`/blog/post/${postId}/view`);
  };
  
  export const getViewers = async (postId) => {
    return api.get(`/blog/post/${postId}/viewers`);
  };