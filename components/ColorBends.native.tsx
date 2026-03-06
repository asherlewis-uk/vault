/**
 * ColorBends — native stub (Android / iOS).
 * Renders a simple static dark background instead of Three.js shaders.
 * Selected by Metro via .native.tsx extension; the web path uses ColorBends.tsx.
 */
import React from "react";
import { View, StyleSheet } from "react-native";

interface ColorBendsProps {
  accent?: "blue" | "purple" | "green";
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  style?: any;
}

export default function ColorBends({ style }: ColorBendsProps) {
  return <View style={[styles.container, style]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
