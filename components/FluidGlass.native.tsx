/**
 * FluidGlass — native stub.
 * Three.js / @react-three components are web-only.
 * This file is selected by Metro for Android/iOS builds,
 * keeping expo-gl and drei out of the native bundle.
 */
import React from "react";
import { type ViewStyle, type StyleProp } from "react-native";

interface FluidGlassProps {
  style?: StyleProp<ViewStyle>;
  variant?: "lens" | "bar" | "cube";
}

export default function FluidGlass(_props: FluidGlassProps) {
  return null;
}
