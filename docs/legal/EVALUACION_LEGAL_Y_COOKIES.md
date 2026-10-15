# DICTAMEN DE EVALUACIÓN LEGAL, PRIVACIDAD Y COOKIES
**Aplicación:** GARAGE — Telemetría Inteligente & Billetera Digital  
**Fecha de Dictamen:** 15 de Octubre de 2026  
**Ámbitos Normativos Evaluados:** RGPD (Reglamento UE 2016/679), Directiva ePrivacy (2002/58/CE y 2009/136/CE), LOPDGDD (España), LSSI (Art. 22.2), y Legislaciones Nacionales de Protección de Datos Personales en Latinoamérica (Colombia Ley 1581, México LFPDPPP, Chile, Venezuela Constitución Art. 60 y Ley de Infogobierno).

---

## 1. RESUMEN EJECUTIVO Y EVALUACIÓN DE RIESGOS

La aplicación **GARAGE** no es un software utilitario genérico; opera en la intersección de **telemetría predictiva mecánica**, **custodia digital de documentación oficial y de tránsito**, **sensores de hardware en tiempo real (Crash SOS)** y **datos de salud y emergencia**.

### Mapa de Datos Tratados y Nivel de Sensibilidad:
| Categoría de Datos | Ejemplos en GARAGE | Nivel de Riesgo Legal | Base Jurídica Requerida |
| :--- | :--- | :--- | :--- |
| **Identificativos y Cuenta** | Nombre, email, contraseña, país, estado, teléfono, Cédula/DNI | Medio | Ejecución Contractual (Art. 6.1.b RGPD) |
| **Vehiculares y Mecánicos** | Marca, modelo, año, placa, odómetro, consumos, historial de desgaste | Medio-Bajo | Ejecución Contractual |
| **Documentación Oficial** | Fotos de Licencia, Carnet de Circulación, Seguro RCV, Certificado Médico | **Alto** | Consentimiento Explícito (Art. 6.1.a RGPD) |
| **Datos Sensibles de Salud** | **Grupo Sanguíneo** (O+, A-, etc.) para rescate médico | **Muy Alto (Art. 9 RGPD)** | **Consentimiento Explícito e Inequívoco Reforzado (Art. 9.2.a RGPD)** |
| **Contactos de Emergencia** | Nombre, teléfono y correo de terceros designados por el piloto | **Alto** | Declaración de representación legítima del usuario |
| **Geolocalización en Tiempo Real** | Coordenadas GPS del impacto (Crash SOS) | **Alto** | Consentimiento + Intereses Vitales (Art. 6.1.d RGPD) |

---

## 2. ANÁLISIS JURÍDICO ESPECÍFICO: ¿NECESITO PEDIR CONSENTIMIENTO PARA USAR COOKIES?

### Pregunta del Desarrollador:
> *"¿Necesito pedir consentimiento para usar cookies en esta app?"*

### Dictamen Técnico-Legal Concluyente:
**EN LA CONFIGURACIÓN ACTUAL DE LA APP, NO SE REQUIERE UN BANNER DE BLOQUEO PREVIO (OPT-IN) PARA LAS COOKIES, PERO SÍ ES OBLIGATORIA LA POLÍTICA INFORMATIVA DE COOKIES Y ALMACENAMIENTO.**

A continuación se detalla la fundamentación jurídica:

### A. Distinción entre App Móvil Nativa y Entorno Web
1. **En Entorno Móvil Nativo (Android / iOS con React Native):**
   Las aplicaciones nativas no guardan cookies HTTP de navegación estándar en el dispositivo. En su lugar, utilizan contenedores de almacenamiento local en sandbox (`AsyncStorage`, SQLite, SharedPreferences o NSUserDefaults).
2. **En Entorno Web (`react-native-web`):**
   Se emplea `localStorage`, `sessionStorage` y cookies de sesión del cliente Supabase (`sb-*-auth-token`).
3. **Ámbito de la Directiva ePrivacy (Art. 5.3):**
   La ley aplica a **cualquier tecnología que almacene o recupere información en el equipo terminal del usuario**, lo que abarca tanto a las cookies HTTP como a `AsyncStorage` y `localStorage`.

### B. El Criterio de Exención Legal: ¿Cuándo NO se requiere consentimiento previo?
Conforme al Artículo 5.3 de la Directiva 2002/58/CE (modificada por la Directiva 2009/136/CE), al Artículo 22.2 de la LSSI en España y las Guías del Comité Europeo de Protección de Datos (CEPD / EDPB):
- **Exención por Necesidad Técnica:** No se requiere consentimiento previo cuando el almacenamiento o acceso sea:
  1. Con el fin exclusivo de efectuar la transmisión de una comunicación.
  2. **Estrictamente necesario para suministrar un servicio de la sociedad de la información expresamente solicitado por el abonado o usuario.**

