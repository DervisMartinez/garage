# POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES

**Versión:** 1.0.0-2026  
**Fecha de Entrada en Vigor:** 15 de Octubre de 2026  
**Responsable del Tratamiento:** GARAGE Motos Inc. & Afiliados  
**Delegado de Protección de Datos (DPO):** privacidad@garageapp.io  

---

## 1. RESPONSABLE DEL TRATAMIENTO DE SUS DATOS
El responsable del tratamiento de los datos personales recabados a través de la aplicación móvil **GARAGE** es GARAGE Motos Inc., con canal oficial de protección de datos disponible en `privacidad@garageapp.io`.

Nos comprometemos a proteger su privacidad con apego estricto a los principios de licitud, lealtad, transparencia, limitación de la finalidad, minimización de datos, exactitud, limitación del plazo de conservación, integridad y confidencialidad exigidos por el **Reglamento General de Protección de Datos (RGPD - UE 2016/679)**, la **LOPDGDD** y los regímenes jurídicos de protección de datos de Iberoamérica.

---

## 2. CATEGORÍAS DE DATOS PERSONALES QUE RECOPILAMOS

### A. Datos Identificativos y de Contacto:
- Nombre y apellido del piloto.
- Dirección de correo electrónico y número telefónico.
- País, estado o ciudad de residencia.
- Número de documento de identidad oficial (Cédula de Identidad, DNI, Pasaporte).

### B. Datos Técnicos del Vehículo:
- Marca, modelo, año, placa/matrícula y número de serie/chasis.
- Kilometraje actual del odómetro y registro histórico de lecturas.
- Registro de gastos, consumos y costos de combustible.
- Historial de mantenimiento preventivo y correctivo de los 10 subsistemas mecánicos.

### C. Documentación Digitalizada (Billetera Vial):
- Archivos fotográficos y copias escaneadas de:
  - Licencia de Conducir.
  - Carnet de Circulación / Certificado de Título de Propiedad.
  - Póliza de Seguro de Responsabilidad Civil de Vehículos (RCV).
  - Certificado Médico Vial.

### D. Datos Sensibles y Especiales de Salud (Art. 9 RGPD):
- **Grupo y Factor Sanguíneo:** (ej. O+, A-, etc.). Este dato se trata exclusivamente con el fin humanitario de facilitar la asistencia médica de emergencia ante un siniestro vial.
- **Contactos de Emergencia:** Nombre, teléfono y correo electrónico de personas designadas por usted para ser notificadas en caso de colisión.

### E. Datos de Geolocalización y Sensores de Movimiento:
- Coordenadas de latitud y longitud satelital precisa (GPS).
- Datos inerciales de acelerómetro y giroscopio (deceleración g-force), procesados localmente para la detección de caídas y choques.

---

## 3. FINALIDADES Y BASES JURÍDICAS DEL TRATAMIENTO

| Finalidad del Tratamiento | Base Jurídica (RGPD) | Obligatoriedad |
| :--- | :--- | :--- |
| **Creación y gestión de la cuenta de usuario** | Ejecución de contrato (Art. 6.1.b) | Obligatorio |
| **Cálculo de telemetría y desgaste mecánico** | Ejecución de contrato (Art. 6.1.b) | Obligatorio |
| **Custodia de documentos en Billetera Vial** | Consentimiento explícito e inequívoco (Art. 6.1.a) | Opcional |
| **Tratamiento de Grupo Sanguíneo (Salud)** | **Consentimiento explícito reforzado (Art. 9.2.a)** | Opcional |
| **Despacho de coordenadas GPS en Crash SOS** | **Protección de intereses vitales (Art. 6.1.d / 9.2.c)** y consentimiento | Opcional |
| **Trazabilidad y auditoría de consentimientos** | Cumplimiento de obligación legal (Art. 6.1.c / 7.1) | Obligatorio |

---

