import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
        />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites">
        <Icon sf={{ default: "heart", selected: "heart.fill" }} />
        <Label>Favorites</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf={{ default: "clock", selected: "clock.fill" }} />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function IslandBackground() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  return (
    <View style={StyleSheet.absoluteFill}>
      {isIOS || isWeb ? (
        <BlurView style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={islandStyles.specularLine} />
    </View>
  );
}

function ClassicTabLayout() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            bottom: bottomOffset + 16,
            left: 24,
            right: 24,
            height: 62,
            borderTopWidth: 0,
            elevation: 0,
            overflow: "hidden",
            borderWidth: 1,
          },
          tabBarBackground: () => <IslandBackground />,
          tabBarItemStyle: {
            paddingBottom: 0,
            paddingTop: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[
                  islandStyles.tabItem,
                  focused && islandStyles.tabItemActive,
                ]}
              >
                <Ionicons
                  name={focused ? "grid" : "grid-outline"}
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[
                  islandStyles.tabItem,
                  focused && islandStyles.tabItemActive,
                ]}
              >
                <Ionicons
                  name={focused ? "heart" : "heart-outline"}
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[
                  islandStyles.tabItem,
                  focused && islandStyles.tabItemActive,
                ]}
              >
                <Ionicons
                  name={focused ? "time" : "time-outline"}
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[
                  islandStyles.tabItem,
                  focused && islandStyles.tabItemActive,
                ]}
              >
                <Ionicons
                  name={focused ? "settings" : "settings-outline"}
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const islandStyles = StyleSheet.create({
  specularLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabItem: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemActive: {},
});

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
