# GitHub Copilot — Operational Directives for Video Vault UI Integration

> Generated from `.vault/docs/project-brief.md` and workspace scan.  
> Effective until the UI integration phase is complete.

---

## 1. Operational Boundaries

You are a **UI/UX integration agent** operating within an existing Expo (SDK 54) + Express/Drizzle full-stack application.

Your scope is LIMITED to:

- Frontend files inside `app/`, `components/`, `contexts/`, `constants/`, `lib/`, `types/`, and `assets/`.
- Creating new visual components that consume `ogl`, `three`, `@react-three/fiber`, `@react-three/drei`, and `maath`.
- Modifying stylesheets, layout files, and component rendering logic to integrate the new visual stack.

You are NOT permitted to:

- Alter application business logic unless directly required by a visual integration (e.g., wiring a new prop).
- Make networking, API, or data-layer changes.
- Modify build scripts (`scripts/build.js`) or deployment configuration (`.replit`).

---

## 2. Backend Lockdown — ABSOLUTE

The following files are **READ-ONLY**. Do not modify, overwrite, or regenerate them under any circumstance:

| File                | Reason                                                  |
| ------------------- | ------------------------------------------------------- |
| `server/routes.ts`  | Express API route definitions                           |
| `server/storage.ts` | Data access layer                                       |
| `shared/schema.ts`  | Drizzle ORM schema (DB contract)                        |
| `server/index.ts`   | Server bootstrap (modify only if explicitly instructed) |
| `drizzle.config.ts` | ORM configuration                                       |

If a UI integration appears to require a backend change, **stop and report the conflict** instead of proceeding.

---

## 3. Canvas Constraints — STRICT

### 3.1 `@react-three/fiber` (Three.js) Canvases

- The `<Canvas>` component **MUST** use absolute positioning (`position: 'absolute'`) with explicit `width`, `height`, or `inset: 0` styling.
- `<Canvas>` is **strictly forbidden** from being nested inside unstyled block `<View>` or `<div>` elements that could collapse to 0×0 dimensions.
- Always wrap in a container with explicit dimensions:
  ```tsx
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
    <Canvas>{/* scene */}</Canvas>
  </View>
  ```
- Maintain strict `zIndex` layering: Canvas backgrounds must sit BELOW interactive UI.
- Ensure SVG displacement maps and shader overlays use `pointerEvents: 'none'` to avoid blocking touch/click events on interactive elements.

### 3.2 `ogl` Canvases

- Same absolute positioning rules apply.
- `ogl` renders to a raw `<canvas>` DOM element — on React Native Web, this requires a direct ref-based mount, not JSX nesting.
- Guard all `ogl` usage with `Platform.OS === 'web'` checks. `ogl` has no native iOS/Android support.

### 3.3 Platform Guards

All WebGL/Three.js components are **web-only**. Every component file that imports from `ogl`, `three`, `@react-three/fiber`, `@react-three/drei`, or `maath` must:

- Check `Platform.OS` before rendering canvas elements.
- Provide a graceful fallback (solid color, gradient, or null) on native platforms.

---

## 4. Asset Protocols

### FluidGlass 3D Models

The `FluidGlass` component requires three `.glb` model files:

| Asset      | Path                        |
| ---------- | --------------------------- |
| `lens.glb` | `public/assets/3d/lens.glb` |
| `bar.glb`  | `public/assets/3d/bar.glb`  |
| `cube.glb` | `public/assets/3d/cube.glb` |

**Rules:**

- Scaffold the directory `public/assets/3d/` during Phase 2.
- Create placeholder import references in the `FluidGlass` component source.
- **Do NOT attempt to generate, download, or synthesize `.glb` files.** The user will supply them.
- Code must handle missing assets gracefully (try/catch around `useGLTF`, fallback geometry).

---

## 5. Execution Pipeline

### Phase 1: Dependency Injection

1. Verify none of the required packages exist in `package.json` (confirmed: none present).
2. Install: `ogl`, `three`, `@react-three/fiber`, `@react-three/drei`, `maath`.
3. Run `npm run postinstall` to re-apply `patch-package` patches.
4. Verify no peer dependency errors with `react@19.1.0` and `react-dom@19.1.0`.

