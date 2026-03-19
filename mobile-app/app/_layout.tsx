import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import api from "../src/services/api";

export default function RootLayout() {
  useEffect(() => {
    api.get("/health")
      .then(() => {
        console.log("hello from backend");
      })
      .catch((err) => {
        console.log("backend connection failed:", err.message);
      });
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
