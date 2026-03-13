import React from "react";
import { type ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView, type SFSymbol, type SymbolWeight } from "expo-symbols";

type Props = {
  name: SFSymbol;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
  fallbackName?: keyof typeof Ionicons.glyphMap;
};

export function SFIcon({
  name,
  size = 20,
  color,
  weight = "regular",
  fallbackName,
}: Props) {
  const fallback = fallbackName ? (
    <Ionicons name={fallbackName} size={size} color={color as any} />
  ) : undefined;

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      type="monochrome"
      fallback={fallback}
    />
  );
}
