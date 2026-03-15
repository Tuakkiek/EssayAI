/**
 * components/LiquidGlassTabBar.tsx
 *
 * Main composition of the Liquid Glass Tab Bar.
 *
 * Coordinates:
 *   - GlassContainer (5-layer glass visual)
 *   - LiquidIndicator (SVG morphing blob)
 *   - TabButton × N (magnetic icon interactions)
 *   - useLiquidPhysics (blob position + deformation springs)
 *   - useMagneticTabs (per-icon lift + pulse)
 *
 * Supports:
 *   1. React Navigation Bottom Tab Navigator (pass as tabBar prop)
 *   2. Standalone controlled usage (activeIndex + onTabChange)
 *
 * Tab layout measurement:
 *   Each TabButton reports its layout via onLayout callback.
 *   The center X of the active tab is passed to moveBlobTo().
 *   On first render, we initialize the blob at the active tab center.
 *
 * Positioning:
 *   The bar is absolutely positioned at bottom of screen,
 *   horizontally centered, floating above safe area.
 */

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  memo,
} from "react";
import {
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Home,
  PenLine,
  BarChart2,
  User,
  LucideIcon,
} from "lucide-react-native";

import { GlassContainer }   from "./GlassContainer";
import { LiquidIndicator }  from "./LiquidIndicator";
import { TabButton }        from "./TabButton";
import { useLiquidPhysics } from "../hooks/useLiquidPhysics";
import { useMagneticTabs }  from "../hooks/useMagneticTabs";
import { Spacing }          from "../theme/spacing";

// ── Dimensions ─────────────────────────────────────────────────────────────
const SCREEN_W    = Dimensions.get("window").width;
const BAR_WIDTH   = SCREEN_W - Spacing.barHorizontalGap * 2;
const BAR_HEIGHT  = Spacing.barHeight;

// ── Default tab definitions ────────────────────────────────────────────────
export interface TabDefinition {
  key:   string;
  label: string;
  Icon:  LucideIcon;
}

export const DEFAULT_TABS: TabDefinition[] = [
  { key: "home",    label: "Home",    Icon: Home     },
  { key: "write",   label: "Write",   Icon: PenLine  },
  { key: "results", label: "Results", Icon: BarChart2 },
  { key: "profile", label: "Profile", Icon: User     },
];

// ── Props ──────────────────────────────────────────────────────────────────
export interface LiquidGlassTabBarProps {
  // React Navigation props
  state?:       any;
  descriptors?: any;
  navigation?:  any;

  // Standalone usage
  tabs?:         TabDefinition[];
  activeIndex?:  number;
  onTabChange?:  (index: number) => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
  tabs: tabsProp,
  activeIndex: controlledIndex,
  onTabChange,
}: LiquidGlassTabBarProps) {
  const tabs = tabsProp ?? DEFAULT_TABS;
  const tabCount = tabs.length;

  // ── Active index resolution ────────────────────────────────────────────
  const [localIndex, setLocalIndex] = useState(
    controlledIndex ?? state?.index ?? 0,
  );
  const activeIdx =
    controlledIndex !== undefined
      ? controlledIndex
      : state?.index !== undefined
        ? state.index
        : localIndex;

  // ── Animation hooks ────────────────────────────────────────────────────
  const physics  = useLiquidPhysics();
  const magnetic = useMagneticTabs(tabCount);

  // ── Tab layout map: index → centerX ───────────────────────────────────
  // Stored in a ref to avoid re-renders
  const tabCenters = useRef<number[]>(
    // Pre-calculate evenly spaced centers as fallback
    Array.from({ length: tabCount }, (_, i) => {
      const tabW = BAR_WIDTH / tabCount;
      return tabW * i + tabW / 2;
    }),
  );
  const initDone = useRef(false);

  // ── Initialize blob on mount once we have layout ──────────────────────
  const tryInit = useCallback(() => {
    if (initDone.current) return;
    const cx = tabCenters.current[activeIdx];
    if (cx !== undefined) {
      physics.initBlob(cx);
      magnetic.activateTab(activeIdx);
      initDone.current = true;
    }
  }, [activeIdx]);

  // ── Handle tab layout reported by TabButton ────────────────────────────
  const handleTabLayout = useCallback(
    (index: number, x: number, width: number) => {
      tabCenters.current[index] = x + width / 2;
      // Try to initialize once all tabs have reported their center
      tryInit();
    },
    [tryInit],
  );

  // ── Handle tab press ───────────────────────────────────────────────────
  const handleTabPress = useCallback(
    (index: number, centerX: number) => {
      const prev = tabCenters.current[activeIdx];
      const next = centerX;
      const dist = next - (prev ?? 0);

      // Update blob center ref
      tabCenters.current[index] = centerX;

      // Physics: move blob
      physics.moveBlobTo(next, dist);

      // Magnetic: lift icon
      magnetic.activateTab(index);

      // Update controlled or local state
      if (controlledIndex === undefined && state?.index === undefined) {
        setLocalIndex(index);
      }
      onTabChange?.(index);

      // React Navigation integration
      if (state && navigation) {
        const route = state.routes[index];
        if (!route) return;
        const focused = state.index === index;
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!focused && !event.defaultPrevented) {
          navigation.navigate({ name: route.name, merge: true });
        }
      }
    },
    [activeIdx, controlledIndex, state, navigation, onTabChange, physics, magnetic],
  );

  // ── Respond to external active index changes (React Navigation) ──────
  useEffect(() => {
    const idx = state?.index ?? controlledIndex;
    if (idx === undefined) return;
    const cx = tabCenters.current[idx];
    if (cx !== undefined && initDone.current) {
      const prev  = tabCenters.current[activeIdx];
      const dist  = cx - (prev ?? 0);
      physics.moveBlobTo(cx, dist);
      magnetic.activateTab(idx);
    }
  }, [state?.index, controlledIndex]);

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <GlassContainer width={BAR_WIDTH}>
        {/* ── Liquid blob (behind icons, pointerEvents:none) ── */}
        <LiquidIndicator
          blobX={physics.blobX}
          blobRx={physics.blobRx}
          blobRy={physics.blobRy}
          blobAlpha={physics.blobAlpha}
          barWidth={BAR_WIDTH}
          barHeight={BAR_HEIGHT}
        />

        {/* ── Tab buttons row ── */}
        <View style={styles.tabsRow}>
          {tabs.map((tab, i) => (
            <TabButton
              key={tab.key}
              icon={tab.Icon}
              label={tab.label}
              index={i}
              isActive={activeIdx === i}
              lift={magnetic.lifts[i]}
              scale={magnetic.scales[i]}
              onPress={handleTabPress}
              onLayout={handleTabLayout}
            />
          ))}
        </View>
      </GlassContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    bottom: Spacing.barBottomOffset,
    left: Spacing.barHorizontalGap,
    right: Spacing.barHorizontalGap,
    alignItems: "center",
    // Ensure the tab bar is above screen content
    zIndex: 999,
  },
  tabsRow: {
    flexDirection: "row",
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
});
