import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Tabs, router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { API_ROOT_URL } from "../src/config/api";

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthScreen = segments[0] === "login";
    if (!isAuthenticated && !inAuthScreen) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthScreen) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, segments]);

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
      {/* Hide these screens from the tab bar */}
      <Tabs.Screen name="home" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="improvement" options={{ href: null }} />
      <Tabs.Screen name="essay/input" options={{ href: null }} />
      <Tabs.Screen name="essay/result" options={{ href: null }} />
      <Tabs.Screen name="essay/detail" options={{ href: null }} />
      <Tabs.Screen name="teacher/dashboard" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/[essayId]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/create-center" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/index" options={{ href: null }} />
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
