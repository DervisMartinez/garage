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
  const bgTop = mode === 'dark' ? 'rgba(17,19,25,0.1)' : 'rgba(245,245,247,0.1)';
  const bgMid = mode === 'dark' ? 'rgba(17,19,25,0.8)' : 'rgba(245,245,247,0.85)';
  const bgBottom = mode === 'dark' ? 'rgba(17,19,25,1)' : 'rgba(245,245,247,1)';

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 50 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 100 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }}>
                <MaterialCommunityIcons name="engine" size={40} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 36, fontFamily: F.extrabold, color: colors.onSurface, letterSpacing: -1 }}>GARAGE</Text>
              <Text style={{ fontSize: 14, fontFamily: F.medium, color: colors.onSurfaceVariant, marginTop: 4 }}>
                {isLogin ? 'Tu garaje inteligente en la nube' : 'Crea tu garaje inteligente'}
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              
              {!isLogin && (
                <>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TextInput 
                      style={[styles.input, { flex: 1, backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerHigh, color: colors.onSurface, fontFamily: F.semibold }]} 
                      placeholder="Nombre" 
                      placeholderTextColor={colors.onSurfaceVariant} 
                      value={firstName} 
                      onChangeText={setFirstName} 
                    />
                    <TextInput 
                      style={[styles.input, { flex: 1, backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerHigh, color: colors.onSurface, fontFamily: F.semibold }]} 
                      placeholder="Apellido" 
                      placeholderTextColor={colors.onSurfaceVariant} 
                      value={lastName} 
                      onChangeText={setLastName} 
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TextInput 
                      style={[styles.input, { flex: 1, backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerHigh, color: colors.onSurface, fontFamily: F.semibold }]} 
                      placeholder="País" 
                      placeholderTextColor={colors.onSurfaceVariant} 
                      value={country} 
                      onChangeText={setCountry} 
                    />
                    <TextInput 
                      style={[styles.input, { flex: 1, backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerHigh, color: colors.onSurface, fontFamily: F.semibold }]} 
                      placeholder="Estado/Provincia" 
                      placeholderTextColor={colors.onSurfaceVariant} 
                      value={state} 
                      onChangeText={setState} 
                    />
                  </View>
                </>
              )}

              <TextInput 
                style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerHigh, color: colors.onSurface, fontFamily: F.semibold }]} 
                placeholder="Correo Electrónico" 
                placeholderTextColor={colors.onSurfaceVariant} 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerHigh, padding: 0, paddingHorizontal: 16 }]}>
                <TextInput 
                  style={{ flex: 1, paddingVertical: 16, color: colors.onSurface, fontFamily: F.semibold, fontSize: 16 }} 
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
                  style={{ padding: 6 }}
                >
                  <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={24} color={showPassword ? colors.primary : colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.onPrimaryContainer} /> : <Text style={[styles.buttonText, { color: colors.onPrimaryContainer, fontFamily: F.extrabold }]}>{isLogin ? 'INGRESAR' : 'REGISTRARSE'}</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{alignItems: 'center', marginVertical: 8}}>
                <Text style={{color: colors.primary, fontFamily: F.bold, fontSize: 13}}>
                  {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Ingresa aquí'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, letterSpacing: 1 },
});
