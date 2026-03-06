/**
 * GlassSurface — cross-platform glassmorphism container.
 * iOS: BlurView backdrop. Web: CSS backdrop-filter. Android: translucent fill.
 * This is NOT a WebGL component — fully cross-platform with no platform gate needed.
 */
import React, { type ReactNode } from "react";
import {
  View,
  Platform,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { BlurView } from "expo-blur";

interface GlassSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Blur intensity (iOS BlurView). Default: 24 */
  intensity?: number;
  /** Border radius. Default: 20 */
  borderRadius?: number;
  /** Show border. Default: true */
  bordered?: boolean;
}

export default function GlassSurface({
  children,
  style,
  intensity = 24,
  borderRadius = 20,
  bordered = true,
}: GlassSurfaceProps) {
  const borderStyle = bordered
    ? { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }
    : undefined;

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.base, { borderRadius }, borderStyle, style]}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
        <View style={[styles.specularHighlight, { borderRadius }]} />
        {children}
      </View>
    );
  }

  // Web: CSS backdrop-filter. Android: solid translucent fill.
  const backdropStyle =
    Platform.OS === "web"
      ? ({
          backdropFilter: `blur(${intensity}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${intensity}px) saturate(180%)`,
          backgroundColor: "rgba(255,255,255,0.04)",
        } as any)
      : { backgroundColor: "rgba(28,28,30,0.85)" };

  return (
    <View
      style={[styles.base, { borderRadius }, borderStyle, backdropStyle, style]}
    >
      <View style={[styles.specularHighlight, { borderRadius }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  specularHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
