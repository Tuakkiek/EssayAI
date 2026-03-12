import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/constants/theme";

export default function AdminTasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Chức năng này sẽ được cập nhật sau.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { ...Typography.heading2, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
});

