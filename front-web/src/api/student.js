import apiClient from "./client";

export const joinClass = (classCode) =>
  apiClient.post("/api/student/join-class", { classCode });

export const getMyClass = () => apiClient.get("/api/student/my-class");

export const getAssignments = () => apiClient.get("/api/student/assignments");

export const getAssignmentById = (id) =>
  apiClient.get(`/api/student/assignments/${id}`, {
    params: { _t: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

export const submitAssignment = (assignmentId, text) =>
  apiClient.post(`/api/student/assignments/${assignmentId}/submit`, { text });
