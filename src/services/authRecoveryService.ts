import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../data/supabaseClient';

export interface RecoveryResult {
  success: boolean;
  message?: string;
}

/**
 * Traduce y formatea mensajes de error comunes de Supabase Auth al español.
 */
export function formatAuthError(error: any): string {
  if (!error) return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  const rawMsg = error.message || String(error);

  if (rawMsg.includes('once every') || rawMsg.includes('over_email_send_rate_limit')) {
    return 'Por motivos de seguridad, debes esperar un momento antes de solicitar otro enlace de recuperación.';
  }
  if (rawMsg.includes('User not found') || rawMsg.includes('Unable to validate email address')) {
    return 'No encontramos un piloto registrado con ese correo electrónico.';
  }
  if (rawMsg.includes('Token has expired') || rawMsg.includes('invalid') || rawMsg.includes('Token is invalid')) {
    return 'El código o enlace de recuperación ha expirado o no es válido. Solicita uno nuevo.';
  }
  if (rawMsg.includes('Password should be at least')) {
    return 'La nueva contraseña debe tener al menos 6 caracteres.';
  }
  if (rawMsg.includes('same_password') || rawMsg.includes('different from the old')) {
    return 'La nueva contraseña debe ser distinta a la contraseña anterior.';
  }
  if (rawMsg.includes('Auth session missing') || rawMsg.includes('session_not_found')) {
    return 'No hay una sesión de recuperación activa. Ingresa el código de 6 dígitos que te enviamos por correo.';
  }
  if (rawMsg.includes('Network request failed')) {
    return 'Problema de conexión a internet. Revisa tu red e inténtalo nuevamente.';
  }

  return rawMsg;
}

/**
 * Solicita el restablecimiento de contraseña enviando un correo al usuario
 * con enlace seguro de recuperación y token OTP de Supabase.
 */
export async function requestPasswordReset(email: string): Promise<RecoveryResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return {
      success: false,
      message: 'Ingresa un correo electrónico válido.',
    };
  }

  try {
    const redirectUrl =
      Platform.OS === 'web'
        ? typeof window !== 'undefined'
          ? `${window.location.origin}`
          : undefined
        : Linking.createURL('reset-password');

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return {
        success: false,
        message: formatAuthError(error),
      };
    }

    return {
      success: true,
      message: 'Hemos enviado un enlace y código de recuperación a tu correo.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: formatAuthError(err),
    };
  }
}

/**
 * Valida el código de 6 dígitos (OTP token) recibido por correo para activar
 * la sesión temporal de recuperación.
 */
export async function verifyRecoveryOtp(email: string, token: string): Promise<RecoveryResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanEmail) {
    return {
      success: false,
      message: 'El correo electrónico es requerido.',
    };
  }

  if (!cleanToken || cleanToken.length < 6) {
    return {
      success: false,
      message: 'Ingresa el código numérico de 6 dígitos recibido por correo.',
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    if (error) {
      return {
        success: false,
        message: formatAuthError(error),
      };
    }

    if (!data.session && !data.user) {
      return {
        success: false,
        message: 'No se pudo verificar el código. Solicita un nuevo enlace.',
      };
    }

    return {
      success: true,
      message: 'Código verificado correctamente.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: formatAuthError(err),
    };
  }
}

/**
 * Actualiza la contraseña del usuario autenticado (en sesión de recuperación o activa).
 */
export async function updatePilotPassword(newPassword: string): Promise<RecoveryResult> {
  const cleanPassword = newPassword.trim();

  if (!cleanPassword || cleanPassword.length < 6) {
    return {
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres.',
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: cleanPassword,
    });

    if (error) {
      return {
        success: false,
        message: formatAuthError(error),
      };
    }

    return {
      success: true,
      message: '¡Tu contraseña ha sido actualizada con éxito!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: formatAuthError(err),
    };
  }
}

/**
 * Analiza un enlace profundo (Deep Link) o URL con fragmento de recuperación
 * (#access_token=... o ?code=...) y establece la sesión en Supabase.
 */
export async function handleRecoveryDeepLink(url: string): Promise<{ isRecovery: boolean; error?: string }> {
  if (!url) return { isRecovery: false };

  try {
    // Caso 1: Fragmento de URL (#access_token=...&refresh_token=...&type=recovery)
    if (url.includes('#')) {
      const hash = url.split('#')[1];
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          return { isRecovery: false, error: formatAuthError(error) };
        }

        return { isRecovery: type === 'recovery' || true };
      }
    }

    // Caso 2: Parámetro de consulta PKCE (?code=...)
    if (url.includes('code=')) {
      const queryString = url.split('?')[1]?.split('#')[0];
      const params = new URLSearchParams(queryString);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return { isRecovery: false, error: formatAuthError(error) };
        }
        return { isRecovery: true };
      }
    }

    return { isRecovery: false };
  } catch (err: any) {
    return { isRecovery: false, error: formatAuthError(err) };
  }
}
