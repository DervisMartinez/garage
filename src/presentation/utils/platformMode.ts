import { Platform } from 'react-native';

/**
 * Determines if the current execution is the dedicated Web Platform (port 8081 or web production)
 * vs the Mobile Application (port 8082, native iOS/Android, Expo Go).
 * 
 * Strict separation:
 * - Mobile App (port 8082 / native): Never shows web landing screen, never adulterates native bottom bar or mobile dashboard.
 * - Web Platform (port 8081 / web domain): Shows landing page for guests, responsive web navbar, web telemetry hero, no mobile bottom bar.
 */
export const isWebPlatform = (): boolean => {
  // Native iOS / Android is ALWAYS the Mobile Application
  if (Platform.OS !== 'web') {
    return false;
  }

  if (typeof window !== 'undefined' && window.location) {
    const port = window.location.port;

    // Port 8082 is explicitly running the Mobile App instance
    if (port === '8082') {
      return false;
    }

    // Query parameter override: ?app=mobile forces mobile app, ?app=web forces web
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const appParam = searchParams.get('app') || searchParams.get('mode');
      if (appParam === 'mobile') {
        return false;
      }
      if (appParam === 'web') {
        return true;
      }
    }

    // Port 8081 is the dedicated Web portal
    if (port === '8081') {
      return true;
    }
  }

  // Default web environments (like web dist/production)
  return true;
};
