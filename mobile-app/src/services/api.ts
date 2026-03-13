import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { ApiResponse } from "../types";
import { API_ROOT_URL } from "../config/api";

// Base URL from Expo config
const api = axios.create({
  baseURL: API_ROOT_URL,
  timeout: 30000, // increased to 30s for AI grading responses
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
  },
);

// ─── Error helper ────────────────────────────────────────────────────────────
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
  login: (phone: string, password: string) =>
    api.post("/api/auth/login", { phone, password }),
  register: (
    name: string,
    phone: string,
    password: string,
    confirmPassword: string,
    role: "free_student" | "teacher",
    centerName?: string,
  ) =>
    api.post("/api/auth/register", {
      name,
      phone,
      password,
      confirmPassword,
      role,
      centerName,
    }),
  logout: () => api.post("/api/auth/logout"),
};

// ─── Essays ───────────────────────────────────────────────────────────────────
export const essayApi = {
  submit: (text: string, assignmentId?: string) =>
    api.post("/api/essays", { text, assignmentId }),
  getHistory: () => api.get("/api/essays"),
  // Add cache-busting param + headers to prevent 304 Not Modified
  // during polling (304 returns empty body which breaks parsing)
  getById: (id: string) =>
    api.get(`/api/essays/${id}`, {
      params: { _t: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    }),
};

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionApi = {
  getPlans: () => api.get("/api/subscription/plans"),
  checkout: (planId: string) =>
    api.post("/api/subscription/checkout", { plan: planId }),
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
  getEssayById: (id: string) => api.get(`/api/teacher/essays/${id}`),
  getCenterAnalytics: () => api.get("/api/teacher/center/analytics"),
  createCenter: (data: Record<string, unknown>) =>
    api.post("/api/teacher/center", data),
};

// ─── Teacher - Classes ────────────────────────────────────────────
export const classApi = {
  getAll: (params?: object) => api.get("/api/teacher/classes", { params }),
  getById: (id: string) => api.get(`/api/teacher/classes/${id}`),
  getWithStudents: (id: string) => api.get(`/api/teacher/classes/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post("/api/teacher/classes", data),
  delete: (id: string) => api.delete(`/api/teacher/classes/${id}`),
  getAnalytics: (id: string) => api.get(`/api/teacher/classes/${id}/analytics`),
  inviteStudent: (classId: string, name: string, phone: string) =>
    api.post(`/api/teacher/classes/${classId}/invite`, { name, phone }),
  bulkCreateStudents: (
    classId: string,
    students: { name: string; phone: string }[],
  ) =>
    api.post(`/api/teacher/classes/${classId}/students/bulk-create`, {
      students,
    }),
  removeStudent: (classId: string, studentId: string) =>
    api.delete(`/api/teacher/classes/${classId}/students/${studentId}`),
};

// ─── Teacher - Assignments ────────────────────────────────────────
export const assignmentApi = {
  getAll: (params?: object) => api.get("/api/teacher/assignments", { params }),
  getById: (id: string) => api.get(`/api/teacher/assignments/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post("/api/teacher/assignments", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/api/teacher/assignments/${id}`, data),
  publish: (id: string) => api.patch(`/api/teacher/assignments/${id}/publish`),
  close: (id: string) => api.patch(`/api/teacher/assignments/${id}/close`),
  delete: (id: string) => api.delete(`/api/teacher/assignments/${id}`),
  getSubmissions: (id: string) =>
    api.get(`/api/teacher/assignments/${id}/submissions`),
};

// ─── Teacher - Submissions ────────────────────────────────────────
export const submissionApi = {
  getById: (id: string) => api.get(`/api/teacher/submissions/${id}`),
  review: (id: string, comment: string) =>
    api.patch(`/api/teacher/submissions/${id}/review`, { comment }),
};

// ─── Student ──────────────────────────────────────────────────────
export const studentApi = {
  joinClass: (classCode: string) =>
    api.post("/api/student/join-class", { classCode }),
  getMyClass: () => api.get("/api/student/my-class"),
  getAssignments: () => api.get("/api/student/assignments"),
  getAssignmentById: (id: string) => api.get(`/api/student/assignments/${id}`),
  submitAssignment: (assignmentId: string, text: string) =>
    api.post(`/api/student/assignments/${assignmentId}/submit`, {
      text,
    }),
};

// ─── Admin ────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params?: object) => api.get("/api/admin/users", { params }),
  getUserById: (id: string) => api.get(`/api/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    api.patch(`/api/admin/users/${id}/role`, { role }),
  toggleUserActive: (id: string, isActive: boolean) =>
    api.patch(`/api/admin/users/${id}/active`, { isActive }),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  getAnalyticsOverview: () => api.get("/api/admin/analytics/overview"),
  getAnalyticsEssays: () => api.get("/api/admin/analytics/essays"),
  getAnalyticsUsers: () => api.get("/api/admin/analytics/users"),
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userApi = {
  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    api.patch("/api/user/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/api/user/change-password", { currentPassword, newPassword }),
  getProfile: () => api.get("/api/user/profile"),
};

export default api;

/** Parse essay from any backend response shape */
export const extractEssay = (raw: unknown): import("../types").Essay | null => {
  if (!raw || typeof raw !== "object") return null;

  const r = raw as Record<string, unknown>;

  // Priority: data.essay > data > essay > root
  const candidate =
    (r.data as Record<string, unknown>)?.essay ??
    ((r.data as Record<string, unknown>)?._id ? r.data : null) ??
    (r as Record<string, unknown>)?.essay ??
    (r._id ? r : null);

  return candidate &&
    typeof candidate === "object" &&
    (candidate as Record<string, unknown>)._id
    ? (candidate as import("../types").Essay)
    : null;
};
