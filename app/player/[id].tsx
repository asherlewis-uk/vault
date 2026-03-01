import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMedia } from '@/contexts/MediaContext';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/StarRating';
import TagPill from '@/components/TagPill';
import { Colors } from '@/constants/colors';
import { getEmbedUrl, getSourceLabel } from '@/lib/utils';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch {}
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, tags, updateItem, recordView } = useMedia();
  const { updateActivity } = useAuth();
  const insets = useSafeAreaInsets();
  const [webviewLoading, setWebviewLoading] = useState(true);

  const item = items.find((i) => i.id === id);

  useEffect(() => {
    if (item) {
      recordView(item.id, item.title);
      updateActivity();
    }
  }, [id]);

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const embedUrl = getEmbedUrl(item.url);
  const source = getSourceLabel(item.url);
  const itemTags = tags.filter((t) => item.tags.includes(t.id));

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.sourceLabel} numberOfLines={1}>{source}</Text>
        <Pressable
          onPress={() => {
            updateItem(item.id, { isFavorite: !item.isFavorite });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.favBtn}
        >
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={item.isFavorite ? Colors.danger : Colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.player}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : null}
            <View style={styles.webFallbackOverlay}>
              <Pressable
                style={styles.openBtn}
                onPress={() => {
                  if (typeof window !== 'undefined') window.open(item.url, '_blank');
                }}
              >
                <Ionicons name="open-outline" size={18} color="white" />
                <Text style={styles.openBtnText}>Open in Browser</Text>
              </Pressable>
            </View>
          </View>
        ) : WebView ? (
          <>
            {webviewLoading && (
              <View style={styles.webviewLoader}>
                <ActivityIndicator size="large" color={Colors.accent} />
              </View>
            )}
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webview}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={() => setWebviewLoading(false)}
            />
          </>
        ) : (
          <View style={styles.webFallback}>
            <Text style={styles.noPlayerText}>Player not available</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.meta, { paddingBottom: bottomPad + 20 }]}>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="eye-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaChipText}>{item.viewCount} views</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="link-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaChipText}>{source}</Text>
          </View>
        </View>

        <StarRating
          rating={item.rating}
          onChange={(r) => updateItem(item.id, { rating: r })}
          size={24}
        />

        {itemTags.length > 0 && (
          <View style={styles.tagRow}>
            {itemTags.map((tag) => (
              <TagPill key={tag.id} tag={tag} size="md" />
            ))}
          </View>
        )}

        {item.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.editBtn}
          onPress={() => {
            router.back();
            setTimeout(() => router.push({ pathname: '/edit/[id]', params: { id: item.id } }), 50);
          }}
        >
          <Ionicons name="pencil-outline" size={16} color={Colors.accent} />
          <Text style={styles.editBtnText}>Edit Item</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  favBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  webFallback: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  openBtnText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  noPlayerText: {
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  meta: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.glass,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  metaChipText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  notesBox: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 6,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.accentDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  editBtnText: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    gap: 12,
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  backLink: {
    color: Colors.accent,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
