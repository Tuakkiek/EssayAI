import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { Colors } from "@/constants/theme";

const ROLE_HOME = {
  admin: "/(admin)/admin/dashboard",
  teacher: "/(teacher)/progress",
  center_student: "/(student)",
  free_student: "/(student)",
} as const;

export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    router.replace(ROLE_HOME[user.role] ?? "/login");
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
