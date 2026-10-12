import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView 
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';

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

  // Profile emergency data
  const [pilotName, setPilotName] = useState('Piloto GARAGE');
  const [bloodType, setBloodType] = useState('O+');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');

  const countdownTimerRef = useRef<any>(null);

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  // Load emergency profile contacts
  useEffect(() => {
    AsyncStorage.getItem('@user_profile_data').then(cached => {
      if (cached) {
        try {
          const p = JSON.parse(cached);
          if (p.first_name || p.last_name) setPilotName(`${p.first_name || ''} ${p.last_name || ''}`.trim());
          if (p.blood_type) setBloodType(p.blood_type);
          if (p.emergency_contact_phone) setEmergencyPhone(p.emergency_contact_phone);
          if (p.emergency_contact_name) setEmergencyContact(p.emergency_contact_name);
          if (p.emergency_email) setEmergencyEmail(p.emergency_email);
        } catch {}
      }
    });
  }, [visible]);

  // Handle countdown & vibration
  useEffect(() => {
    if (!visible) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Vibration.cancel();
      return;
    }

    // Fetch GPS location in background immediately
    fetchGPSLocation();

    if (manualTrigger) {
      setPhase('action');
      return;
    }

    setPhase('countdown');
    setCountdown(15);

    // Vibration pattern: Vibrate 600ms, pause 400ms repeatedly
    Vibration.vibrate([0, 600, 400, 600, 400], true);

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          Vibration.cancel();
          setPhase('action');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Vibration.cancel();
    };
  }, [visible, manualTrigger]);

  const fetchGPSLocation = async () => {
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
      console.warn('GPS location error:', e);
    } finally {
      setLocLoading(false);
    }
  };

  const handleCancelAlert = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    Vibration.cancel();
    onClose();
  };

  const mapsUrl = location 
    ? `https://maps.google.com/?q=${location.lat},${location.lng}` 
    : 'Ubicación GPS no disponible';

  const makePhoneCall = (number: string) => {
    if (!number) {
      Alert.alert('Sin número', 'Configura el teléfono de emergencia en tu Perfil.');
      return;
    }
    const cleanNumber = number.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Error', 'No se pudo iniciar la llamada telefónica.');
    });
  };

  const sendEmergencyEmail = () => {
    const targetEmail = emergencyEmail || '';
    if (!targetEmail) {
      Alert.alert(
        'Correo no configurado',
        'Por favor ingresa primero el Correo Familiar Designado en la pestaña Perfil para enviar la alerta.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    const motoInfo = myMoto 
      ? `${myMoto.brand.toUpperCase()} ${myMoto.model.toUpperCase()} • Placa: ${myMoto.plate || 'S/N'}` 
      : 'Vehículo en Garaje';
    
    const subject = encodeURIComponent(`🚨 [GARAGE SOS] ALERTA DE ACCIDENTE / AUXILIO - Piloto: ${pilotName}`);
    
    const emailBody = 
`=========================================
      🛡️ GARAGE TELEMETRY & RESCUE 🛡️
   ALERTA DE EMERGENCIA & AUXILIO EN RUTA
=========================================

⚠️ ATENCIÓN: El sistema GARAGE detectó un impacto severo o desaceleración brusca (>3.5G) asociada al piloto registrado.

👤 DATOS VITALES DEL PILOTO:
-----------------------------------------
• Nombre del Piloto: ${pilotName}
• Tipo de Sangre: ${bloodType}
• Contacto Familiar Registrado: ${emergencyContact || 'Familiar'}
• Teléfono de Emergencia: ${emergencyPhone || 'No especificado'}

🏍️ VEHÍCULO EN RUTA:
-----------------------------------------
• Modelo: ${motoInfo}
• Odómetro Actual: ${myMoto?.currentOdometer || 0} km

📍 UBICACIÓN GPS EN TIEMPO REAL:
-----------------------------------------
${location ? `Coordenadas: Lat ${location.lat.toFixed(5)}, Lng ${location.lng.toFixed(5)}` : 'Calculando señal GPS satelital...'}

🗺️ VER UBICACIÓN EXACTA EN GOOGLE MAPS:
${mapsUrl}

-----------------------------------------
📞 ACCIONES RECOMENDADAS:
1. Intente contactar de inmediato al piloto a su teléfono móvil.
2. Si no responde, comuníquese con el 911 / 171 indicando las coordenadas GPS proporcionadas arriba.
3. Comparta la ficha médica (Tipo de Sangre: ${bloodType}) con los servicios de paramédicos o rescate.

=========================================
Enviado automáticamente por GARAGE APP
Tu Garaje Inteligente en Ruta
=========================================`;

    const encodedBody = encodeURIComponent(emailBody);

    if (Platform.OS === 'web') {
      // En la web (navegador), abrir directamente la ventana de redacción de Gmail o cliente de correo
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${subject}&body=${encodedBody}`;
      window.open(gmailUrl, '_blank');
    } else {
      Linking.openURL(`mailto:${targetEmail}?subject=${subject}&body=${encodedBody}`).catch(() => {
        Alert.alert('Error', 'No se pudo abrir el gestor de correo en tu dispositivo.');
      });
    }
  };

  const sendWhatsAppSOS = () => {
    const motoInfo = myMoto ? `${myMoto.brand} ${myMoto.model} (Placa: ${myMoto.plate || 'S/N'})` : 'Vehículo';
    const text = encodeURIComponent(
      `🚨 *ALERTA SOS - POSIBLE ACCIDENTE EN MOTO*\n\n` +
      `Piloto: *${pilotName}*\n` +
      `Tipo de Sangre: *${bloodType}*\n` +
      `Vehículo: *${motoInfo}*\n\n` +
      `📍 *Mi Ubicación GPS Actual:*\n${mapsUrl}\n\n` +
      `¡Necesito asistencia o verificación inmediata!`
    );

    const cleanNumber = emergencyPhone ? emergencyPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanNumber ? `https://wa.me/${cleanNumber}?text=${text}` : `https://wa.me/?text=${text}`;

    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        
        {/* ========================================================= */}
        {/* FASE 1: CONTEO REGRESIVO DE IMPACTO (15 SEGUNDOS)        */}
        {/* ========================================================= */}
        {phase === 'countdown' && (
          <View style={[styles.dialogCard, { backgroundColor: '#1C1917', borderColor: '#FF453A' }]}>
            
            <View style={styles.alarmBadge}>
              <MaterialIcons name="warning" size={44} color="#FF453A" />
            </View>

            <Text style={{ fontFamily: F.extrabold, fontSize: 24, color: '#FFFFFF', textAlign: 'center', marginTop: 14 }}>
              ¡POSIBLE IMPACTO DETECTADO!
            </Text>
            
            <Text style={{ fontFamily: F.medium, fontSize: 13, color: '#E2E8F0', textAlign: 'center', marginTop: 6, paddingHorizontal: 10 }}>
              El acelerómetro detectó una desaceleración brusca o caída. Emitiendo aviso de emergencia en:
            </Text>

            {/* CÍRCULO CONTADOR */}
            <View style={styles.countdownRing}>
              <Text style={{ fontFamily: F.extrabold, fontSize: 52, color: '#FF453A' }}>
                {countdown}
              </Text>
              <Text style={{ fontFamily: F.bold, fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>
                segundos
              </Text>
            </View>

            {/* BOTÓN ESTOY BIEN */}
            <TouchableOpacity 
              onPress={handleCancelAlert} 
              activeOpacity={0.85}
              style={styles.cancelBtn}
            >
              <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
              <Text style={{ fontFamily: F.extrabold, fontSize: 16, color: '#FFFFFF', marginLeft: 8 }}>
                ESTOY BIEN (CANCELAR ALERTA)
              </Text>
            </TouchableOpacity>

            {/* BOTÓN FORZAR SOS YA */}
            <TouchableOpacity 
              onPress={() => {
                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                Vibration.cancel();
                setPhase('action');
              }} 
              style={{ padding: 12, marginTop: 4 }}
            >
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#FF453A', textDecorationLine: 'underline' }}>
                Pedir ayuda de inmediato →
              </Text>
            </TouchableOpacity>

          </View>
        )}

        {/* ========================================================= */}
        {/* FASE 2: PROTOCOLO ACTIVO DE AUXILIO Y CONTACTOS           */}
        {/* ========================================================= */}
        {phase === 'action' && (
          <View style={[styles.dialogCard, { backgroundColor: '#0F172A', borderColor: '#38BDF8', maxHeight: '92%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
              
              {/* HEADER SOS */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' }} />
                  <Text style={{ fontFamily: F.extrabold, fontSize: 18, color: '#FFFFFF' }}>CENTRO SOS & RESCATE</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeRoundBtn}>
                  <MaterialIcons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* FICHA MÉDICA VITAL */}
              <View style={styles.medicalPill}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="blood-bag" size={20} color="#EF4444" />
                  <Text style={{ fontFamily: F.bold, color: '#FFFFFF', fontSize: 13 }}>Sangre: {bloodType}</Text>
                </View>
                <Text style={{ fontFamily: F.semibold, color: '#94A3B8', fontSize: 12 }}>Piloto: {pilotName}</Text>
              </View>

              {/* RECUADRO GPS */}
              <View style={styles.gpsBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="my-location" size={18} color="#38BDF8" />
                    <Text style={{ fontFamily: F.bold, color: '#38BDF8', fontSize: 12 }}>UBICACIÓN GPS DEL MÓVIL</Text>
                  </View>
                  {locLoading && <ActivityIndicator size="small" color="#38BDF8" />}
                </View>

                <Text style={{ fontFamily: F.medium, color: '#CBD5E1', fontSize: 12, marginTop: 6 }} numberOfLines={2}>
                  {location ? `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}` : 'Obteniendo coordenadas satelitales...'}
                </Text>

                {location && (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(mapsUrl)}
                    style={{ alignSelf: 'flex-start', marginTop: 6 }}
                  >
                    <Text style={{ fontFamily: F.bold, color: '#38BDF8', fontSize: 11, textDecorationLine: 'underline' }}>
                      Abrir en Google Maps →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* LISTA DE LLAMADAS Y ENLACES DE EMERGENCIA */}
              <Text style={{ fontFamily: F.bold, color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', alignSelf: 'flex-start', marginTop: 14, marginBottom: 8 }}>
                Llamadas y Avisos Directos
              </Text>

              {/* 1. LLAMAR A EMERGENCIAS NACIONALES (911) */}
              <TouchableOpacity 
                onPress={() => makePhoneCall('911')}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: '#DC2626' }]}
              >
                <View style={styles.actionIconBox}>
                  <MaterialIcons name="local-police" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.extrabold, color: '#FFFFFF', fontSize: 16 }}>Llamar al 911 / 171</Text>
                  <Text style={{ fontFamily: F.medium, color: '#FEE2E2', fontSize: 11 }}>Emergencias Médicas & Tránsito</Text>
                </View>
                <MaterialIcons name="phone" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* 2. LLAMAR A CONTACTO FAMILIAR */}
              <TouchableOpacity 
                onPress={() => makePhoneCall(emergencyPhone)}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: '#1E293B', borderColor: '#475569', borderWidth: 1 }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#334155' }]}>
                  <MaterialIcons name="phone-in-talk" size={24} color="#38BDF8" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.bold, color: '#FFFFFF', fontSize: 15 }}>
                    {emergencyContact ? `Llamar a ${emergencyContact}` : 'Llamar a Familiar'}
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: '#94A3B8', fontSize: 11 }}>
                    {emergencyPhone || 'Configura el número en tu Perfil'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
              </TouchableOpacity>

              {/* 3. ENVIAR CORREO DESIGNADO A FAMILIAR CON GPS */}
              <TouchableOpacity 
                onPress={sendEmergencyEmail}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: '#1E293B', borderColor: '#475569', borderWidth: 1 }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
                  <MaterialIcons name="mail-outline" size={24} color="#EAB308" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.bold, color: '#FFFFFF', fontSize: 15 }}>Avisar por Correo con GPS</Text>
                  <Text style={{ fontFamily: F.medium, color: '#94A3B8', fontSize: 11 }}>
                    {emergencyEmail || 'Enviar a correo familiar designado'}
                  </Text>
                </View>
                <MaterialIcons name="send" size={20} color="#EAB308" />
              </TouchableOpacity>

              {/* 4. ENVIAR WHATSAPP SOS CON COORDENADAS */}
              <TouchableOpacity 
                onPress={sendWhatsAppSOS}
                activeOpacity={0.85}
                style={[styles.actionCard, { backgroundColor: '#065F46', borderColor: '#10B981', borderWidth: 1 }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.25)' }]}>
                  <MaterialCommunityIcons name="whatsapp" size={26} color="#34D399" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: F.bold, color: '#FFFFFF', fontSize: 15 }}>Enviar SOS por WhatsApp</Text>
                  <Text style={{ fontFamily: F.medium, color: '#A7F3D0', fontSize: 11 }}>Envía mensaje con link de ubicación</Text>
                </View>
                <MaterialCommunityIcons name="send-circle" size={24} color="#34D399" />
              </TouchableOpacity>

              {/* BOTÓN SALIR / CERRAR */}
              <TouchableOpacity 
                onPress={onClose}
                style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 20 }}
              >
                <Text style={{ fontFamily: F.semibold, color: '#94A3B8', fontSize: 13 }}>Cerrar Asistente SOS</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        )}

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  alarmBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  countdownRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  cancelBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  closeRoundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  gpsBox: {
    width: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
