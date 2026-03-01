import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '@/types';
import { Colors } from '@/constants/colors';

interface TagPillProps {
  tag: Tag;
  active?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export default function TagPill({ tag, active, onPress, onRemove, size = 'sm' }: TagPillProps) {
  const isSm = size === 'sm';

  const content = (
    <View
      style={[
        styles.pill,
        isSm ? styles.pillSm : styles.pillMd,
        {
          backgroundColor: active
            ? tag.color + '30'
            : 'rgba(255,255,255,0.06)',
          borderColor: active ? tag.color + '80' : Colors.glassBorder,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tag.color }]} />
      <Text
        style={[
          styles.label,
          isSm ? styles.labelSm : styles.labelMd,
          { color: active ? tag.color : Colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {tag.name}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={12} color={Colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    gap: 5,
  },
  pillSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: 'Inter_500Medium',
  },
  labelSm: {
    fontSize: 11,
  },
  labelMd: {
    fontSize: 13,
  },
});
