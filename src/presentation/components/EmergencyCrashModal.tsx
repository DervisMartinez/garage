import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Vibration, 
  Linking, 
  Alert, 
  Platform, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';
import { dispatchEmergencyEmail } from '../../services/emergencyService';
import { supabase } from '../../data/supabaseClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  manualTrigger?: boolean;
}

export const EmergencyCrashModal: React.FC<Props> = ({ visible, onClose, manualTrigger = false }) => {
  const { colors, mode } = useTheme();
  const { myMoto } = useMyMoto();

  const [phase, setPhase] = useState<'countdown' | 'action'>(manualTrigger ? 'action' : 'countdown');
  const [countdown, setCountdown] = useState<number>(15);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  // Estado del despacho automático en segundo plano
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [dispatchMessage, setDispatchMessage] = useState<string>('');

  // Datos vitales del perfil del piloto
  const [pilotName, setPilotName] = useState('Dervis Martinez');
  const [bloodType, setBloodType] = useState('O+');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');

  const countdownTimerRef = useRef<any>(null);
  const hasAutoDispatched = useRef<boolean>(false);

  // Tipografía oficial GARAGE (Montserrat)
  const F = {
    extrabold: 'Montserrat_800ExtraBold',
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  // Paleta de tokens oficiales según DESIGN.md
  const isDark = mode === 'dark';
  const tokens = {
    primary: isDark ? '#4169E1' : '#275FE3',        // Vivid Royal Blue / Motorsport Blue
    secondary: '#00e3fd',                          // Cyan Telemetry
    tertiary: '#00ae78',                           // Motorsport Emerald
    alert: '#ba1a1a',                              // Crimson Warning
    alertContainer: isDark ? 'rgba(186, 26, 26, 0.18)' : 'rgba(186, 26, 26, 0.10)',
    surface: isDark ? '#111319' : '#f5f5f7',
    surfaceCard: isDark ? '#191c21' : '#ffffff',
    surfaceWell: isDark ? '#1d2025' : '#ececf0',
    surfaceHigh: isDark ? '#272a30' : '#e0e0e6',
    outline: '#40485c',
  };

  // Cargar perfil del piloto en caché y sesión de Supabase
  useEffect(() => {
    // 1. Cargar almacenamiento local inmediato
    AsyncStorage.getItem('@user_profile_data').then(cached => {
      if (cached) {
        try {
          const p = JSON.parse(cached);
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          if (fullName) setPilotName(fullName);
          if (p.blood_type) setBloodType(p.blood_type);
          if (p.emergency_contact_phone) setEmergencyPhone(p.emergency_contact_phone);
          if (p.emergency_contact_name) setEmergencyContact(p.emergency_contact_name);
          if (p.emergency_email) setEmergencyEmail(p.emergency_email);
        } catch {}
      }
    });

    // 2. Cargar sesión de usuario en Supabase (datos de registro)
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata || {};
        const fullName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || meta.full_name || meta.name;
        if (fullName) {
          setPilotName(fullName);
        } else if (data.user.email) {
          const emailName = data.user.email.split('@')[0].replace(/[0-9_.-]+/g, ' ').trim();
          if (emailName) {
            setPilotName(emailName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
          }
        }
        if (meta.blood_type) setBloodType(meta.blood_type);
        if (meta.emergency_contact_phone) setEmergencyPhone(meta.emergency_contact_phone);
        if (meta.emergency_contact_name) setEmergencyContact(meta.emergency_contact_name);
        if (meta.emergency_email) setEmergencyEmail(meta.emergency_email);
      }
    });
  }, [visible]);

  const mapsUrl = location 
    ? `https://maps.google.com/?q=${location.lat},${location.lng}` 
    : 'Ubicación GPS no disponible';

  const motoInfo = myMoto 
    ? `${myMoto.brand.toUpperCase()} ${myMoto.model.toUpperCase()} (Placa: ${myMoto.plate || 'S/N'})` 
    : 'Vehículo en Garaje';

  // Obtener ubicación GPS en tiempo real
  const fetchGPSLocation = useCallback(async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      console.warn('Error adquiriendo GPS:', e);
    } finally {
      setLocLoading(false);
    }
  }, []);

  // Función de despacho automático por HTTP
  const triggerAutomatedDispatch = useCallback(async () => {
    if (hasAutoDispatched.current) return;
    hasAutoDispatched.current = true;
    setDispatchStatus('sending');
    setDispatchMessage('Transmitiendo alerta a servidor satelital...');

    const result = await dispatchEmergencyEmail({
      toEmail: emergencyEmail,
      pilotName,
      bloodType,
      motoInfo,
      odometer: myMoto?.currentOdometer || 0,
      location,
      mapsUrl,
      emergencyContact,
      emergencyPhone,
    });

    if (result.success) {
      setDispatchStatus('success');
      setDispatchMessage(`Alerta despachada con éxito a ${emergencyEmail}`);
    } else {
      setDispatchStatus('error');
      setDispatchMessage(result.message || 'Error en transmisión automática');
    }
  }, [emergencyEmail, pilotName, bloodType, motoInfo, myMoto?.currentOdometer, location, mapsUrl, emergencyContact, emergencyPhone]);

  // Manejo del ciclo de vida y conteo de 15 segundos
  useEffect(() => {
    if (!visible) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Vibration.cancel();
      hasAutoDispatched.current = false;
      setDispatchStatus('idle');
      return;
    }

    fetchGPSLocation();

    if (manualTrigger) {
      setPhase('action');
      return;
    }

    setPhase('countdown');
    setCountdown(15);
    hasAutoDispatched.current = false;
    setDispatchStatus('idle');

    // Patrón de vibración táctil
    Vibration.vibrate([0, 600, 400, 600, 400], true);

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          Vibration.cancel();
          setPhase('action');
          // Disparo automático instantáneo al terminar el conteo
          triggerAutomatedDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Vibration.cancel();
    };
  }, [visible, manualTrigger, fetchGPSLocation, triggerAutomatedDispatch]);

  const handleCancelAlert = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    Vibration.cancel();
    onClose();
  };

  const handleForceEmergencyNow = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    Vibration.cancel();
    setPhase('action');
    triggerAutomatedDispatch();
  };

  const makePhoneCall = (number: string) => {
    if (!number) {
      Alert.alert('Sin número registrado', 'Configura el teléfono de emergencia en tu Perfil.');
      return;
    }
    const cleanNumber = number.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Error', 'No se pudo iniciar la llamada telefónica.');
    });
  };

  const sendWhatsAppSOS = () => {
    const activePilot = pilotName && pilotName.trim().length > 0 ? pilotName : 'Dervis Martinez';
    const text = encodeURIComponent(
      `🚨 *[GARAGE SOS] ALERTA DE IMPACTO / AUXILIO EN RUTA*\n\n` +
      `👤 *Piloto:* ${activePilot}\n` +
      `🩸 *Grupo Sanguíneo:* ${bloodType}\n` +
      `🏍️ *Vehículo:* ${motoInfo}\n\n` +
      `📍 *Ubicación GPS Satelital:*\n${mapsUrl}\n\n` +
      `⚠️ *¡El sensor de GARAGE registró un impacto severo (>3.5G)! Por favor comunícate de inmediato con el piloto o los servicios de rescate.*`
    );

    const cleanNumber = emergencyPhone ? emergencyPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanNumber ? `https://wa.me/${cleanNumber}?text=${text}` : `https://wa.me/?text=${text}`;

    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp en el dispositivo.');
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        
        {/* ========================================================= */}
        {/* FASE 1: CONTEO REGRESIVO DE IMPACTO (15 SEGUNDOS)         */}
        {/* ========================================================= */}
        {phase === 'countdown' && (
          <View style={[
            styles.dialogCard, 
            { 
              backgroundColor: tokens.surface, 
              borderColor: tokens.alert 
            }
          ]}>
            
            {/* Indicador de Advertencia de Alta Precisión */}
            <View style={[styles.alarmBadge, { borderColor: tokens.alert, backgroundColor: tokens.alertContainer }]}>
              <MaterialIcons name="warning" size={44} color={tokens.alert} />
            </View>

            <Text style={{ 
              fontFamily: F.extrabold, 
              fontSize: 20, 
              color: colors.onSurface, 
              textAlign: 'center', 
              marginTop: 16,
              letterSpacing: 0.5,
              textTransform: 'uppercase'
            }}>
              IMPACTO SEVERO DETECTADO
            </Text>
            
            <Text style={{ 
              fontFamily: F.medium, 
              fontSize: 12.5, 
              color: colors.onSurfaceVariant, 
              textAlign: 'center', 
              marginTop: 8, 
              paddingHorizontal: 8,
              lineHeight: 18
            }}>
              Telemetría de acelerómetro {'>'}3.5G registrada. Transmitiendo auxilio satelital automático en:
            </Text>

            {/* Dial Numérico de Precisión */}
            <View style={[
              styles.countdownRing, 
              { 
                borderColor: tokens.alert, 
                backgroundColor: tokens.surfaceWell 
              }
            ]}>
              <Text style={{ fontFamily: F.extrabold, fontSize: 54, color: tokens.alert }}>
                {countdown}
              </Text>
              <Text style={{ fontFamily: F.bold, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase' }}>
                SEGUNDOS
              </Text>
            </View>

            {/* Botón de Cancelación (Estoy Bien) - Mínimo 48px */}
            <TouchableOpacity 
              onPress={handleCancelAlert} 
              activeOpacity={0.85}
              style={[styles.primaryActionBtn, { backgroundColor: tokens.tertiary }]}
            >
              <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
              <Text style={{ fontFamily: F.extrabold, fontSize: 14, color: '#FFFFFF', marginLeft: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                ESTOY BIEN (CANCELAR)
              </Text>
            </TouchableOpacity>

            {/* Atajo de Despacho Inmediato */}
            <TouchableOpacity 
              onPress={handleForceEmergencyNow} 
              style={styles.linkTouchTarget}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 13, color: tokens.alert }}>
                  Despachar auxilio de inmediato
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color={tokens.alert} />
              </View>
            </TouchableOpacity>

          </View>
        )}

        {/* ========================================================= */}
        {/* FASE 2: PROTOCOLO ACTIVO DE AUXILIO Y CONTACTOS           */}
        {/* ========================================================= */}
        {phase === 'action' && (
          <View style={[
            styles.dialogCard, 
            { 
              backgroundColor: tokens.surfaceCard, 
              borderColor: tokens.outline, 
              maxHeight: '92%' 
            }
          ]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
              
              {/* Barra Superior del Centro SOS */}
              <View style={styles.headerBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="shield-alert" size={24} color={tokens.alert} />
                  <Text style={{ 
                    fontFamily: F.extrabold, 
                    fontSize: 17, 
                    color: colors.onSurface, 
                    letterSpacing: 0.5, 
                    textTransform: 'uppercase' 
                  }}>
                    CENTRO SOS & RESCATE
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.closeTouchTarget}
                  accessibilityLabel="Cerrar modal de auxilio"
                >
                  <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* Ficha Médica Técnica */}
              <View style={[styles.technicalPill, { backgroundColor: tokens.surfaceWell, borderColor: tokens.outline }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="water" size={18} color={tokens.alert} />
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 13 }}>
                    GRUPO: {bloodType}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="person" size={16} color={tokens.primary} />
                  <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 12 }}>
                    {pilotName}
                  </Text>
                </View>
              </View>

              {/* Recuadro de Telemetría GPS */}
              <View style={[styles.gpsBox, { backgroundColor: tokens.surfaceWell, borderColor: tokens.secondary }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="my-location" size={18} color={tokens.secondary} />
                    <Text style={{ fontFamily: F.bold, color: tokens.secondary, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      TELEMETRÍA GPS EN RUTA
                    </Text>
                  </View>
                  {locLoading && <ActivityIndicator size="small" color={tokens.secondary} />}
                </View>

                <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12, marginTop: 6 }} numberOfLines={2}>
                  {location ? `Lat: ${location.lat.toFixed(5)}  |  Lng: ${location.lng.toFixed(5)}` : 'Sincronizando satélites GPS...'}
                </Text>

                {location && (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(mapsUrl)}
                    style={styles.linkTouchTarget}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialIcons name="open-in-new" size={14} color={tokens.secondary} />
                      <Text style={{ fontFamily: F.bold, color: tokens.secondary, fontSize: 11, textTransform: 'uppercase' }}>
                        Ver en Google Maps
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Banner de Estado de Despacho Automático */}
              <View style={[
                styles.statusBanner, 
                { 
                  backgroundColor: dispatchStatus === 'success' ? 'rgba(0, 174, 120, 0.12)' : (dispatchStatus === 'error' ? tokens.alertContainer : tokens.surfaceWell),
                  borderColor: dispatchStatus === 'success' ? tokens.tertiary : (dispatchStatus === 'error' ? tokens.alert : tokens.primary)
                }
              ]}>
                {dispatchStatus === 'sending' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={tokens.primary} />
                    <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurface }}>
                      TRANSMITIENDO ALERTA AUTOMÁTICA...
                    </Text>
                  </View>
                )}

                {dispatchStatus === 'success' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="check-circle" size={18} color={tokens.tertiary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.bold, fontSize: 11, color: tokens.tertiary, textTransform: 'uppercase' }}>
                        ALERTA TRANSMITIDA EXITOSAMENTE
                      </Text>
                      <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant }}>
                        Destino: {emergencyEmail}
                      </Text>
                    </View>
                  </View>
                )}

                {dispatchStatus === 'error' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="error-outline" size={18} color={tokens.alert} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.bold, fontSize: 11, color: tokens.alert, textTransform: 'uppercase' }}>
                        ERROR AL TRANSMITIR ALERTA
                      </Text>
                      <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant }}>
                        {dispatchMessage || 'Verifica la conexión a internet'}
                      </Text>
                    </View>
                  </View>
                )}

                {dispatchStatus === 'idle' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="send" size={18} color={tokens.primary} />
                    <Text style={{ fontFamily: F.semibold, fontSize: 11, color: colors.onSurface }}>
                      Listo para despachar auxilio por correo
                    </Text>
                  </View>
                )}
              </View>

              {/* Botones de Acción de Alta Eficiencia (Hit Target >= 48px) */}
              <Text style={{ 
                fontFamily: F.bold, 
                color: colors.onSurfaceVariant, 
                fontSize: 10.5, 
                letterSpacing: 0.5, 
                textTransform: 'uppercase', 
                alignSelf: 'flex-start', 
                marginTop: 12, 
                marginBottom: 8 
              }}>
                ACCIONES DIRECTAS DE AUXILIO
              </Text>

              {/* 1. TRANSMISIÓN AUTOMÁTICA POR CORREO */}
              <TouchableOpacity 
                onPress={() => {
                  hasAutoDispatched.current = false;
                  triggerAutomatedDispatch();
                }}
                disabled={dispatchStatus === 'sending'}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: tokens.primary }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <MaterialIcons name="forward-to-inbox" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.extrabold, color: '#FFFFFF', fontSize: 14, textTransform: 'uppercase' }}>
                    {dispatchStatus === 'sending' ? 'TRANSMITIENDO...' : 'DESPACHAR ALERTA POR CORREO'}
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: 'rgba(255, 255, 255, 0.85)', fontSize: 11 }} numberOfLines={1}>
                    {emergencyEmail || 'Configura el correo en Perfil'}
                  </Text>
                </View>
                <MaterialIcons name="bolt" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* 2. LLAMADA AL 911 / 171 */}
              <TouchableOpacity 
                onPress={() => makePhoneCall('911')}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: tokens.alert }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <MaterialIcons name="local-hospital" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.extrabold, color: '#FFFFFF', fontSize: 14, textTransform: 'uppercase' }}>
                    LLAMAR AL 911 / 171
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: 'rgba(255, 255, 255, 0.85)', fontSize: 11 }}>
                    Emergencias Médicas & Tránsito
                  </Text>
                </View>
                <MaterialIcons name="phone" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* 3. LLAMADA AL CONTACTO FAMILIAR */}
              <TouchableOpacity 
                onPress={() => makePhoneCall(emergencyPhone)}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: tokens.surfaceWell, borderColor: tokens.outline, borderWidth: 1 }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: tokens.surfaceCard }]}>
                  <MaterialIcons name="phone-in-talk" size={24} color={tokens.secondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 14, textTransform: 'uppercase' }}>
                    {emergencyContact ? `LLAMAR A ${emergencyContact}` : 'LLAMAR A CONTACTO FAMILIAR'}
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11 }}>
                    {emergencyPhone || 'Configura el número en Perfil'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* 4. TRANSMITIR SOS POR WHATSAPP */}
              <TouchableOpacity 
                onPress={sendWhatsAppSOS}
                activeOpacity={0.85}
                style={[
                  styles.actionCard, 
                  { 
                    backgroundColor: isDark ? 'rgba(0, 174, 120, 0.12)' : 'rgba(0, 174, 120, 0.08)', 
                    borderColor: tokens.tertiary, 
                    borderWidth: 1 
                  }
                ]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 174, 120, 0.2)' }]}>
                  <MaterialCommunityIcons name="whatsapp" size={26} color={tokens.tertiary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 14, textTransform: 'uppercase' }}>
                    TRANSMITIR SOS POR WHATSAPP
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11 }}>
                    Envía ubicación satelital y ficha técnica
                  </Text>
                </View>
                <MaterialIcons name="send" size={18} color={tokens.tertiary} />
              </TouchableOpacity>

              {/* Botón Cerrar */}
              <TouchableOpacity 
                onPress={onClose}
                style={styles.dismissBtn}
              >
                <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 12, textTransform: 'uppercase' }}>
                  Cerrar Asistente SOS
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        )}

      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 25, 0.88)', // Obsidian overlay según DESIGN.md
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  alarmBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  countdownRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52, // Mínimo 48px hit target
    borderRadius: 16,
    elevation: 3,
  },
  linkTouchTarget: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  closeTouchTarget: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  gpsBox: {
    width: '100%',
    borderWidth: 0.8,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  statusBanner: {
    width: '100%',
    borderWidth: 0.8,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    justifyContent: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 52, // Mínimo 48px
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
  },
});
