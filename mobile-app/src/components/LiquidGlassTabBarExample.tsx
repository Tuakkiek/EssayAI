/**
 * LiquidGlassTabBarExample.tsx
 *
 * Usage examples for the Liquid Glass Tab Bar.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Example 1: React Navigation (drop-in replacement)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
 *   import { LiquidGlassTabBar } from "./components/LiquidGlassTabBar";
 *
 *   const Tab = createBottomTabNavigator();
 *
 *   export function AppNavigator() {
 *     return (
 *       <NavigationContainer>
 *         <Tab.Navigator
 *           tabBar={(props) => <LiquidGlassTabBar {...props} />}
 *           screenOptions={{ headerShown: false }}
 *         >
 *           <Tab.Screen name="home"    component={HomeScreen}    />
 *           <Tab.Screen name="write"   component={WriteScreen}   />
 *           <Tab.Screen name="results" component={ResultsScreen} />
 *           <Tab.Screen name="profile" component={ProfileScreen} />
 *         </Tab.Navigator>
 *       </NavigationContainer>
 *     );
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Example 2: Standalone controlled component
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   const [tab, setTab] = useState(0);
 *
 *   <LiquidGlassTabBar
 *     tabs={DEFAULT_TABS}
 *     activeIndex={tab}
 *     onTabChange={setTab}
 *   />
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
  LiquidGlassTabBar,
  DEFAULT_TABS,
} from "./LiquidGlassTabBar";
import { Colors } from "../theme/colors";

const { width: W } = Dimensions.get("window");

// ── Placeholder screens ────────────────────────────────────────────────────
function PlaceholderScreen({
  label,
  emoji,
  bg,
}: {
  label: string;
  emoji: string;
  bg: string;
}) {
  return (
    <View style={[screen.container, { backgroundColor: bg }]}>
      <Text style={screen.emoji}>{emoji}</Text>
      <Text style={screen.title}>{label}</Text>
    </View>
  );
}

const screen = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emoji: { fontSize: 52 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D1D1F",
    opacity: 0.4,
    letterSpacing: -0.5,
  },
});

// ── Example 1: React Navigation ────────────────────────────────────────────
const Tab = createBottomTabNavigator();

export function ReactNavigationExample() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen
          name="home"
          component={() => (
            <PlaceholderScreen label="Home" emoji="🏠" bg="#F0F9E8" />
          )}
        />
        <Tab.Screen
          name="write"
          component={() => (
            <PlaceholderScreen label="Write" emoji="✍️" bg="#FFF8EC" />
          )}
        />
        <Tab.Screen
          name="results"
          component={() => (
            <PlaceholderScreen label="Results" emoji="📊" bg="#EBF5FF" />
          )}
        />
        <Tab.Screen
          name="profile"
          component={() => (
            <PlaceholderScreen label="Profile" emoji="👤" bg="#F3EFF8" />
          )}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ── Example 2: Standalone visual demo ─────────────────────────────────────
const SCREEN_COLORS = ["#E8F5E0", "#FFF4E0", "#E0EFFF", "#F3EFF8"];
const SCREEN_EMOJIS = ["🏠", "✍️", "📊", "👤"];

export function StandaloneDemo() {
  const [activeTab, setActiveTab] = useState(0);

  const currentBg = SCREEN_COLORS[activeTab];

  return (
    <SafeAreaView style={[demo.container, { backgroundColor: currentBg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Background decorative blobs */}
      <View style={[demo.bgBlob1, { backgroundColor: currentBg }]} />
      <View style={demo.bgBlob2} />

      {/* Header */}
      <View style={demo.header}>
        <Text style={demo.title}>Liquid Glass</Text>
        <Text style={demo.subtitle}>Apple-inspired tab bar · React Native</Text>
      </View>

      {/* Center content */}
      <View style={demo.content}>
        <Text style={demo.centerEmoji}>{SCREEN_EMOJIS[activeTab]}</Text>
        <Text style={demo.centerLabel}>{DEFAULT_TABS[activeTab].label}</Text>

        {/* Tab index dots */}
        <View style={demo.dotsRow}>
          {DEFAULT_TABS.map((_, i) => (
            <View
              key={i}
              style={[
                demo.dot,
                activeTab === i && demo.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Feature callouts */}
      <View style={demo.callouts}>
        {[
          "SVG bezier path morphing",
          "Physics springs (stiffness 220)",
          "5-layer Apple glass",
          "Magnetic icon lift",
        ].map((text) => (
          <View key={text} style={demo.calloutRow}>
            <View style={demo.calloutDot} />
            <Text style={demo.calloutText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* The tab bar */}
      <LiquidGlassTabBar
        tabs={DEFAULT_TABS}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />
    </SafeAreaView>
  );
}

const demo = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  bgBlob1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    right: -60,
    opacity: 0.5,
  },
  bgBlob2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 180,
    left: -40,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1D1D1F",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    color: "#6E6E73",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  centerEmoji: { fontSize: 64 },
  centerLabel: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1D1F",
    letterSpacing: -0.5,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D1D6",
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  callouts: {
    paddingHorizontal: 28,
    paddingBottom: 120,
    gap: 8,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  calloutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  calloutText: {
    fontSize: 13,
    color: "#6E6E73",
    fontWeight: "500",
  },
});

// Default export: standalone demo
export default StandaloneDemo;
