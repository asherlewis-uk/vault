import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMedia } from '@/contexts/MediaContext';
import { TAG_COLORS } from '@/lib/utils';
import { Tag } from '@/types';

function TagRow({ tag, itemCount, onEdit, onDelete }: { tag: Tag; itemCount: number; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.tagRow}>
      <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
      <View style={styles.tagInfo}>
        <Text style={styles.tagName}>{tag.name}</Text>
        <Text style={styles.tagCount}>{itemCount} items</Text>
      </View>
      <View style={styles.tagActions}>
        <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
          <Ionicons name="pencil-outline" size={16} />
        </Pressable>
        <Pressable onPress={onDelete} style={styles.actionBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

export default function TagsScreen() {
  const { tags, items, addTag, updateTag, deleteTag } = useMedia();
  const insets = useSafeAreaInsets();
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function getItemCount(tagId: string) {
    return items.filter((item) => item.tags.includes(tagId)).length;
  }

  async function handleSave() {
    const name = newName.trim();
    if (!name) return;
    if (editingTag) {
      await updateTag(editingTag.id, { name, color: selectedColor });
      setEditingTag(null);
    } else {
      await addTag({ name, color: selectedColor });
    }
    setNewName('');
    setSelectedColor(TAG_COLORS[0]);
  }

  function handleEdit(tag: Tag) {
    setEditingTag(tag);
    setNewName(tag.name);
    setSelectedColor(tag.color);
  }

  function handleDelete(tag: Tag) {
    Alert.alert(
      'Delete Tag',
      `Remove "${tag.name}" from all items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTag(tag.id) },
      ]
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Tags</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} />
        </Pressable>
      </View>

      <View style={styles.createBox}>
        <Text style={styles.createTitle}>{editingTag ? 'Edit Tag' : 'New Tag'}</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="Tag name..."
          value={newName}
          onChangeText={setNewName}
        />
        <View style={styles.colorRow}>
          {TAG_COLORS.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
        <Pressable
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={!newName.trim()}
        >
          <Text style={styles.saveBtnText}>{editingTag ? 'Update Tag' : 'Create Tag'}</Text>
        </Pressable>
        {editingTag && (
          <Pressable
            onPress={() => { setEditingTag(null); setNewName(''); setSelectedColor(TAG_COLORS[0]); }}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={tags}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pricetags-outline" size={36} />
            <Text style={styles.emptyText}>No tags yet. Create one above.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TagRow
            tag={item}
            itemCount={getItemCount(item.id)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {},
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBox: {
    marginHorizontal: 20,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  createTitle: {},
  nameInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorDot: {
    width: 28,
    height: 28,
  },
  colorDotSelected: {
    transform: [{ scale: 1.15 }],
  },
  saveBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {},
  cancelBtn: {
    alignItems: 'center',
  },
  cancelText: {},
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  tagDot: {
    width: 12,
    height: 12,
  },
  tagInfo: {
    flex: 1,
    gap: 2,
  },
  tagName: {},
  tagCount: {},
  tagActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {},
});
