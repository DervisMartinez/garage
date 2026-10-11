import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { MotoProvider } from '@/presentation/context/MotoContext';
import { ThemeProvider, useTheme } from '@/presentation/context/ThemeContext';

SplashScreen.preventAutoHideAsync();
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
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  if (fontsLoaded) {
    SplashScreen.hideAsync();
  }

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <MotoProvider>
        <InnerLayout />
      </MotoProvider>
    </ThemeProvider>
  );
}
