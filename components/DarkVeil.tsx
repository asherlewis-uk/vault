/**
 * DarkVeil — animated dark atmosphere overlay.
 * Cross-platform. Uses reanimated for subtle pulsing opacity.
 * Absolutely positioned, pointerEvents: 'none'.
 */
import React from "react";
import { StyleSheet, View } from "react-native";

interface DarkVeilProps {
  /** Base opacity */
  baseOpacity?: number;
}

export default function DarkVeil({ baseOpacity }: DarkVeilProps) {
  return (
    <View style={styles.veil} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -8,
  },
});
