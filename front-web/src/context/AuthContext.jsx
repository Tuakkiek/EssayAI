/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "@/api/auth";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  onLogoutEvent,
} from "@/api/client";

const VALID_ROLES = ["admin", "teacher", "center_student", "free_student"];

const AuthContext = createContext(null);

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const role = VALID_ROLES.includes(rawUser.role) ? rawUser.role : "free_student";
  const center = rawUser.center && typeof rawUser.center === "object" ? rawUser.center : null;

  return {
    id: rawUser.id ?? rawUser._id ?? "",
    name: rawUser.name ?? "",
    phone: rawUser.phone ?? "",
    email: rawUser.email ?? null,
    role,
    centerId: rawUser.centerId ?? center?._id ?? null,
    centerName: rawUser.centerName ?? center?.name ?? null,
    avatarUrl: rawUser.avatarUrl ?? null,
    mustChangePassword: Boolean(rawUser.mustChangePassword),
  };
};

const extractAuthPayload = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;
  const token = data?.token ?? root?.token ?? null;
  const rawUser =
    data?.user ??
    root?.user ??
    data?.account ??
    (data?.id || data?._id || data?.phone ? data : null);

  return {
    token,
    user: normalizeUser(rawUser),
  };
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);

    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const restoreSession = useCallback(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = window.localStorage.getItem(AUTH_USER_KEY);

    if (!token || !storedUser) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      return;
    }

    try {
      const user = normalizeUser(JSON.parse(storedUser));

      if (!user) {
        clearSession();
        return;
      }

      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const unsubscribe = onLogoutEvent(() => {
      clearSession();
    });

    return unsubscribe;
  }, [clearSession]);

  const login = useCallback(async (phone, password) => {
    const response = await authApi.login(phone, password);
    const { token, user } = extractAuthPayload(response);

    if (!token || !user) {
      throw new Error("Invalid login response.");
    }

    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });

    return user;
  }, []);

  const register = useCallback(
    async (name, phone, password, role, centerName) => {
      const response = await authApi.register(
        name,
        phone,
        password,
        role,
        centerName,
      );

      const { token, user } = extractAuthPayload(response);

      if (!token || !user) {
        throw new Error("Invalid register response.");
      }

      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

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

  const refreshUser = useCallback((partial = {}) => {
    let nextUser = null;

    setState((prev) => {
      if (!prev.user) {
        return prev;
      }

      nextUser = {
        ...prev.user,
        ...partial,
      };

      return {
        ...prev,
        user: nextUser,
      };
    });

    if (nextUser) {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear session locally even when server logout fails.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshUser,
    }),
    [state, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export default AuthContext;
