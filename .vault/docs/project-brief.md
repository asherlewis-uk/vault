# Video Vault: Architectural State & Integration Brief

## 1. Current Architectural State

The project is currently structured as a full-stack Expo application (React Native for Web/Mobile) with a custom Express backend.

- **Routing:** File-based routing handled via Expo Router (`app/` directory).
- **Backend:** Express server (`server/index.ts`) interfacing with a database via Drizzle ORM (`shared/schema.ts`).
- **State Management & Context:** Custom React contexts for Authentication (`AuthContext.tsx`) and Media State (`MediaContext.tsx`).
- **Current UI:** Standard React Native / Expo web components (`View`, `ScrollView`, etc.) utilizing basic stylesheets and structural layouts across the main tabs (`index.tsx`, `favorites.tsx`, `history.tsx`, `settings.tsx`).

## 2. The Integration Delta (Copilot Objectives)

The primary objective is to strip the generic UI container styling and inject advanced WebGL (`ogl`) and 3D (`@react-three/fiber`) shader components as the foundational UI layers.

Copilot must execute the following phases without disrupting the underlying Drizzle schemas or routing logic.

### Phase 1: Dependency Injection

Before altering any UI components, Copilot must verify and install the required packages for the new visual stack.

- **Required Packages:** `ogl`, `three`, `@react-three/fiber`, `@react-three/drei`, `maath`.
- **Environment:** Ensure these are added to the `package.json` and resolved cleanly.

### Phase 2: Asset Pipeline Preparation

The `FluidGlass` component requires physical 3D models to render.

- Copilot must scaffold the `/public/assets/3d/` directory structure.
- Copilot must establish placeholder references in the code for `lens.glb`, `bar.glb`, and `cube.glb` so the user can drop the files in later without breaking the canvas initialization.

### Phase 3: Surgical UI Replacement

Copilot will strip the legacy background styling and integrate the 4 specific visual components:

1. **Aurora (Background Layer):** \* Replace static background colors in `app/_layout.tsx` or `app/(tabs)/_layout.tsx` with the `<Aurora />` component.
   - Ensure the `ogl` canvas sits fixed behind the `Slot` or standard Expo Tab navigation.
2. **FluidGlass (3D Interactive Layer):**
   - Integrate `<FluidGlass />` within specific media view zones (e.g., `app/player/[id].tsx`).
   - **CRITICAL:** Ensure the `@react-three/fiber` `<Canvas>` is NOT nested inside standard block `<div>` elements that force a 0x0 height, preventing the "invisible canvas" crash.
3. **GlassSurface (Container Styling):**
   - Refactor standard media cards (`components/MediaCard.tsx`) and authentication gates (`components/AuthGate.tsx`) to utilize the `<GlassSurface />` component.
   - Ensure the SVG displacement maps do not block touch/click events on the interactive media buttons.
4. **ColorBends / DarkVeil (Atmosphere):**
   - Wire these in as active states or secondary backgrounds for isolated routes like `app/settings.tsx` or `app/add.tsx`.

## 3. Critical Constraints for AI Agent

- **Do not** alter `server/routes.ts` or `shared/schema.ts`.
- **Do not** remove the `KeyboardAwareScrollViewCompat` wrappers, as they are necessary for mobile text inputs.
- **Strict Canvas Management:** Treat all `ogl` and `three` canvases as highly volatile. Maintain strict z-indexing and absolute positioning to prevent DOM flow errors.
