import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Colors } from "../../src/constants/theme";
import { SFIcon } from "../../src/components/SFIcon";

// ─── Apple Design Tokens ────────────────────────────────────────────
const IOS = {
  blue: "#007AFF",
  inactive: "#8E8E93",
  tabBg: "#FFFFFF",
  pillBg: "#007AFF14",
  border: "#E5E5EA",
};

// ─── Tab Icon with Apple-style active pill ──────────────────────────
function TabIcon({
  sfName,
  fallbackName,
  focused,
  color,
  size,
}: {
  sfName: string;
  fallbackName: string;
  focused: boolean;
  color: string;
  size: number;
}) {
  return (
    <View style={[tabIconStyles.wrap, focused && tabIconStyles.wrapActive]}>
      <SFIcon
        name={sfName}
        size={size}
        color={color}
        fallbackName={fallbackName}
      />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  wrapActive: {
    backgroundColor: IOS.pillBg,
  },
});

// ─── Layout ────────────────────────────────────────────────────────
export default function StudentTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: IOS.blue,
        tabBarInactiveTintColor: IOS.inactive,
        tabBarStyle: {
          backgroundColor: IOS.tabBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: IOS.border,
          height: Platform.OS === "ios" ? 88 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0.1,
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              sfName={focused ? "house.fill" : "house"}
              fallbackName={focused ? "home" : "home-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="student/assignments/index"
        options={{
          title: "Bài tập",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              sfName={focused ? "doc.text.fill" : "doc.text"}
              fallbackName={focused ? "clipboard" : "clipboard-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Lịch sử",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              sfName={focused ? "clock.fill" : "clock"}
              fallbackName={focused ? "time" : "time-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Tiến độ",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              sfName={focused ? "chart.bar.fill" : "chart.bar"}
              fallbackName={focused ? "bar-chart" : "bar-chart-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Nâng cấp",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              sfName={focused ? "star.fill" : "star"}
              fallbackName={focused ? "star" : "star-outline"}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              sfName={focused ? "person.crop.circle.fill" : "person.crop.circle"}
              fallbackName={focused ? "person-circle" : "person-circle-outline"}
              focused={focused}
              color={color}
              size={size}
            />
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