/**
 * DarkCapsuleTabBar — updated with new design tokens.
 * Accent color now uses brand green (#58CC02) per spec.
 */
import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Animated,
} from "react-native";

// Design tokens from new theme
const TAB_BG     = "#1A1A1A";
const TAB_ACCENT = "#58CC02";
const ICON_ON    = "#FFFFFF";
const ICON_OFF   = "#666666";

export const TAB_THEME = {
  barBg:      TAB_BG,
  accent:     TAB_ACCENT,
  iconActive: ICON_ON,
  iconOff:    ICON_OFF,
};

export const BAR_BOTTOM = Platform.OS === "ios" ? 28 : 20;

function AnimatedTab({
  route,
  focused,
  options,
  onPress,
}: {
  route: any;
  focused: boolean;
  options: any;
  onPress: () => void;
}) {
  const scaleAnim   = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.45)).current;
  const accentOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const accentWidth   = useRef(new Animated.Value(focused ? 22 : 0)).current;
  const accentY       = useRef(new Animated.Value(focused ? 0 : -4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.45,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(accentOpacity, {
        toValue: focused ? 1 : 0,
        duration: focused ? 220 : 120,
        useNativeDriver: false,
      }),
      Animated.timing(accentWidth, {
        toValue: focused ? 22 : 0,
        duration: focused ? 250 : 150,
        useNativeDriver: false,
      }),
      Animated.timing(accentY, {
        toValue: focused ? 0 : -4,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  const icon = options.tabBarIcon?.({
    focused,
    color: ICON_ON,
    size:  22,
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.tab}>
      <View style={s.tile}>
        {/* Accent line — green per new tokens */}
        <Animated.View
          style={[
            s.accentLine,
            {
              opacity:   accentOpacity,
              width:     accentWidth,
              transform: [{ translateY: accentY }],
            },
          ]}
        />
        <Animated.View
          style={{
            opacity:   opacityAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {icon}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export function DarkCapsuleTabBar({
  state,
  descriptors,
  navigation,
  horizontalPadding = 20,
}: any) {
  const visible = state.routes.filter(
    (r: any) => !!descriptors[r.key].options.tabBarIcon,
  );

  return (
    <View
      style={[s.capsule, { left: horizontalPadding, right: horizontalPadding }]}
      pointerEvents="box-none"
    >
      {visible.map((route: any) => {
        const { options } = descriptors[route.key];
        const focused = state.routes[state.index].key === route.key;

        const onPress = () => {
          const e = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <AnimatedTab
            key={route.key}
            route={route}
            focused={focused}
            options={options}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  capsule: {
    position: "absolute",
    bottom: BAR_BOTTOM,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TAB_BG,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tile: {
    width: 52,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  accentLine: {
    position: "absolute",
    top: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: TAB_ACCENT,
  },
});