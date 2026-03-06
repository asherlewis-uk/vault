import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMedia } from "@/contexts/MediaContext";
import MediaCard from "@/components/MediaCard";
import ColorBends from "@/components/ColorBends";
import { ViewMode } from "@/types";

export default function FavoritesScreen() {
  const { items, tags, updateItem, deleteItem } = useMedia();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const favorites = useMemo(
    () =>
      items
        .filter((item) => item.isFavorite)
        .sort((a, b) => b.createdAt - a.createdAt),
    [items],
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const numCols = viewMode === "compact" ? 3 : viewMode === "grid" ? 2 : 1;

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
        <View>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.count}>{favorites.length} items</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() =>
              setViewMode(
                viewMode === "grid"
                  ? "compact"
                  : viewMode === "compact"
                    ? "list"
                    : "grid",
              )
            }
          >
            <Ionicons
              name={
                viewMode === "list"
                  ? "list-outline"
                  : viewMode === "compact"
                    ? "apps-outline"
                    : "grid-outline"
              }
              size={20}
            />
          </Pressable>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="heart-outline"
            size={48}
          />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any item to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={favorites}
          numColumns={numCols}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numCols > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[styles.cardWrapper, viewMode !== "list" && { flex: 1 }]}
            >
              <MediaCard
                item={item}
                tags={tags}
                viewMode={viewMode}
                onPlay={() =>
                  router.push({
                    pathname: "/player/[id]",
                    params: { id: item.id },
                  })
                }
                onEdit={() =>
                  router.push({
                    pathname: "/edit/[id]",
                    params: { id: item.id },
                  })
                }
                onToggleFavorite={() =>
                  updateItem(item.id, { isFavorite: !item.isFavorite })
                }
                onDelete={() => deleteItem(item.id)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
  },
  count: {
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
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
  },
  emptyTitle: {
  },
  emptySubtitle: {
    textAlign: "center",
  },
});
