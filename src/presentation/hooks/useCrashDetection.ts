import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@garage_crash_detection_enabled';
const CRASH_G_THRESHOLD = 3.5; // Umbral de impacto en fuerza G

export const useCrashDetection = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [crashTriggered, setCrashTriggered] = useState<boolean>(false);
  const [isManualTrigger, setIsManualTrigger] = useState<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const lastTriggerTime = useRef<number>(0);

  // Load preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved !== null) {
        setIsEnabled(saved === 'true');
      }
    });
  }, []);

  const toggleCrashDetection = async () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    await AsyncStorage.setItem(STORAGE_KEY, nextState.toString());
  };

  useEffect(() => {
    if (!isEnabled || Platform.OS === 'web') {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      return;
    }

    Accelerometer.setUpdateInterval(100); // 10Hz sampling

    subscriptionRef.current = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const totalG = Math.sqrt(x * x + y * y + z * z);

      const now = Date.now();
      // Si supera el umbral de 3.5G y han pasado más de 10 seg desde la última alerta
      if (totalG >= CRASH_G_THRESHOLD && now - lastTriggerTime.current > 10000) {
        lastTriggerTime.current = now;
        setIsManualTrigger(false);
        setCrashTriggered(true);
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [isEnabled]);

  const triggerManualSOS = () => {
    setIsManualTrigger(true);
    setCrashTriggered(true);
  };

  const simulateTestCrash = () => {
    setIsManualTrigger(false);
    setCrashTriggered(true);
  };

  const dismissCrashAlert = () => {
    setCrashTriggered(false);
    setIsManualTrigger(false);
  };

  return {
    isEnabled,
    toggleCrashDetection,
    crashTriggered,
    isManualTrigger,
    triggerManualSOS,
    simulateTestCrash,
    dismissCrashAlert,
  };
};
