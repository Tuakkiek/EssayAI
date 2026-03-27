import axios from "axios";
import * as toast from "../utils/toast";

export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "authUser";

const LOGOUT_EVENT_NAME = "essay-ai:logout";

const isBrowser = typeof window !== "undefined";

export const emitLogoutEvent = () => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT_NAME));
};

export const onLogoutEvent = (listener) => {
  if (!isBrowser) {
    return () => {};
  }

  window.addEventListener(LOGOUT_EVENT_NAME, listener);
  return () => window.removeEventListener(LOGOUT_EVENT_NAME, listener);
};

const apiClient = axios.create({
  baseURL: "",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (!isBrowser) {
    return config;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hasResponse = Boolean(error?.response);
    const requestUrl = String(error?.config?.url ?? "");

    if (status === 401) {
      const isAuthEndpoint =
        requestUrl.includes("/api/auth/login") ||
        requestUrl.includes("/api/auth/register") ||
        requestUrl.includes("/api/auth/logout");

      if (!isAuthEndpoint) {
        emitLogoutEvent();
        if (isBrowser && window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }

    if (!hasResponse) {
      toast.error("Không thể kết nối. Kiểm tra kết nối mạng.");
    } else if (status >= 500) {
      toast.error("Lỗi server. Vui lòng thử lại.");
    }

    return Promise.reject(error);
  },
);

export const getErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Cannot connect to server. Please check your network.";
    }

    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      error.message ??
      "Request failed"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

export default apiClient;
