import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { MediaItem, Tag, ViewMode } from "@/types";
import StarRating from "@/components/StarRating";
import TagPill from "@/components/TagPill";
import { formatDate, getSourceLabel } from "@/lib/utils";
import GlassSurface from "@/components/GlassSurface";

interface MediaCardProps {
  item: MediaItem;
  tags: Tag[];
  viewMode: ViewMode;
  onPlay: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function ContextMenu({
  visible,
  onClose,
  onPlay,
  onEdit,
  onFavorite,
  onDelete,
  isFavorite,
}: {
  visible: boolean;
  onClose: () => void;
  onPlay: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  isFavorite: boolean;
}) {
  if (!visible) return null;

  const options = [
    {
      icon: "play-circle-outline" as const,
      label: "Play",
      onPress: onPlay,
    },
    {
      icon: "pencil-outline" as const,
      label: "Edit",
      onPress: onEdit,
    },
    {
      icon: isFavorite ? ("heart" as const) : ("heart-outline" as const),
      label: isFavorite ? "Unfavorite" : "Favorite",
      onPress: onFavorite,
    },
    {
      icon: "trash-outline" as const,
      label: "Delete",
      onPress: onDelete,
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <View style={styles.menuShadow}>
          <GlassSurface borderRadius={18} style={styles.menuGlass}>
            {options.map((opt, i) => (
              <Pressable
                key={opt.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  i < options.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
              >
                <Ionicons name={opt.icon} size={18} />
                <Text style={styles.menuLabel}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </GlassSurface>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function MediaCard({
  item,
  tags,
  viewMode,
  onPlay,
  onEdit,
  onToggleFavorite,
  onDelete,
}: MediaCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.965, { damping: 15, stiffness: 250 });
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  }
  function handleLongPress() {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(true);
  }

  const itemTags = tags.filter((t) => item.tags.includes(t.id));
  const source = getSourceLabel(item.url);

  if (viewMode === "list") {
    return (
      <>
        <Animated.View style={[styles.listCardShadow, animStyle]}>
          <Pressable
            style={styles.listCard}
            onPress={onPlay}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <GlassSurface
              style={StyleSheet.absoluteFillObject}
              borderRadius={16}
            />
            <View style={styles.listSpecular} />
            <View style={styles.listThumb}>
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}
                >
                  <Ionicons
                    name="play-circle"
                    size={22}
                  />
                </View>
              )}
              <View style={styles.listThumbOverlay}>
                <Ionicons name="play" size={12} />
              </View>
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.listMeta}>
                {source} · {formatDate(item.createdAt)}
              </Text>
              <View style={styles.listBottom}>
                <StarRating rating={item.rating} size={11} />
                <View style={styles.listTagRow}>
                  {itemTags.slice(0, 2).map((tag) => (
                    <TagPill key={tag.id} tag={tag} size="sm" />
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.listActions}>
              {item.isFavorite && (
                <Ionicons name="heart" size={13} />
              )}
              <Pressable onPress={() => setMenuVisible(true)} hitSlop={8}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
        <ContextMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onPlay={onPlay}
          onEdit={onEdit}
          onFavorite={onToggleFavorite}
          onDelete={onDelete}
          isFavorite={item.isFavorite}
        />
      </>
    );
  }

  const isCompact = viewMode === "compact";

  return (
    <>
      <Animated.View style={[styles.cardWrapper, animStyle]}>
        <Pressable
          style={styles.card}
          onPress={onPlay}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <GlassSurface
            style={StyleSheet.absoluteFillObject}
            borderRadius={16}
          />
          <View style={[styles.thumb, isCompact && styles.thumbCompact]}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
                <Ionicons
                  name="film-outline"
                  size={isCompact ? 26 : 34}
                />
                <Text style={styles.sourceLabel}>{source}</Text>
              </View>
            )}

            <LinearGradient
              colors={["transparent", "transparent"]}
              style={StyleSheet.absoluteFill}
              locations={[0.28, 1]}
            />

            <View style={styles.overlay}>
              {!isCompact && (
                <View style={styles.badgeRow}>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>{source}</Text>
                  </View>
                  {item.isFavorite && (
                    <Ionicons name="heart" size={13} />
                  )}
                </View>
              )}

              <Text
                style={[styles.cardTitle, isCompact && styles.cardTitleCompact]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              {!isCompact && (
                <>
                  <StarRating rating={item.rating} size={11} />
                  <View style={styles.tagRow}>
                    {itemTags.slice(0, 2).map((tag) => (
                      <TagPill key={tag.id} tag={tag} size="sm" />
                    ))}
                  </View>
                </>
              )}
            </View>

            {isCompact && item.isFavorite && (
              <View style={styles.favBadge}>
                <Ionicons name="heart" size={9} />
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
      <ContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onPlay={onPlay}
        onEdit={onEdit}
        onFavorite={onToggleFavorite}
        onDelete={onDelete}
        isFavorite={item.isFavorite}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    overflow: "hidden",
  },
  card: {
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    overflow: "hidden",
    borderWidth: 1,
  },
  thumbCompact: {
    aspectRatio: 16 / 9,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sourceLabel: {},
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  sourceBadgeText: {},
  cardTitle: {},
  cardTitleCompact: {},
  tagRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  favBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 3,
    borderWidth: 1,
  },
  listCardShadow: {},
  listCard: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: "flex-start",
    overflow: "hidden",
    position: "relative",
  },
  listSpecular: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  listThumb: {
    width: 92,
    height: 58,
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 1,
  },
  listThumbOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    padding: 2,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listTitle: {},
  listMeta: {},
  listBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  listTagRow: {
    flexDirection: "row",
    gap: 4,
  },
  listActions: {
    alignItems: "center",
    gap: 8,
    paddingTop: 2,
  },
  menuBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuShadow: {},
  menu: {
    width: 228,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuGlass: {
    width: 228,
  },
  menuSpecular: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuLabel: {},
});
