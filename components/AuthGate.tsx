import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

type Step = 'enter' | 'create' | 'confirm';

const DOT_COUNT = 4;

function PinDot({ filled }: { filled: boolean }) {
  const scale = useSharedValue(filled ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.7, { damping: 12, stiffness: 200 });
  }, [filled]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: filled ? 1 : 0.25,
  }));

  return (
    <Animated.View style={[styles.dot, filled && styles.dotFilled, style]} />
  );
}

function KeypadButton({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      style={styles.keyOuter}
      onPressIn={() => {
        scale.value = withSpring(0.91, { damping: 10, stiffness: 320 });
        opacity.value = withTiming(0.75, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 320 });
        opacity.value = withTiming(1, { duration: 100 });
        onPress();
      }}
    >
      <Animated.View style={[styles.key, animStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.keySpecular} pointerEvents="none" />
        <Text style={styles.keyLabel}>{label}</Text>
        {sub ? <Text style={styles.keySub}>{sub}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

export default function AuthGate() {
  const { hasPin, createPin, unlock } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(hasPin ? 'enter' : 'create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const shakeX = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const containerY = useSharedValue(20);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 500 });
    containerY.value = withSpring(0, { damping: 18, stiffness: 150 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerY.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  function shake() {
    shakeX.value = withSequence(
      withTiming(-14, { duration: 55 }),
      withTiming(14, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
    if (Platform.OS !== 'web') Vibration.vibrate(300);
  }

  function getTitle() {
    if (step === 'create') return 'Create PIN';
    if (step === 'confirm') return 'Confirm PIN';
    return 'Enter PIN';
  }

  function getSubtitle() {
    if (step === 'create') return 'Choose a 4-digit PIN to lock your vault';
    if (step === 'confirm') return 'Re-enter your PIN to confirm';
    return 'Your vault is locked';
  }

  const currentPin = step === 'confirm' ? confirmPin : pin;

  async function handleDigit(d: string) {
    setError('');
    if (currentPin.length >= DOT_COUNT) return;
    const next = currentPin + d;

    if (step === 'confirm') {
      setConfirmPin(next);
      if (next.length === DOT_COUNT) {
        if (next === pin) {
          setIsCreating(true);
          await createPin(next);
          setIsCreating(false);
        } else {
          shake();
          setError('PINs do not match');
          setTimeout(() => setConfirmPin(''), 600);
        }
      }
    } else if (step === 'create') {
      setPin(next);
      if (next.length === DOT_COUNT) {
        setTimeout(() => setStep('confirm'), 300);
      }
    } else {
      setPin(next);
      if (next.length === DOT_COUNT) {
        const ok = await unlock(next);
        if (!ok) {
          shake();
          setError('Incorrect PIN');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  }

  function handleDelete() {
    setError('');
    if (step === 'confirm') {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={styles.header}>
          <View style={styles.iconRing}>
            <LinearGradient
              colors={['rgba(10,132,255,0.28)', 'rgba(10,132,255,0.08)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.iconRingSpecular} />
            <Ionicons name="lock-closed" size={26} color={Colors.accent} />
          </View>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        <Animated.View style={[styles.dotsRow, dotsStyle]}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <PinDot key={i} filled={i < currentPin.length} />
          ))}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorPlaceholder} />}

        <View style={styles.keypad}>
          {[
            ['1', 'ABC', '2', 'ABC', '3', 'DEF'],
            ['4', 'GHI', '5', 'JKL', '6', 'MNO'],
            ['7', 'PQRS', '8', 'TUV', '9', 'WXYZ'],
          ].map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {[0, 2, 4].map((i) => (
                <KeypadButton
                  key={row[i]}
                  label={row[i]}
                  sub={row[i + 1] !== row[i] ? row[i + 1] : undefined}
                  onPress={() => handleDigit(row[i])}
                />
              ))}
            </View>
          ))}
          <View style={styles.keyRow}>
            <View style={styles.keyEmpty} />
            <KeypadButton label="0" onPress={() => handleDigit('0')} />
            <Pressable style={styles.deleteKey} onPress={handleDelete}>
              <Ionicons name="backspace-outline" size={22} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {step === 'confirm' && (
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              setStep('create');
              setPin('');
              setConfirmPin('');
              setError('');
            }}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
    gap: 10,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  iconRingSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(10,132,255,0.55)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  dotFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  error: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: 'Inter_500Medium',
    height: 20,
    marginBottom: 20,
  },
  errorPlaceholder: {
    height: 20,
    marginBottom: 20,
  },
  keypad: {
    width: '100%',
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  keyOuter: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  key: {
    flex: 1,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  keySpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  keyLabel: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: 'Inter_500Medium',
    lineHeight: 28,
  },
  keySub: {
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    fontFamily: 'Inter_400Regular',
  },
  keyEmpty: {
    flex: 1,
  },
  deleteKey: {
    flex: 1,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    marginTop: 28,
  },
  backText: {
    color: Colors.accent,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
