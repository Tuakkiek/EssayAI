import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TeacherTabLayout() {
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
        name="progress"
        options={{
          title: "Tiến độ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher/assignments/index"
        options={{
          title: "Bài tập",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher/classes/index"
        options={{
          title: "Lớp học",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
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

      {/* Hidden routes */}
      <Tabs.Screen name="teacher/dashboard" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/[essayId]" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/index" options={{ href: null }} />
      <Tabs.Screen name="teacher/students/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/create-center" options={{ href: null }} />
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
    </Tabs>
  );
}
