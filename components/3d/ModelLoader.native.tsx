/**
 * ModelLoader — native stub.
 * The real implementation uses @react-three/drei (web-only).
 * This file is selected by Metro for Android/iOS builds.
 */
import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

export class ModelErrorBoundary extends Component<ErrorBoundaryProps> {
  render() {
    return this.props.children;
  }
}

export function FallbackGeometry() {
  return null;
}

export function SafeModel() {
  return null;
}
