# Private Vault

A privacy-first, PIN-locked media aggregator app built with Expo React Native.

## Overview

Private Vault is a fully client-side mobile app for collecting, organizing, tagging, and watching video bookmarks from multiple sources. All data is stored locally using AsyncStorage — no backend, no tracking, no accounts.

## Architecture

### Stack
- **Frontend**: Expo React Native (SDK 54) with Expo Router (file-based routing)
- **State Management**: React Context (AuthContext, MediaContext)
- **Storage**: AsyncStorage (local-only, no server)
- **Styling**: React Native StyleSheet with iOS 26 glassmorphism dark theme
- **Fonts**: Inter (via @expo-google-fonts/inter)
- **PIN Security**: expo-crypto SHA-256 hashing

### Project Structure

```
app/
  _layout.tsx              # Root layout with all providers + auth gate
  (tabs)/
    _layout.tsx            # NativeTabs (iOS 26 liquid glass) or classic BlurView
    index.tsx              # Library screen (main media grid)
    favorites.tsx          # Favorites collection
    history.tsx            # Watch history
    settings.tsx           # Settings, export, security
  add.tsx                  # Add media (formSheet)
  player/[id].tsx          # Full-screen player (WebView)
  edit/[id].tsx            # Edit media item (formSheet)
  tags.tsx                 # Tag manager (formSheet)
  change-pin.tsx           # Change PIN (formSheet)

contexts/
  AuthContext.tsx           # PIN auth state, idle timeout, lock/unlock
  MediaContext.tsx          # Media library, tags, history, CRUD

components/
  AuthGate.tsx              # PIN keypad entry screen
  MediaCard.tsx             # Media card (grid/compact/list modes)
  StarRating.tsx            # 5-star rating with spring animation
  TagPill.tsx               # Color-coded tag pill component

types/index.ts             # TypeScript interfaces (MediaItem, Tag, HistoryEntry)
lib/utils.ts               # URL parsing, thumbnail extraction, metadata fetching
```

### Data Models
- **MediaItem**: id, url, title, thumbnail, tags, rating, isFavorite, notes, createdAt, lastViewedAt, viewCount
- **Tag**: id, name, color (hex)
- **HistoryEntry**: id, mediaId, mediaTitle, viewedAt

## Features

1. **PIN Authentication Gate** — first-time setup, keypad entry, SHA-256 hashing, auto-lock on idle
2. **Media Library** — add via URL with auto-metadata fetch (YouTube/Vimeo oEmbed), grid/compact/list views
3. **Organization** — color-coded tags, 1–5 star ratings, favorites, personal notes
4. **Search & Filter** — instant full-text search, filter by tag/favorites, sort by date/rating/title/recent
5. **Player** — WebView embedded player, YouTube/Vimeo embed URL conversion
6. **Watch History** — automatic tracking, clear option
7. **Settings** — change PIN, auto-lock timeout, tag manager, export/import, nuclear wipe
8. **iOS 26 Design** — NativeTabs with liquid glass, glassmorphism surfaces, spring animations

## Workflows

- **Start Frontend**: `npm run expo:dev` — Expo dev server on port 8081
- **Start Backend**: `npm run server:dev` — Express server on port 5000 (serves landing page only)

## Design System

All colors from `constants/colors.ts`:
- Background: `#0a0a0c`
- Glass surfaces: `rgba(255,255,255,0.04–0.10)`
- Accent: `#0a84ff` (iOS blue)
- Fonts: Inter 400/500/600/700

## Key Dependencies

- expo-crypto@~15.0.8 — PIN hashing (important: must be 15.x, not 55.x)
- react-native-webview — embedded player
- @expo-google-fonts/inter — typography
- expo-blur — tab bar glassmorphism
- expo-haptics — touch feedback
- expo-linear-gradient — card overlays
