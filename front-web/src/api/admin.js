import apiClient from "./client";

export const getUsers = (params) => apiClient.get("/api/admin/users", { params });

export const toggleUserActive = (id, isActive) =>
  apiClient.patch(`/api/admin/users/${id}/active`, { isActive });

export const getAnalyticsOverview = () =>
  apiClient.get("/api/admin/analytics/overview");

export const getAnalyticsUsers = () => apiClient.get("/api/admin/analytics/users");

export const getAnalyticsEssays = () => apiClient.get("/api/admin/analytics/essays");
