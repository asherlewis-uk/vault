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
  /** Blur intensity (iOS BlurView) */
  intensity?: number;
  /** Border radius */
  borderRadius?: number;
  /** Show border */
  bordered?: boolean;
}

export default function GlassSurface({
  children,
  style,
  intensity,
  borderRadius,
  bordered,
}: GlassSurfaceProps) {
  const borderStyle = bordered
    ? { borderWidth: 1 }
    : undefined;

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.base, borderStyle, style]}>
        <BlurView
          intensity={intensity}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.specularHighlight} />
        {children}
      </View>
    );
  }

  // Web: CSS backdrop-filter. Android: solid translucent fill.
  const backdropStyle =
    Platform.OS === "web"
      ? ({
          backdropFilter: intensity ? `blur(${intensity}px) saturate(180%)` : undefined,
          WebkitBackdropFilter: intensity ? `blur(${intensity}px) saturate(180%)` : undefined,
        } as any)
      : {};

  return (
    <View
      style={[styles.base, borderStyle, backdropStyle, style]}
    >
      <View style={styles.specularHighlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  specularHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
