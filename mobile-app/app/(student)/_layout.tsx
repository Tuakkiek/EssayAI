import { Tabs } from "expo-router";
import { DarkCapsuleTabBar } from "../../src/components/DarkCapsuleTabBar";
import { SFIcon } from "../../src/components/SFIcon";

export default function StudentTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DarkCapsuleTabBar {...props} horizontalPadding={14} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <SFIcon name="house" size={size} color={color} fallbackName="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="student/assignments/index"
        options={{
          title: "Bài tập",
          tabBarIcon: ({ color, size }) => (
            <SFIcon name="doc.text" size={size} color={color} fallbackName="clipboard-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Lịch sử",
          tabBarIcon: ({ color, size }) => (
            <SFIcon name="clock" size={size} color={color} fallbackName="time-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Tiến độ",
          tabBarIcon: ({ color, size }) => (
            <SFIcon name="chart.bar" size={size} color={color} fallbackName="bar-chart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Nâng cấp",
          tabBarIcon: ({ color, size }) => (
            <SFIcon name="star" size={size} color={color} fallbackName="star-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <SFIcon name="person.crop.circle" size={size} color={color} fallbackName="person-circle-outline" />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen name="improvement"              options={{ href: null }} />
      <Tabs.Screen name="essay/input"              options={{ href: null }} />
      <Tabs.Screen name="essay/result"             options={{ href: null }} />
      <Tabs.Screen name="essay/detail"             options={{ href: null }} />
      <Tabs.Screen name="individualSubscription"   options={{ href: null }} />
      <Tabs.Screen name="student/join-class"       options={{ href: null }} />
      <Tabs.Screen name="student/assignments/[id]" options={{ href: null }} />
    </Tabs>
  );
}