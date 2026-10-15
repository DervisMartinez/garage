export const COOKIES_POLICY = {
  title: 'Política de Cookies y Almacenamiento Local',
  version: 'v1.0.0-2026',
  effectiveDate: '15 de Octubre de 2026',
  sections: [
    {
      id: '1',
      title: '1. ¿Qué son las Cookies y el Almacenamiento Local?',
      content: `Una "cookie" es un pequeño fichero de texto que un sitio web o servicio digital descarga en el navegador o dispositivo del usuario para recordar información técnica o de navegación.

En el ecosistema de aplicaciones móviles nativas (Android e iOS, como GARAGE desarrollada en React Native y Expo), en lugar de cookies tradicionales de navegador web, se utilizan mecanismos equivalentes de almacenamiento local seguro en el sandbox del dispositivo, conocidos como AsyncStorage, SecureStore y almacenamiento en caché, así como Web Storage (localStorage / sessionStorage) cuando se accede desde la versión web.

En esta política, nos referimos conjuntamente como "Cookies y Tecnologías de Almacenamiento Local" a todos estos mecanismos técnicos.`
    },
    {
      id: '2',
      title: '2. ¿Necesita GARAGE pedir su consentimiento para usarlas? (Dictamen Legal)',
      content: `Conforme a la Directiva europea sobre Privacidad y Comunicaciones Electrónicas (Directiva ePrivacy 2002/58/CE, modificada por la Directiva 2009/136/CE, Art. 5.3), la doctrina del Comité Europeo de Protección de Datos (CEPD / EDPB) y las normativas de telecomunicaciones y protección de datos aplicables:

a) ALMACENAMIENTO ESTRICTAMENTE NECESARIO (TÉCNICO):
Las cookies o almacenamiento local cuyo único propósito sea la transmisión de una comunicación, o que sean ESTRICTAMENTE NECESARIOS para prestar un servicio expresamente solicitado por el usuario (como mantener abierta la sesión, recordar su tema visual o guardar temporalmente el kilometraje offline), ESTÁN EXENTOS del deber de obtener consentimiento previo. Por tanto, no se requiere un banner de bloqueo opt-in para su instalación técnica.

b) COOKIES DE ANALÍTICA, RASTREO Y PUBLICIDAD (TERCEROS):
Cualquier almacenamiento con fines de medición estadística externa (ej. Google Analytics, Amplitude), seguimiento publicitario o perfilado comercial requeriría OBLIGATORIAMENTE su consentimiento previo, granular e informado mediante un banner opt-in.

DECLARACIÓN OFICIAL DE GARAGE: En su versión actual, GARAGE ÚNICAMENTE UTILIZA ALMACENAMIENTO TÉCNICO ESTRICTAMENTE NECESARIO. La aplicación NO emplea cookies publicitarias, trackers de redes sociales ni comparte identificadores de dispositivo con intermediarios de mercadeo.`
    },
    {
      id: '3',
      title: '3. Detalle de Tecnologías y Claves de Almacenamiento Utilizadas',
      content: `A continuación se detallan los elementos de almacenamiento local operados por GARAGE:

1. Tokens de Autenticación Supabase (sb-*-auth-token):
- Tipo: Estrictamente Necesario / Seguridad.
- Función: Mantiene su sesión abierta de forma segura sin requerir que ingrese su contraseña cada vez que abre la aplicación.
- Persistencia: Hasta que el usuario presione "Cerrar Sesión".

2. Datos de Caché de Perfil y Piloto (@user_profile_data, @user_avatar_url):
- Tipo: Estrictamente Necesario / Rendimiento.
- Función: Permite que sus datos de contacto de emergencia y carnet se carguen de inmediato sin latencia en pantalla, incluso sin cobertura de red.

3. Sincronización de Moto y Telemetría (@selected_moto_id, @garage_motos_cache):
- Tipo: Estrictamente Necesario / Funcionalidad Offline.
- Función: Conserva en el dispositivo el odómetro y el estado de desgaste de componentes mecánicos para que pueda consultarlos en talleres o en carretera sin conexión a internet.

4. Registro de Auditoría de Consentimiento (@garage_legal_consent_audit):
- Tipo: Estrictamente Necesario / Cumplimiento Legal (Accountability).
- Función: Guarda constancia en el dispositivo del momento y la versión de Términos y Política de Privacidad aceptadas por el usuario.

5. Preferencias de Visualización (@theme_mode):
- Tipo: Preferencia / Técnico.
- Función: Recuerda su selección entre modo oscuro (Dark Mode para conducción nocturna) o modo claro.`
    },
    {
      id: '4',
      title: '4. ¿Cómo Deshabilitar o Eliminar el Almacenamiento Local?',
      content: `El Usuario puede gestionar o purgar estos datos en cualquier momento mediante las siguientes opciones:

a) Desde la Aplicación: Al presionar "Cerrar Sesión" en la pestaña de Perfil, se invalidan los tokens de sesión activos.
b) Desde los Ajustes del Sistema Operativo:
- En Android: Vaya a Ajustes > Aplicaciones > GARAGE > Almacenamiento > "Borrar Datos" / "Borrar Caché".
- En iOS: Desinstalando la aplicación se eliminan automáticamente todos los datos del contenedor sandbox en el dispositivo.
- En la Versión Web: Acceda a la configuración de su navegador (Chrome, Safari, Firefox, Edge) > Privacidad y Seguridad > Borrar datos de navegación > Cookies y datos de sitios web.

NOTA TÉCNICA: Si elimina o bloquea el almacenamiento estrictamente necesario, la aplicación no podrá mantener iniciada su sesión ni conservar sus cálculos mecánicos en modo sin conexión.`
    },
    {
      id: '5',
      title: '5. Actualizaciones de la Política de Cookies',
      content: `Si en el futuro GARAGE incorporase servicios analíticos o de publicidad que requieran consentimiento previo con arreglo a la normativa, actualizaremos esta política y desplegaremos el correspondiente Gestor / Banner de Consentimiento Opt-in antes de activar dichas tecnologías.`
    }
  ]
};
