/**
 * app/(student)/_layout.tsx
 *
 * NativeTabs (Liquid Glass) — Expo Router SDK 54
 *
 * - Icon.sf      → SF Symbols trên iOS
 * - Icon.androidSrc → VectorIcon (Ionicons) trên Android
 * - hidden={false} → bắt buộc để expo-router nhận là Screen visible
 * - Android BottomNavigationView: tối đa 5 tabs
 */

import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";

const tintColor =
  Platform.OS === "ios"
    ? DynamicColorIOS({ light: "#1D1D1F", dark: "#FFFFFF" })
    : "#1D1D1F";

export default function StudentTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <NativeTabs
        tintColor={tintColor}
        labelStyle={{ fontSize: 11, fontWeight: "600" }}
      >
        {/* ── Tab 1: Home ──────────────────────────────────────────────── */}
        <NativeTabs.Trigger name="index" hidden={false}>
          <Icon
            sf={{ default: "house", selected: "house.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="home-outline" />}
          />
          <Label>Home</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 2: Bài tập ───────────────────────────────────────────── */}
        <NativeTabs.Trigger name="student/assignments/index" hidden={false}>
          <Icon
            sf={{ default: "doc.text", selected: "doc.text.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="document-text-outline" />}
          />
          <Label>Bài tập</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 3: Lịch sử ───────────────────────────────────────────── */}
        <NativeTabs.Trigger name="history" hidden={false}>
          <Icon
            sf={{ default: "clock", selected: "clock.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="time-outline" />}
          />
          <Label>Lịch sử</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 4: Tiến độ ───────────────────────────────────────────── */}
        <NativeTabs.Trigger name="progress" hidden={false}>
          <Icon
            sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="bar-chart-outline" />}
          />
          <Label>Tiến độ</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 5: Tài khoản ─────────────────────────────────────────── */}
        <NativeTabs.Trigger name="profile" hidden={false}>
          <Icon
            sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="person-circle-outline" />}
          />
          <Label>Tài khoản</Label>
        </NativeTabs.Trigger>

        {/* ── Hidden routes ─────────────────────────────────────────────── */}
        <NativeTabs.Trigger name="improvement"              hidden />
        <NativeTabs.Trigger name="essay/input"              hidden />
        <NativeTabs.Trigger name="essay/result"             hidden />
        <NativeTabs.Trigger name="essay/detail"             hidden />
        <NativeTabs.Trigger name="individualSubscription"   hidden />
        <NativeTabs.Trigger name="subscription"             hidden />
        <NativeTabs.Trigger name="student/join-class"       hidden />
        <NativeTabs.Trigger name="student/assignments/[id]" hidden />
      </NativeTabs>
    </ThemeProvider>
  );
}