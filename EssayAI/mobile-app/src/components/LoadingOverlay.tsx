import React from "react"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme"

interface Props {
  visible: boolean
  message?: string
}

export const LoadingOverlay: React.FC<Props> = ({ visible, message = "Loading..." }) => {
  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  card: {
    minWidth: 200,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    ...Shadow.md,
  },
  message: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
})

