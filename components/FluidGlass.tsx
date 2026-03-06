/// <reference types="@react-three/fiber" />
/**
 * FluidGlass — @react-three/fiber 3D decorative layer.
 * Web-only. Loads .glb models with graceful fallback to procedural geometry.
 *
 * Canvas Constraints (§3.1):
 *  - Wrapped in absolutely-positioned container with explicit dimensions
 *  - NEVER nested inside unstyled/zero-dimension containers
 *  - pointerEvents: 'none' (decorative only)
 */
import React, { useRef, useEffect, useState, Suspense } from "react";
import {
  View,
  Platform,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";

/* ── Platform gate ─────────────────────────────────────────────── */

interface FluidGlassProps {
  style?: StyleProp<ViewStyle>;
  /** Which model set to display. Default: 'lens' */
  variant?: "lens" | "bar" | "cube";
}

export default function FluidGlass({
  style,
  variant = "lens",
}: FluidGlassProps) {
  if (Platform.OS !== "web") return null;
  return <FluidGlassWeb style={style} variant={variant} />;
}

/* ── Lazy-loaded modules type ──────────────────────────────────── */

interface R3FModules {
  Canvas: any;
  Environment: any;
  Float: any;
  SafeModel: any;
  FallbackGeometry: any;
}

const MODEL_URLS: Record<string, string> = {
  lens: "/assets/3d/lens.glb",
  bar: "/assets/3d/bar.glb",
  cube: "/assets/3d/cube.glb",
};

/* ── Rotating wrapper ──────────────────────────────────────────── */

function RotatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<any>(null);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.003;
        groupRef.current.rotation.x += 0.001;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <group ref={groupRef}>{children}</group>;
}

/* ── Web implementation ────────────────────────────────────────── */

function FluidGlassWeb({ style, variant }: FluidGlassProps) {
  const [modules, setModules] = useState<R3FModules | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("@react-three/fiber"),
      import("@react-three/drei"),
      import("@/components/3d/ModelLoader"),
    ])
      .then(([fiber, drei, loader]) => {
        if (cancelled) return;
        setModules({
          Canvas: fiber.Canvas,
          Environment: drei.Environment,
          Float: drei.Float,
          SafeModel: loader.SafeModel,
          FallbackGeometry: loader.FallbackGeometry,
        });
      })
      .catch((err) => {
        console.warn("[FluidGlass] R3F init failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!modules) return null;

  const { Canvas, Environment, Float, SafeModel, FallbackGeometry } = modules;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Canvas
        gl={{ alpha: true, antialias: true, premultipliedAlpha: true }}
        camera={{ position: [0, 0, 4], fov: 45 }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <pointLight position={[-3, 2, 4]} intensity={0.4} />

        <Float
          speed={1.5}
          rotationIntensity={0.4}
          floatIntensity={0.6}
          floatingRange={[-0.1, 0.1]}
        >
          <RotatingGroup>
            <SafeModel
              url={MODEL_URLS[variant!] || MODEL_URLS.lens}
              fallback={<FallbackGeometry />}
            />
          </RotatingGroup>
        </Float>

        <Suspense fallback={null}>
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});
