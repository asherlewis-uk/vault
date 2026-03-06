/**
 * DarkVeil — animated dark atmosphere overlay.
 * Cross-platform. Uses reanimated for subtle pulsing opacity.
 * Absolutely positioned, pointerEvents: 'none'.
 */
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface DarkVeilProps {
  /** Base opacity. Default: 0.3 */
  baseOpacity?: number;
}

export default function DarkVeil({ baseOpacity = 0.3 }: DarkVeilProps) {
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(baseOpacity + 0.1, {
        duration: 6000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.veil, animStyle]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
