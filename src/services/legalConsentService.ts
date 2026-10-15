import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../data/supabaseClient';
import { LEGAL_CONSTANTS } from '../data/legal/legalConstants';
import { ENV } from '../constants/config';

export interface ConsentRecord {
  id: string;
  email: string;
  userId?: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: string;
  termsVersion: string;
  privacyAccepted: boolean;
  privacyAcceptedAt: string;
  privacyVersion: string;
  cookiesAcknowledged: boolean;
  cookiesVersion: string;
  consentMethod: string;
  acceptanceContext: string;
  ipAddress: string;
  deviceInfo: {
    os: string;
    osVersion: string | number;
    brand: string | null;
    modelName: string | null;
    deviceName: string | null;
    isDevice: boolean;
  };
  recordedAt: string;
}

const STORAGE_KEY_AUDIT_LOG = '@garage_legal_consent_audit';
const STORAGE_KEY_LATEST_CONSENT = '@garage_latest_legal_consent';

/**
 * Obtiene la dirección IP pública del usuario con timeout controlado.
 * Si falla la red, retorna un identificador seguro indicativo.
 */
async function fetchPublicIp(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    
    const ipEndpoint = ENV.IP_LOOKUP_URL || 'https://api.ipify.org?format=json';
    const res = await fetch(ipEndpoint, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.ip) return data.ip;
    }
  } catch (e) {
    // Falla silenciosa si no hay internet o timeout
  }
  return Platform.OS === 'web' ? 'web_client_direct' : 'mobile_client_sandbox';
}

/**
 * Registra el consentimiento legal explícito y separado del usuario.
 * Guarda en:
 * 1. AsyncStorage local (historial de auditoría completo y último consentimiento).
 * 2. Supabase tabla `legal_consents` (si está creada y disponible).
 * 3. Retorna el registro para que pueda incluirse en user_metadata de Supabase Auth.
 */
export async function recordLegalConsent(params: {
  email: string;
  userId?: string | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  cookiesAcknowledged?: boolean;
  acceptanceContext?: string;
}): Promise<ConsentRecord> {
  const nowIso = new Date().toISOString();
  const ip = await fetchPublicIp();

  let brand: string | null = null;
  let modelName: string | null = null;
  let deviceName: string | null = null;
  let isDevice = true;

  try {
    brand = Device.brand;
    modelName = Device.modelName;
    deviceName = Device.deviceName;
    isDevice = Device.isDevice;
  } catch (err) {
    // Fallback defensivo
    brand = Platform.OS;
    modelName = Platform.select({ ios: 'iPhone/iPad', android: 'Android Device', default: 'Web Browser' });
  }

  const record: ConsentRecord = {
    id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: params.email.trim().toLowerCase(),
    userId: params.userId || null,
    termsAccepted: params.termsAccepted,
    termsAcceptedAt: nowIso,
    termsVersion: LEGAL_CONSTANTS.CURRENT_TERMS_VERSION,
    privacyAccepted: params.privacyAccepted,
    privacyAcceptedAt: nowIso,
    privacyVersion: LEGAL_CONSTANTS.CURRENT_PRIVACY_VERSION,
    cookiesAcknowledged: params.cookiesAcknowledged ?? true,
    cookiesVersion: LEGAL_CONSTANTS.CURRENT_COOKIES_VERSION,
    consentMethod: LEGAL_CONSTANTS.CONSENT_METHOD_DEFAULT,
    acceptanceContext: params.acceptanceContext || 'auth_registration_screen',
    ipAddress: ip,
    deviceInfo: {
      os: Platform.OS,
      osVersion: Platform.Version,
      brand,
      modelName,
      deviceName,
      isDevice,
    },
    recordedAt: nowIso,
  };

  // 1. Guardar en almacenamiento local inmediato
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LATEST_CONSENT, JSON.stringify(record));

    const existingAuditRaw = await AsyncStorage.getItem(STORAGE_KEY_AUDIT_LOG);
    let auditList: ConsentRecord[] = [];
    if (existingAuditRaw) {
      try {
        auditList = JSON.parse(existingAuditRaw);
      } catch (e) {
        auditList = [];
      }
    }
    auditList.push(record);
    await AsyncStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify(auditList));
  } catch (storageErr) {
    console.warn('[legalConsentService] Error guardando auditoría local:', storageErr);
  }

  // 2. Intentar guardar en tabla remota Supabase (si existe la tabla)
  try {
    await supabase.from('legal_consents').insert({
      email: record.email,
      user_id: record.userId || null,
      terms_accepted: record.termsAccepted,
      terms_version: record.termsVersion,
      terms_accepted_at: record.termsAcceptedAt,
      privacy_accepted: record.privacyAccepted,
      privacy_version: record.privacyVersion,
      privacy_accepted_at: record.privacyAcceptedAt,
      cookies_acknowledged: record.cookiesAcknowledged,
      cookies_version: record.cookiesVersion,
      acceptance_context: record.acceptanceContext,
      consent_method: record.consentMethod,
      ip_address: record.ipAddress,
      device_info: record.deviceInfo,
      created_at: record.recordedAt,
    });
  } catch (supabaseErr) {
    // No bloqueamos al usuario si la tabla aún no fue creada en la nube
    console.log('[legalConsentService] Supabase insert notice (ignorable si tabla no creada aún):', supabaseErr);
  }

  return record;
}

/**
 * Obtiene el último registro de consentimiento guardado localmente
 */
export async function getLatestConsent(): Promise<ConsentRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LATEST_CONSENT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[legalConsentService] Error leyendo último consentimiento:', e);
  }
  return null;
}

/**
 * Obtiene todo el historial de consentimientos registrados en este dispositivo
 */
export async function getConsentHistory(): Promise<ConsentRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUDIT_LOG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[legalConsentService] Error leyendo historial de consentimientos:', e);
  }
  return [];
}
