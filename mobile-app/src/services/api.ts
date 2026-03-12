import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { ApiResponse } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Error helper ───────────────────────────────────────────────────────

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    return data?.message ?? error.message ?? "Network error";
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post("/auth/register/student", { name, email, password }),

  logout: () => api.post("/auth/logout"),
};

// ─── Essays ───────────────────────────────────────────────────────────────────

export const essayApi = {
  submit: (text: string, taskType: "task1" | "task2", assignmentId?: string) =>
    api.post("/api/essays", {
      text,
      taskType,
      assignmentId,
    }),

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

// ─── Improvement / Progress ───────────────────────────────────────────────────

export const improvementApi = {
  getProgress: () => api.get("/improvement/progress"),
  getVocabulary: () => api.get("/improvement/vocabulary"),
  getGrammar: () => api.get("/improvement/grammar"),
  getPhrases: () => api.get("/improvement/phrases"),
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
