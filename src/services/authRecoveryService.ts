import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../data/supabaseClient';

export interface RecoveryResult {
  success: boolean;
  message?: string;
  isExpired?: boolean;
}

/**
 * Traduce y formatea mensajes de error comunes de Supabase Auth al español.
 */
export function formatAuthError(error: any): string {
  if (!error) return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  const rawMsg = error.message || String(error);

  if (rawMsg.includes('otp_expired') || rawMsg.includes('Email link is invalid or has expired') || rawMsg.includes('Token has expired')) {
    return 'El enlace de recuperación ha expirado o ya fue utilizado. Si solicitaste varios correos, asegúrate de abrir el enlace del correo más reciente.';
  }
  if (rawMsg.includes('once every') || rawMsg.includes('over_email_send_rate_limit')) {
    return 'Por motivos de seguridad, debes esperar 60 segundos antes de solicitar otro enlace de recuperación.';
  }
  if (rawMsg.includes('User not found') || rawMsg.includes('Unable to validate email address')) {
    return 'No encontramos un piloto registrado con ese correo electrónico.';
  }
  if (rawMsg.includes('Password should be at least')) {
    return 'La nueva contraseña debe tener al menos 6 caracteres.';
  }
  if (rawMsg.includes('same_password') || rawMsg.includes('different from the old')) {
    return 'La nueva contraseña debe ser distinta a la contraseña anterior.';
  }
  if (rawMsg.includes('Auth session missing') || rawMsg.includes('session_not_found')) {
    return 'No se detectó una sesión activa de recuperación. Asegúrate de hacer clic en el enlace "Reset password" del correo más reciente.';
  }
  if (rawMsg.includes('Network request failed')) {
    return 'Problema de conexión a internet. Revisa tu red e inténtalo nuevamente.';
  }

  return rawMsg;
}

export const CANONICAL_APP_URL = 'https://garage-sigma-silk.vercel.app';

/**
 * Obtiene la URL de redirección adecuada para autenticación y recuperación.
 * Siempre prefiere el dominio oficial desplegado en Vercel, o el origin actual
 * si se ejecuta en un dominio web real en la nube.
 */
export function getAuthRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (origin.startsWith('http://') || origin.startsWith('https://')) {
      if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return origin;
      }
    }
  }
  // En cualquier otro caso (mobile, emulador, o localhost para no generar enlaces rotos),
  // siempre apuntar al dominio oficial desplegado en Vercel
  return CANONICAL_APP_URL;
}

/**
 * Limpia el hash de error o tokens de la barra de direcciones en navegador web
 * para evitar que un hash caducado permanezca al recargar la página.
 */
export function cleanUrlHash(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {}
  }
}

/**
 * Verifica si existe una sesión activa actualmente en Supabase.
 */
export async function isUserSessionActive(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) return true;
    const { data: userData } = await supabase.auth.getUser();
    return Boolean(userData?.user);
  } catch {
    return false;
  }
}

/**
 * Solicita el restablecimiento de contraseña enviando un correo al usuario
 * con enlace seguro de recuperación apuntando a Vercel.
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
    const redirectUrl = getAuthRedirectUrl();

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
      message: 'Hemos enviado las instrucciones a tu correo. Abre el último mensaje que recibas.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: formatAuthError(err),
    };
  }
}

/**
 * Valida un código OTP de 6 dígitos si la plantilla de correo de Supabase lo provee.
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
      message: 'Ingresa el código numérico de 6 dígitos.',
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
 * Actualiza la contraseña del usuario autenticado en la sesión de recuperación.
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
 * Analiza un enlace profundo o URL web buscando tokens de acceso o errores de expiración.
 */
export async function handleRecoveryDeepLink(
  url: string
): Promise<{ isRecovery: boolean; error?: string; isExpired?: boolean }> {
  if (!url) return { isRecovery: false };

  try {
    // Caso 1: Fragmento de URL (#access_token=... o #error=...)
    if (url.includes('#')) {
      const hash = url.split('#')[1];
      const params = new URLSearchParams(hash);

      const urlError = params.get('error');
      const errorCode = params.get('error_code');
      const errorDesc = params.get('error_description');

      if (urlError || errorCode) {
        cleanUrlHash();
        let msg = 'El enlace de recuperación es inválido o ha expirado.';
        if (errorCode === 'otp_expired' || (errorDesc && errorDesc.includes('expired'))) {
          msg =
            'El enlace de recuperación ha expirado o ya fue utilizado. Si solicitaste varios correos, abre únicamente el enlace del correo más reciente.';
        }
        return { isRecovery: false, error: msg, isExpired: true };
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        cleanUrlHash();

        if (error) {
          return { isRecovery: false, error: formatAuthError(error) };
        }

        return { isRecovery: type === 'recovery' || Boolean(accessToken) };
      }
    }

    // Caso 2: Parámetros de consulta (?code=... o ?error=...)
    if (url.includes('?')) {
      const query = url.split('?')[1]?.split('#')[0];
      const params = new URLSearchParams(query);

      const urlError = params.get('error');
      const errorCode = params.get('error_code');
      const errorDesc = params.get('error_description');

      if (urlError || errorCode) {
        cleanUrlHash();
        let msg = 'El enlace de recuperación es inválido o ha expirado.';
        if (errorCode === 'otp_expired' || (errorDesc && errorDesc.includes('expired'))) {
          msg = 'El enlace ha expirado o ya fue utilizado. Abre el correo más reciente recibido.';
        }
        return { isRecovery: false, error: msg, isExpired: true };
      }

      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        cleanUrlHash();

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
