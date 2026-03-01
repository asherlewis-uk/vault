import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MediaItem, Tag, ViewMode } from '@/types';
import StarRating from '@/components/StarRating';
import TagPill from '@/components/TagPill';
import { Colors } from '@/constants/colors';
import { formatDate, getSourceLabel } from '@/lib/utils';

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
    { icon: 'play-circle-outline' as const, label: 'Play', onPress: onPlay, color: Colors.accent },
    { icon: 'pencil-outline' as const, label: 'Edit', onPress: onEdit, color: Colors.text },
    {
      icon: isFavorite ? ('heart' as const) : ('heart-outline' as const),
      label: isFavorite ? 'Unfavorite' : 'Favorite',
      onPress: onFavorite,
      color: isFavorite ? Colors.danger : Colors.text,
    },
    { icon: 'trash-outline' as const, label: 'Delete', onPress: onDelete, color: Colors.danger },
  ];

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <View style={styles.menu}>
          {options.map((opt, i) => (
            <Pressable
              key={opt.label}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: Colors.glassHover },
                i < options.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => {
                onClose();
                opt.onPress();
              }}
            >
              <Ionicons name={opt.icon} size={18} color={opt.color} />
              <Text style={[styles.menuLabel, { color: opt.color }]}>{opt.label}</Text>
            </Pressable>
          ))}
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
    scale.value = withSpring(0.97, { damping: 15, stiffness: 250 });
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

  if (viewMode === 'list') {
    return (
      <>
        <Animated.View style={animStyle}>
          <Pressable
            style={({ pressed }) => [styles.listCard, pressed && { opacity: 0.85 }]}
            onPress={onPlay}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.listThumb}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
                  <Ionicons name="play-circle" size={24} color={Colors.textTertiary} />
                </View>
              )}
              <View style={styles.listThumbOverlay}>
                <Ionicons name="play" size={14} color="white" />
              </View>
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.listMeta}>{source} · {formatDate(item.createdAt)}</Text>
              <View style={styles.listBottom}>
                <StarRating rating={item.rating} size={12} />
                <View style={styles.listTagRow}>
                  {itemTags.slice(0, 2).map((tag) => (
                    <TagPill key={tag.id} tag={tag} size="sm" />
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.listActions}>
              {item.isFavorite && (
                <Ionicons name="heart" size={14} color={Colors.danger} />
              )}
              <Pressable onPress={() => setMenuVisible(true)} hitSlop={8}>
                <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textTertiary} />
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

  const isCompact = viewMode === 'compact';

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
          <View style={[styles.thumb, isCompact && styles.thumbCompact]}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
                <Ionicons name="film-outline" size={isCompact ? 28 : 36} color={Colors.textTertiary} />
                <Text style={styles.sourceLabel}>{source}</Text>
              </View>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={StyleSheet.absoluteFill}
              locations={[0.3, 1]}
            />

            <View style={styles.overlay}>
              {!isCompact && (
                <View style={styles.badgeRow}>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>{source}</Text>
                  </View>
                  {item.isFavorite && (
                    <Ionicons name="heart" size={14} color={Colors.danger} />
                  )}
                </View>
              )}

              <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact]} numberOfLines={2}>
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
                <Ionicons name="heart" size={10} color={Colors.danger} />
              </View>
            )}

            <View style={styles.playBtn}>
              <Ionicons name="play-circle" size={isCompact ? 28 : 36} color="white" />
            </View>
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
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.bgFloating,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbCompact: {
    aspectRatio: 16 / 9,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.bgFloating,
  },
  sourceLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_500Medium',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
  cardTitleCompact: {
    fontSize: 10,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    opacity: 0,
  },
  favBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 3,
  },
  listCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 12,
    alignItems: 'flex-start',
  },
  listThumb: {
    width: 96,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.bgFloating,
    flexShrink: 0,
  },
  listThumbOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    padding: 2,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 17,
  },
  listMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  listBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  listTagRow: {
    flexDirection: 'row',
    gap: 4,
  },
  listActions: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    width: 220,
    backgroundColor: Colors.bgFloating,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
