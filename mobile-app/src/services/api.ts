import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { ApiResponse } from "../types";
import { API_ROOT_URL } from "../config/api";
// Base URL from Expo config
const api = axios.create({
  baseURL: API_ROOT_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Auto-attach token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Friendly error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.friendlyMessage =
        "Cannot connect to server. Check your internet or make sure the server is running.";
    } else if (error.response.status === 401) {
      error.friendlyMessage = "Session expired. Please log in again.";
    } else if (error.response.status >= 500) {
      error.friendlyMessage = "Server error. Please try again later.";
    }
    return Promise.reject(error);
  }
);

// ─── Error helper ───────────────────────────────────────────────────────
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if ((error as any).friendlyMessage) {
      return (error as any).friendlyMessage;
    }
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    return data?.message ?? error.message ?? "Network error";
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post("/api/auth/register/student", { name, email, password }),
  logout: () => api.post("/api/auth/logout"),
};

// ─── Essays ───────────────────────────────────────────────────────────────────
export const essayApi = {
  submit: (text: string, taskType: "task1" | "task2", assignmentId?: string) =>
    api.post("/api/essays", { text, taskType, assignmentId }),
  getHistory: () => api.get("/api/essays"),
  getById: (id: string) => api.get(`/api/essays/${id}`),
};

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionApi = {
  getPlans: () => api.get("/api/subscription/plans"),
  checkout: (planId: string, userId: string) =>
    api.post("/api/subscription/checkout", { planId, userId }),
  getStatus: () => api.get("/api/subscription"),
};

// ─── Improvement ──────────────────────────────────────────────────────────────
export const improvementApi = {
  getProgress: () => api.get("/api/improvement/progress"),
  getVocabulary: () => api.get("/api/improvement/vocabulary"),
  getGrammar: () => api.get("/api/improvement/grammar"),
  getPhrases: () => api.get("/api/improvement/phrases"),
};

// ─── Teacher ──────────────────────────────────────────────────────────────────
export const teacherApi = {
  getStudents: () => api.get("/api/teacher/students"),
  getStudentById: (id: string) => api.get(`/api/teacher/students/${id}`),
  getEssays: () => api.get("/api/teacher/essays"),
  createCenter: (data: Record<string, unknown>) =>
    api.post("/api/teacher/center", data),
};

export default api;



