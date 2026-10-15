import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, LogBox, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { 
  useFonts, 
  Montserrat_400Regular, 
  Montserrat_500Medium, 
  Montserrat_600SemiBold, 
  Montserrat_700Bold, 
  Montserrat_800ExtraBold 
} from '@expo-google-fonts/montserrat';
import { MotoProvider } from '@/presentation/context/MotoContext';
import { ThemeProvider, useTheme } from '@/presentation/context/ThemeContext';

// On native, prevent splash auto-hide until assets are loaded.
// On web, avoiding this prevents timeout freezes and hydration conflicts.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

// Intercept benign FontObserver timeout rejections on Web so they never crash the UI
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (reasonMsg.includes('12000ms') || reasonMsg.includes('timeout exceeded')) {
      event.preventDefault();
    }
  });
}

LogBox.ignoreAllLogs(); // Silencia advertencias de debugging en pantalla

function InnerLayout() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  // Safety fallback for Web: if fonts take more than 1.5s or network is throttled, don't block the UI
  const [fallbackReady, setFallbackReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        setFallbackReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || fallbackReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fallbackReady]);

  // If fonts are not ready and fallback has not elapsed, wait
  if (!fontsLoaded && !fontError && !fallbackReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <MotoProvider>
        <InnerLayout />
      </MotoProvider>
    </ThemeProvider>
  );
}
