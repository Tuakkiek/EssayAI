/**
 * app/(teacher)/_layout.tsx
 *
 * NativeTabs (Liquid Glass) — Expo Router SDK 54
 *
 * - Icon.sf      → SF Symbols trên iOS
 * - Icon.androidSrc → VectorIcon (Ionicons) trên Android
 * - hidden={false} → bắt buộc để expo-router nhận là Screen visible
 */

import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";

const tintColor =
  Platform.OS === "ios"
    ? DynamicColorIOS({ light: "#1D1D1F", dark: "#FFFFFF" })
    : "#1D1D1F";

export default function TeacherTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <NativeTabs
        tintColor={tintColor}
        labelStyle={{ fontSize: 11, fontWeight: "600" }}
      >
        {/* ── Tab 1: Tiến độ ───────────────────────────────────────────── */}
        <NativeTabs.Trigger name="progress" hidden={false}>
          <Icon
            sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="bar-chart-outline" />}
          />
          <Label>Tiến độ</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 2: Bài tập ───────────────────────────────────────────── */}
        <NativeTabs.Trigger name="teacher/assignments/index" hidden={false}>
          <Icon
            sf={{ default: "doc.text", selected: "doc.text.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="document-text-outline" />}
          />
          <Label>Bài tập</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 3: Lớp học ───────────────────────────────────────────── */}
        <NativeTabs.Trigger name="teacher/classes/index" hidden={false}>
          <Icon
            sf={{ default: "person.3", selected: "person.3.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="people-outline" />}
          />
          <Label>Lớp học</Label>
        </NativeTabs.Trigger>

        {/* ── Tab 4: Tài khoản ─────────────────────────────────────────── */}
        <NativeTabs.Trigger name="profile" hidden={false}>
          <Icon
            sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
            androidSrc={<VectorIcon family={Ionicons} name="person-circle-outline" />}
          />
          <Label>Tài khoản</Label>
        </NativeTabs.Trigger>

        {/* ── Hidden routes ─────────────────────────────────────────────── */}
        <NativeTabs.Trigger name="teacher/dashboard"                         hidden />
        <NativeTabs.Trigger name="teacher/essays/index"                      hidden />
        <NativeTabs.Trigger name="teacher/essays/[essayId]"                  hidden />
        <NativeTabs.Trigger name="teacher/students/index"                    hidden />
        <NativeTabs.Trigger name="teacher/students/[id]"                     hidden />
        <NativeTabs.Trigger name="teacher/create-center"                     hidden />
        <NativeTabs.Trigger name="teacher/classes/[classId]"                 hidden />
        <NativeTabs.Trigger name="teacher/classes/[classId]/create-students" hidden />
        <NativeTabs.Trigger name="teacher/classes/create"                    hidden />
        <NativeTabs.Trigger name="teacher/assignments/[id]"                  hidden />
        <NativeTabs.Trigger name="teacher/assignments/create"                hidden />
        <NativeTabs.Trigger name="teacher/assignments/[id]/submissions"      hidden />
      </NativeTabs>
    </ThemeProvider>
  );
}