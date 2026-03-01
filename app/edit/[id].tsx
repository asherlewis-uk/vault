import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMedia } from '@/contexts/MediaContext';
import StarRating from '@/components/StarRating';
import TagPill from '@/components/TagPill';
import { Colors } from '@/constants/colors';

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, tags, updateItem, deleteItem } = useMedia();
  const insets = useSafeAreaInsets();

  const item = items.find((i) => i.id === id);

  const [title, setTitle] = useState(item?.title ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [rating, setRating] = useState(item?.rating ?? 0);
  const [selectedTags, setSelectedTags] = useState<string[]>(item?.tags ?? []);
  const [thumbnail, setThumbnail] = useState(item?.thumbnail ?? '');

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
      </View>
    );
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSave() {
    await updateItem(item.id, {
      title: title.trim() || item.title,
      notes: notes.trim(),
      rating,
      tags: selectedTags,
      thumbnail: thumbnail.trim() || null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Item', `Remove "${item.title}" from your vault?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingBottom: bottomPad }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Item</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title..."
              placeholderTextColor={Colors.textTertiary}
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
              value={notes}
              onChangeText={setNotes}
              placeholder="Add personal notes..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Thumbnail URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={thumbnail}
              onChangeText={setThumbnail}
              placeholder="https://..."
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.urlBox}>
            <Ionicons name="link-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.urlText} numberOfLines={1}>{item.url}</Text>
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Pressable>
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgFloating,
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dangerDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
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
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
  },
});
