import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";

export const api = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
  },
  essays: {
    submit: "/api/essays",
    list: "/api/essays",
    byId: (id) => `/api/essays/${id}`,
  },
  subscription: {
    plans: "/api/subscription/plans",
    checkout: "/api/subscription/checkout",
    status: "/api/subscription",
  },
  improvement: {
    progress: "/api/improvement/progress",
    vocabulary: "/api/improvement/vocabulary",
    grammar: "/api/improvement/grammar",
    phrases: "/api/improvement/phrases",
  },
  teacher: {
    students: "/api/teacher/students",
    studentById: (id) => `/api/teacher/students/${id}`,
    essays: "/api/teacher/essays",
    essayById: (id) => `/api/teacher/essays/${id}`,
    centerAnalytics: "/api/teacher/center/analytics",
    center: "/api/teacher/center",
  },
  classes: {
    list: "/api/teacher/classes",
    create: "/api/teacher/classes",
    byId: (id) => `/api/teacher/classes/${id}`,
    delete: (id) => `/api/teacher/classes/${id}`,
    analytics: (id) => `/api/teacher/classes/${id}/analytics`,
    invite: (classId) => `/api/teacher/classes/${classId}/invite`,
    bulkCreateStudents: (classId) =>
      `/api/teacher/classes/${classId}/students/bulk-create`,
    removeStudent: (classId, studentId) =>
      `/api/teacher/classes/${classId}/students/${studentId}`,
  },
  assignments: {
    list: "/api/teacher/assignments",
    byId: (id) => `/api/teacher/assignments/${id}`,
    publish: (id) => `/api/teacher/assignments/${id}/publish`,
    close: (id) => `/api/teacher/assignments/${id}/close`,
    submissions: (id) => `/api/teacher/assignments/${id}/submissions`,
  },
  submissions: {
    byId: (id) => `/api/teacher/submissions/${id}`,
    review: (id) => `/api/teacher/submissions/${id}/review`,
  },
  student: {
    joinClass: "/api/student/join-class",
    myClass: "/api/student/my-class",
    assignments: "/api/student/assignments",
    assignmentById: (id) => `/api/student/assignments/${id}`,
    submitAssignment: (assignmentId) =>
      `/api/student/assignments/${assignmentId}/submit`,
  },
  admin: {
    users: "/api/admin/users",
    userById: (id) => `/api/admin/users/${id}`,
    updateUserRole: (id) => `/api/admin/users/${id}/role`,
    toggleUserActive: (id) => `/api/admin/users/${id}/active`,
    analyticsOverview: "/api/admin/analytics/overview",
    analyticsEssays: "/api/admin/analytics/essays",
    analyticsUsers: "/api/admin/analytics/users",
  },
  user: {
    profile: "/api/user/profile",
    changePassword: "/api/user/change-password",
  },
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
});

export const saveAuthSession = (token, user) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const safeDecode = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = safeDecode(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const getAuthToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }
  return token;
};

export const getAuthUser = () => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const isAuthenticated = () => Boolean(getAuthToken());

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ??
    error?.message ??
    "Không thể kết nối. Vui lòng thử lại."
  );
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
