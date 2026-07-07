import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDb } from '@/data/db';
import { isSeeded, seed } from '@/data/seed';
import { useSettings } from '@/stores/appStore';
import { useDaily } from '@/stores/dailyStore';
import { useTravel } from '@/stores/travelStore';
import { useWork } from '@/stores/workStore';
import { ThemeProvider } from '@/theme/ThemeContext';
import { ToastProvider } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync();

// Synchronous, once, before first render: schema + demo seed + settings.
initDb();
if (!isSeeded()) seed();
useSettings.getState().hydrate();
useDaily.getState().load();
useTravel.getState().load();
useWork.getState().load();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
