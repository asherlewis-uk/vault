import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '@/types';

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
      ]}
    >
      <View style={styles.dot} />
      <Text
        style={[
          styles.label,
          isSm ? styles.labelSm : styles.labelMd,
        ]}
        numberOfLines={1}
      >
        {tag.name}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={12} />
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
  },
  label: {},
  labelSm: {},
  labelMd: {},
});