## 4. SEGURIDAD, ALMACENAMIENTO Y CIFRADO
Implementamos salvaguardas técnicas y organizativas de nivel bancario:
1. **Cifrado de Credenciales:** Las contraseñas nunca se almacenan en texto plano; se protegen mediante funciones hash criptográficas irreversibles gestionadas por Supabase Auth.
2. **Políticas de Seguridad a Nivel de Fila (RLS):** La base de datos PostgreSQL implementa RLS estricto, aislando los registros para que ningún usuario pueda consultar ni manipular los datos de otro usuario.
3. **Cifrado en Tránsito:** Toda conexión entre la aplicación móvil y los servidores en la nube se realiza mediante canales seguros cifrados TLS 1.3 / HTTPS.
4. **Almacenamiento Seguro de Documentos:** Las imágenes de la Billetera se almacenan en Supabase Storage con acceso restringido exclusivamente mediante URLs firmadas con tokens de vida corta.

---

## 5. DESTINATARIOS Y TRANSFERENCIAS INTERNACIONALES
GARAGE no comercializa, no renta ni vende sus datos personales a agencias publicitarias. Únicamente se realizan comunicaciones en los siguientes supuestos:
1. **Proveedores de Infraestructura en la Nube:** Proveedores esenciales para la operación técnica de la plataforma (Supabase Inc. para base de datos y autenticación, y pasarelas de entrega de correo transaccional/emergencia).
2. **Contactos de Emergencia Designados:** Ante una alerta generada por el módulo Crash SOS, se transmitirán sus datos vitales y ubicación geográfica a los contactos configurados por el piloto.
3. **Requerimiento Judicial:** En caso de orden legal vinculante emitida por autoridad judicial o administrativa competente.

---

## 6. PLAZO DE CONSERVACIÓN DE LOS DATOS
Sus datos se conservarán mientras conserve activa su cuenta de usuario en GARAGE. Si solicita la baja o eliminación de su cuenta:
- Los datos de telemetría, vehículos y documentos de la billetera serán eliminados de los servidores en un plazo máximo de treinta (30) días.
- Se conservarán bloqueados únicamente los registros mínimos de auditoría exigidos por ley para la prescripción de responsabilidades legales o contractuales.

---

## 7. DERECHOS DEL USUARIO (DERECHOS ARCO / RGPD)
Usted tiene derecho a:
- **Acceso:** Solicitar confirmación sobre si estamos tratando sus datos y obtener copia íntegra de los mismos.
- **Rectificación:** Modificar cualquier dato inexacto o incompleto directamente desde la pestaña de Perfil.
- **Supresión ("Derecho al Olvido"):** Solicitar la eliminación total de su cuenta y de sus datos personales.
- **Limitación del Tratamiento y Oposición:** Oponerse al tratamiento o solicitar su limitación en las circunstancias tasadas por ley.
- **Portabilidad:** Recibir sus datos en formato estructurado, electrónico y de uso común (JSON/CSV).
- **Revocación del Consentimiento:** Retirar el consentimiento otorgado en cualquier momento, sin efectos retroactivos.

Para ejercer sus derechos, remita una solicitud por escrito a `privacidad@garageapp.io` indicando su nombre completo, correo asociado a la cuenta y derecho que desea ejercer.

---

## 8. PRIVACIDAD DE MENORES
GARAGE está dirigida exclusivamente a personas que hayan alcanzado la edad legal mínima para la conducción de motocicletas (mínimo 16 años según jurisdicción). No recopilamos conscientemente información de menores de dicha edad. Toda cuenta detectada que pertenezca a un menor sin tutela legal será cancelada de inmediato.

---

## 9. REGISTRO DE AUDITORÍA Y TRAZABILIDAD (ACCOUNTABILITY)
En cumplimiento del principio de responsabilidad proactiva (Artículo 7.1 del RGPD), el sistema conserva un registro inmutable con la marca de tiempo (timestamp ISO), versión documental aceptada, dirección IP y huella de dispositivo en el momento exacto en que el Usuario marcó activamente la casilla de verificación independiente de esta Política de Privacidad.
