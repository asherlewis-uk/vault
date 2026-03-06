# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design System

### Colors
- **Background**: `#0a0a0c` (near-black)
- **Glass surfaces**: `rgba(255,255,255,0.04–0.10)` (subtle white overlays)
- **Accent**: `#0a84ff` (iOS system blue)
- **Font**: Inter 400/500/600/700

### Theme
- **Style**: iOS 26 liquid glass / glassmorphism dark
- **Z-index layers**:
  - Background canvas: `0`
  - Glass surfaces: `1`
  - UI controls: `2`

### Important
- `constants/colors.ts` is currently empty and needs to be rebuilt as the single source of truth for all design system colors
- All ogl/three canvases must use absolute positioning with explicit width/height

## UI Tools Available

- **ui-ux-pro-max skill**: Consult for design decisions and glassmorphism patterns
- **magic MCP**: Use `/ui` commands to source components from 21st.dev registry
- **stitch MCP**: Use for generating new screen designs

## Hard Rules

1. **Never modify** `server/routes.ts` or `shared/schema.ts`
2. **Never remove** `KeyboardAwareScrollViewCompat` wrappers
3. **All ogl/three canvases** must use absolute positioning with explicit width/height
4. **Z-index layering**: Background canvas=0, glass surfaces=1, UI controls=2
5. **constants/colors.ts** is currently empty — rebuild it as the single source of truth for all colors

## Current State (as of March 6, 2026)

- Theme scrub complete — all hardcoded theming removed from 26 files
- `constants/colors.ts` is gutted and ready to be repopulated with new design system values
- Design system now centralized and ready for consistent implementation

## Development Commands

### Frontend (Expo)
- `npm run expo:dev` - Start Expo development server (port 8081) with Replit domain configuration
- `npm start` - Standard Expo start
- `npm run expo:static:build` - Build static Expo app
- `npm run expo:start:static:build` - Start Expo without dev/minify on localhost

### Backend (Express)
- `npm run server:dev` - Start development server (port 5000, uses tsx)
- `npm run server:build` - Build Express server to `server_dist/` using esbuild
- `npm run server:prod` - Run production server from built files

### Database
- `npm run db:push` - Push Drizzle schema changes to PostgreSQL database
- Schema defined in `shared/schema.ts`, config in `drizzle.config.ts`

### Other
- `npm run lint` - Run ESLint (expo lint)
- `npm run lint:fix` - Auto-fix linting issues
- `npm run postinstall` - Applies patches via patch-package (runs automatically)

## Architecture Overview

### Tech Stack
- **Framework**: Expo React Native SDK 54 with React 19.1.0
- **Navigation**: Expo Router (file-based routing with typed routes)
- **State Management**: React Context API (AuthContext, MediaContext)
- **Storage**: AsyncStorage for client-side persistence (no backend dependency for core functionality)
- **Backend**: Express 5 server (primarily for landing page and static asset serving)
- **Database**: Drizzle ORM + PostgreSQL (minimal usage, mainly users table)
- **Data Fetching**: TanStack Query (React Query v5)
- **3D Graphics**: Three.js + React Three Fiber (@react-three/fiber, @react-three/drei)
- **Styling**: React Native StyleSheet with glassmorphism design
- **Fonts**: Inter (via @expo-google-fonts/inter)
- **Security**: expo-crypto for SHA-256 PIN hashing

### Core Application Flow

1. **App Launch**: `app/_layout.tsx` is the root layout
   - Wraps app in providers: ErrorBoundary → QueryClientProvider → GestureHandlerRootView → KeyboardProvider → AuthProvider → MediaProvider
   - Loads Inter fonts (400/500/600/700)
   - Shows AuthGate if user is locked out, otherwise shows main navigation

2. **Authentication Gate**: PIN-based authentication via `AuthContext`
   - First-time users create a PIN
   - PIN is SHA-256 hashed with salt ('vault_salt_2024')
   - Stored in AsyncStorage under `@vault/auth`
   - Auto-lock after configurable idle timeout (default 5 minutes)
   - Idle detection runs every 15 seconds

3. **Main Navigation**: Tab-based navigation at `app/(tabs)/_layout.tsx`
   - Uses NativeTabs (iOS 26 liquid glass) or fallback BlurView tabs
   - Tabs: Library (index), Favorites, History, Settings

4. **Data Architecture**: All app data stored client-side in AsyncStorage
   - Media items: `@vault/media` (MediaItem[])
   - Tags: `@vault/tags` (Tag[])
   - History: `@vault/history` (HistoryEntry[], max 200 entries)
   - Managed via MediaContext with CRUD operations

### Key File Structure

