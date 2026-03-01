import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { View } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MediaProvider } from '@/contexts/MediaContext';
import AuthGate from '@/components/AuthGate';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading, isUnlocked } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  if (!isUnlocked) {
    return <AuthGate />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'ios',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: Colors.bgFloating },
        }}
      />
      <Stack.Screen
        name="player/[id]"
        options={{
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.95],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: Colors.bgFloating },
        }}
      />
      <Stack.Screen
        name="tags"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.85],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: Colors.bgFloating },
        }}
      />
      <Stack.Screen
        name="change-pin"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.85],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: Colors.bgFloating },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <MediaProvider>
                <RootLayoutNav />
              </MediaProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
