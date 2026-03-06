/// <reference types="@react-three/fiber" />
/**
 * ModelLoader — safe wrapper around @react-three/drei useGLTF.
 * Provides Suspense + ErrorBoundary pattern for missing .glb assets.
 * Web-only: guarded at the FluidGlass integration level.
 */
import React, { Component, Suspense, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";

/* ── Error Boundary (class component required by React) ────────── */

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ModelErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[ModelLoader] Failed to load 3D asset:", error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ── Fallback procedural geometry ──────────────────────────────── */

export function FallbackGeometry() {
  return (
    <mesh>
      <icosahedronGeometry args={[0.8, 3]} />
      <meshPhysicalMaterial
        transmission={0.92}
        thickness={1.2}
        ior={1.45}
        transparent
      />
    </mesh>
  );
}

/* ── Safe model loader ─────────────────────────────────────────── */

function GLTFModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} dispose={null} />;
}

interface SafeModelProps {
  url: string;
  fallback?: ReactNode;
}

export function SafeModel({ url, fallback }: SafeModelProps) {
  const fallbackNode = fallback ?? <FallbackGeometry />;

  return (
    <ModelErrorBoundary fallback={fallbackNode}>
      <Suspense fallback={fallbackNode}>
        <GLTFModel url={url} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
