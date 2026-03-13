import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Tabs, router, useRootNavigationState, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { API_ROOT_URL } from "../src/config/api";

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key || segments.length === 0) return;
    const inAuthScreen = segments[0] === "login";

    let timer: ReturnType<typeof setTimeout>;

    if (!isAuthenticated && !inAuthScreen) {
      timer = setTimeout(() => router.replace("/login"), 50);
    } else if (isAuthenticated && inAuthScreen) {
      const role = user?.role;
      timer = setTimeout(() => {
        if (role === "admin") router.replace("/admin/dashboard");
        else if (role === "teacher") router.replace("/teacher/dashboard");
        else router.replace("/");
      }, 50);
    }

    return () => clearTimeout(timer); // cleanup nếu effect chạy lại trước khi timer xong
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
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

function TabLayout() {
  const { user } = useAuth();
  const segments = useSegments();
  const inAuthScreen = segments[0] === "login";
  const role = user?.role ?? "";

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isCenterStudent = role === "center_student";
  const isFreeStudent = role === "free_student";
  const isStudent = isCenterStudent || isFreeStudent;

  const tabBarStyle = inAuthScreen
    ? { display: "none" }
    : {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingBottom: 8,
        paddingTop: 4,
        height: 60,
      };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Lịch sử",
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Tiến độ",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Gói dịch vụ",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="teacher/dashboard"
        options={{
          title: "Dashboard",
          href: isTeacher ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher/classes/index"
        options={{
          title: "Lớp học",
          href: isTeacher ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher/assignments/index"
        options={{
          title: "Bài tập",
          href: isTeacher ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="student/assignments/index"
        options={{
          title: "Bài tập",
          href: isCenterStudent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/dashboard"
        options={{
          title: "Dashboard",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/users/index"
        options={{
          title: "Users",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/tasks/index"
        options={{
          title: "Tasks",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="checkmark-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hide these screens from the tab bar */}
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="improvement" options={{ href: null }} />
      <Tabs.Screen name="essay/input" options={{ href: null }} />
      <Tabs.Screen name="essay/result" options={{ href: null }} />
      <Tabs.Screen name="essay/detail" options={{ href: null }} />
      <Tabs.Screen name="individualSubscription" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/[essayId]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/create-center" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/index" options={{ href: null }} />
      {/* Teacher new screens */}
      <Tabs.Screen name="teacher/classes/[classId]" options={{ href: null }} />
      <Tabs.Screen
        name="teacher/classes/[classId]/create-students"
        options={{ href: null }}
      />
      <Tabs.Screen name="teacher/classes/create" options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/create" options={{ href: null }} />
      <Tabs.Screen
        name="teacher/assignments/[id]/submissions"
        options={{ href: null }}
      />

      {/* Student new screens */}
      <Tabs.Screen name="student/join-class" options={{ href: null }} />
      <Tabs.Screen name="student/assignments/[id]" options={{ href: null }} />

      {/* Admin screens */}
    </Tabs>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

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
        <TabLayout />
      </AuthGuard>
    </AuthProvider>
  );
}
