import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useMedia } from "@/contexts/MediaContext";
import { useAuth } from "@/contexts/AuthContext";
import MediaCard from "@/components/MediaCard";
import TagPill from "@/components/TagPill";
import { Colors } from "@/constants/colors";
import ColorBends from "@/components/ColorBends";
import { MediaItem, ViewMode, SortBy } from "@/types";

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: "dateAdded", label: "Newest" },
  { key: "rating", label: "Rating" },
  { key: "title", label: "A–Z" },
  { key: "lastViewed", label: "Recent" },
];

function FAB({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.fab, { bottom }, animStyle]}>
      <Pressable
        style={styles.fabInner}
        onPressIn={() => {
          scale.value = withSpring(0.88, { damping: 8, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 8, stiffness: 300 });
          onPress();
        }}
      >
        <View style={styles.fabSpecular} />
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const { items, tags, updateItem, deleteItem } = useMedia();
  const { lock, updateActivity } = useAuth();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("dateAdded");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const searchHeight = useSharedValue(0);
  const searchOpacity = useSharedValue(0);

  const searchStyle = useAnimatedStyle(() => ({
    height: searchHeight.value,
    opacity: searchOpacity.value,
    overflow: "hidden",
  }));

  function toggleSearch() {
    if (searchOpen) {
      searchHeight.value = withTiming(0, { duration: 220 });
      searchOpacity.value = withTiming(0, { duration: 180 });
      setSearch("");
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      searchHeight.value = withSpring(52, { damping: 18, stiffness: 200 });
      searchOpacity.value = withTiming(1, { duration: 200 });
      setTimeout(() => searchInputRef.current?.focus(), 250);
    }
  }

  function cycleSortBy() {
    const idx = SORT_OPTIONS.findIndex((o) => o.key === sortBy);
    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key);
    Haptics.selectionAsync();
  }

  function cycleViewMode() {
    setViewMode((v) =>
      v === "grid" ? "compact" : v === "compact" ? "list" : "grid",
    );
    Haptics.selectionAsync();
  }

  function toggleTag(tagId: string) {
    setActiveTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
    updateActivity();
  }

  const filteredItems = useMemo((): MediaItem[] => {
    let result = [...items];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q) ||
          item.tags.some((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return tag?.name.toLowerCase().includes(q);
          }),
      );
    }

    if (activeTagIds.length > 0) {
      result = result.filter((item) =>
        activeTagIds.every((tagId) => item.tags.includes(tagId)),
      );
    }

    if (showFavoritesOnly) {
      result = result.filter((item) => item.isFavorite);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "title":
          return a.title.localeCompare(b.title);
        case "lastViewed":
          return (b.lastViewedAt ?? 0) - (a.lastViewedAt ?? 0);
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [items, tags, search, activeTagIds, showFavoritesOnly, sortBy]);

  const numCols = viewMode === "compact" ? 3 : viewMode === "grid" ? 2 : 1;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <View style={[styles.cardWrapper, viewMode !== "list" && { flex: 1 }]}>
        <MediaCard
          item={item}
          tags={tags}
          viewMode={viewMode}
          onPlay={() => {
            updateActivity();
            router.push({ pathname: "/player/[id]", params: { id: item.id } });
          }}
          onEdit={() =>
            router.push({ pathname: "/edit/[id]", params: { id: item.id } })
          }
          onToggleFavorite={() =>
            updateItem(item.id, { isFavorite: !item.isFavorite })
          }
          onDelete={() => deleteItem(item.id)}
        />
      </View>
    ),
    [tags, viewMode, updateItem, deleteItem],
  );

  const viewModeIcon: Record<ViewMode, keyof typeof Ionicons.glyphMap> = {
    grid: "grid-outline",
    compact: "apps-outline",
    list: "list-outline",
  };

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "Newest";

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ColorBends
        rotation={45}
        autoRotate={0.05}
        speed={0.4}
        colors={["#0a84ff", "#bf5af2", "#ff375f", "#30d158", "#ffd60a"]}
        transparent={true}
        scale={1}
        frequency={1.2}
        warpStrength={1.5}
        mouseInfluence={1.5}
        parallax={0.5}
        noise={0.1}
        style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.appTitle}>Vault</Text>
            <Text style={styles.countLabel}>{items.length} items</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={toggleSearch} style={styles.iconBtn}>
            <Ionicons
              name={searchOpen ? "close" : "search-outline"}
              size={20}
              color={searchOpen ? Colors.accent : Colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={cycleViewMode} style={styles.iconBtn}>
            <Ionicons
              name={viewModeIcon[viewMode]}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              lock();
            }}
            style={styles.iconBtn}
          >
            <Ionicons
              name="lock-open-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.searchContainer, searchStyle]}>
        <View style={styles.searchBox}>
          <View style={styles.searchSpecular} />
          <Ionicons name="search" size={16} color={Colors.textTertiary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search titles, notes, tags..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="done"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={Colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </Animated.View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Pressable
            style={[
              styles.filterChip,
              !showFavoritesOnly &&
                !activeTagIds.length &&
                styles.filterChipActive,
            ]}
            onPress={() => {
              setShowFavoritesOnly(false);
              setActiveTagIds([]);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                !showFavoritesOnly &&
                  !activeTagIds.length &&
                  styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              showFavoritesOnly && styles.filterChipActive,
            ]}
            onPress={() => {
              setShowFavoritesOnly((v) => !v);
              setActiveTagIds([]);
            }}
          >
            <Ionicons
              name={showFavoritesOnly ? "heart" : "heart-outline"}
              size={13}
              color={showFavoritesOnly ? Colors.danger : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                showFavoritesOnly && { color: Colors.danger },
              ]}
            >
              Favorites
            </Text>
          </Pressable>

          {tags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              active={activeTagIds.includes(tag.id)}
              onPress={() => toggleTag(tag.id)}
              size="sm"
            />
          ))}

          <Pressable style={styles.sortChip} onPress={cycleSortBy}>
            <Ionicons
              name="swap-vertical"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.sortChipText}>{currentSortLabel}</Text>
          </Pressable>
        </ScrollView>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.empty}>
          {items.length === 0 ? (
            <>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="film-outline"
                  size={40}
                  color={Colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>Your vault is empty</Text>
              <Text style={styles.emptySubtitle}>
                Tap + to add your first item
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="search-outline"
                size={40}
                color={Colors.textTertiary}
              />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search or filter
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={filteredItems}
          numColumns={numCols}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 140,
            },
          ]}
          columnWrapperStyle={numCols > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          onScroll={() => updateActivity()}
          scrollEventThrottle={300}
        />
      )}

      <FAB
        onPress={() => router.push("/add")}
        bottom={(Platform.OS === "web" ? 34 : insets.bottom) + 96}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lockBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  countLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  headerRight: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  searchSpecular: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  filterBar: {
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent + "60",
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.accent,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  sortChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
    backgroundColor: "transparent",
  },
  columnWrapper: {
    gap: 10,
  },
  cardWrapper: {
    overflow: "hidden",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
    backgroundColor: "transparent",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  fab: {
    position: "absolute",
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  fabSpecular: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.40)",
  },
});
