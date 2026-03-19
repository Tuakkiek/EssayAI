import { useEffect } from "react";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import api from "../src/services/api";

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading) return;
    if (!rootNavigationState?.key) return;

    const isLoginRoute = segments[0] === "login";

    if (!isAuthenticated && !isLoginRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isLoginRoute) {
      router.replace("/");
    }
  }, [
    isAuthenticated,
    isLoading,
    rootNavigationState?.key,
    router,
    segments,
  ]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    api.get("/health")
      .then(() => {
        console.log("hello from backend");
      })
      .catch((err) => {
        console.log("backend connection failed:", err.message);
      });
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
