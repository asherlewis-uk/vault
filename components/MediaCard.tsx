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
import { Colors } from "@/constants/colors";
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
      color: Colors.accent,
    },
    {
      icon: "pencil-outline" as const,
      label: "Edit",
      onPress: onEdit,
      color: Colors.text,
    },
    {
      icon: isFavorite ? ("heart" as const) : ("heart-outline" as const),
      label: isFavorite ? "Unfavorite" : "Favorite",
      onPress: onFavorite,
      color: isFavorite ? Colors.danger : Colors.text,
    },
    {
      icon: "trash-outline" as const,
      label: "Delete",
      onPress: onDelete,
      color: Colors.danger,
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
                  pressed && { backgroundColor: "rgba(255,255,255,0.06)" },
                  i < options.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
              >
                <Ionicons name={opt.icon} size={18} color={opt.color} />
                <Text style={[styles.menuLabel, { color: opt.color }]}>
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
            style={({ pressed }) => [
              styles.listCard,
              pressed && { opacity: 0.88 },
            ]}
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
                    color={Colors.textTertiary}
                  />
                </View>
              )}
              <View style={styles.listThumbOverlay}>
                <Ionicons name="play" size={12} color="white" />
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
                <Ionicons name="heart" size={13} color={Colors.danger} />
              )}
              <Pressable onPress={() => setMenuVisible(true)} hitSlop={8}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color={Colors.textTertiary}
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
                  color={Colors.textTertiary}
                />
                <Text style={styles.sourceLabel}>{source}</Text>
              </View>
            )}

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.92)"]}
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
                    <Ionicons name="heart" size={13} color={Colors.danger} />
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
                <Ionicons name="heart" size={9} color={Colors.danger} />
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
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: Colors.bgFloating,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  thumbCompact: {
    aspectRatio: 16 / 9,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.bgFloating,
  },
  sourceLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
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
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sourceBadgeText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 16,
  },
  cardTitleCompact: {
    fontSize: 10,
  },
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
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listCardShadow: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
  },
  listCard: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "transparent",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
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
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  listThumb: {
    width: 92,
    height: 58,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.bgFloating,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  listThumbOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    padding: 2,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  listMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
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
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    borderRadius: 18,
  },
  menu: {
    width: 228,
    backgroundColor: "rgba(30,30,34,0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
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
    backgroundColor: "rgba(255,255,255,0.22)",
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
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
