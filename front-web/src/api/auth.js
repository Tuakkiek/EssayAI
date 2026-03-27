import apiClient from "./client";

export const login = (phone, password) =>
  apiClient.post("/api/auth/login", { phone, password });

export const register = (name, phone, password, role, centerName) => {
  const payload = { name, phone, password, role };

  if (centerName) {
    payload.centerName = centerName;
  }

  return apiClient.post("/api/auth/register", payload);
};

export const logout = () => apiClient.post("/api/auth/logout");

export const getMe = () => apiClient.get("/api/auth/me");

export const changePassword = (oldPassword, newPassword) =>
  apiClient.post("/api/auth/change-password", { oldPassword, newPassword });
