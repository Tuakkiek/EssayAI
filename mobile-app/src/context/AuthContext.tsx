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

export type UserRole = "admin" | "teacher" | "center_student" | "free_student";

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  centerId?: string | null;
  centerName?: string | null;
  mustChangePassword?: boolean;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "free_student" | "teacher",
    centerName?: string,
  ) => Promise<User>;
  redirectAfterLogin: (role: UserRole) => void;
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
    return user;
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "free_student" | "teacher",
      centerName?: string,
    ) => {
      const response = await authApi.register(
        name,
        email,
        password,
        role,
        centerName,
      );
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
      return user;
    },
    [],
  );

  const redirectAfterLogin = useCallback((role: UserRole) => {
    switch (role) {
      case "admin":
        router.navigate("/admin/dashboard");
        break;
      case "teacher":
        router.navigate("/teacher/dashboard");
        break;
      case "center_student":
      case "free_student":
      default:
        router.navigate("/");
    }
  }, []);

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

      router.navigate("/login");
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, redirectAfterLogin, logout, getToken }}
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
