/**
 * app/(student)/_layout.tsx
 *
 * iOS 26 Liquid Glass tab bar — student role.
 *
 * Key settings:
 *   tabBarStyle: { position: "absolute" } → bar floats, doesn't push content
 *   sceneContainerStyle.paddingBottom     → screens clear the floating bar
 */

import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "react-native";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { LiquidGlassBar, TAB_BAR_BOTTOM_OFFSET } from "../../src/components/LiquidGlassBar";

export default function StudentTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs
        tabBar={(props) => <LiquidGlassBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Remove the default React Navigation border line
          tabBarStyle: {
            position:        "absolute",
            borderTopWidth:  0,
            borderTopColor:  "transparent",
            backgroundColor: "transparent",
            elevation:       0,       // Android: kills the default shadow/border
          },
        }}
        sceneContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_OFFSET }}
      >
        {/* ─── Visible tabs ──────────────────────────────────────────── */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="student/assignments/index"
          options={{
            title: "Bài tập",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Lịch sử",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Tiến độ",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Tài khoản",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={size} color={color} />
            ),
          }}
        />

        {/* ─── Hidden routes ─────────────────────────────────────────── */}
        <Tabs.Screen name="improvement"              options={{ href: null }} />
        <Tabs.Screen name="essay/input"              options={{ href: null }} />
        <Tabs.Screen name="essay/result"             options={{ href: null }} />
        <Tabs.Screen name="essay/detail"             options={{ href: null }} />
        <Tabs.Screen name="individualSubscription"   options={{ href: null }} />
        <Tabs.Screen name="subscription"             options={{ href: null }} />
        <Tabs.Screen name="student/join-class"       options={{ href: null }} />
        <Tabs.Screen name="student/assignments/[id]" options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}