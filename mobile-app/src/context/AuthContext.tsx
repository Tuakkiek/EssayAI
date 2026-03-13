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

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type UserRole = "admin" | "teacher" | "center_student" | "free_student";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
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
  login: (phone: string, password: string) => Promise<User>;
  register: (
    name: string,
    phone: string,
    password: string,
    confirmPassword: string,
    role: "free_student" | "teacher",
    centerName?: string,
  ) => Promise<User>;
  refreshUser: (partial?: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";

// â”€â”€â”€ Context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AuthContext = createContext<AuthContextValue | null>(null);

// â”€â”€â”€ Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const login = useCallback(async (phone: string, password: string) => {
    const response = await authApi.login(phone, password);
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
      phone: string,
      password: string,
      confirmPassword: string,
      role: "free_student" | "teacher",
      centerName?: string,
    ) => {
      const response = await authApi.register(
        name,
        phone,
        password,
        confirmPassword,
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

  const refreshUser = useCallback(async (partial: Partial<User> = {}) => {
    let nextUser: User | null = null;

    setState((prev) => {
      if (!prev.user) return prev;
      nextUser = { ...prev.user, ...partial };
      return { ...prev, user: nextUser };
    });

    if (nextUser) {
      await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(nextUser));
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
      // We rely on AuthGuard to redirect to /login when isAuthenticated becomes false.
      // Calling router.replace here concurrently with state update causes the navigator to crash.
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        refreshUser,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// â”€â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

export default AuthContext;

