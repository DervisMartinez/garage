import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../data/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export const AuthScreen = () => {
  const { colors, mode } = useTheme();
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Extra profile fields for registration
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password) { alert('Correo y contraseña son obligatorios'); return; }
    
    if (!isLogin && (!firstName || !lastName || !country || !state)) {
      alert('Por favor llena todos los campos de perfil para continuar');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              country: country,
              state: state
            }
          }
        });
        if (error) throw error;
        
        // Si Supabase devuelve sesión nula tras registrar, significa que pide confirmar email
        if (!data.session) {
          alert('¡Registro exitoso!');
          setIsLogin(true);
        } else {
          alert('¡Registro exitoso!');
        }
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Correo o contraseña incorrectos, o falta confirmar tu correo.';
      if (msg.includes('User already registered')) msg = 'Este correo ya está registrado.';
      if (msg.includes('Password should be at least')) msg = 'La contraseña debe tener al menos 6 caracteres.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  // Determine gradient colors based on theme so it blends perfectly
  const bgTop = mode === 'dark' ? 'rgba(10,12,18,0.35)' : 'rgba(255,255,255,0.35)';
  const bgMid = mode === 'dark' ? 'rgba(10,12,18,0.88)' : 'rgba(255,255,255,0.92)';
  const bgBottom = mode === 'dark' ? 'rgba(10,12,18,0.98)' : 'rgba(255,255,255,0.98)';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ImageBackground 
        source={require('../../../assets/images/fondo_login.jpg')} 
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[bgTop, bgMid, bgBottom]}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center', 
              alignItems: 'center', 
              paddingHorizontal: 20, 
              paddingTop: 30,
              paddingBottom: 40,
            }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: '100%', maxWidth: 390, alignSelf: 'center' }}>
              
              {/* LOGO & HEADER */}
              <View style={{ alignItems: 'center', marginBottom: 26 }}>
                <View style={[styles.logoBadge, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
                  <MaterialCommunityIcons name="engine" size={38} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 34, fontFamily: F.extrabold, color: colors.onSurface, letterSpacing: -0.8 }}>
                  GARAGE
                </Text>
                <Text style={{ fontSize: 13, fontFamily: F.medium, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                  {isLogin ? 'Tu garaje inteligente en la nube' : 'Crea tu garaje inteligente'}
                </Text>
              </View>

              {/* FORM FIELDS */}
              <View style={{ gap: 12, width: '100%' }}>
                
                {!isLogin && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <TextInput 
                          style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, color: colors.onSurface, fontFamily: F.semibold }]} 
                          placeholder="Nombre" 
                          placeholderTextColor={colors.onSurfaceVariant} 
                          value={firstName} 
                          onChangeText={setFirstName} 
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <TextInput 
                          style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, color: colors.onSurface, fontFamily: F.semibold }]} 
                          placeholder="Apellido" 
                          placeholderTextColor={colors.onSurfaceVariant} 
                          value={lastName} 
                          onChangeText={setLastName} 
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <TextInput 
                          style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, color: colors.onSurface, fontFamily: F.semibold }]} 
                          placeholder="País" 
                          placeholderTextColor={colors.onSurfaceVariant} 
                          value={country} 
                          onChangeText={setCountry} 
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <TextInput 
                          style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, color: colors.onSurface, fontFamily: F.semibold }]} 
                          placeholder="Estado / Prov." 
                          placeholderTextColor={colors.onSurfaceVariant} 
                          value={state} 
                          onChangeText={setState} 
                        />
                      </View>
                    </View>
                  </>
                )}

                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, color: colors.onSurface, fontFamily: F.semibold }]} 
                  placeholder="Correo Electrónico" 
                  placeholderTextColor={colors.onSurfaceVariant} 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, paddingHorizontal: 16, paddingVertical: 0 }]}>
                  <TextInput 
                    style={{ flex: 1, height: 50, color: colors.onSurface, fontFamily: F.semibold, fontSize: 15 }} 
                    placeholder="Contraseña" 
                    placeholderTextColor={colors.onSurfaceVariant} 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={showPassword ? colors.primary : colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.primary }]} 
                  onPress={handleAuth} 
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimaryContainer} />
                  ) : (
                    <Text style={[styles.buttonText, { color: colors.onPrimaryContainer, fontFamily: F.extrabold }]}>
                      {isLogin ? 'INGRESAR' : 'REGISTRARSE'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setIsLogin(!isLogin)} 
                  style={{ alignItems: 'center', paddingVertical: 12, marginTop: 4 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.primary, fontFamily: F.bold, fontSize: 13 }}>
                    {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Ingresa aquí'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    width: '100%',
    minWidth: 0,
    justifyContent: 'center',
  },
  button: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 15,
    letterSpacing: 0.8,
  },
});
