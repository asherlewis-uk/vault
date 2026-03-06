import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Vibration,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'current' | 'new' | 'confirm';

const DOT_COUNT = 4;

function PinDot({ filled }: { filled: boolean }) {
  const scale = useSharedValue(filled ? 1 : 0.7);
  React.useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.7, { damping: 12, stiffness: 200 });
  }, [filled]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: filled ? 1 : 0.25,
  }));
  return <Animated.View style={[styles.dot, filled && styles.dotFilled, style]} />;
}

function KeypadButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 300 }); onPress(); }}
    >
      <Animated.View style={[styles.key, animStyle]}>
        <Text style={styles.keyLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ChangePinScreen() {
  const { hasPin, createPin, changePin } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(hasPin ? 'current' : 'new');
  const [collectedCurrent, setCollectedCurrent] = useState('');
  const [collectedNew, setCollectedNew] = useState('');
  const [currentEntry, setCurrentEntry] = useState('');
  const [newEntry, setNewEntry] = useState('');
  const [confirmEntry, setConfirmEntry] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const shakeX = useSharedValue(0);

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function shake() {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 60 }),
      withTiming(12, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    if (Platform.OS !== 'web') Vibration.vibrate(300);
  }

  function getActiveEntry() {
    if (step === 'current') return currentEntry;
    if (step === 'new') return newEntry;
    return confirmEntry;
  }

  async function handleDigit(d: string) {
    setError('');
    const active = getActiveEntry();
    if (active.length >= DOT_COUNT) return;
    const next = active + d;

    if (step === 'current') {
      setCurrentEntry(next);
      if (next.length === DOT_COUNT) {
        setCollectedCurrent(next);
        setTimeout(() => {
          setStep('new');
          setCurrentEntry('');
        }, 300);
      }
    } else if (step === 'new') {
      setNewEntry(next);
      if (next.length === DOT_COUNT) {
        setCollectedNew(next);
        setTimeout(() => {
          setStep('confirm');
          setNewEntry('');
        }, 300);
      }
    } else {
      setConfirmEntry(next);
      if (next.length === DOT_COUNT) {
        if (next !== collectedNew) {
          shake();
          setError('PINs do not match');
          setTimeout(() => setConfirmEntry(''), 600);
          return;
        }
        let success = false;
        if (hasPin) {
          success = await changePin(collectedCurrent, collectedNew);
          if (!success) {
            shake();
            setError('Incorrect current PIN');
            setTimeout(() => {
              setStep('current');
              setCurrentEntry('');
              setNewEntry('');
              setConfirmEntry('');
              setCollectedCurrent('');
              setCollectedNew('');
            }, 800);
            return;
          }
        } else {
          await createPin(collectedNew);
          success = true;
        }
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSuccess(true);
          setTimeout(() => router.back(), 1200);
        }
      }
    }
  }

  function handleDelete() {
    setError('');
    if (step === 'current') setCurrentEntry((p) => p.slice(0, -1));
    else if (step === 'new') setNewEntry((p) => p.slice(0, -1));
    else setConfirmEntry((p) => p.slice(0, -1));
  }

  const titles: Record<Step, string> = {
    current: 'Enter Current PIN',
    new: 'Enter New PIN',
    confirm: 'Confirm New PIN',
  };

  const active = getActiveEntry();
  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} />
        </Pressable>
      </View>

      {success ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} />
          <Text style={styles.successText}>PIN Updated</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.stepTitle}>{titles[step]}</Text>

          <Animated.View style={[styles.dotsRow, dotsStyle]}>
            {Array.from({ length: DOT_COUNT }).map((_, i) => (
              <PinDot key={i} filled={i < active.length} />
            ))}
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 20 }} />}

          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, ri) => (
              <View key={ri} style={styles.keyRow}>
                {row.map((d) => (
                  <KeypadButton key={d} label={d} onPress={() => handleDigit(d)} />
                ))}
              </View>
            ))}
            <View style={styles.keyRow}>
              <View style={styles.keyEmpty} />
              <KeypadButton label="0" onPress={() => handleDigit('0')} />
              <Pressable style={styles.deleteKey} onPress={handleDelete}>
                <Ionicons name="backspace-outline" size={24} />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  stepTitle: {},
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
  },
  dotFilled: {},
  error: {
    height: 20,
  },
  keypad: {
    width: '100%',
    gap: 8,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  key: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {},
  keyEmpty: { flex: 1 },
  deleteKey: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {},
});
