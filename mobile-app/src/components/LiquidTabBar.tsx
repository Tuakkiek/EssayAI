/**
 * LiquidTabBar.tsx
 *
 * Apple-inspired Liquid Glass bottom tab bar.
 *
 * Architecture:
 *   FloatingGlassShell          ← positioned absolute, floating above safe area
 *     BlurLayer                 ← expo-blur frosted glass
 *     GlassOverlay              ← semi-transparent white + border highlight
 *     InnerHighlightEdge        ← top-edge shimmer line (glass top reflection)
 *     AnimatedLiquidIndicator   ← the moving blob, behind icons
 *     TabButtonsRow             ← measures tab positions, renders icon+label
 *
 * All animation values come from useLiquidTabAnimation.
 * Layout measurement uses onLayout to get each tab's center X.
 */

import React, {
  useCallback,
  useRef,
  useState,
  memo,
} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  Home,
  PenLine,
  BarChart2,
  User,
  LucideIcon,
} from "lucide-react-native";

import { LiquidColors } from "../theme/colors";
import { useLiquidTabAnimation } from "../hooks/useLiquidTabAnimation";

// ── Constants ──────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get("window");
const BAR_HEIGHT         = 72;
const HORIZONTAL_PADDING = 18;
const CORNER_RADIUS      = 30;
const BLOB_SIZE          = 52;
const BAR_BOTTOM_OFFSET  = Platform.OS === "ios" ? 30 : 18;
const BLUR_INTENSITY     = 70;
const ICON_SIZE          = 24;
const ICON_STROKE        = 2.2;

// ── Tab definitions ────────────────────────────────────────────────────────
export interface TabDefinition {
  key: string;
  label: string;
  Icon: LucideIcon;
}

export const DEFAULT_TABS: TabDefinition[] = [
  { key: "home",    label: "Home",    Icon: Home      },
  { key: "write",   label: "Write",   Icon: PenLine   },
  { key: "results", label: "Results", Icon: BarChart2 },
  { key: "profile", label: "Profile", Icon: User      },
];

// ── Props ──────────────────────────────────────────────────────────────────
export interface LiquidTabBarProps {
  /** React Navigation BottomTabBar props (state, descriptors, navigation) */
  state?: any;
  descriptors?: any;
  navigation?: any;

  /** Override tabs for standalone usage */
  tabs?: TabDefinition[];

  /** Controlled active index (for standalone usage) */
  activeIndex?: number;
  onTabChange?: (index: number) => void;
}

// ── Animated Liquid Blob ──────────────────────────────────────────────────
interface LiquidBlobProps {
  indicatorX: any;
  blobScaleX: any;
  blobScaleY: any;
  indicatorOpacity: any;
}

const LiquidBlob = memo(function LiquidBlob({
  indicatorX,
  blobScaleX,
  blobScaleY,
  indicatorOpacity,
}: LiquidBlobProps) {
  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorX.value - BLOB_SIZE / 2 },
      { scaleX: blobScaleX.value },
      { scaleY: blobScaleY.value },
    ],
    opacity: indicatorOpacity.value,
  }));

  return (
    <Animated.View style={[styles.blob, blobStyle]} pointerEvents="none">
      {/* Inner glow layer */}
      <View style={styles.blobInner} />
      {/* Top specular highlight */}
      <View style={styles.blobHighlight} />
    </Animated.View>
  );
});

// ── Single Tab Button ──────────────────────────────────────────────────────
interface TabButtonProps {
  tab: TabDefinition;
  index: number;
  isActive: boolean;
  iconLift: any;
  iconScale: any;
  onPress: (index: number, centerX: number) => void;
}

const TabButton = memo(function TabButton({
  tab,
  index,
  isActive,
  iconLift,
  iconScale,
  onPress,
}: TabButtonProps) {
  const layoutRef = useRef<{ x: number; width: number }>({ x: 0, width: 0 });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: iconLift.value },
      { scale: iconScale.value },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0.55, { duration: 200 }),
    transform: [
      {
        scale: withTiming(isActive ? 1 : 0.9, { duration: 200 }),
      },
    ],
  }));

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    layoutRef.current = {
      x: e.nativeEvent.layout.x,
      width: e.nativeEvent.layout.width,
    };
  }, []);

  const handlePress = useCallback(() => {
    const centerX = layoutRef.current.x + layoutRef.current.width / 2;
    onPress(index, centerX);
  }, [index, onPress]);

  return (
    <TouchableOpacity
      onLayout={handleLayout}
      onPress={handlePress}
      activeOpacity={1}
      style={styles.tabButton}
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <tab.Icon
          size={ICON_SIZE}
          color={isActive ? LiquidColors.iconActive : LiquidColors.iconInactive}
          strokeWidth={isActive ? 2.5 : ICON_STROKE}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: isActive ? LiquidColors.iconActive : LiquidColors.iconInactive },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
});

