import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, router, useRootNavigationState, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { API_ROOT_URL } from "../src/config/api";
import { Colors } from "../src/constants/theme";

// --- Auth Guard ----------------------------------------------------------------
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key || segments.length === 0) return;
    const inAuthScreen = segments[0] === "login";
    const role = user?.role;
    const roleGroup =
      role === "admin" ? "(admin)" : role === "teacher" ? "(teacher)" : "(student)";
    const inRoleGroup = segments[0] === roleGroup;

    let timer: ReturnType<typeof setTimeout>;

    if (!isAuthenticated && !inAuthScreen) {
      timer = setTimeout(() => router.replace("/login"), 50);
    } else if (isAuthenticated && inAuthScreen) {
      timer = setTimeout(() => {
        if (role === "admin") router.replace("/(admin)/admin/dashboard");
        else if (role === "teacher") router.replace("/(teacher)/progress");
        else router.replace("/(student)");
      }, 50);
    } else if (isAuthenticated && !inRoleGroup) {
      timer = setTimeout(() => {
        if (role === "admin") router.replace("/(admin)/admin/dashboard");
        else if (role === "teacher") router.replace("/(teacher)/progress");
        else router.replace("/(student)");
      }, 50);
    }

    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    isLoading,
    segments,
    rootNavigationState?.key,
    user?.role,
  ]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

// --- Root Layout ---------------------------------------------------------------
export default function RootLayout() {
  useEffect(() => {
    const healthUrl = `${API_ROOT_URL}/health`;
    console.log("[Startup] Using API_ROOT_URL:", API_ROOT_URL);
    fetch(healthUrl)
      .then((res) => {
        if (res.ok) {
          console.info(`[Startup] Network OK (${res.status})`, {
            url: healthUrl,
          });
          console.log("hello from backend");
        } else {
          console.warn(`[Startup] Network check failed (${res.status})`, {
            url: healthUrl,
          });
        }
      })
      .catch((error) => {
        console.error("[Startup] Network check FAILED - Full error:", error);
        console.error(
          "[Startup] Network check FAILED - Message:",
          error.message,
        );
        console.error("[Startup] Network check FAILED - URL:", healthUrl);
        if (error.code)
          console.error("[Startup] Network check FAILED - Code:", error.code);
      });
  }, []);

  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(student)" options={{ headerShown: false }} />
          <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}
