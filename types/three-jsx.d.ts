/**
 * Global type augmentations for @react-three/fiber JSX intrinsic elements.
 * Expo uses "jsx": "react-native" which resolves JSX via the global namespace,
 * not React.JSX. This bridges R3F's ThreeElements into the global JSX scope
 * so <mesh>, <ambientLight>, <primitive>, etc. are recognized by TypeScript.
 */
import type { ThreeElements } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
