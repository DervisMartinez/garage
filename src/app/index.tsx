import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useMyMoto } from '@/presentation/context/MotoContext';
import { SetupScreen } from '@/presentation/screens/SetupScreen';
import { MainApp } from '@/presentation/screens/MainApp';
import { AuthScreen } from '@/presentation/screens/AuthScreen';
import { LandingScreen } from '@/presentation/screens/LandingScreen';
import { supabase } from '@/data/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const PreloadScreen = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.preloadContainer}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', transform: [{ scale: pulseAnim }] }}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="engine" size={60} color="#8ca9ff" />
        </View>
      </Animated.View>
      <Animated.Text style={[styles.preloadText, { opacity: fadeAnim }]}>Arrancando motores...</Animated.Text>
    </View>
  );
};

import { isWebPlatform } from '@/presentation/utils/platformMode';

export default function HomeScreen() {
  const { myMoto, isLoaded, isAddingMoto } = useMyMoto();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Mantenemos un mínimo de tiempo para que se aprecie la animación (opcional, 1.5s)
  const [minWaitDone, setMinWaitDone] = useState(false);

  // Estado de navegación inicial para la versión WEB: 'landing' | 'auth' | 'app'
  const [viewState, setViewState] = useState<'landing' | 'auth' | 'app'>('landing');

  const isWeb = isWebPlatform();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        setViewState('app');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setViewState('app');
      } else {
        setViewState('landing');
      }
    });

    setTimeout(() => {
      setMinWaitDone(true);
    }, 1500);

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (authLoading || !isLoaded || !minWaitDone) {
    return <PreloadScreen />;
  }

  // ==========================================
  // MOBILE APP FLOW (Port 8082 / Native iOS / Android):
  // 100% PURA APP MÓVIL SIN ADULTERACIONES NI LANDING WEB
  // ==========================================
  if (!isWeb) {
    if (!session) {
      return <AuthScreen />;
    }
    if (!myMoto || isAddingMoto) {
      return <SetupScreen />;
    }
    return <MainApp />;
  }

  // ==========================================
  // WEB PLATFORM FLOW (Port 8081 / Web domain):
  // Portada de entrada (Landing) -> Acceder -> App Web
  // ==========================================
  if (viewState === 'landing') {
    return (
      <LandingScreen
        isLoggedIn={Boolean(session)}
        onEnter={() => {
          if (session) {
            setViewState('app');
          } else {
            setViewState('auth');
          }
        }}
      />
    );
  }

  if (!session || viewState === 'auth') {
    return (
      <AuthScreen
        onBack={() => setViewState('landing')}
      />
    );
  }

  if (!myMoto || isAddingMoto) {
    return <SetupScreen />;
  }

  return <MainApp />;
}

const styles = StyleSheet.create({
  preloadContainer: {
    flex: 1,
    backgroundColor: '#111319',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1d2025',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4169E1',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10
  },
  preloadText: {
    color: '#c4cce0',
    marginTop: 30,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 1
  }
});
