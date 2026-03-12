import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { adminApi, getErrorMessage } from "../services/api";

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      const data = res.data?.data?.users ?? res.data?.data ?? [];
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.toggleUserActive(userId, !isActive);
      load();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.email ?? item.phone ?? ""}</Text>
              <Text style={styles.meta}>Role: {item.role}</Text>
            </View>
            <TouchableOpacity
              style={[styles.badge, !item.isActive && styles.badgeInactive]}
              onPress={() => toggleActive(item._id, item.isActive)}
            >
              <Text style={styles.badgeText}>
                {item.isActive ? "Active" : "Disabled"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: { ...Typography.heading2, color: Colors.surface, fontWeight: "800" },
  list: { padding: Spacing.lg },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
    alignItems: "center",
  },
  name: { ...Typography.body, fontWeight: "700" },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeInactive: { backgroundColor: Colors.textMuted },
  badgeText: { color: Colors.surface, fontWeight: "700", fontSize: 12 },
});

