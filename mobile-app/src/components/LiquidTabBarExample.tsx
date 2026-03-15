/**
 * LiquidTabBarExample.tsx
 *
 * Two usage patterns demonstrated:
 *
 * 1. React Navigation integration  — pass as `tabBar` prop to Tab.Navigator
 * 2. Standalone demo               — rendered inside a plain screen for visual testing
 *
 * Run the standalone demo on any screen to preview the animation.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { LiquidTabBar, DEFAULT_TABS } from "./LiquidTabBar";

// ── 1. React Navigation Integration ──────────────────────────────────────
//
// Drop-in replacement for the default React Navigation tab bar.
// Just set `tabBar` on your Tab.Navigator.
//
// Example:
//
//   <Tab.Navigator
//     tabBar={(props) => <LiquidTabBar {...props} />}
//     screenOptions={{ headerShown: false }}
//   >
//     <Tab.Screen name="home"    component={HomeScreen}    />
//     <Tab.Screen name="write"   component={WriteScreen}   />
//     <Tab.Screen name="results" component={ResultsScreen} />
//     <Tab.Screen name="profile" component={ProfileScreen} />
//   </Tab.Navigator>
//

const Tab = createBottomTabNavigator();

function PlaceholderScreen({ label, color }: { label: string; color: string }) {
  return (
    <View style={[demoStyles.screen, { backgroundColor: color }]}>
      <Text style={demoStyles.screenLabel}>{label}</Text>
    </View>
  );
}

export function ReactNavigationExample() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <LiquidTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="home"    component={() => <PlaceholderScreen label="Home"    color="#F0F9E8" />} />
        <Tab.Screen name="write"   component={() => <PlaceholderScreen label="Write"   color="#FFF4E0" />} />
        <Tab.Screen name="results" component={() => <PlaceholderScreen label="Results" color="#EBF5FF" />} />
        <Tab.Screen name="profile" component={() => <PlaceholderScreen label="Profile" color="#F5F0FF" />} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ── 2. Standalone Demo ─────────────────────────────────────────────────────
//
// Use this to visually test the tab bar in isolation on any background.
//

const DEMO_BACKGROUNDS = [
  // Blurred image background colors to test glass effect
  "#D4EFC6",
  "#C6D8EF",
  "#EFD4C6",
  "#D4C6EF",
];

export function StandaloneDemo() {
  const [activeTab, setActiveTab] = useState(0);
  const [bgIndex] = useState(0);

  const bg = DEMO_BACKGROUNDS[bgIndex];

  return (
    <SafeAreaView style={[demoStyles.demoContainer, { backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Background blobs to make glass visible */}
      <View style={[demoStyles.blob1, { backgroundColor: `${bg}88` }]} />
      <View style={[demoStyles.blob2, { backgroundColor: "#FFFFFF55" }]} />

      {/* Header */}
      <View style={demoStyles.demoHeader}>
        <Text style={demoStyles.demoTitle}>Liquid Glass Tab Bar</Text>
        <Text style={demoStyles.demoSub}>Apple-inspired • React Native</Text>
      </View>

      {/* Active tab display */}
      <View style={demoStyles.activeDisplay}>
        <View style={{ flexDirection: "row" }}>
          {DEFAULT_TABS.map((tab, i) => (
            <View
              key={tab.key}
              style={[
                demoStyles.tabIndicatorDot,
                activeTab === i && demoStyles.tabIndicatorDotActive,
              ]}
            />
          ))}
        </View>
        <Text style={demoStyles.activeLabel}>
          {DEFAULT_TABS[activeTab].label}
        </Text>
      </View>

      {/* Instructions */}
      <View style={demoStyles.instructions}>
        <Text style={demoStyles.instructionText}>
          👆 Tap any tab to see the liquid blob slide and deform
        </Text>
        <Text style={demoStyles.instructionText}>
          ✨ Notice the stretch animation and glass reflection
        </Text>
      </View>

      {/* The actual Liquid Tab Bar */}
      <LiquidTabBar
        tabs={DEFAULT_TABS}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const demoStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  screenLabel: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1D1D1F",
    opacity: 0.5,
  },
  demoContainer: {
    flex: 1,
    position: "relative",
  },
  blob1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -60,
    right: -40,
    opacity: 0.6,
  },
  blob2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 200,
    left: -30,
    opacity: 0.5,
  },
  demoHeader: {
    paddingTop: 24,
    paddingHorizontal: 28,
    gap: 4,
  },
  demoTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1D1D1F",
    letterSpacing: -0.8,
  },
  demoSub: {
    fontSize: 14,
    color: "#6E6E73",
    fontWeight: "500",
  },
  activeDisplay: {
    marginTop: 40,
    alignItems: "center",
    gap: 12,
  },
  tabIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CCCCCC",
    marginHorizontal: 3,
  },
  tabIndicatorDotActive: {
    backgroundColor: "#58CC02",
    width: 20,
  },
  activeLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1D1D1F",
    marginTop: 8,
  },
  instructions: {
    position: "absolute",
    bottom: 140,
    left: 24,
    right: 24,
    gap: 6,
  },
  instructionText: {
    fontSize: 13,
    color: "#6E6E73",
    textAlign: "center",
    lineHeight: 18,
  },
});

// ── Default export: standalone demo ───────────────────────────────────────
export default StandaloneDemo;
