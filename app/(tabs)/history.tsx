import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMedia } from "@/contexts/MediaContext";
import { Colors } from "@/constants/colors";
import ColorBends from "@/components/ColorBends";
import { formatDate, getSourceLabel } from "@/lib/utils";
import { HistoryEntry } from "@/types";

function HistoryItem({
  entry,
  onPlay,
}: {
  entry: HistoryEntry;
  onPlay: () => void;
}) {
  const item = useMedia().items.find((i) => i.id === entry.mediaId);
  const source = item ? getSourceLabel(item.url) : "Unknown";

  return (
    <Pressable
      style={({ pressed }) => [styles.histItem, pressed && { opacity: 0.75 }]}
      onPress={onPlay}
    >
      <View style={styles.histIcon}>
        <Ionicons name="play-circle-outline" size={20} color={Colors.accent} />
      </View>
      <View style={styles.histInfo}>
        <Text style={styles.histTitle} numberOfLines={1}>
          {entry.mediaTitle}
        </Text>
        <Text style={styles.histMeta}>
          {source} · {formatDate(entry.viewedAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { history, items, clearHistory } = useMedia();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleClear() {
    Alert.alert(
      "Clear History",
      "Remove all watch history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearHistory },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ColorBends
        rotation={45}
        autoRotate={0.05}
        speed={0.4}
        colors={["#0a84ff", "#bf5af2", "#ff375f", "#30d158", "#ffd60a"]}
        transparent={true}
        scale={1}
        frequency={1.2}
        warpStrength={1.5}
        mouseInfluence={1.5}
        parallax={0.5}
        noise={0.1}
        style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.count}>{history.length} entries</Text>
        </View>
        {history.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Items you watch will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <HistoryItem
              entry={item}
              onPlay={() => {
                const media = items.find((i) => i.id === item.mediaId);
                if (media)
                  router.push({
                    pathname: "/player/[id]",
                    params: { id: media.id },
                  });
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.2)",
  },
  clearText: {
    color: Colors.danger,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    backgroundColor: "transparent",
  },
  histItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  histIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  histInfo: {
    flex: 1,
    gap: 3,
  },
  histTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
  histMeta: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
    backgroundColor: "transparent",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
});
