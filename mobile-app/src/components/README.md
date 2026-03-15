# Liquid Glass Tab Bar

A physics-based, Apple-inspired floating bottom tab bar for React Native.

## Features

- **SVG Bezier path morphing** — blob shape computed every frame in Reanimated worklet
- **Physics-based spring motion** — stiffness 220 / damping 18 / mass 0.7 (per spec)
- **Surface tension deformation** — blob stretches toward target, trailing edge lags behind
- **5-layer glass surface** — blur + tint + reflection gradient + specular highlight + border
- **Magnetic icon interactions** — icons lift (-6px) and pulse (1.12×) on activation
- **UI thread animations** — all motion runs on native thread, zero JS involvement

---

## Required Dependencies

```bash
# Core
npx expo install react-native-reanimated
npx expo install expo-blur
npx expo install react-native-svg
npm install lucide-react-native

# Navigation (if using React Navigation integration)
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

### babel.config.js (required for Reanimated)

```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'], // must be last
};
```

---

## File Structure

```
components/
  LiquidGlassTabBar.tsx   ← Main composition (use this)
  LiquidIndicator.tsx     ← SVG morphing blob
  GlassContainer.tsx      ← 5-layer glass surface
  TabButton.tsx           ← Single tab with magnetic behavior

hooks/
  useLiquidPhysics.ts     ← Blob position + deformation physics
  useMagneticTabs.ts      ← Per-icon lift + scale animations

theme/
  colors.ts               ← Color tokens
  spacing.ts              ← Geometry tokens

LiquidGlassTabBarExample.tsx  ← Usage examples
```

---

## Usage

### React Navigation (drop-in)

```tsx
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LiquidGlassTabBar } from "./components/LiquidGlassTabBar";

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="home"    component={HomeScreen}    />
        <Tab.Screen name="write"   component={WriteScreen}   />
        <Tab.Screen name="results" component={ResultsScreen} />
        <Tab.Screen name="profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### Standalone (controlled)

```tsx
import { LiquidGlassTabBar, DEFAULT_TABS } from "./components/LiquidGlassTabBar";

const [tab, setTab] = useState(0);

<LiquidGlassTabBar
  tabs={DEFAULT_TABS}
  activeIndex={tab}
  onTabChange={setTab}
/>
```

---

## Physics Architecture

### Blob deformation sequence (per tab press)

1. **blobRx → stretchRx** (withTiming 90ms, fast leading edge)
   **blobRy → compressRy** (proportional, volume conservation)
2. **blobX → targetX** (withSpring, stiffness 220, damping 18, mass 0.7)
3. **After 150ms delay**:
   **blobRx → REST_RX** (withSpring, STRETCH_SPRING)
   **blobRy → REST_RY * 0.86 → REST_RY** (arrival compression + settle)

### SVG path computation (runs on UI thread every frame)

```
// 4-segment cubic bezier ellipse
// k = 0.5523 (circle approximation constant)

M cx, cy-ry
C cx+kx, cy-ry  cx+rx, cy-ky  cx+rx, cy
C cx+rx, cy+ky  cx+kx, cy+ry  cx, cy+ry
C cx-kx, cy+ry  cx-rx, cy+ky  cx-rx, cy
C cx-rx, cy-ky  cx-kx, cy-ry  cx, cy-ry
Z
```

`cx`, `rx`, `ry` are all Reanimated shared values. The path string is derived in `useDerivedValue` — Reanimated calls this worklet at 60+ FPS on the UI thread.
