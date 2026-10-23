import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  requestPasswordReset,
  verifyRecoveryOtp,
  updatePilotPassword,
  isUserSessionActive,
} from '../../services/authRecoveryService';

export type ForgotPasswordStep = 'request' | 'reset' | 'success';

interface Props {
  visible: boolean;
  initialEmail?: string;
  initialStep?: ForgotPasswordStep;
  initialErrorMessage?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ForgotPasswordModal: React.FC<Props> = ({
  visible,
  initialEmail = '',
  initialStep = 'request',
  initialErrorMessage = null,
  onClose,
  onSuccess,
}) => {
  const { colors, mode, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  const [step, setStep] = useState<ForgotPasswordStep>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otpToken, setOtpToken] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sincronizar estado cuando el modal se abre
  useEffect(() => {
    if (visible) {
      setStep(initialStep);
      setEmail(initialEmail);
      setOtpToken('');
      setShowOtpField(false);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(initialErrorMessage);
      setInfoMessage(null);
      setLoading(false);
    }
  }, [visible, initialEmail, initialStep, initialErrorMessage]);

  const F = {
    extrabold: 'Montserrat_800ExtraBold',
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  const tokens = {
    primary: isDark ? '#4169E1' : '#275FE3',
    secondary: '#00e3fd',
    tertiary: '#00ae78',
    alert: '#ba1a1a',
    alertContainer: isDark ? 'rgba(186, 26, 26, 0.2)' : 'rgba(186, 26, 26, 0.08)',
    surface: isDark ? '#111319' : '#f5f5f7',
    surfaceCard: isDark ? '#191c21' : '#ffffff',
    surfaceContainer: isDark ? '#1d2025' : '#ececf0',
    surfaceHigh: isDark ? '#272a30' : '#e0e0e6',
    outline: isDark ? '#40485c' : '#c4c6d0',
    textPrimary: isDark ? '#ffffff' : '#111319',
    textSecondary: isDark ? '#a0a5b5' : '#575b66',
  };

  // PASO 1: Enviar solicitud de recuperación
  const handleRequestReset = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (!res.success) {
        setErrorMessage(res.message || 'No se pudo enviar el correo.');
        return;
      }

      setInfoMessage('¡Listo! Revisa tu bandeja de entrada o spam.');
      setStep('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al conectar con Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Confirmar nueva contraseña (con OTP o sesión de enlace activa)
  const handleUpdatePassword = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!newPassword) {
      setErrorMessage('Ingresa tu nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // 1. Si el usuario ingresó código OTP de 6 dígitos, verificarlo primero
      if (otpToken.trim()) {
        const otpRes = await verifyRecoveryOtp(email, otpToken);
        if (!otpRes.success) {
          setErrorMessage(otpRes.message || 'Código OTP inválido.');
          setLoading(false);
          return;
        }
      } else {
        // 2. Verificar si existe sesión de recuperación activa (establecida al hacer clic en el correo)
        const hasSession = await isUserSessionActive();
        if (!hasSession) {
          setErrorMessage(
            'No se detectó una sesión de recuperación activa. Si recibiste varios correos, asegúrate de abrir el enlace "Reset password" del correo más reciente, o solicita un nuevo enlace abajo.'
          );
          setLoading(false);
          return;
        }
      }

      // 3. Actualizar la contraseña en Supabase Auth
      const updateRes = await updatePilotPassword(newPassword);
      if (!updateRes.success) {
        setErrorMessage(updateRes.message || 'No se pudo actualizar la contraseña.');
        setLoading(false);
        return;
      }

      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar tu clave de acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const isPasswordValidLength = newPassword.length >= 6;
  const doPasswordsMatch = Boolean(newPassword && newPassword === confirmPassword);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: tokens.surfaceCard,
                borderColor: tokens.outline,
                maxWidth: isDesktop ? 500 : 420,
              },
            ]}
          >
            {/* CABECERA CON MARCA MOTORSPORT */}
            <View style={[styles.headerRow, { borderBottomColor: tokens.outline }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: tokens.surfaceContainer,
                      borderColor: tokens.secondary,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={
                      step === 'success'
                        ? 'verified'
                        : step === 'reset'
                        ? 'lock-reset'
                        : 'vpn-key'
                    }
                    size={22}
                    color={step === 'success' ? tokens.tertiary : tokens.secondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.brandTitle, { color: tokens.textPrimary, fontFamily: F.extrabold }]}>
                    {step === 'success'
                      ? 'ACCESO RESTABLECIDO'
                      : step === 'reset'
                      ? 'NUEVA CONTRASEÑA'
                      : 'RECUPERAR ACCESO'}
                  </Text>
                  <Text style={[styles.brandSubtitle, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                    GARAGE • AUTENTICACIÓN SEGURA
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: tokens.surfaceContainer }]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color={tokens.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 18 }}
            >
              {/* MENSAJES DE ERROR / INFO */}
              {errorMessage && (
                <View style={[styles.alertBox, { backgroundColor: tokens.alertContainer, borderColor: tokens.alert }]}>
                  <MaterialIcons name="error-outline" size={20} color={tokens.alert} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertText, { color: tokens.alert, fontFamily: F.semibold }]}>
                      {errorMessage}
                    </Text>
                    {step === 'reset' && (
                      <TouchableOpacity
                        onPress={() => {
                          setErrorMessage(null);
                          setStep('request');
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="refresh" size={16} color={tokens.alert} />
                        <Text style={{ color: tokens.alert, fontFamily: F.bold, fontSize: 12, textDecorationLine: 'underline' }}>
                          Solicitar nuevo enlace de recuperación
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {infoMessage && (
                <View style={[styles.alertBox, { backgroundColor: 'rgba(0, 227, 253, 0.1)', borderColor: tokens.secondary }]}>
                  <MaterialIcons name="info-outline" size={18} color={tokens.secondary} />
                  <Text style={[styles.alertText, { color: tokens.secondary, fontFamily: F.semibold }]}>
                    {infoMessage}
                  </Text>
                </View>
              )}

              {/* VISTA 1: SOLICITAR RESTABLECIMIENTO */}
              {step === 'request' && (
                <View style={{ gap: 16 }}>
                  <Text style={[styles.descriptionText, { color: tokens.textSecondary, fontFamily: F.regular }]}>
                    Ingresa el correo electrónico asociado a tu cuenta de piloto. Te enviaremos un enlace seguro a tu bandeja para restablecer tu contraseña.
                  </Text>

                  <View>
                    <Text style={[styles.inputLabel, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                      CORREO ELECTRÓNICO
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: tokens.surfaceContainer,
                          borderColor: tokens.outline,
                          color: tokens.textPrimary,
                          fontFamily: F.medium,
                        },
                      ]}
                      placeholder="piloto@correo.com"
                      placeholderTextColor={tokens.textSecondary}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>

                  {/* BOTÓN ENVIAR */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: tokens.primary, opacity: loading ? 0.7 : 1 },
                    ]}
                    onPress={handleRequestReset}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <Text style={[styles.btnText, { fontFamily: F.extrabold }]}>
                          ENVIAR INSTRUCCIONES
                        </Text>
                        <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* ACCESO RÁPIDO SI YA POSEE EL ENLACE */}
                  <TouchableOpacity
                    onPress={() => {
                      setErrorMessage(null);
                      setStep('reset');
                    }}
                    style={styles.switchStepBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="email-check-outline" size={18} color={tokens.secondary} />
                    <Text style={[styles.switchStepText, { color: tokens.secondary, fontFamily: F.semibold }]}>
                      ¿Ya abriste el enlace en tu correo? Ingresa tu contraseña aquí
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* VISTA 2: ESTABLECER NUEVA CONTRASEÑA */}
              {step === 'reset' && (
                <View style={{ gap: 14 }}>
                  <View style={[styles.statusBanner, { backgroundColor: tokens.surfaceContainer, borderColor: tokens.outline }]}>
                    <MaterialIcons name="mark-email-read" size={20} color={tokens.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusBannerTitle, { color: tokens.textPrimary, fontFamily: F.bold }]}>
                        Instrucciones despachadas
                      </Text>
                      <Text style={[styles.statusBannerSub, { color: tokens.textSecondary, fontFamily: F.regular }]}>
                        Abre el botón "Reset password" del correo más reciente que te llegó para autorizar el cambio.
                      </Text>
                    </View>
                  </View>

                  {/* NUEVA CONTRASEÑA */}
                  <View>
                    <Text style={[styles.inputLabel, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                      NUEVA CONTRASEÑA
                    </Text>
                    <View
                      style={[
                        styles.inputWithIcon,
                        {
                          backgroundColor: tokens.surfaceContainer,
                          borderColor: tokens.outline,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.flexInput, { color: tokens.textPrimary, fontFamily: F.medium }]}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor={tokens.textSecondary}
                        value={newPassword}
                        onChangeText={(val) => {
                          setNewPassword(val);
                          setErrorMessage(null);
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color={showPassword ? tokens.secondary : tokens.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* CONFIRMAR CONTRASEÑA */}
                  <View>
                    <Text style={[styles.inputLabel, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                      CONFIRMAR NUEVA CONTRASEÑA
                    </Text>
                    <View
                      style={[
                        styles.inputWithIcon,
                        {
                          backgroundColor: tokens.surfaceContainer,
                          borderColor: tokens.outline,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.flexInput, { color: tokens.textPrimary, fontFamily: F.medium }]}
                        placeholder="Repite tu contraseña"
                        placeholderTextColor={tokens.textSecondary}
                        value={confirmPassword}
                        onChangeText={(val) => {
                          setConfirmPassword(val);
                          setErrorMessage(null);
                        }}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeBtn}
                      >
                        <MaterialIcons
                          name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color={showConfirmPassword ? tokens.secondary : tokens.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* VALIDACIONES VISUALES */}
                  <View style={styles.checklistCard}>
                    <View style={styles.checkItem}>
                      <MaterialIcons
                        name={isPasswordValidLength ? 'check-circle' : 'radio-button-unchecked'}
                        size={16}
                        color={isPasswordValidLength ? tokens.tertiary : tokens.textSecondary}
                      />
                      <Text
                        style={[
                          styles.checkText,
                          {
                            color: isPasswordValidLength ? tokens.tertiary : tokens.textSecondary,
                            fontFamily: F.medium,
                          },
                        ]}
                      >
                        Al menos 6 caracteres
                      </Text>
                    </View>
                    <View style={styles.checkItem}>
                      <MaterialIcons
                        name={doPasswordsMatch ? 'check-circle' : 'radio-button-unchecked'}
                        size={16}
                        color={doPasswordsMatch ? tokens.tertiary : tokens.textSecondary}
                      />
                      <Text
                        style={[
                          styles.checkText,
                          {
                            color: doPasswordsMatch ? tokens.tertiary : tokens.textSecondary,
                            fontFamily: F.medium,
                          },
                        ]}
                      >
                        Las contraseñas coinciden
                      </Text>
                    </View>
                  </View>

                  {/* OPCIÓN SECUNDARIA: CÓDIGO DE 6 DÍGITOS */}
                  <TouchableOpacity
                    onPress={() => setShowOtpField(!showOtpField)}
                    style={{ alignSelf: 'center', paddingVertical: 4 }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 11, color: tokens.secondary, fontFamily: F.semibold, textDecorationLine: 'underline' }}>
                      {showOtpField ? 'Ocultar campo de código' : '¿Tu correo incluye un código de 6 dígitos? Ingrésalo aquí'}
                    </Text>
                  </TouchableOpacity>

                  {showOtpField && (
                    <View>
                      <Text style={[styles.inputLabel, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                        CÓDIGO NUMÉRICO DE 6 DÍGITOS
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: tokens.surfaceContainer,
                            borderColor: tokens.outline,
                            color: tokens.textPrimary,
                            fontFamily: F.bold,
                            letterSpacing: 3,
                            textAlign: 'center',
                          },
                        ]}
                        placeholder="123456"
                        placeholderTextColor={tokens.textSecondary}
                        value={otpToken}
                        onChangeText={(val) => {
                          setOtpToken(val);
                          setErrorMessage(null);
                        }}
                        keyboardType="number-pad"
                        maxLength={8}
                      />
                    </View>
                  )}

                  {/* BOTÓN ACTUALIZAR */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: tokens.primary,
                        opacity: loading || !isPasswordValidLength || !doPasswordsMatch ? 0.6 : 1,
                      },
                    ]}
                    onPress={handleUpdatePassword}
                    disabled={loading || !isPasswordValidLength || !doPasswordsMatch}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnRow}>
                        <MaterialIcons name="security" size={18} color="#FFFFFF" />
                        <Text style={[styles.btnText, { fontFamily: F.extrabold }]}>
                          ACTUALIZAR CONTRASEÑA
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* BOTÓN RETROCEDER AL PASO 1 */}
                  <TouchableOpacity
                    onPress={() => {
                      setErrorMessage(null);
                      setStep('request');
                    }}
                    style={styles.backStepBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="arrow-back" size={16} color={tokens.textSecondary} />
                    <Text style={[styles.backStepText, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                      Cambiar correo o solicitar nuevo enlace
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* VISTA 3: ÉXITO */}
              {step === 'success' && (
                <View style={{ alignItems: 'center', paddingVertical: 12, gap: 16 }}>
                  <View
                    style={[
                      styles.successCircle,
                      {
                        backgroundColor: isDark ? 'rgba(0, 174, 120, 0.15)' : 'rgba(0, 174, 120, 0.1)',
                        borderColor: tokens.tertiary,
                      },
                    ]}
                  >
                    <MaterialIcons name="check-circle" size={54} color={tokens.tertiary} />
                  </View>

                  <Text style={[styles.successTitle, { color: tokens.textPrimary, fontFamily: F.extrabold }]}>
                    ¡CONTRASEÑA ACTUALIZADA!
                  </Text>

                  <Text style={[styles.successDesc, { color: tokens.textSecondary, fontFamily: F.regular }]}>
                    Tu clave de acceso ha sido restablecida correctamente en la base de datos de Supabase. Ya puedes acceder con total normalidad a tu Garaje y telemetrías.
                  </Text>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: tokens.tertiary, width: '100%', marginTop: 8 }]}
                    onPress={handleFinishSuccess}
                    activeOpacity={0.85}
                  >
                    <View style={styles.btnRow}>
                      <Text style={[styles.btnText, { fontFamily: F.extrabold }]}>
                        CONTINUAR AL INICIO DE SESIÓN
                      </Text>
                      <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 0.8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 15,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    width: '100%',
  },
  inputWithIcon: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  flexInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    height: 52, // Mínimo 48px hit target
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    letterSpacing: 0.6,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 18,
  },
  switchStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  switchStepText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBannerTitle: {
    fontSize: 13,
  },
  statusBannerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  checklistCard: {
    gap: 6,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 11.5,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backStepText: {
    fontSize: 12,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
