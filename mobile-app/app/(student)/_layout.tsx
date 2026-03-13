import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";

export default function StudentTabLayout() {
  const { user } = useAuth();
  const isCenterStudent = user?.role === "center_student";

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
          title: "Lịch sử",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Tiến độ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Gói dịch vụ",
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
        name="student/assignments/index"
        options={{
          title: "Bài tập",
          href: isCenterStudent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen name="improvement" options={{ href: null }} />
      <Tabs.Screen name="essay/input" options={{ href: null }} />
      <Tabs.Screen name="essay/result" options={{ href: null }} />
      <Tabs.Screen name="essay/detail" options={{ href: null }} />
      <Tabs.Screen name="individualSubscription" options={{ href: null }} />
      <Tabs.Screen name="student/join-class" options={{ href: null }} />
      <Tabs.Screen name="student/assignments/[id]" options={{ href: null }} />
    </Tabs>
  );
}



