import apiClient from "./client";

export const getDashboard = () => apiClient.get("/api/teacher/dashboard");

export const getClasses = (params) =>
  apiClient.get("/api/teacher/classes", { params });

export const getClassById = (id) => apiClient.get(`/api/teacher/classes/${id}`);

export const createClass = (data) => apiClient.post("/api/teacher/classes", data);

export const deleteClass = (id) => apiClient.delete(`/api/teacher/classes/${id}`);

export const getClassAnalytics = (id) =>
  apiClient.get(`/api/teacher/classes/${id}/analytics`);

export const bulkCreateStudents = (classId, students) =>
  apiClient.post(`/api/teacher/classes/${classId}/students/bulk-create`, {
    students,
  });

export const removeStudent = (classId, studentId) =>
  apiClient.delete(`/api/teacher/classes/${classId}/students/${studentId}`);

export const getAssignments = (params) =>
  apiClient.get("/api/teacher/assignments", { params });

export const getAssignmentById = (id) =>
  apiClient.get(`/api/teacher/assignments/${id}`);

export const createAssignment = (data) =>
  apiClient.post("/api/teacher/assignments", data);

export const updateAssignment = (id, data) =>
  apiClient.put(`/api/teacher/assignments/${id}`, data);

export const publishAssignment = (id) =>
  apiClient.patch(`/api/teacher/assignments/${id}/publish`);

export const closeAssignment = (id) =>
  apiClient.patch(`/api/teacher/assignments/${id}/close`);

export const deleteAssignment = (id) =>
  apiClient.delete(`/api/teacher/assignments/${id}`);

export const getSubmissions = (assignmentId) =>
  apiClient.get(`/api/teacher/assignments/${assignmentId}/submissions`);

export const getSubmissionById = (id) =>
  apiClient.get(`/api/teacher/submissions/${id}`);

export const reviewSubmission = (id, comment) =>
  apiClient.patch(`/api/teacher/submissions/${id}/review`, { comment });

export const getEssays = (params) => apiClient.get("/api/teacher/essays", { params });

export const getEssayById = (id) => apiClient.get(`/api/teacher/essays/${id}`);
