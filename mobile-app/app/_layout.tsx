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
    if (isLoading || !rootNavigationState?.key) return;
    const inAuthScreen = segments[0] === "login";
    if (!isAuthenticated && !inAuthScreen) {
      router.navigate("/login");
    } else if (isAuthenticated && inAuthScreen) {
      const role = user?.role;
      if (role === "admin") router.navigate("/admin/dashboard");
      else if (role === "teacher") router.navigate("/teacher/dashboard");
      else router.navigate("/");
    }
  }, [isAuthenticated, isLoading, segments, rootNavigationState?.key, user?.role]);

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Plans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
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
      <Tabs.Screen name="teacher/dashboard" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/[essayId]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/create-center" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/index" options={{ href: null }} />
      {/* Teacher new screens */}
      <Tabs.Screen name="teacher/classes/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/classes/[classId]" options={{ href: null }} />
      <Tabs.Screen name="teacher/classes/create" options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/create" options={{ href: null }} />
      <Tabs.Screen
        name="teacher/assignments/[id]/submissions"
        options={{ href: null }}
      />

      {/* Student new screens */}
      <Tabs.Screen name="student/join-class" options={{ href: null }} />
      <Tabs.Screen name="student/assignments/index" options={{ href: null }} />
      <Tabs.Screen name="student/assignments/[id]" options={{ href: null }} />

      {/* Admin screens */}
      <Tabs.Screen name="admin/dashboard" options={{ href: null }} />
      <Tabs.Screen name="admin/users/index" options={{ href: null }} />
      <Tabs.Screen name="admin/tasks/index" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  useEffect(() => {
    const healthUrl = `${API_ROOT_URL}/health`;
    fetch(healthUrl)
      .then((res) => {
        if (res.ok) {
          console.info(`[Startup] Network OK (${res.status})`, { url: healthUrl });
          console.log("hello from backend");
        } else {
          console.warn(`[Startup] Network check failed (${res.status})`, { url: healthUrl });
        }
      })
      .catch((error) => {
        console.warn("[Startup] Network check failed", { url: healthUrl, error });
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