```
app/
  _layout.tsx               # Root layout with providers + auth gate
  (tabs)/                   # Main tabbed navigation
    _layout.tsx             # Tab bar layout
    index.tsx               # Library screen (main media grid)
    favorites.tsx           # Favorites collection
    history.tsx             # Watch history
    settings.tsx            # Settings, export, security
  add.tsx                   # Add media (formSheet modal)
  player/[id].tsx           # Video player (fullScreenModal, WebView)
  edit/[id].tsx             # Edit media item (formSheet modal)
  tags.tsx                  # Tag manager (formSheet modal)
  change-pin.tsx            # Change PIN (formSheet modal)

contexts/
  AuthContext.tsx           # PIN auth state, lock/unlock, idle timeout
  MediaContext.tsx          # Media library CRUD, tags, history, import/export

components/
  AuthGate.tsx              # PIN keypad entry screen
  MediaCard.tsx             # Media card component (grid/compact/list modes)
  StarRating.tsx            # 5-star rating with spring animation
  TagPill.tsx               # Color-coded tag pill
  GlassSurface.tsx          # Reusable glassmorphism surface
  FluidGlass.tsx            # Animated glass effect with shaders
  ColorBends.tsx            # 3D color bending effect (Three.js)
  3d/
    ModelLoader.tsx         # 3D model loader (uses R3F)
    *.native.tsx            # Native stub files for components unsupported on native

server/
  index.ts                  # Express server entry point
  routes.ts                 # API route registration
  storage.ts                # Storage utilities
  templates/
    landing-page.html       # Landing page template

shared/
  schema.ts                 # Drizzle database schema (users table)

types/index.ts              # TypeScript type definitions
lib/
  utils.ts                  # URL parsing, thumbnail extraction, metadata fetching
  query-client.ts           # TanStack Query client configuration
```

### Data Models

**MediaItem** (types/index.ts):
- id, url, title, thumbnail, tags (array of tag IDs), rating (1-5), isFavorite, notes, createdAt, lastViewedAt, viewCount

**Tag** (types/index.ts):
- id, name, color (hex string)

**HistoryEntry** (types/index.ts):
- id, mediaId, mediaTitle, viewedAt

**ViewMode**: 'grid' | 'compact' | 'list'

**SortBy**: 'dateAdded' | 'rating' | 'title' | 'lastViewed'

### Important Technical Constraints

1. **expo-crypto Version**: Must use expo-crypto@~15.0.8 (NOT 55.x). Critical for PIN hashing.

2. **Platform-Specific Components**: Components with `.native.tsx` suffix are stubs for features unsupported on React Native (e.g., Three.js components). The `.tsx` version runs on web, `.native.tsx` runs on iOS/Android.

3. **Expo New Architecture**: Enabled via `newArchEnabled: true` in app.json. Uses React Compiler experimental features.

4. **AsyncStorage Keys**:
   - `@vault/auth` - Authentication data (pinHash, idleTimeout)
   - `@vault/media` - Media items array
   - `@vault/tags` - Tags array
   - `@vault/history` - History entries (trimmed to 200)

5. **Server CORS**: Configured for Replit domains + localhost origins (any port). Allows credentials and handles preflight OPTIONS requests.

6. **Expo Router Configuration**: Uses file-based routing with typed routes experiment enabled. All modals use iOS-style presentations (formSheet, fullScreenModal).

7. **Colors & Theming**:
   - `constants/colors.ts` was gutted during March 6, 2026 theme scrub
   - Must be rebuilt as single source of truth for design system
   - Use design system values: bg=#0a0a0c, glass=rgba(255,255,255,0.04-0.10), accent=#0a84ff
   - Never hardcode colors in components — always reference from constants/colors.ts

### State Management Patterns

1. **Context Providers**: All state managed via React Context
   - AuthContext: Auth state, wraps entire app below KeyboardProvider
   - MediaContext: Media library state, wraps below AuthProvider
   - Always use corresponding hooks: `useAuth()`, `useMedia()`

2. **Async Operations**: All AsyncStorage operations are async/await
   - Save operations immediately update state after successful storage
   - Load operations happen on mount in useEffect

3. **Data Export/Import**: MediaContext provides exportData() and importData()
   - Export format: JSON with items, tags, history, exportedAt timestamp
   - Import merges data, avoiding duplicates by ID

### Development Patterns

1. **Error Boundaries**: Root ErrorBoundary wraps entire app (components/ErrorBoundary.tsx)

2. **Navigation**: Use expo-router hooks and components
   - `router.push()`, `router.back()`, `router.replace()`
   - Dynamic routes: `[id].tsx` (e.g., player/[id], edit/[id])

3. **Animations**: Use react-native-reanimated for animations (e.g., StarRating.tsx)

4. **Haptics**: Use expo-haptics for touch feedback on buttons and interactions

5. **3D Components**: Use platform-specific files
   - Web: Full Three.js/R3F implementation in `.tsx`
   - Native: Stub component in `.native.tsx` (returns null or placeholder)

6. **Glassmorphism Patterns**:
   - Use `GlassSurface.tsx` component for standard glass surfaces
   - Use `FluidGlass.tsx` for animated glass effects with shaders
   - Always respect z-index layering: canvas=0, glass=1, UI=2
   - Glass opacity range: 0.04-0.10 for subtle layering

### Testing the App

Since this is an Expo app, use Expo Go or development builds:
- Run `npm run expo:dev`
- Scan QR code with Expo Go app (iOS/Android)
- Or press 'w' to open in web browser
- Or press 'i' for iOS simulator, 'a' for Android emulator

Backend server (port 5000) serves landing page accessible at root URL.
