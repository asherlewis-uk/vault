import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  color?: string;
}

function Star({
  filled,
  onPress,
  size,
  color,
}: {
  filled: boolean;
  onPress?: () => void;
  size: number;
  color: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!onPress) {
    return (
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? color : Colors.textTertiary}
      />
    );
  }

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(1.3, { damping: 8, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 8, stiffness: 300 });
        onPress();
      }}
    >
      <Animated.View style={animStyle}>
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={size}
          color={filled ? color : Colors.textTertiary}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function StarRating({
  rating,
  onChange,
  size = 16,
  color = Colors.warning,
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={star <= rating}
          onPress={onChange ? () => onChange(star === rating ? 0 : star) : undefined}
          size={size}
          color={color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
