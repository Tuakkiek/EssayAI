import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";

// ─── Apple Design Tokens ────────────────────────────────────────────
const IOS = {
  blue: "#007AFF",
  inactive: "#8E8E93",
  tabBg: "#FFFFFF",
  pillBg: "#007AFF14",
  border: "#E5E5EA",
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// ─── Tab Icon with Apple-style active pill ──────────────────────────
function TabIcon({
  name,
  activeName,
  focused,
  color,
  size,
}: {
  name: IconName;
  activeName: IconName;
  focused: boolean;
  color: string;
  size: number;
}) {
  return (
    <View style={[tabIconStyles.wrap, focused && tabIconStyles.wrapActive]}>
      <Ionicons
        name={focused ? activeName : name}
        size={size}
        color={color}
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
export default function TeacherTabLayout() {
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
        name="progress"
        options={{
          title: "Tiến độ",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="bar-chart-outline"
              activeName="bar-chart"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher/assignments/index"
        options={{
          title: "Bài tập",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="document-text-outline"
              activeName="document-text"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher/classes/index"
        options={{
          title: "Lớp học",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="people-outline"
              activeName="people"
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
              name="person-circle-outline"
              activeName="person-circle"
              focused={focused}
              color={color}
              size={size}
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
      <Tabs.Screen name="teacher/assignments/create" options={{ href: null }} />
      <Tabs.Screen
        name="teacher/assignments/[id]/submissions"
        options={{ href: null }}
      />
    </Tabs>
  );
}