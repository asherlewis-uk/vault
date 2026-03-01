import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMedia } from '@/contexts/MediaContext';
import StarRating from '@/components/StarRating';
import TagPill from '@/components/TagPill';
import { Colors } from '@/constants/colors';
import { fetchMetadata } from '@/lib/utils';

type Tab = 'single' | 'bulk';

export default function AddScreen() {
  const { tags, addItem, addTag, bulkImport } = useMedia();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('single');

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  async function handleFetch() {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError('');
    try {
      const meta = await fetchMetadata(url.trim());
      setTitle(meta.title);
      setThumbnail(meta.thumbnail);
    } catch {
      setFetchError('Could not fetch metadata');
    }
    setFetching(false);
  }

  async function handleSave() {
    if (!url.trim() || !title.trim()) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addItem({
      url: url.trim(),
      title: title.trim(),
      thumbnail,
      tags: selectedTags,
      rating,
      isFavorite: false,
      notes: notes.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  async function handleBulkSave() {
    setBulkSaving(true);
    setBulkResult(null);
    try {
      let count = 0;
      const lines = bulkText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('http'));

      for (const line of lines) {
        try {
          const meta = await fetchMetadata(line);
          await addItem({
            url: line,
            title: meta.title,
            thumbnail: meta.thumbnail,
            tags: [],
            rating: 0,
            isFavorite: false,
            notes: '',
          });
          count++;
        } catch {}
      }
      setBulkResult(`Added ${count} of ${lines.length} items`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setBulkResult('Import failed. Check format.');
    }
    setBulkSaving(false);
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  const canSave = url.trim().length > 0 && title.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingBottom: bottomPad }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add to Vault</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          {(['single', 'bulk'] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'single' ? 'Single URL' : 'Bulk Import'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'single' ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>URL</Text>
                <View style={styles.urlRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Paste URL here..."
                    placeholderTextColor={Colors.textTertiary}
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <Pressable
                    style={[styles.fetchBtn, (!url.trim() || fetching) && { opacity: 0.5 }]}
                    onPress={handleFetch}
                    disabled={!url.trim() || fetching}
                  >
                    {fetching ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="search" size={18} color="white" />
                    )}
                  </Pressable>
                </View>
                {fetchError ? <Text style={styles.error}>{fetchError}</Text> : null}
              </View>

              {thumbnail ? (
                <View style={styles.thumbPreview}>
                  <Image source={{ uri: thumbnail }} style={styles.thumbImg} contentFit="cover" />
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter title..."
                  placeholderTextColor={Colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Rating</Text>
                <StarRating rating={rating} onChange={setRating} size={28} />
              </View>

              {tags.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.label}>Tags</Text>
                  <View style={styles.tagGrid}>
                    {tags.map((tag) => (
                      <TagPill
                        key={tag.id}
                        tag={tag}
                        active={selectedTags.includes(tag.id)}
                        onPress={() => toggleTag(tag.id)}
                        size="md"
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add personal notes..."
                  placeholderTextColor={Colors.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}
                onPress={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.saveBtnText}>Save to Vault</Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.bulkHint}>
                Paste one URL per line. YouTube, Vimeo, and other links are supported.
              </Text>
              <TextInput
                style={[styles.input, styles.bulkInput]}
                placeholder={'https://youtube.com/watch?v=...\nhttps://vimeo.com/...'}
                placeholderTextColor={Colors.textTertiary}
                value={bulkText}
                onChangeText={setBulkText}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {bulkResult ? <Text style={styles.bulkResult}>{bulkResult}</Text> : null}
              <Pressable
                style={[styles.saveBtn, (!bulkText.trim() || bulkSaving) && { opacity: 0.4 }]}
                onPress={handleBulkSave}
                disabled={!bulkText.trim() || bulkSaving}
              >
                {bulkSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={20} color="white" />
                    <Text style={styles.saveBtnText}>Import URLs</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgFloating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  tabTextActive: {
    color: 'white',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  urlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fetchBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'Inter_400Regular',
  },
  thumbPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    width: '100%',
    backgroundColor: Colors.bgFloating,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
  },
  bulkHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  bulkInput: {
    height: 200,
    paddingTop: 12,
  },
  bulkResult: {
    fontSize: 14,
    color: Colors.success,
    fontFamily: 'Inter_500Medium',
  },
});
