import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Colors, Spacing, Typography } from "../constants/theme";
import { SFIcon } from "./SFIcon";

interface Props {
  label: string;
  onPress: () => void;
}

export function BackButton({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.iconWrap}>
        <SFIcon
          name="chevron.left"
          size={18}
          color={Colors.tint}
          weight="semibold"
          fallbackName="chevron-back"
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWrap: {
    marginRight: Spacing.xs,
  },
  label: {
    ...Typography.body,
    color: Colors.tint,
  },
});
