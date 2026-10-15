# POLÍTICA DE COOKIES Y TECNOLOGÍAS DE ALMACENAMIENTO LOCAL

**Versión:** 1.0.0-2026  
**Fecha de Entrada en Vigor:** 15 de Octubre de 2026  
**Titular:** GARAGE Motos Inc. & Afiliados  
**Contacto:** privacidad@garageapp.io  

---

## 1. ¿QUÉ SON LAS COOKIES Y EL ALMACENAMIENTO LOCAL?
Una "cookie" es un fichero de datos que un servicio digital deposita en el navegador de un usuario para recordar información técnica, de sesión o de comportamiento.

En aplicaciones móviles desarrolladas con **React Native y Expo**, en lugar de cookies HTTP convencionales de navegador, se emplean tecnologías equivalentes de almacenamiento local seguro en el sandbox del sistema operativo (conocidas como `AsyncStorage`, `SecureStore` y SQLite en Android e iOS), así como Web Storage (`localStorage` y `sessionStorage`) en la versión para navegadores web.

A los efectos de esta Política y en concordancia con el marco normativo internacional, el término conjunto *"Cookies y Almacenamiento Local"* abarca a todos estos mecanismos.

---

## 2. DICTAMEN LEGAL: ¿POR QUÉ NO SE REQUIERE BANNER DE CONSENTIMIENTO PREVIO EN LA APP ACTUAL?

### Fundamentación Jurídica (Directiva ePrivacy 2002/58/CE, Art. 5.3 y LSSI Art. 22.2):
La legislación europea e internacional establece que el almacenamiento de información en el equipo del usuario requiere su consentimiento previo, **EXCEPTO** cuando se cumpla alguna de las dos siguientes condiciones de exención:
1. **Criterio de Exclusividad Técnica:** Cuando el almacenamiento tenga como fin exclusivo efectuar la transmisión de una comunicación.
2. **Criterio de Estricta Necesidad:** Cuando sea **estrictamente necesario para prestar un servicio expresamente solicitado por el usuario**.

### Aplicación al Ecosistema GARAGE:
**GARAGE ÚNICAMENTE EMPLEA ALMACENAMIENTO TÉCNICO ESTRICTAMENTE NECESARIO.**
- No se utilizan cookies analíticas de terceros (como Google Analytics publicitario).
- No se utilizan píxeles de remarketing (como Meta Pixel o TikTok Pixel).
- No se comercializan identificadores móviles para publicidad dirigida (IDFA / GAID).

Por lo tanto, la instalación de estas claves técnicas **está exenta de consentimiento previo opt-in**, siendo plenamente legal el inicio de la app sin bloquear la pantalla con un banner de cookies.

---

## 3. TABLA DETALLADA DE ALMACENAMIENTO LOCAL EN GARAGE

| Clave / Identificador | Tipo de Tecnología | Finalidad Técnica | Caducidad | ¿Exento de Consentimiento Previo? |
| :--- | :--- | :--- | :--- | :--- |
| `sb-*-auth-token` | Token JWT / Sesión | Mantiene abierta la sesión del piloto de forma segura sin reingresar contraseña en cada inicio. | Persistente hasta cerrar sesión | **SÍ (Estrictamente necesario)** |
| `@user_profile_data` | `AsyncStorage` | Guarda en caché el perfil del piloto (nombre, sangre, teléfono de auxilio) para acceso offline inmediato. | Persistente local | **SÍ (Estrictamente necesario)** |
| `@user_avatar_url` | `AsyncStorage` | Ruta local del avatar para evitar parpadeos de recarga. | Persistente local | **SÍ (Técnico / Rendimiento)** |
| `@selected_moto_id` | `AsyncStorage` | Identificador de la motocicleta activa en el garaje. | Persistente local | **SÍ (Estrictamente necesario)** |
| `@garage_legal_consent_audit` | `AsyncStorage` | Archivo histórico local de auditoría de los consentimientos legales otorgados por el usuario. | Persistente / Inmutable | **SÍ (Obligación Legal / RGPD Art. 7.1)** |
| `@garage_latest_legal_consent`| `AsyncStorage` | Copia del último consentimiento para validación rápida de versión. | Persistente | **SÍ (Obligación Legal)** |
| `@theme_mode` | `AsyncStorage` | Preferencia de interfaz (Modo Oscuro para noche vs Modo Claro para día). | Persistente | **SÍ (Preferencia del usuario)** |

---

## 4. CÓMO ELIMINAR O GESTIONAR EL ALMACENAMIENTO LOCAL

El usuario conserva el control absoluto sobre sus datos y puede borrarlos en cualquier momento:

### En Dispositivos Móviles Android:
1. Abra los **Ajustes** del teléfono.
2. Seleccione **Aplicaciones** > **GARAGE**.
3. Pulse en **Almacenamiento y Caché**.
4. Seleccione **"Borrar almacenamiento"** o **"Borrar caché"**.

### En Dispositivos Móviles iOS:
- La eliminación de la aplicación desinstala automáticamente todos los datos contenidos en el sandbox del dispositivo.

### En Navegadores Web (Versión Web):
- Acceda a la Configuración de su navegador (Chrome, Safari, Edge, Firefox) > **Privacidad y Seguridad** > **Borrar datos de navegación** > Marque **Cookies y otros datos de sitios**.

> **Nota:** La eliminación de los datos técnicos requerirá que el usuario vuelva a iniciar sesión con sus credenciales al reabrir la aplicación.

---

## 5. ACTUALIZACIONES DE ESTA POLÍTICA
En caso de que en futuras versiones se añadan herramientas de analítica web o publicidad de terceros, GARAGE actualizará esta política y desplegará un **Gestor de Preferencias de Cookies (CMP)** con casillas opt-in antes de activar cualquier rastreador no esencial.
