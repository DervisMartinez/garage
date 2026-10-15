export const PRIVACY_POLICY = {
  title: 'Política de Privacidad y Tratamiento de Datos Personales',
  version: 'v1.0.0-2026',
  effectiveDate: '15 de Octubre de 2026',
  sections: [
    {
      id: '1',
      title: '1. Responsable del Tratamiento de sus Datos',
      content: `El responsable del tratamiento de los datos personales recabados a través de la aplicación GARAGE es GARAGE Motos Inc., con domicilio de contacto y canal de protección de datos disponible en privacidad@garageapp.io (en adelante, "GARAGE" o el "Responsable").

Nos comprometemos a proteger su privacidad con apego estricto a los más altos estándares internacionales, incluyendo el Reglamento General de Protección de Datos (RGPD / GDPR - UE 2016/679), la Ley Orgánica de Protección de Datos Personales (LOPDGDD) y las legislaciones nacionales de protección de datos aplicables en Latinoamérica.`
    },
    {
      id: '2',
      title: '2. Datos Personales que Recopilamos',
      content: `Recopilamos y tratamos las siguientes categorías de datos:
a) Datos de Identificación y Contacto: Nombre, apellido, dirección de correo electrónico, número de teléfono, país, estado/ciudad y número de documento de identidad (Cédula/DNI/Pasaporte).
b) Datos del Vehículo: Marca, modelo, año, placa/matrícula, kilometraje actual (odómetro), registro de mantenimientos, consumos y costos de combustible, e imágenes de la motocicleta.
c) Documentación Digitalizada (Billetera Vial): Fotografías y copias digitales de Licencia de Conducir, Carnet de Circulación / Título de Propiedad, Póliza de Seguro RCV y Certificado Médico Vial.
d) Datos Sensibles / Especiales de Salud: Tipo o grupo sanguíneo (ej. O+, A-, etc.) y datos de contacto de emergencia (nombre, teléfono y correo electrónico de personas designadas por usted).
e) Datos de Geolocalización y Sensores: Coordenadas precisas de latitud y longitud, así como telemetría de acelerómetros y giroscopios, capturados únicamente con ocasión de la activación del protocolo de detección de accidentes o registro voluntario de odómetro.`
    },
    {
      id: '3',
      title: '3. Finalidades y Bases Jurídicas del Tratamiento',
      content: `Tratamos sus datos con las siguientes finalidades y bases legales:
1. Ejecución de la Relación Contractual (Art. 6.1.b RGPD): Gestión de su cuenta de usuario, cálculo de telemetría de desgaste de componentes, administración del garaje de motocicletas y sincronización del odómetro.
2. Consentimiento Explícito del Usuario (Art. 6.1.a y Art. 9.2.a RGPD): Tratamiento de datos de salud (grupo sanguíneo) y custodia de imágenes de documentos personales en la Billetera Digital. Este consentimiento es libre, informado, inequívoco y otorgado de manera separada e independiente a los Términos y Condiciones.
3. Protección de Intereses Vitales (Art. 6.1.d y Art. 9.2.c RGPD): Envío de coordenadas GPS y datos vitales a contactos de emergencia designados y servicios de rescate ante un siniestro o impacto detectado por el módulo Crash SOS.
4. Cumplimiento de Obligaciones Legales y Trazabilidad (Art. 6.1.c RGPD): Conservación de registros de auditoría de los consentimientos otorgados y prevención del fraude informático.`
    },
    {
      id: '4',
      title: '4. Seguridad, Almacenamiento y Cifrado',
      content: `Implementamos medidas técnicas y organizativas de seguridad avanzadas:
- Las contraseñas se almacenan mediante algoritmos de cifrado irreversible (hashing con bcrypt/Argon2 provisto por Supabase Auth).
- La base de datos opera con Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS), asegurando que ningún usuario pueda consultar ni modificar los datos o documentos de otro usuario.
- Toda transmisión de datos entre la Aplicación y los servidores en la nube se ejecuta a través de canales seguros cifrados con protocolo TLS/HTTPS.
- Los documentos digitalizados se almacenan en contenedores aislados (Supabase Storage Blobs) con acceso restringido únicamente al usuario titular mediante tokens de sesión autenticados.`
    },
    {
      id: '5',
      title: '5. Destinatarios y Transferencias de Datos',
      content: `Sus datos personales NO son comercializados, vendidos ni cedidos a terceros con fines publicitarios. Sus datos únicamente se comunican a:
a) Proveedores de Infraestructura en la Nube: Proveedores tecnológicos esenciales para el funcionamiento de la plataforma (Supabase Inc. para base de datos y autenticación, y proveedores de entrega de correos para alertas de emergencia).
b) Contactos de Emergencia Designados: En caso de que se active el sistema de detección de colisiones, sus coordenadas geográficas, nombre y grupo sanguíneo se transmitirán a los contactos que usted configuró previamente.
c) Autoridades Competentes: Cuando sea requerido por mandato judicial o mandamiento legal vinculante.`
    },
    {
      id: '6',
      title: '6. Plazo de Conservación de los Datos',
      content: `Sus datos personales se conservarán mientras mantenga activa su cuenta en GARAGE. Si decide eliminar su cuenta, sus datos personales, historial de motocicletas y documentos digitalizados serán eliminados de manera segura y definitiva de nuestras bases de datos en un plazo máximo de 30 días, salvo aquellos datos que debamos conservar bloqueados durante los plazos legalmente exigibles para la prescripción de responsabilidades.`
    },
    {
      id: '7',
      title: '7. Derechos del Usuario (Derechos ARCO / RGPD)',
      content: `Como titular de los datos personales, usted ostenta los siguientes derechos:
- Acceso: Conocer qué datos personales tratamos sobre usted.
- Rectificación: Modificar datos inexactos o incompletos directamente desde la pestaña de Perfil o mediante solicitud.
- Supresión / Cancelación ("Derecho al Olvido"): Solicitar la eliminación total de sus datos personales y documentos.
- Limitación del Tratamiento y Oposición: Oponerse al tratamiento o solicitar su limitación en casos previstos por la ley.
- Portabilidad: Recibir sus datos personales en un formato estructurado, de uso común y lectura mecánica (JSON/CSV).
- Revocación del Consentimiento: Retirar en cualquier momento el consentimiento otorgado previamente, sin que ello afecte la licitud del tratamiento anterior.

Para ejercer cualquiera de estos derechos, envíe una comunicación a privacidad@garageapp.io indicando su nombre completo y el correo vinculado a su cuenta.`
    },
    {
      id: '8',
      title: '8. Privacidad de Menores de Edad',
      content: `La Aplicación está dirigida exclusivamente a personas mayores de 16 años (o la mayoría de edad legal para conducción de motocicletas aplicable en su país). No recopilamos conscientemente datos de menores de dicha edad. En caso de detectarse el registro de un menor sin la correspondiente representación legal, se procederá a cancelar la cuenta y purgar sus datos de inmediato.`
    },
    {
      id: '9',
      title: '9. Registro y Auditoría del Consentimiento',
      content: `De conformidad con el principio de responsabilidad proactiva (Accountability), GARAGE mantiene un registro electrónico seguro y trazable que acredita el momento exacto (fecha, hora UTC), versión documental, identificador de dispositivo y dirección IP desde la cual el Usuario marcó voluntariamente las casillas de aceptación de esta Política de Privacidad y de los Términos y Condiciones.`
    }
  ]
};
