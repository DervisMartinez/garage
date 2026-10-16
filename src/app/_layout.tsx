import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (fontsLoaded || fontError || Platform.OS === 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError && Platform.OS !== 'web') {
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
