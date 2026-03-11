import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { getBandColor, getBandLabel } from "@/utils/bandColor"
import { Radius, Typography } from "@/constants/theme"

interface Props {
  score: number
  size?: "sm" | "lg"
}

export const ScoreBadge: React.FC<Props> = ({ score, size = "sm" }) => {
  const color = getBandColor(score)
  const isLarge = size === "lg"

  return (
    <View style={[styles.container, { backgroundColor: color + "20", borderColor: color }, isLarge && styles.large]}>
      <Text style={[styles.score, { color }, isLarge && styles.scoreLarge]}>
        {score.toFixed(1)}
      </Text>
      {isLarge && (
        <Text style={[styles.label, { color }]}>{getBandLabel(score)}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  score: {
    ...Typography.heading3,
    fontWeight: "700",
  },
  scoreLarge: {
    fontSize: 42,
    fontWeight: "800",
  },
  label: {
    ...Typography.caption,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
})

