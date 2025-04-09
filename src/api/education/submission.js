import { api } from "../config";

export const createSubmission = async (data) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };
    return api.post("/education/submission", data, config);
};

export const getSubmissionsByAssignment = async (assignmentId) => {
    return api.get(`/education/submission/assignment/${assignmentId}`);
};

export const getSubmissionById = async (submissionId) => {
    return api.get(`/education/submission/${submissionId}`);
};

export const gradeSubmission = async (submissionId, data) => {
    return api.post(`/education/submission/${submissionId}/grade`, data);
};

export const downloadAttachment = async (submissionId, attachmentId) => {
    return api.get(`/education/submission/${submissionId}/attachment/${attachmentId}/download`);
};


