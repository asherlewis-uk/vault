import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMedia } from '@/contexts/MediaContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  iconColor,
  label,
  sublabel,
  onPress,
  danger,
  rightContent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  danger?: boolean;
  rightContent?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: Colors.glassHover }]}
      onPress={onPress}
      disabled={!onPress && !rightContent}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? Colors.accent) + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? Colors.accent} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {rightContent ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} /> : null)}
    </Pressable>
  );
}

const TIMEOUT_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
];

export default function SettingsScreen() {
  const { items, tags, history, clearHistory, exportData, importData, nukeAll } = useMedia();
  const { lock, idleTimeout, setIdleTimeout, hasPin } = useAuth();
  const insets = useSafeAreaInsets();
  const [showTimeoutPicker, setShowTimeoutPicker] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleExport() {
    const json = exportData();
    if (Platform.OS === 'web') {
      Alert.alert('Export Data', 'Copy the JSON below to back up your vault.', [
        { text: 'OK' },
      ]);
    } else {
      Share.share({ message: json, title: 'Private Vault Export' });
    }
  }

  function handleClearHistory() {
    Alert.alert('Clear History', 'Remove all watch history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  }

  function handleNuke() {
    Alert.alert(
      'Delete Everything',
      'This will permanently delete ALL media, tags, and history from your vault. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await nukeAll();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }

  function handleLock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lock();
  }

  const currentTimeout = TIMEOUT_OPTIONS.find((o) => o.value === idleTimeout) ?? TIMEOUT_OPTIONS[2];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Items', value: items.length },
            { label: 'Tags', value: tags.length },
            { label: 'Watched', value: history.length },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Section title="Security">
          <Row
            icon="key-outline"
            label={hasPin ? 'Change PIN' : 'Set PIN'}
            onPress={() => router.push('/change-pin')}
          />
          <View style={styles.rowDivider} />
          <Row
            icon="timer-outline"
            iconColor={Colors.purple}
            label="Auto-lock"
            sublabel={currentTimeout.label}
            onPress={() => setShowTimeoutPicker(!showTimeoutPicker)}
          />
          {showTimeoutPicker && (
            <View style={styles.timeoutPicker}>
              {TIMEOUT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.timeoutOpt,
                    opt.value === idleTimeout && styles.timeoutOptActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    setIdleTimeout(opt.value);
                    setShowTimeoutPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeoutOptText,
                      opt.value === idleTimeout && { color: Colors.accent },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.value === idleTimeout && (
                    <Ionicons name="checkmark" size={16} color={Colors.accent} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.rowDivider} />
          <Row icon="lock-closed-outline" iconColor={Colors.danger} label="Lock Vault" onPress={handleLock} />
        </Section>

        <Section title="Library">
          <Row
            icon="pricetags-outline"
            iconColor={Colors.success}
            label="Manage Tags"
            sublabel={`${tags.length} tags`}
            onPress={() => router.push('/tags')}
          />
        </Section>

        <Section title="Data">
          <Row
            icon="cloud-upload-outline"
            iconColor={Colors.accent}
            label="Export Vault"
            sublabel={`${items.length} items`}
            onPress={handleExport}
          />
          <View style={styles.rowDivider} />
          <Row
            icon="time-outline"
            iconColor={Colors.warning}
            label="Clear History"
            sublabel={`${history.length} entries`}
            onPress={handleClearHistory}
          />
        </Section>

        <Section title="Danger Zone">
          <Row
            icon="nuclear-outline"
            iconColor={Colors.danger}
            label="Nuke Everything"
            sublabel="Permanently delete all data"
            onPress={handleNuke}
            danger
          />
        </Section>

        <Text style={styles.version}>Private Vault · v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 4,
  },
  headerSection: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: 'Inter_500Medium',
  },
  rowSublabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginLeft: 60,
  },
  timeoutPicker: {
    backgroundColor: Colors.bgElevated,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  timeoutOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  timeoutOptActive: {
    backgroundColor: Colors.accentDim,
  },
  timeoutOptText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Inter_400Regular',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
});
