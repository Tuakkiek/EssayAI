import apiClient from "./client";

export const submit = (text, taskType, assignmentId) =>
  apiClient.post("/api/essays", { text, taskType, assignmentId });

export const getHistory = (page, limit) =>
  apiClient.get("/api/essays", {
    params: { page, limit },
  });

export const getById = (id) =>
  apiClient.get(`/api/essays/${id}`, {
    params: { _t: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

export const deleteById = (id) => apiClient.delete(`/api/essays/${id}`);