### Phase 2: Asset Pipeline Preparation

1. Create directory: `public/assets/3d/`.
2. Add a `.gitkeep` or `README.md` inside explaining that `lens.glb`, `bar.glb`, `cube.glb` must be placed here.
3. Create placeholder loader utility in `lib/` or `components/3d/` that wraps `useGLTF` with error boundaries.

### Phase 3: Surgical UI Replacement

Execute in this exact order:

1. **Aurora (Background Layer)**
   - Create `components/Aurora.tsx` using `ogl` (web-only).
   - Integrate into `app/_layout.tsx` or `app/(tabs)/_layout.tsx` as a fixed background behind `<Slot>` / tab navigation.

2. **FluidGlass (3D Interactive Layer)**
   - Create `components/FluidGlass.tsx` using `@react-three/fiber`.
   - Integrate within media view zones (`app/player/[id].tsx`).
   - Enforce the Canvas Constraints from §3.

3. **GlassSurface (Container Styling)**
   - Create `components/GlassSurface.tsx` as a reusable translucent container.
   - Refactor `components/MediaCard.tsx` and `components/AuthGate.tsx` to use it.
   - Ensure touch events pass through decorative layers.

4. **ColorBends / DarkVeil (Atmosphere)**
   - Create atmosphere components for secondary routes.
   - Wire into `app/(tabs)/settings.tsx` and `app/add.tsx` as background or active-state layers.

### Phase 4: Verification

1. Confirm no regressions in PIN auth flow (`AuthGate` → `AuthContext`).
2. Confirm media CRUD operations still function (`MediaContext`).
3. Confirm all canvases render correctly on web (`Platform.OS === 'web'`).
4. Confirm graceful fallbacks on native (iOS/Android via Expo Go).
5. Confirm no touch/click event blocking from canvas or SVG overlay layers.

---

## 6. Existing Architecture — Do Not Disturb

| Component / Pattern | Location                                              | Note                                                   |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Root providers      | `app/_layout.tsx`                                     | QueryClient → GestureHandler → Keyboard → Auth → Media |
| Font gating         | `app/_layout.tsx`                                     | `useFonts` + `SplashScreen` pattern — do not remove    |
| Tab layout          | `app/(tabs)/_layout.tsx`                              | NativeTabs / BlurView — integrate Aurora BEHIND this   |
| Auth flow           | `contexts/AuthContext.tsx`, `components/AuthGate.tsx` | PIN lock — wrap with GlassSurface, do not alter logic  |
| Media state         | `contexts/MediaContext.tsx`                           | CRUD + tags + history — read-only for this integration |
| Query client        | `lib/query-client.ts`                                 | API fetcher config — do not modify                     |
| Keyboard wrappers   | Various screens                                       | `KeyboardAwareScrollViewCompat` — do not remove        |
| Safe area insets    | All screens                                           | `useSafeAreaInsets()` — always respect, never hardcode |

---

## 7. Style & Quality Standards

- Dark mode only. Background: `#0a0a0c` (from `constants/colors.ts`).
- iOS 26 glassmorphism aesthetic: translucent layers, blur, soft shadows, spring animations.
- All animations via `react-native-reanimated` (already installed) or Three.js/ogl render loops.
- Font: Inter (400/500/600/700) — already loaded.
- Maximum font sizes: display 48–64pt, headers 20–28pt, body 14–16pt.
- Web insets: 67px top, 34px bottom (Platform.OS === 'web' only).

---

## 8. Forbidden Actions Summary

- ❌ Modify `server/routes.ts`, `server/storage.ts`, `shared/schema.ts`
- ❌ Edit `package.json` directly (use npm install)
- ❌ Nest `<Canvas>` inside unstyled/zero-dimension containers
- ❌ Generate `.glb` 3D model files
- ❌ Remove font-gating pattern from `_layout.tsx`
- ❌ Remove `KeyboardAwareScrollViewCompat` wrappers
- ❌ Hardcode safe area padding values
- ❌ Run `npx expo start` directly (use workflow restart)
- ❌ Use `uuid` package (use `expo-crypto` or `Date.now()` pattern)
- ❌ Set `headerShown` dynamically inside screen components
