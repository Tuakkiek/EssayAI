import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DarkCapsuleTabBar } from "../../src/components/DarkCapsuleTabBar";

export default function AdminTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DarkCapsuleTabBar {...props} horizontalPadding={24} />}
      screenOptions={{ headerShown: false }}
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
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/tasks/index"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
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
    </Tabs>
  );
}