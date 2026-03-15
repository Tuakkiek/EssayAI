/**
 * app/(teacher)/_layout.tsx
 *
 * Expo Router Tabs + custom LiquidGlassBar.
 */

import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "react-native";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import {
  LiquidGlassBar,
  TAB_BAR_BOTTOM_OFFSET,
} from "../../src/components/LiquidGlassBar";

export default function TeacherTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs
        tabBar={(props) => <LiquidGlassBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: "absolute" },
        }}
        sceneContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_OFFSET }}
      >
        {/* Visible Tab 1: Tiến độ */}
        <Tabs.Screen
          name="progress"
          options={{
            title: "Tiến độ",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "bar-chart" : "bar-chart-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Visible Tab 2: Bài tập */}
        <Tabs.Screen
          name="teacher/assignments/index"
          options={{
            title: "Bài tập",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Visible Tab 3: Lớp học */}
        <Tabs.Screen
          name="teacher/classes/index"
          options={{
            title: "Lớp học",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Visible Tab 4: Tài khoản */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Tài khoản",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={size}
                color={color}
              />
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
        <Tabs.Screen
          name="teacher/assignments/create"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="teacher/assignments/[id]/submissions"
          options={{ href: null }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
