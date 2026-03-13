import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Platform, StyleSheet } from "react-native";

// ─── Apple Design Tokens ────────────────────────────────────────────
const IOS = {
  blue: "#007AFF",
  inactive: "#8E8E93",
  tabBg: "#FFFFFF",
  pillBg: "#007AFF14",   // 8% blue tint
  border: "#E5E5EA",
  label: "#000000",
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
export default function AdminTabLayout() {
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
          // Frosted glass shadow
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
        name="admin/dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="speedometer-outline"
              activeName="speedometer"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/users/index"
        options={{
          title: "Users",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="people-circle-outline"
              activeName="people-circle"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/tasks/index"
        options={{
          title: "Tasks",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="checkmark-circle-outline"
              activeName="checkmark-circle"
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
    </Tabs>
  );
}