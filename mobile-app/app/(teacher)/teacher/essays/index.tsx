import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { teacherApi } from "@/src/services/api";
import { useRoleGuard } from "@/src/hooks/useRoleGuard";
import { useBack } from "@/src/hooks/useBack";

interface Essay {
  _id: string;
  studentName?: string;
  taskType: "task1" | "task2";
  overallBand: number;
  createdAt: string;
  originalText: string;
}

export default function TeacherEssaysScreen() {
  useRoleGuard(["teacher", "admin"]);

  const goBack = useBack("/(teacher)/progress");
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEssays = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await teacherApi.getEssays();
      setEssays(response.data?.essays ?? response.data ?? []);
    } catch {
      Alert.alert("Error", "Failed to load essays. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEssays();
  }, [fetchEssays]);

  const renderItem = ({ item }: { item: Essay }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/teacher/essays/${item._id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.studentName}>
          {item.studentName ?? "H?c sinh"}
        </Text>
        <View style={styles.bandBadge}>
          <Text style={styles.bandText}>{item.overallBand.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.taskType}>
        {item.taskType === "task1" ? "Task 1" : "Task 2"}
      </Text>

      <Text style={styles.preview} numberOfLines={2}>
        {item.originalText}
      </Text>

      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài lu?n</Text>
        <Text style={styles.count}>{essays.length}</Text>
      </View>

      <FlatList
        data={essays}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchEssays(true)}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chua có bài lu?n</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#111827" },
  count: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  bandBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bandText: { fontSize: 14, fontWeight: "700", color: "#4F46E5" },
  taskType: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  preview: { fontSize: 13, color: "#9CA3AF", lineHeight: 18 },
  date: { fontSize: 11, color: "#D1D5DB" },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});




