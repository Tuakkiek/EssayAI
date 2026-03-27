import apiClient from "./client";

export const updateProfile = (payload) => apiClient.put("/api/user/profile", payload);
