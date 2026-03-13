import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTabLayout() {
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
          
          // Chỉnh sửa tại đây:
          height: 80,          // Tăng từ 60 lên 70 (+10px)
          paddingBottom: 12,   // Giảm nhẹ paddingBottom để cân đối icon ở giữa (tùy chỉnh theo mắt bạn)
          paddingTop: 8,       // Tăng nhẹ paddingTop để icon không sát mép trên
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginBottom: 4,     // Thêm một chút margin bottom cho chữ nếu cần
        },
      }}
    >
      <Tabs.Screen
        name="admin/dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/users/index"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/tasks/index"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="checkmark-circle-outline"
              size={size}
              color={color}
            />
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
    </Tabs>
  );
}
