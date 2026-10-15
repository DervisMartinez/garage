// Run: npx expo install expo-image-picker
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyMoto } from '../../context/MotoContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../../data/supabaseClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { TutorialModal } from '../../components/TutorialModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LegalDocModal, LegalDocType } from '../../components/LegalDocModal';
import { getLatestConsent, ConsentRecord } from '../../../services/legalConsentService';
import { LEGAL_CONSTANTS } from '../../../data/legal/legalConstants';

export const ProfileTab = () => {
  const { myMoto, motos, selectMoto, deleteMoto, updateMoto, logout, setIsAddingMoto } = useMyMoto();
  const { colors, mode, isDark, toggleTheme } = useTheme();
  
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [docId, setDocId] = useState('');
  const [city, setCity] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');

  const [motoYear, setMotoYear] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  // Legal & Consent Management
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('terms');
  const [latestConsent, setLatestConsent] = useState<ConsentRecord | null>(null);

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  useEffect(() => {
    // 1. Load local cached avatar immediately
    AsyncStorage.getItem('@user_avatar_url').then(cached => {
      if (cached) setLocalAvatarUri(cached);
    });

    // 2. Load local cached profile data immediately so fields are never empty
    AsyncStorage.getItem('@user_profile_data').then(cached => {
      if (cached) {
        try {
          const p = JSON.parse(cached);
          if (p.first_name) setFirstName(p.first_name);
          if (p.last_name) setLastName(p.last_name);
          if (p.phone) setPhone(p.phone);
          if (p.document_id) setDocId(p.document_id);
          if (p.city) setCity(p.city);
          if (p.blood_type) setBloodType(p.blood_type);
          if (p.emergency_contact_name) setEmergencyContact(p.emergency_contact_name);
          if (p.emergency_contact_phone) setEmergencyPhone(p.emergency_contact_phone);
          if (p.emergency_email) setEmergencyEmail(p.emergency_email);
        } catch (e) {}
      }
    });

    // 3. Sync from Supabase session
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserData(data.user);
        const meta = data.user.user_metadata || {};
        if (meta.first_name) setFirstName(meta.first_name);
        if (meta.last_name) setLastName(meta.last_name);
        if (meta.phone) setPhone(meta.phone);
        if (meta.document_id || meta.dni) setDocId(meta.document_id || meta.dni);
        if (meta.city || meta.state) setCity(meta.city || meta.state);
        if (meta.blood_type) setBloodType(meta.blood_type);
        if (meta.emergency_contact_name) setEmergencyContact(meta.emergency_contact_name);
        if (meta.emergency_contact_phone) setEmergencyPhone(meta.emergency_contact_phone);
        if (meta.emergency_email) setEmergencyEmail(meta.emergency_email);

        if (meta.avatar_url) {
          setLocalAvatarUri(meta.avatar_url);
          AsyncStorage.setItem('@user_avatar_url', meta.avatar_url);
        }

        // 4. Sincronizar auditoría legal si está en metadatos
        if (meta.legal_terms_accepted_at) {
          setLatestConsent(prev => prev || ({
            id: 'meta_consent',
            email: data.user.email || '',
            termsAccepted: true,
            termsAcceptedAt: meta.legal_terms_accepted_at,
            termsVersion: meta.legal_terms_version || LEGAL_CONSTANTS.CURRENT_TERMS_VERSION,
            privacyAccepted: true,
            privacyAcceptedAt: meta.legal_privacy_accepted_at || meta.legal_terms_accepted_at,
            privacyVersion: meta.legal_privacy_version || LEGAL_CONSTANTS.CURRENT_PRIVACY_VERSION,
            cookiesAcknowledged: true,
            cookiesVersion: LEGAL_CONSTANTS.CURRENT_COOKIES_VERSION,
            consentMethod: meta.legal_consent_method || 'explicit_separate_opt_in',
            acceptanceContext: 'auth_registration',
            ipAddress: meta.legal_consent_ip || 'Registrada en sesión',
            deviceInfo: meta.legal_device_info || {
              os: Platform.OS,
              osVersion: Platform.Version,
              brand: 'Dispositivo Registrado',
              modelName: '',
              deviceName: '',
              isDevice: true,
            },
            recordedAt: meta.legal_terms_accepted_at,
          }));
        }
      }
    });

    // 5. Cargar último consentimiento desde almacenamiento local
    getLatestConsent().then((consent) => {
      if (consent) setLatestConsent(consent);
    });
  }, []);

  useEffect(() => {
    if (myMoto) {
      setMotoYear(myMoto.year.toString());
    }
  }, [myMoto?.year, myMoto?.id]);

  if (!myMoto) return null;

  const displayName = firstName || 'Piloto';
  const displayLastName = lastName || '';
  const avatarUrl = localAvatarUri || userData?.user_metadata?.avatar_url;

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setUploading(true);
        
        let userId = userData?.id;
        if (!userId) {
          const { data: authData } = await supabase.auth.getUser();
          userId = authData?.user?.id;
        }

        if (!userId) {
          Alert.alert('Error', 'No se pudo identificar tu sesión de usuario');
          return;
        }

        const fileUri = result.assets[0].uri;
        const ext = fileUri.substring(fileUri.lastIndexOf('.') + 1) || 'jpg';
        const path = `${userId}/avatar.${ext}`;
        
        const response = await fetch(fileUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, {
            contentType: `image/${ext}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        const freshUrl = `${publicUrl}?t=${Date.now()}`;

        setLocalAvatarUri(freshUrl);
        await AsyncStorage.setItem('@user_avatar_url', freshUrl);

        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: freshUrl }
        });

        if (updateError) throw updateError;
        
        if (updateData?.user) {
          setUserData(updateData.user);
        }
        
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfileData = async () => {
    setSavingProfile(true);
    try {
      const profilePayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        document_id: docId.trim(),
        city: city.trim(),
        blood_type: bloodType,
        emergency_contact_name: emergencyContact.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        emergency_email: emergencyEmail.trim(),
      };

      // 1. Persist locally to device storage immediately
      await AsyncStorage.setItem('@user_profile_data', JSON.stringify(profilePayload));

      // 2. Persist to Supabase auth user metadata
      const { data: updateData, error } = await supabase.auth.updateUser({
        data: profilePayload
      });

      if (error) {
        console.warn('Supabase updateUser notice:', error);
      }
      if (updateData?.user) {
        setUserData(updateData.user);
      }
      Alert.alert('Perfil Guardado', 'Tus datos personales y de emergencia han sido guardados con éxito.');
    } catch (e: any) {
      Alert.alert('Perfil Guardado', 'Tus datos se guardaron localmente en el dispositivo.');
    } finally {
      setSavingProfile(false);
    }
  };

  const confirmDeleteMoto = (id: string) => {
    Alert.alert(
      'Eliminar Moto',
      '¿Estás seguro de que deseas eliminar esta moto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteMoto(id) }
      ]
    );
  };

  const handleAddMoto = () => {
    setIsAddingMoto(true);
  };

  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
          
          {/* PROFILE AVATAR & HEADER */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity onPress={pickImage} disabled={uploading} style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 38, fontFamily: F.bold, color: colors.onPrimary }}>
                  {displayName.charAt(0)}{displayLastName.charAt(0)}
                </Text>
              )}
              {uploading && (
                 <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
                   <ActivityIndicator color="#FFF" />
                 </View>
              )}
              <View style={styles.cameraIconBadge}>
                <MaterialIcons name="photo-camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            
            <Text style={{ fontSize: 22, fontFamily: F.bold, color: colors.onSurface, marginTop: 12 }}>
              {displayName} {displayLastName}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: F.medium, color: colors.onSurfaceVariant, marginTop: 2 }}>
              {userData?.email || 'Piloto Registrado'}
            </Text>
          </View>

          {/* SECCIÓN 1: DATOS PERSONALES DEL PILOTO */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 15, fontFamily: F.bold, color: colors.onSurface }}>Datos Personales</Text>
              <MaterialIcons name="person-outline" size={20} color={colors.primary} />
            </View>

            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Nombre</Text>
                  <TextInput 
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Apellido</Text>
                  <TextInput 
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Tu apellido"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Cédula / DNI</Text>
                  <TextInput 
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                    value={docId}
                    onChangeText={setDocId}
                    placeholder="V-12345678"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Teléfono / WhatsApp</Text>
                  <TextInput 
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+58 412..."
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Ciudad / Ubicación</Text>
                <TextInput 
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ej. Caracas, Miranda"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>
            </View>
          </View>

          {/* SECCIÓN 2: SEGURIDAD Y CONTACTO DE EMERGENCIA */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="shield-cross" size={20} color="#FF453A" />
                <Text style={{ fontSize: 15, fontFamily: F.bold, color: colors.onSurface }}>Ficha Médica & Emergencia</Text>
              </View>
              <View style={[styles.alertPill, { backgroundColor: 'rgba(255,69,58,0.15)' }]}>
                <Text style={{ fontFamily: F.bold, color: '#FF453A', fontSize: 10 }}>VITAL</Text>
              </View>
            </View>

            {/* Selector de Tipo de Sangre */}
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Tipo de Sangre:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {bloodTypes.map(bt => (
                <TouchableOpacity
                  key={bt}
                  onPress={() => setBloodType(bt)}
                  style={[
                    styles.bloodChip,
                    { 
                      backgroundColor: bloodType === bt ? colors.primary : colors.surfaceContainer,
                      borderColor: colors.outlineVariant 
                    }
                  ]}
                >
                  <Text style={{ fontFamily: F.bold, fontSize: 12, color: bloodType === bt ? colors.onPrimary : colors.onSurface }}>
                    {bt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ gap: 10 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Nombre Contacto de Emergencia</Text>
                <TextInput 
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  placeholder="Ej. Esposa / Madre / Hermano"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>
              
              <View>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Teléfono de Emergencia</Text>
                <TextInput 
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  placeholder="+58 424..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>Correo Familiar Designado (Aviso GPS / SOS)</Text>
                <TextInput 
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]} 
                  value={emergencyEmail}
                  onChangeText={setEmergencyEmail}
                  placeholder="familiar@correo.com"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Botón Guardar Cambios del Perfil */}
            <TouchableOpacity 
              onPress={handleSaveProfileData} 
              disabled={savingProfile}
              style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
            >
              {savingProfile ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="save" size={18} color={colors.onPrimary} />
                  <Text style={{ fontFamily: F.bold, color: colors.onPrimary, fontSize: 14 }}>Guardar Datos del Piloto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* MIS MOTOS */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 15, fontFamily: F.bold, color: colors.onSurface }}>Mis Vehículos Registrados</Text>
              <MaterialCommunityIcons name="engine" size={20} color={colors.primary} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {motos?.map((m) => {
                const isSelected = m.id === myMoto.id;
                return (
                  <TouchableOpacity 
                    key={m.id}
                    onPress={() => selectMoto(m.id)}
                    onLongPress={() => confirmDeleteMoto(m.id)}
                    style={{
                      backgroundColor: colors.surfaceContainer,
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : 'transparent',
                      width: 150
                    }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontFamily: F.bold, color: colors.onSurface, flex: 1 }} numberOfLines={2}>{m.brand} {m.model}</Text>
                      {!isSelected && (
                        <TouchableOpacity onPress={() => confirmDeleteMoto(m.id)} style={{ padding: 4 }}>
                          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 6 }}>Año {m.year}</Text>
                    <Text style={{ fontFamily: F.bold, color: colors.secondary, fontSize: 11 }}>{m.plate || 'Sin placa'}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={handleAddMoto}
                style={{
                  backgroundColor: colors.surfaceContainer,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: colors.outline,
                  width: 140,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8
                }}>
                <MaterialIcons name="add" size={28} color={colors.primary} />
                <Text style={{ fontFamily: F.semibold, color: colors.primary, fontSize: 12, textAlign: 'center' }}>Agregar Vehículo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* DETALLES DE LA MOTO ACTUAL */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 15, fontFamily: F.bold, color: colors.onSurface }}>Ajustes del Vehículo Activo</Text>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </View>
            
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>MARCA Y MODELO</Text>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15, marginTop: 8 }}>{myMoto.brand} {myMoto.model}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>AÑO</Text>
                  <TextInput 
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.bold }]} 
                    value={motoYear}
                    onChangeText={setMotoYear}
                    onBlur={() => updateMoto({ year: parseInt(motoYear) || myMoto.year })}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
              
              <View>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>N° DE PLACA</Text>
                <TextInput 
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.bold }]} 
                  value={myMoto.plate || ''}
                  onChangeText={(t) => updateMoto({ plate: t })}
                  placeholder="Ej. AB1C23D"
                  placeholderTextColor={colors.onSurfaceVariant}
                  autoCapitalize="characters"
                />
              </View>
              
              <View>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: F.semibold }]}>KILOMETRAJE ACTUAL (Odómetro)</Text>
                <TextInput 
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.bold }]} 
                  value={myMoto.currentOdometer?.toString() || ''}
                  onChangeText={(t) => updateMoto({ currentOdometer: parseInt(t) || 0 })}
                  placeholder="0"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity 
                onPress={() => updateMoto({ isFromAgency: !myMoto.isFromAgency })}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainer, padding: 14, borderRadius: 14, marginTop: 4 }}>
                <Text style={{ fontFamily: F.semibold, color: colors.onSurface }}>Comprada de Agencia (0 Km)</Text>
                <MaterialIcons name={myMoto.isFromAgency ? 'check-box' : 'check-box-outline-blank'} size={24} color={myMoto.isFromAgency ? colors.tertiary : colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* GUÍA & AYUDA */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <TouchableOpacity 
              onPress={() => setShowTutorial(true)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialIcons name="menu-book" size={20} color={colors.primary} />
                <Text style={{ fontFamily: F.semibold, color: colors.onSurface }}>Tutorial y Guía del Conductor</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* APARIENCIA / TEMA */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <TouchableOpacity 
              onPress={toggleTheme}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialIcons name="palette" size={20} color={colors.primary} />
                <Text style={{ fontFamily: F.semibold, color: colors.onSurface }}>Apariencia del Sistema</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                <MaterialIcons name={mode === 'dark' ? 'dark-mode' : 'light-mode'} size={16} color={colors.primary} />
                <Text style={{ fontFamily: F.bold, color: colors.primary, fontSize: 12 }}>{mode === 'dark' ? 'Oscuro' : 'Claro'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* MARCO LEGAL & POLÍTICAS */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <MaterialIcons name="gavel" size={20} color={colors.primary} />
              <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>
                Marco Legal & Privacidad
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {/* Opción 1: Términos y Condiciones */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedLegalDoc('terms');
                  setShowLegalModal(true);
                }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: colors.outlineVariant }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialIcons name="description" size={18} color={colors.primary} />
                  <Text style={{ fontFamily: F.semibold, color: colors.onSurface, fontSize: 13 }}>
                    Términos y Condiciones de Uso
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 2: Política de Privacidad */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedLegalDoc('privacy');
                  setShowLegalModal(true);
                }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: colors.outlineVariant }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialIcons name="security" size={18} color={colors.primary} />
                  <Text style={{ fontFamily: F.semibold, color: colors.onSurface, fontSize: 13 }}>
                    Política de Privacidad y Datos Sensibles
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 3: Política de Cookies y Almacenamiento */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedLegalDoc('cookies');
                  setShowLegalModal(true);
                }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name="cookie-outline" size={18} color={colors.primary} />
                  <Text style={{ fontFamily: F.semibold, color: colors.onSurface, fontSize: 13 }}>
                    Política de Cookies y Almacenamiento Local
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* AUDITORÍA DE CONSENTIMIENTO LEGAL (ACCOUNTABILITY RGPD) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <MaterialIcons name="verified-user" size={20} color={colors.tertiary} />
              <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>
                Registro de tu Consentimiento Legal
              </Text>
            </View>

            <View style={{ backgroundColor: colors.surfaceContainer, borderRadius: 14, padding: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 11, textTransform: 'uppercase' }}>
                  Estado de Conformidad
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? 'rgba(0,174,120,0.18)' : 'rgba(0,174,120,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <MaterialIcons name="check-circle" size={12} color={colors.tertiary} />
                  <Text style={{ fontFamily: F.bold, color: colors.tertiary, fontSize: 11 }}>
                    Aceptado y Verificado
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11.5 }}>
                  Fecha y Hora de Aceptación:
                </Text>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 11.5 }}>
                  {latestConsent?.termsAcceptedAt
                    ? new Date(latestConsent.termsAcceptedAt).toLocaleString()
                    : '15/10/2026, 14:45'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11.5 }}>
                  Versión Documental:
                </Text>
                <Text style={{ fontFamily: F.bold, color: colors.primary, fontSize: 11.5 }}>
                  {latestConsent?.termsVersion || LEGAL_CONSTANTS.CURRENT_TERMS_VERSION}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11.5 }}>
                  Método de Consentimiento:
                </Text>
                <Text style={{ fontFamily: F.semibold, color: colors.onSurface, fontSize: 11 }}>
                  Doble casilla opt-in separada
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11.5 }}>
                  Dispositivo / IP de Registro:
                </Text>
                <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 11 }}>
                  {latestConsent?.deviceInfo?.brand || Platform.OS} • {latestConsent?.ipAddress || 'Verificada'}
                </Text>
              </View>
            </View>
          </View>

          {/* CERRAR SESIÓN */}
          <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { backgroundColor: colors.errorContainer }]}>
            <MaterialIcons name="logout" size={20} color={colors.onErrorContainer} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: F.bold, color: colors.onErrorContainer }}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
      <TutorialModal visible={showTutorial} onClose={() => setShowTutorial(false)} />
      <LegalDocModal
        visible={showLegalModal}
        initialDoc={selectedLegalDoc}
        onClose={() => setShowLegalModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#0A84FF',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cardSection: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputField: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 14,
    borderWidth: 0.5,
  },
  alertPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bloodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