// ── Glass Shell ────────────────────────────────────────────────────────────
function GlassShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.shellContainer}>
      {/* Layer 1: Blur */}
      <BlurView
        intensity={BLUR_INTENSITY}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      {/* Layer 2: Semi-transparent white overlay */}
      <View style={[StyleSheet.absoluteFillObject, styles.glassOverlay]} />
      {/* Layer 3: Top-edge shimmer (glass reflection) */}
      <View style={styles.topEdgeShimmer} />
      {/* Layer 4: Bottom inner shadow to add depth */}
      <View style={styles.bottomInnerShadow} />
      {/* Content */}
      {children}
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function LiquidTabBar({
  state,
  descriptors,
  navigation,
  tabs: tabsProp,
  activeIndex: controlledIndex,
  onTabChange,
}: LiquidTabBarProps) {
  // Resolve tabs — React Navigation or standalone
  const tabs = tabsProp ?? DEFAULT_TABS;
  const resolvedActiveIndex =
    controlledIndex !== undefined
      ? controlledIndex
      : (state?.index ?? 0);

  const [localIndex, setLocalIndex] = useState(resolvedActiveIndex);
  const activeIdx = controlledIndex !== undefined ? controlledIndex : localIndex;

  const {
    activeIndex,
    indicatorX,
    blobScaleX,
    blobScaleY,
    iconLifts,
    iconScales,
    indicatorOpacity,
    onTabPress,
  } = useLiquidTabAnimation({ tabCount: tabs.length, initialIndex: activeIdx });

  // Track whether indicator has been initialized (first layout)
  const initialized = useRef(false);

  const handleTabPress = useCallback(
    (index: number, centerX: number) => {
      // Initialize indicator on first press if not yet done via layout
      onTabPress(index, centerX);

      if (controlledIndex === undefined) {
        setLocalIndex(index);
      }
      onTabChange?.(index);

      // React Navigation integration
      if (state && navigation) {
        const route = state.routes[index];
        if (!route) return;
        const isFocused = state.index === index;
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate({ name: route.name, merge: true });
        }
      }
    },
    [onTabPress, controlledIndex, onTabChange, state, navigation],
  );

  // ── On container layout: initialize indicator position ─────────────────
  const handleBarLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (initialized.current) return;
      // Use bar width to compute even tab width
      const barW = e.nativeEvent.layout.width;
      const tabW = barW / tabs.length;
      // Initialize indicator at active tab center
      const initCenterX = tabW * activeIdx + tabW / 2;
      indicatorX.value = initCenterX;
      indicatorOpacity.value = 1;
      initialized.current = true;
    },
    [activeIdx, tabs.length, indicatorX, indicatorOpacity],
  );

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Outer shadow ring */}
      <View style={styles.shadowRing} />

      <GlassShell>
        <View style={styles.barInner} onLayout={handleBarLayout}>
          {/* Liquid blob — renders behind icons */}
          <LiquidBlob
            indicatorX={indicatorX}
            blobScaleX={blobScaleX}
            blobScaleY={blobScaleY}
            indicatorOpacity={indicatorOpacity}
          />

          {/* Tab buttons */}
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.key}
              tab={tab}
              index={index}
              isActive={activeIdx === index}
              iconLift={iconLifts[index]}
              iconScale={iconScales[index]}
              onPress={handleTabPress}
            />
          ))}
        </View>
      </GlassShell>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: BAR_BOTTOM_OFFSET,
    alignSelf: "center",
    width: SCREEN_W - HORIZONTAL_PADDING * 2,
    // Outer drop shadow
    shadowColor: LiquidColors.backdropShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 20,
  },

  shadowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CORNER_RADIUS + 2,
    borderWidth: 1,
    borderColor: LiquidColors.glassBorderInner,
    // Extra glow shadow
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.6,
    shadowRadius: 1,
  },

  // ── Glass Shell ──────────────────────────────────────────────────────────
  shellContainer: {
    height: BAR_HEIGHT,
    borderRadius: CORNER_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LiquidColors.glassBorder,
  },

  glassOverlay: {
    backgroundColor: LiquidColors.glassBackground,
    borderRadius: CORNER_RADIUS,
  },

  // Top shimmer line — glass top-edge reflection
  topEdgeShimmer: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: LiquidColors.glassShimmer,
    borderRadius: 1,
    opacity: 0.85,
  },

  // Subtle inner shadow at bottom for depth
  bottomInnerShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    borderBottomLeftRadius: CORNER_RADIUS,
    borderBottomRightRadius: CORNER_RADIUS,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  // ── Bar inner row ────────────────────────────────────────────────────────
  barInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    position: "relative",
  },

  // ── Liquid Blob ──────────────────────────────────────────────────────────
  blob: {
    position: "absolute",
    top: (BAR_HEIGHT - BLOB_SIZE) / 2,
    left: 0,
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    backgroundColor: LiquidColors.indicatorFill,
    borderWidth: 1,
    borderColor: LiquidColors.indicatorBorder,
    // Blob glow
    shadowColor: LiquidColors.indicatorShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 0,
  },

  blobInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BLOB_SIZE / 2,
    backgroundColor: LiquidColors.indicatorGlow,
    margin: 3,
  },

  blobHighlight: {
    position: "absolute",
    top: 6,
    left: 10,
    width: BLOB_SIZE * 0.42,
    height: BLOB_SIZE * 0.22,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.60)",
    transform: [{ rotate: "-18deg" }],
  },

  // ── Tab Button ───────────────────────────────────────────────────────────
  tabButton: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    gap: 3,
  },

  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
  },
});
