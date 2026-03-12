import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { authApi } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "center_admin"
  | "teacher"
  | "student"
  | "individual_user";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  accountType?: "CENTER_STUDENT" | "INDIVIDUAL_USER" | "CENTER_STAFF";
  centerId?: string | null;
  mustChangePassword?: boolean;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accountType?: "CENTER_STUDENT" | "INDIVIDUAL_USER" | "CENTER_STAFF";
  centerId?: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(AUTH_USER_KEY),
      ]);

      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { token, user } = response.data.data;

    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
      SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user)),
    ]);

    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });

    // Role-based navigation for dual models
    switch (user.role) {
      case "center_admin":
        router.replace("/teacher/create-center");
        break;
      case "teacher":
        router.replace("/teacher/dashboard");
        break;
      case "individual_user":
        router.replace("/subscription"); // Check plan first
        break;
      default: // student
        router.replace("/");
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await authApi.register(name, email, password);
      const { token, user } = response.data.data;

      await Promise.all([
        SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
        SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user)),
      ]);

      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      router.replace("/");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout locally even if API call fails
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(AUTH_USER_KEY),
      ]);

      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });

      router.replace("/login");
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

export default AuthContext;