#### ¿Qué almacena GARAGE actualmente?
- **Tokens de autenticación JWT de Supabase:** Necesarios para mantener al usuario autenticado. (Exento)
- **Caché de perfil y piloto (`@user_profile_data`):** Necesario para que la interfaz cargue sin latencia. (Exento)
- **Caché de motocicleta y telemetría (`@selected_moto_id`):** Necesario para el funcionamiento offline en garajes o carretera. (Exento)
- **Registro de auditoría legal (`@garage_legal_consent_audit`):** Obligación legal de trazabilidad. (Exento)
- **Preferencia de tema Claro/Oscuro:** Preferencia de interfaz solicitada por el usuario. (Exento)

**Conclusión:** Al tratarse de almacenamiento estrictamente necesario y técnico, **GARAGE está legalmente exenta de implementar un banner emergente de consentimiento previo de cookies**.

### C. ¿Cuándo SÍ sería obligatorio pedir consentimiento previo (Banner Opt-in)?
Si en futuras versiones la aplicación integra:
- SDKs de analítica externa (Google Analytics / Firebase Analytics con seguimiento publicitario, Mixpanel, Amplitude).
- Píxeles de conversión o retargeting (Meta Pixel, Google Tag Manager).
- Redes de anuncios publicitarios que lean el identificador de publicidad del móvil (IDFA en iOS o GAID en Android).

En dicho escenario, **será imperativo desplegar un banner opt-in granular previo** antes de inicializar esos scripts.

### D. La Obligación Legal Ineludible: Deber de Transparencia
Aunque no se requiera el banner de bloqueo, la ley exige **informar claramente de la existencia de este almacenamiento técnico**. Esto se cumple mediante la **Política de Cookies y Almacenamiento Local** redactada e integrada en la app.

---

## 3. DOCTRINA DEL CONSENTIMIENTO NO AGRUPADO (SEPARATE / UNBUNDLED CONSENT)

### El Requisito del Usuario:
> *"EN CADA FORMULARIO DOS CASILLAS SEPARADAS UNA PARA TERMINO Y CONDICIONES, OTRA PARA LA POLITICA DE PRIVACIDAD, NADA DE UN SOLO BOTON PARA AMBAS, PON UN LINK AL LADO DEL CHECK BOX"*

### Fundamento Jurídico:
El **Considerando 43 del RGPD** y las directrices del EDPB (Directrices 05/2020 sobre el consentimiento) sancionan expresamente el **"Consentimiento Atado" (Tying o Bundling)**:
1. **Naturalezas Jurídicas Distintas:**
   - **Términos y Condiciones:** Es el contrato de adhesión que regula las reglas del servicio, derechos de propiedad intelectual, pagos y descargos de responsabilidad mecánica.
   - **Política de Privacidad:** Es el instrumento mediante el cual el usuario consiente el tratamiento de sus datos personales y sensibles (salud, geolocalización, cédulas).
2. **Prohibición de "Un solo botón para todo":**
   Un botón que diga "Al registrarte aceptas los Términos y la Política" es considerado **consentimiento tácito o forzado**, inválido bajo el RGPD.
3. **Casillas de Verificación Independientes (Opt-in Activo):**
   - Casilla 1: [ ] Acepto los Términos y Condiciones.
   - Casilla 2: [ ] Acepto la Política de Privacidad y el tratamiento de datos sensibles.
   - Ninguna casilla debe estar pre-marcada por defecto.
   - Si una de las dos casillas no está marcada, el formulario debe rechazar el registro de manera informada.

---

## 4. PRINCIPIO DE RESPONSABILIDAD PROACTIVA (ACCOUNTABILITY): REGISTRO DE AUDITORÍA

El Artículo 7.1 del RGPD estipula:
> *"Cuando el tratamiento se base en el consentimiento, el responsable del tratamiento deberá ser capaz de demostrar que el interesado consintió el tratamiento de sus datos personales."*

Para dar cumplimiento pleno, GARAGE ha implementado el servicio `legalConsentService.ts` y la tabla Supabase `legal_consents`, capturando de manera inmutable:
1. **Quién:** Correo electrónico del usuario y UUID de cuenta.
2. **Cuándo:** Marca de tiempo ISO 8601 con hora y fecha exacta de marcación de casillas.
3. **Qué versión:** Versión exacta del texto de Términos (`v1.0.0-2026`) y de Privacidad (`v1.0.0-2026`).
4. **Cómo:** Método de consentimiento (`explicit_separate_opt_in`).
5. **Desde dónde:** Dirección IP pública y metadatos de hardware/sistema operativo (Marca, Modelo, SO).
6. **Almacenamiento Dual:**
   - En la nube: Registro en Supabase `legal_consents` y en `auth.users.user_metadata`.
   - En el dispositivo: Registro local en `AsyncStorage` (`@garage_legal_consent_audit`).
