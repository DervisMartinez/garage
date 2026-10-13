import { Platform } from 'react-native';

export interface EmergencyPayload {
  toEmail: string;
  pilotName: string;
  bloodType: string;
  motoInfo: string;
  odometer: number;
  location: { lat: number; lng: number } | null;
  mapsUrl: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface DispatchResult {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Servicio de despacho satelital y telemático de emergencia GARAGE.
 * Envía la notificación en segundo plano directamente vía HTTP POST
 * sin requerir interacción manual del usuario en clientes de correo externos.
 */
export const dispatchEmergencyEmail = async (payload: EmergencyPayload): Promise<DispatchResult> => {
  const timestamp = new Date().toISOString();
  const cleanEmail = payload.toEmail.trim();

  if (!cleanEmail) {
    return {
      success: false,
      message: 'No hay un correo familiar designado configurado en el perfil.',
      timestamp,
    };
  }

  const emailSubject = `[GARAGE SOS] ALERTA DE IMPACTO / AUXILIO EN RUTA - Piloto: ${payload.pilotName}`;
  const coordinatesStr = payload.location 
    ? `${payload.location.lat.toFixed(5)}, ${payload.location.lng.toFixed(5)}`
    : 'Coordenadas no disponibles';

  // Payload estructurado para despacho transaccional
  const requestBody = {
    _subject: emailSubject,
    _template: 'table',
    _captcha: 'false',
    _replyto: 'no-reply@garageapp.motorsport',
    PROTOCOLO_SEGURIDAD: 'GARAGE Telemetry & Rescue System',
    ESTADO_ALERTA: 'CRÍTICO - IMPACTO SEVERO DETECTADO (>3.5G)',
    PILOTO_REGISTRADO: payload.pilotName,
    GRUPO_SANGUINEO: payload.bloodType,
    VEHICULO_EN_RUTA: payload.motoInfo,
    ODOMETRO_ACTUAL: `${payload.odometer} km`,
    CONTACTO_FAMILIAR: payload.emergencyContact || 'No especificado',
    TELEFONO_FAMILIAR: payload.emergencyPhone || 'No especificado',
    COORDENADAS_GPS: coordinatesStr,
    ENLACE_GOOGLE_MAPS: payload.mapsUrl,
    HORA_DEL_EVENTO: new Date().toLocaleString(),
    ACCION_REQUERIDA: 'Contactar al piloto inmediatamente o alertar al 911 / 171 con las coordenadas provistas.'
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Alerta transmitida exitosamente al correo familiar.',
        timestamp,
      };
    } else {
      // Intento de fallback silencioso
      return {
        success: false,
        message: `Servidor respondió con código ${response.status}`,
        timestamp,
      };
    }
  } catch (error: any) {
    console.warn('Error en despacho automático de correo SOS:', error);
    return {
      success: false,
      message: error?.message || 'Error de conexión de red',
      timestamp,
    };
  }
};
