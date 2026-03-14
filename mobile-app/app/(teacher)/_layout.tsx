import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DarkCapsuleTabBar } from "../../src/components/DarkCapsuleTabBar";

export default function TeacherTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DarkCapsuleTabBar {...props} horizontalPadding={24} />}
      screenOptions={{ headerShown: false }}
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
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen name="teacher/dashboard"                         options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/index"                      options={{ href: null }} />
      <Tabs.Screen name="teacher/essays/[essayId]"                  options={{ href: null }} />
      <Tabs.Screen name="teacher/students/index"                    options={{ href: null }} />
      <Tabs.Screen name="teacher/students/[id]"                     options={{ href: null }} />
      <Tabs.Screen name="teacher/create-center"                     options={{ href: null }} />
      <Tabs.Screen name="teacher/classes/[classId]"                 options={{ href: null }} />
      <Tabs.Screen name="teacher/classes/[classId]/create-students" options={{ href: null }} />
      <Tabs.Screen name="teacher/classes/create"                    options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/[id]"                  options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/create"                options={{ href: null }} />
      <Tabs.Screen name="teacher/assignments/[id]/submissions"      options={{ href: null }} />
    </Tabs>
  );
}