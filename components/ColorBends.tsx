/**
 * ColorBends — high-performance animated shader atmosphere layer.
 * Web: Three.js fragment shader with mouse-reactive color warping.
 * Native: Reanimated + LinearGradient fallback.
 * Absolutely positioned, pointerEvents: 'none'.
 *
 * Canvas Constraints (§3.1):
 *  - Absolutely positioned, pointerEvents: 'none', zIndex: -5
 *  - Platform-gated: Three.js on web only
 */
import React, { useEffect, useRef } from "react";
import { View, Platform, StyleSheet, type ColorValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

/* ── Shared types ──────────────────────────────────────────────── */

interface ColorBendsProps {
  /** Primary hue accent (native fallback). Default: blue */
  accent?: "blue" | "purple" | "green";
  /** Rotation angle in degrees. Default: 45 */
  rotation?: number;
  /** Animation speed multiplier. Default: 0.2 */
  speed?: number;
  /** Array of hex color strings. Default: [] (uses default rainbow) */
  colors?: string[];
  /** Transparent background. Default: true */
  transparent?: boolean;
  /** Auto-rotation speed in deg/s. Default: 0 */
  autoRotate?: number;
  /** Zoom scale. Default: 1 */
  scale?: number;
  /** Pattern frequency. Default: 1 */
  frequency?: number;
  /** Warp distortion strength. Default: 1 */
  warpStrength?: number;
  /** Mouse reactivity. Default: 1 */
  mouseInfluence?: number;
  /** Parallax amount. Default: 0.5 */
  parallax?: number;
  /** Grain noise amount. Default: 0.1 */
  noise?: number;
  /** Optional style override for the container View */
  style?: any;
}

/* ── GLSL Shaders ──────────────────────────────────────────────── */

const MAX_COLORS = 8;

const FRAG = /* glsl */ `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-6.0 / exp(6.0 * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-6.0 / exp(6.0 * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}
`;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/* ── Web implementation (Three.js) ─────────────────────────────── */

function ColorBendsWeb(props: ColorBendsProps) {
  const containerRef = useRef<View>(null);
  const rendererRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  // 1. Store latest props in a ref to bypass React's async rendering
  const propsRef = useRef(props);
  propsRef.current = props;

  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });
  const pointerSmoothRef = useRef(8);

  useEffect(() => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container) return;

    let disposed = false;
    let cleanupFn: (() => void) | null = null;

    import("three").then((THREE) => {
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2);
      const uColorsArray = Array.from(
        { length: MAX_COLORS },
        () => new THREE.Vector3(0, 0, 0),
      );

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uCanvas: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uSpeed: { value: 0.2 },
          uRot: { value: new THREE.Vector2(1, 0) },
          uColorCount: { value: 0 },
          uColors: { value: uColorsArray },
          uTransparent: { value: 1 },
          uScale: { value: 1 },
          uFrequency: { value: 1 },
          uWarpStrength: { value: 1 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uMouseInfluence: { value: 1 },
          uParallax: { value: 0.5 },
          uNoise: { value: 0.1 },
        },
        premultipliedAlpha: true,
        transparent: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
        alpha: true,
      });
      rendererRef.current = renderer;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.pointerEvents = "none";
      container.appendChild(renderer.domElement);

      const clock = new THREE.Clock();

      const toVec3 = (hex: string) => {
        const h = hex.replace("#", "").trim();
        const rgb =
          h.length === 3
            ? [
                parseInt(h[0] + h[0], 16),
                parseInt(h[1] + h[1], 16),
                parseInt(h[2] + h[2], 16),
              ]
            : [
                parseInt(h.slice(0, 2), 16),
                parseInt(h.slice(2, 4), 16),
                parseInt(h.slice(4, 6), 16),
              ];
        return new THREE.Vector3(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
      };

      const handleResize = () => {
        if (disposed) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        material.uniforms.uCanvas.value.set(w, h);
      };
      handleResize();
      window.addEventListener("resize", handleResize);

      const loop = () => {
        if (disposed) return;
        const dt = clock.getDelta();
        const elapsed = clock.elapsedTime;

        // 2. CONTINUOUS PROP SYNC: Guarantees material is fed neon colors instantly, bypassing async traps.
        const p = propsRef.current;
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uSpeed.value = p.speed ?? 0.2;
        material.uniforms.uScale.value = p.scale ?? 1;
        material.uniforms.uFrequency.value = p.frequency ?? 1;
        material.uniforms.uWarpStrength.value = p.warpStrength ?? 1;
        material.uniforms.uMouseInfluence.value = p.mouseInfluence ?? 1;
        material.uniforms.uParallax.value = p.parallax ?? 0.5;
        material.uniforms.uNoise.value = p.noise ?? 0.1;
        material.uniforms.uTransparent.value = p.transparent ? 1 : 0;

        const deg = ((p.rotation ?? 45) % 360) + (p.autoRotate ?? 0) * elapsed;
        const rad = (deg * Math.PI) / 180;
        material.uniforms.uRot.value.set(Math.cos(rad), Math.sin(rad));

        const fallback = [
          "#0a84ff",
          "#bf5af2",
          "#ff375f",
          "#30d158",
          "#ffd60a",
        ];
        const rawColors = p.colors && p.colors.length > 0 ? p.colors : fallback;
        const arr = rawColors.slice(0, MAX_COLORS).map(toVec3);
        for (let i = 0; i < MAX_COLORS; i++) {
          if (i < arr.length) material.uniforms.uColors.value[i].copy(arr[i]);
          else material.uniforms.uColors.value[i].set(0, 0, 0);
        }
        material.uniforms.uColorCount.value = arr.length;
        renderer.setClearColor(0x000000, p.transparent ? 0 : 1);

        const cur = pointerCurrentRef.current;
        const tgt = pointerTargetRef.current;
        const amt = Math.min(1, dt * pointerSmoothRef.current);
        cur.x += (tgt.x - cur.x) * amt;
        cur.y += (tgt.y - cur.y) * amt;
        material.uniforms.uPointer.value.set(cur.x, cur.y);

        renderer.render(scene, camera);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      const handlePointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
        const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
        pointerTargetRef.current = { x, y };
      };

      // 3. Bind to window to ensure cursor tracking works even if container has pointerEvents="none"
      window.addEventListener("pointermove", handlePointerMove);

      cleanupFn = () => {
        disposed = true;
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      disposed = true;
      if (cleanupFn) cleanupFn();
    };
  }, []);

  return (
    <View
      ref={containerRef}
      style={[
        StyleSheet.absoluteFillObject,
        { overflow: "hidden" },
        props.style,
      ]}
      pointerEvents="none"
    />
  );
}

/* ── Native fallback (Reanimated + LinearGradient) ─────────────── */

const PALETTES: Record<string, readonly [string, string, string]> = {
  blue: ["rgba(10,132,255,0.06)", "rgba(94,92,230,0.04)", "transparent"],
  purple: ["rgba(94,92,230,0.06)", "rgba(175,82,222,0.04)", "transparent"],
  green: ["rgba(48,209,88,0.05)", "rgba(10,132,255,0.03)", "transparent"],
};

function ColorBendsNative({ accent = "blue", style }: ColorBendsProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(30, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(-20, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const gradientColors = PALETTES[accent] as unknown as readonly [
    ColorValue,
    ColorValue,
    ...ColorValue[],
  ];

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Animated.View style={[styles.gradient, animStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.1, y: 0.2 }}
          end={{ x: 0.9, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/* ── Exported component ────────────────────────────────────────── */

export default function ColorBends({ style, ...rest }: ColorBendsProps) {
  if (Platform.OS === "web") {
    return <ColorBendsWeb style={style} {...rest} />;
  }
  return <ColorBendsNative {...rest} style={style} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
  },
});
