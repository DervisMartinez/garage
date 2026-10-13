import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Modal, 
  Dimensions, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMyMoto } from '../../context/MotoContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../../data/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type StatusFilter = 'all' | 'valid' | 'expiring' | 'expired';

interface DocStatus {
  status: 'valid' | 'expiring' | 'expired' | 'permanent';
  label: string;
  badgeBg: string;
  badgeColor: string;
  daysRemaining?: number;
}

interface ParsedDoc {
  cleanTitle: string;
  expiryDate?: string;
  docNumber?: string;
  qrData?: string;
}

export const WalletTab = () => {
  const { myMoto } = useMyMoto();
  const { colors, mode } = useTheme();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Card viewing and expand
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
  // Modals
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Document form fields for REAL data
  const [formTitle, setFormTitle] = useState('Carnet de Circulación');
  const [formDocType, setFormDocType] = useState<'moto' | 'user'>('moto');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsPermanent, setFormIsPermanent] = useState(false);
  const [formQrData, setFormQrData] = useState('');
  const [formImageUri, setFormImageUri] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Quick edit modal
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editDocNumber, setEditDocNumber] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editIsPermanent, setEditIsPermanent] = useState(false);

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserData(data.user);
        loadDocuments(data.user.id);
      }
    });
  }, [myMoto?.id]);

  const loadDocuments = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (data) {
        setDocuments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to parse metadata stored in title: "Title || Expiry || DocNumber || QrData"
  const parseDocTitle = (rawTitle: string): ParsedDoc => {
    if (!rawTitle) return { cleanTitle: 'Documento' };
    const parts = rawTitle.split('||').map(p => p.trim());
    return {
      cleanTitle: parts[0] || 'Documento',
      expiryDate: parts[1] || undefined,
      docNumber: parts[2] || undefined,
      qrData: parts[3] || undefined,
    };
  };

  // Helper to compute document expiration status
  const getDocumentStatus = (doc: any): DocStatus => {
    const parsed = parseDocTitle(doc.title);
    const expiryStr = parsed.expiryDate || doc.expires_at;

    const lower = parsed.cleanTitle.toLowerCase();
    if (lower.includes('título') || lower.includes('titulo') || parsed.expiryDate === 'PERMANENTE') {
      return {
        status: 'permanent',
        label: 'Permanente',
        badgeBg: 'rgba(255,255,255,0.22)',
        badgeColor: '#FFFFFF',
      };
    }

    if (!expiryStr) {
      return {
        status: 'valid',
        label: 'Sin Vencimiento',
        badgeBg: 'rgba(48, 209, 88, 0.3)',
        badgeColor: '#30D158',
      };
    }

    const expiry = new Date(expiryStr);
    if (isNaN(expiry.getTime())) {
      return {
        status: 'valid',
        label: 'Registrado',
        badgeBg: 'rgba(48, 209, 88, 0.3)',
        badgeColor: '#30D158',
      };
    }

    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: `Vencido (${Math.abs(diffDays)}d)`,
        badgeBg: 'rgba(255, 69, 58, 0.35)',
        badgeColor: '#FF453A',
        daysRemaining: diffDays,
      };
    }

    if (diffDays <= 30) {
      return {
        status: 'expiring',
        label: `Vence en ${diffDays}d`,
        badgeBg: 'rgba(255, 149, 0, 0.35)',
        badgeColor: '#FF9500',
        daysRemaining: diffDays,
      };
    }

    const formattedDate = expiry.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return {
      status: 'valid',
      label: `Vence: ${formattedDate}`,
      badgeBg: 'rgba(48, 209, 88, 0.3)',
      badgeColor: '#30D158',
      daysRemaining: diffDays,
    };
  };

  // Open Live QR Scanner
  const handleOpenScanner = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para escanear el código QR de tus documentos.');
        return;
      }
    }
    setScannerVisible(true);
  };

  // Handle scanned QR Code
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScannerVisible(false);

    // Heuristics to extract real data from transit / vehicle QR code
    let detectedTitle = 'Documento Escaneado';
    let detectedDocNum = '';
    let detectedExpiry = '';
    let isMotoDoc: 'moto' | 'user' = 'moto';

    const raw = data.trim();

    // Check if INTT or transit doc
    if (raw.toLowerCase().includes('intt') || raw.toLowerCase().includes('vehiculo') || raw.toLowerCase().includes('placa')) {
      detectedTitle = 'Carnet de Circulación / INTT';
      isMotoDoc = 'moto';
    } else if (raw.toLowerCase().includes('seguro') || raw.toLowerCase().includes('rcv') || raw.toLowerCase().includes('poliza')) {
      detectedTitle = 'Póliza Seguro / RCV';
      isMotoDoc = 'moto';
    } else if (raw.toLowerCase().includes('licencia') || raw.toLowerCase().includes('conducir')) {
      detectedTitle = 'Licencia de Conducir';
      isMotoDoc = 'user';
    } else if (raw.toLowerCase().includes('medico') || raw.toLowerCase().includes('salud')) {
      detectedTitle = 'Certificado Médico';
      isMotoDoc = 'user';
    }

    // Try finding dates YYYY-MM-DD or DD/MM/YYYY
    const dateMatch = raw.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})/);
    const dateMatchAlt = raw.match(/(\d{2}[-/.]\d{2}[-/.]\d{4})/);
    if (dateMatch) {
      detectedExpiry = dateMatch[1].replace(/\//g, '-').replace(/\./g, '-');
    } else if (dateMatchAlt) {
      const parts = dateMatchAlt[1].split(/[-/.]/);
      detectedExpiry = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    // Try finding document serial / license number
    const numMatch = raw.match(/(?:N°|No|NUM|DOC|REG|PLACA|V-|E-|J-)[:\s]*([A-Z0-9.-]{4,20})/i);
    if (numMatch) {
      detectedDocNum = numMatch[1].trim();
    } else if (!raw.startsWith('http') && raw.length < 25) {
      detectedDocNum = raw;
    }

    // Fill registration form with real data
    setFormTitle(detectedTitle);
    setFormDocType(isMotoDoc);
    setFormDocNumber(detectedDocNum);
    setFormExpiryDate(detectedExpiry);
    setFormIsPermanent(false);
    setFormQrData(raw);
    setFormImageUri(null);

    // Open form modal to confirm and optionally add photo
    setShowFormModal(true);
    Alert.alert(
      'Código QR Detectado', 
      'Se han extraído los datos del código QR. Verifica la información y añade una foto si lo deseas.'
    );
  };

  // Select Photo from Library
  const handlePickImage = async () => {
    setShowOptionsModal(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setFormImageUri(result.assets[0].uri);
        setShowFormModal(true);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  // Take Photo with Camera
  const handleTakePhoto = async () => {
    setShowOptionsModal(false);
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso necesario', 'Debes permitir el acceso a la cámara para fotografiar el documento.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setFormImageUri(result.assets[0].uri);
        setShowFormModal(true);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo activar la cámara');
    }
  };

  // Save the Document with REAL inputs
  const handleSaveDocument = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresa el título o tipo de documento.');
      return;
    }

    if (!userData?.id) {
      Alert.alert('Error', 'Sesión de usuario no detectada.');
      return;
    }

    setUploading(true);
    try {
      let finalPublicUrl: string | null = null;

      // Upload actual photo if user selected one
      if (formImageUri) {
        const ext = formImageUri.substring(formImageUri.lastIndexOf('.') + 1) || 'jpg';
        const fileName = `${Math.random().toString(36).substring(7)}.${ext}`;
        const path = `${userData.id}/${fileName}`;

        const blob = await (await fetch(formImageUri)).blob();
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, blob, { contentType: `image/${ext}` });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
        finalPublicUrl = publicUrl;
      }

      // Format encoded title: "Title || Expiry || DocNumber || QrData"
      const expValue = formIsPermanent ? 'PERMANENTE' : (formExpiryDate.trim() || 'INDEFINIDO');
      const docNumValue = formDocNumber.trim() || 'S/N';
      const qrValue = formQrData.trim() || '';

      const compoundTitle = `${formTitle.trim()} || ${expValue} || ${docNumValue} || ${qrValue}`;

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: userData.id,
        moto_id: formDocType === 'moto' ? (myMoto ? myMoto.id : null) : null,
        title: compoundTitle,
        type: formDocType,
        image_url: finalPublicUrl
      });

      if (dbError) throw dbError;

      await loadDocuments(userData.id);
      setShowFormModal(false);
      // Reset form
      setFormTitle('Carnet de Circulación');
      setFormDocNumber('');
      setFormExpiryDate('');
      setFormIsPermanent(false);
      setFormQrData('');
      setFormImageUri(null);

      Alert.alert('Éxito', 'Documento guardado con sus datos reales en tu Guantera Digital.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el documento.');
    } finally {
      setUploading(false);
    }
  };

  // Open Edit Expiration / Document Number Modal
  const handleOpenEdit = (doc: any) => {
    const parsed = parseDocTitle(doc.title);
    setEditingDoc(doc);
    setEditDocNumber(parsed.docNumber && parsed.docNumber !== 'S/N' ? parsed.docNumber : '');
    setEditIsPermanent(parsed.expiryDate === 'PERMANENTE');
    setEditExpiryDate(parsed.expiryDate && parsed.expiryDate !== 'PERMANENTE' && parsed.expiryDate !== 'INDEFINIDO' ? parsed.expiryDate : '');
  };

  // Save Edits to existing document
  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    try {
      const parsed = parseDocTitle(editingDoc.title);
      const expValue = editIsPermanent ? 'PERMANENTE' : (editExpiryDate.trim() || 'INDEFINIDO');
      const docNumValue = editDocNumber.trim() || 'S/N';
      const qrValue = parsed.qrData || '';

      const compoundTitle = `${parsed.cleanTitle} || ${expValue} || ${docNumValue} || ${qrValue}`;

      await supabase.from('documents').update({ title: compoundTitle }).eq('id', editingDoc.id);
      if (userData) await loadDocuments(userData.id);
      setEditingDoc(null);
      Alert.alert('Actualizado', 'Datos del documento actualizados correctamente.');
    } catch (e) {
      Alert.alert('Error', 'No se pudieron actualizar los datos del documento.');
    }
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    Alert.alert('Eliminar Documento', '¿Estás seguro que deseas eliminar este documento de tu billetera?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await supabase.from('documents').delete().eq('id', id);
          if (userData) loadDocuments(userData.id);
          setExpandedCardId(null);
      }}
    ]);
  };

  // Style cards dynamically
  const getCardStyle = (rawTitle: string) => {
    const title = rawTitle.split('||')[0].trim().toLowerCase();
    if (title.includes('licencia')) return { colors: ['#4facfe', '#00f2fe'], icon: 'badge' };
    if (title.includes('médico') || title.includes('medico')) return { colors: ['#43e97b', '#38f9d7'], icon: 'medical-services' };
    if (title.includes('seguro') || title.includes('rcv') || title.includes('póliza')) return { colors: ['#fa709a', '#fee140'], icon: 'security' };
    if (title.includes('título') || title.includes('titulo') || title.includes('carnet') || title.includes('circulación')) return { colors: ['#667eea', '#764ba2'], icon: 'description' };
    return { colors: ['#30cfd0', '#330867'], icon: 'folder' };
  };

  // Filter calculations
  const counts = {
    all: documents.length,
    valid: documents.filter(d => {
      const s = getDocumentStatus(d).status;
      return s === 'valid' || s === 'permanent';
    }).length,
    expiring: documents.filter(d => getDocumentStatus(d).status === 'expiring').length,
    expired: documents.filter(d => getDocumentStatus(d).status === 'expired').length,
  };

  const filteredDocuments = documents.filter(doc => {
    if (statusFilter === 'all') return true;
    const st = getDocumentStatus(doc).status;
    if (statusFilter === 'valid') return st === 'valid' || st === 'permanent';
    if (statusFilter === 'expiring') return st === 'expiring';
    if (statusFilter === 'expired') return st === 'expired';
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      
      {/* HEADER: Guantera Digital y Acciones */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 28, fontFamily: F.bold, color: colors.onSurface, letterSpacing: -0.5 }}>
              Documentos
            </Text>
            <Text style={{ fontSize: 13, fontFamily: F.medium, color: colors.onSurfaceVariant, marginTop: 2 }}>
              Tus Documentos de Circulación Nacional 
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Botón Lector QR Activo */}
            <TouchableOpacity 
              onPress={handleOpenScanner}
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
              activeOpacity={0.7}
              accessibilityLabel="Escanea el Código QR"
            >
              <MaterialIcons name="qr-code-scanner" size={22} color={colors.primary} />
              {counts.expiring > 0 && (
                <View style={[styles.statusNotificationDot, { backgroundColor: '#FF9500' }]} />
              )}
            </TouchableOpacity>

            {/* Botón Añadir Documento */}
            <TouchableOpacity 
              onPress={() => setShowOptionsModal(true)}
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
              activeOpacity={0.7}
              accessibilityLabel="Añadir Documento Nuevo"
            >
              <MaterialIcons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SUBMENU SEGMENTADO TIPO APPLE */}
        <View style={[styles.filterBar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            style={[styles.filterPill, statusFilter === 'all' && { backgroundColor: colors.surfaceContainerHigh }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, { color: colors.onSurface, fontFamily: statusFilter === 'all' ? F.bold : F.medium }]}>
              Todos ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter('valid')}
            style={[styles.filterPill, statusFilter === 'valid' && { backgroundColor: colors.surfaceContainerHigh }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, { color: statusFilter === 'valid' ? colors.onSurface : colors.onSurfaceVariant, fontFamily: statusFilter === 'valid' ? F.bold : F.medium }]}>
              Vigentes <Text style={{ color: colors.secondary, fontFamily: F.bold }}>({counts.valid})</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter('expiring')}
            style={[styles.filterPill, statusFilter === 'expiring' && { backgroundColor: colors.surfaceContainerHigh }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, { color: statusFilter === 'expiring' ? colors.onSurface : colors.onSurfaceVariant, fontFamily: statusFilter === 'expiring' ? F.bold : F.medium }]}>
              Por Vencer <Text style={{ color: '#FF9500', fontFamily: F.bold }}>({counts.expiring})</Text>
            </Text>
          </TouchableOpacity>

          {counts.expired > 0 && (
            <TouchableOpacity
              onPress={() => setStatusFilter('expired')}
              style={[styles.filterPill, statusFilter === 'expired' && { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, { color: statusFilter === 'expired' ? colors.onSurface : colors.onSurfaceVariant, fontFamily: statusFilter === 'expired' ? F.bold : F.medium }]}>
                Vencidos <Text style={{ color: colors.error, fontFamily: F.bold }}>({counts.expired})</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        {uploading && (
          <View style={{ backgroundColor: colors.primaryContainer, padding: 14, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
            <Text style={{ fontFamily: F.bold, color: colors.onPrimaryContainer, marginLeft: 12 }}>Procesando y guardando documento...</Text>
          </View>
        )}

        {filteredDocuments.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40, backgroundColor: colors.surfaceContainerLow, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.outline, marginTop: 20 }}>
            <MaterialIcons name="folder-open" size={56} color={colors.onSurfaceVariant} />
            <Text style={{ fontFamily: F.bold, color: colors.onSurface, marginTop: 12, fontSize: 16 }}>
              {statusFilter === 'all' ? 'Tu billetera está vacía' : `Sin documentos en esta categoría`}
            </Text>
            <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center', fontSize: 13 }}>
              {statusFilter === 'all' ? 'Usa el escáner QR o el botón + para añadir los documentos reales de tu vehículo.' : 'Cambia de filtro para ver tus otros documentos.'}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={handleOpenScanner}
                style={[styles.emptyActionBtn, { backgroundColor: colors.surfaceContainer }]}
              >
                <MaterialIcons name="qr-code-scanner" size={18} color={colors.primary} />
                <Text style={{ fontFamily: F.bold, color: colors.primary, fontSize: 12, marginLeft: 6 }}>Escanear QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowOptionsModal(true)}
                style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="add-a-photo" size={18} color={colors.onPrimary} />
                <Text style={{ fontFamily: F.bold, color: colors.onPrimary, fontSize: 12, marginLeft: 6 }}>Tomar Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 6, paddingBottom: expandedCardId ? 30 : 150 }}>
            {filteredDocuments.map((doc, index) => {
              const isExpanded = expandedCardId === doc.id;
              const isAnyExpanded = expandedCardId !== null;
              const cardData = getCardStyle(doc.title);
              const parsed = parseDocTitle(doc.title);
              const docStatus = getDocumentStatus(doc);
              
              const vehicleSubtitle = doc.type === 'moto' 
                ? (myMoto ? `${myMoto.brand} ${myMoto.model}` : 'Vehículo Registrado')
                : 'Documento Personal del Conductor';

              // Apple Wallet stacking logic
              const marginTop = isExpanded ? 20 : (isAnyExpanded ? 20 : (index === 0 ? 0 : -140));
              const display = isAnyExpanded && !isExpanded ? 'none' : 'flex';

              return (
                <TouchableOpacity 
                  key={doc.id} 
                  activeOpacity={0.92}
                  onPress={() => setExpandedCardId(isExpanded ? null : doc.id)}
                  style={{ 
                    marginTop, 
                    display: display as any, 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: -4 }, 
                    shadowOpacity: 0.22, 
                    shadowRadius: 16, 
                    elevation: 12 
                  }}
                >
                  <LinearGradient
                    colors={cardData.colors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      minHeight: 230,
                      borderRadius: 24,
                      padding: 22,
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* Card Top: Title, Vehicle Type, Status Pill */}
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 20, letterSpacing: -0.3 }}>{parsed.cleanTitle}</Text>
                          <Text style={{ fontFamily: F.semibold, color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 4 }}>
                            {vehicleSubtitle}
                          </Text>
                          {parsed.docNumber && parsed.docNumber !== 'S/N' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <MaterialIcons name="fingerprint" size={13} color="rgba(255,255,255,0.85)" />
                              <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 11, marginLeft: 4, letterSpacing: 0.5 }}>
                                N° {parsed.docNumber}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', padding: 8, borderRadius: 14 }}>
                          <MaterialIcons name={cardData.icon as any} size={26} color="#FFF" />
                        </View>
                      </View>

                      {/* Status Badge Capsule */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: docStatus.badgeBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginTop: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.35)' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: docStatus.badgeColor, marginRight: 6 }} />
                        <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 11 }}>
                          {docStatus.label}
                        </Text>
                      </View>
                    </View>

                    {/* Card Bottom: Action buttons when expanded */}
                    {isExpanded && (
                      <View style={{ marginTop: 16 }}>
                        {/* QR Info Banner if available */}
                        {parsed.qrData && (
                          <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                              <MaterialIcons name="qr-code" size={18} color="#FFF" />
                              <Text style={{ fontFamily: F.medium, color: '#FFF', fontSize: 11, marginLeft: 6 }} numberOfLines={1}>
                                QR Certificado: {parsed.qrData}
                              </Text>
                            </View>
                            {parsed.qrData.startsWith('http') && (
                              <TouchableOpacity onPress={() => Linking.openURL(parsed.qrData!)} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8 }}>
                                <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 10 }}>Abrir</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {doc.image_url && (
                              <TouchableOpacity 
                                onPress={() => setSelectedDocImage(doc.image_url)}
                                style={styles.cardActionPill}
                                activeOpacity={0.8}
                              >
                                <MaterialIcons name="visibility" size={16} color="#FFF" />
                                <Text style={{ fontFamily: F.bold, color: '#FFF', marginLeft: 6, fontSize: 12 }}>Ver Foto</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity 
                              onPress={() => handleOpenEdit(doc)}
                              style={styles.cardActionPill}
                              activeOpacity={0.8}
                            >
                              <MaterialIcons name="edit" size={16} color="#FFF" />
                              <Text style={{ fontFamily: F.bold, color: '#FFF', marginLeft: 6, fontSize: 12 }}>Editar Datos</Text>
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity 
                            onPress={() => deleteDocument(doc.id)}
                            style={[styles.cardActionPill, { backgroundColor: 'rgba(255,69,58,0.3)', borderColor: 'rgba(255,69,58,0.5)' }]}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons name="delete" size={16} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL: Escáner QR en Vivo */}
      <Modal visible={scannerVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417', 'code128', 'ean13', 'code39'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          
          {/* Overlay UI para el escáner */}
          <View style={styles.scannerOverlay}>
            {/* Top Bar */}
            <View style={styles.scannerTopBar}>
              <TouchableOpacity 
                onPress={() => setScannerVisible(false)}
                style={styles.scannerCircleBtn}
              >
                <MaterialIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 17 }}>
                Escanear Documento
              </Text>

              <TouchableOpacity 
                onPress={() => setTorchOn(!torchOn)}
                style={[styles.scannerCircleBtn, torchOn && { backgroundColor: '#FFD60A' }]}
              >
                <MaterialIcons name={torchOn ? 'flash-on' : 'flash-off'} size={22} color={torchOn ? '#000' : '#FFF'} />
              </TouchableOpacity>
            </View>

            {/* Target Box */}
            <View style={styles.scannerTargetBox}>
              <View style={[styles.targetCorner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.targetCorner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
              <View style={[styles.targetCorner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.targetCorner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
            </View>

            {/* Bottom Instruction */}
            <View style={styles.scannerBottomBar}>
              <Text style={{ fontFamily: F.semibold, color: '#FFF', fontSize: 14, textAlign: 'center' }}>
                Apunta la cámara hacia el código QR de tu Carnet de Circulación, Póliza o Licencia
              </Text>
              <Text style={{ fontFamily: F.regular, color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                Los datos reales serán capturados automáticamente
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Seleccionar Modo de Añadir Documento */}
      <Modal visible={showOptionsModal} transparent={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surfaceContainerLow, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
            <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 16 }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 20 }}>Añadir Documentación</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 20 }}>
              ¿Cómo deseas registrar la documentación de tu vehículo?
            </Text>

            <View style={{ gap: 12 }}>
              {/* Opción 1: Escanear QR */}
              <TouchableOpacity 
                onPress={() => {
                  setShowOptionsModal(false);
                  handleOpenScanner();
                }}
                style={[styles.addOptionCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.7}
              >
                <View style={[styles.addOptionIconBox, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
                  <MaterialIcons name="qr-code-scanner" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Escanear Código QR</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Captura los datos oficiales del código QR de tu documento
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 2: Tomar Foto con Cámara */}
              <TouchableOpacity 
                onPress={handleTakePhoto}
                style={[styles.addOptionCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.7}
              >
                <View style={[styles.addOptionIconBox, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                  <MaterialIcons name="camera-alt" size={26} color="#30D158" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Tomar Foto con Cámara</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Fotografía tu documento físico e ingresa sus datos reales
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 3: Subir de Galería */}
              <TouchableOpacity 
                onPress={handlePickImage}
                style={[styles.addOptionCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.7}
              >
                <View style={[styles.addOptionIconBox, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
                  <MaterialIcons name="photo-library" size={26} color="#FF9500" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Elegir de la Galería</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Selecciona una foto guardada de tu documento
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 4: Registro Manual sin foto inmediata */}
              <TouchableOpacity 
                onPress={() => {
                  setShowOptionsModal(false);
                  setFormImageUri(null);
                  setShowFormModal(true);
                }}
                style={[styles.addOptionCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.7}
              >
                <View style={[styles.addOptionIconBox, { backgroundColor: 'rgba(175,82,222,0.15)' }]}>
                  <MaterialIcons name="edit-note" size={26} color="#AF52DE" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Ingresar Datos Manuales</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Registra los números y vigencia sin adjuntar foto ahora
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 26 }} />
          </View>
        </View>
      </Modal>

      {/* MODAL: Formulario de Datos Reales del Documento */}
      <Modal visible={showFormModal} transparent={true} animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: colors.surfaceContainerLow, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', padding: 24, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
            <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 14 }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 20 }}>Datos Reales del Documento</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              {/* Vista previa de foto si existe */}
              {formImageUri && (
                <View style={{ marginBottom: 16, alignItems: 'center' }}>
                  <Image source={{ uri: formImageUri }} style={{ width: '100%', height: 160, borderRadius: 16, backgroundColor: colors.surfaceContainer }} resizeMode="cover" />
                  <TouchableOpacity 
                    onPress={() => setFormImageUri(null)}
                    style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 16 }}
                  >
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Selector de Tipo de Documento */}
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: F.bold }]}>Tipo de Documento:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Carnet de Circulación', type: 'moto' as const },
                  { label: 'Título de Propiedad', type: 'moto' as const, perm: true },
                  { label: 'Seguro / RCV', type: 'moto' as const },
                  { label: 'Licencia de Conducir', type: 'user' as const },
                  { label: 'Certificado Médico', type: 'user' as const },
                  { label: 'Revisión Técnica', type: 'moto' as const },
                ].map(item => {
                  const isSelected = formTitle === item.label;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => {
                        setFormTitle(item.label);
                        setFormDocType(item.type);
                        if (item.perm) setFormIsPermanent(true);
                      }}
                      style={[
                        styles.chipBtn,
                        { borderColor: colors.outlineVariant, backgroundColor: isSelected ? colors.primary : colors.surfaceContainer }
                      ]}
                    >
                      <Text style={{ fontFamily: F.bold, fontSize: 12, color: isSelected ? colors.onPrimary : colors.onSurface }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Campo: Título Personalizado */}
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: F.bold }]}>Nombre o Título:</Text>
              <TextInput 
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Ej. Carnet de Circulación"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[styles.inputBox, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]}
              />

              {/* Campo: N° de Documento / Registro */}
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: F.bold, marginTop: 14 }]}>
                N° de Documento / Trámite / Serial (Real):
              </Text>
              <TextInput 
                value={formDocNumber}
                onChangeText={setFormDocNumber}
                placeholder="Ej. V-28.192.831 o N° 0482910"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[styles.inputBox, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]}
              />

              {/* Vigencia / Fecha de Vencimiento */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: F.bold, marginBottom: 0 }]}>
                  Fecha de Vencimiento:
                </Text>

                <TouchableOpacity 
                  onPress={() => setFormIsPermanent(!formIsPermanent)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: formIsPermanent ? colors.secondaryContainer : colors.surfaceContainer, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}
                >
                  <MaterialIcons name={formIsPermanent ? "check-box" : "check-box-outline-blank"} size={18} color={formIsPermanent ? colors.secondary : colors.onSurfaceVariant} />
                  <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurface, marginLeft: 6 }}>Permanente</Text>
                </TouchableOpacity>
              </View>

              {!formIsPermanent && (
                <>
                  <TextInput 
                    value={formExpiryDate}
                    onChangeText={setFormExpiryDate}
                    placeholder="AAAA-MM-DD (Ej. 2026-12-31)"
                    placeholderTextColor={colors.onSurfaceVariant}
                    style={[styles.inputBox, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium }]}
                  />

                  {/* Botones de sugerencia de vigencia rápida */}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {[
                      { label: '+6 Meses', months: 6 },
                      { label: '+1 Año', months: 12 },
                      { label: '+2 Años', months: 24 },
                      { label: '+5 Años', months: 60 },
                    ].map(btn => (
                      <TouchableOpacity
                        key={btn.label}
                        onPress={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + btn.months);
                          setFormExpiryDate(d.toISOString().split('T')[0]);
                        }}
                        style={[styles.quickDateBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                      >
                        <Text style={{ fontFamily: F.semibold, fontSize: 11, color: colors.primary }}>{btn.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* QR Data Info si fue capturado */}
              {formQrData ? (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(0,122,255,0.1)', borderRadius: 14, borderWidth: 0.5, borderColor: colors.primary }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="verified" size={18} color={colors.primary} />
                    <Text style={{ fontFamily: F.bold, color: colors.primary, fontSize: 12, marginLeft: 6 }}>Código QR Certificado</Text>
                  </View>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurface, fontSize: 11, marginTop: 4 }} numberOfLines={2}>
                    {formQrData}
                  </Text>
                </View>
              ) : null}

              {/* Botón Guardar */}
              <TouchableOpacity
                onPress={handleSaveDocument}
                disabled={uploading}
                style={[styles.saveMainBtn, { backgroundColor: colors.primary, marginTop: 22 }]}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={{ fontFamily: F.bold, color: colors.onPrimary, fontSize: 16 }}>Guardar en Billetera</Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: Editar Fecha / N° de Documento Existente */}
      <Modal visible={!!editingDoc} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: colors.surfaceContainerLow, borderRadius: 28, padding: 24, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
            <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 16 }} />
            
            <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 18, textAlign: 'center' }}>
              Editar Datos del Documento
            </Text>
            <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 18 }}>
              {editingDoc ? parseDocTitle(editingDoc.title).cleanTitle : ''}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: F.bold }]}>
              N° de Documento Real:
            </Text>
            <TextInput 
              value={editDocNumber}
              onChangeText={setEditDocNumber}
              placeholder="Ej. V-28.192.831"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[styles.inputBox, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium, marginBottom: 14 }]}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: F.bold, marginBottom: 0 }]}>
                Fecha de Vencimiento:
              </Text>

              <TouchableOpacity 
                onPress={() => setEditIsPermanent(!editIsPermanent)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <MaterialIcons name={editIsPermanent ? "check-box" : "check-box-outline-blank"} size={18} color={editIsPermanent ? colors.primary : colors.onSurfaceVariant} />
                <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurface, marginLeft: 6 }}>Permanente</Text>
              </TouchableOpacity>
            </View>

            {!editIsPermanent && (
              <TextInput 
                value={editExpiryDate}
                onChangeText={setEditExpiryDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[styles.inputBox, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.medium, marginBottom: 18 }]}
              />
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingDoc(null)}
                style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 0.5, borderColor: colors.outlineVariant, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: F.bold, color: colors.onSurface }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: F.bold, color: colors.onPrimary }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Ver Documento en Pantalla Completa */}
      <Modal visible={!!selectedDocImage} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }} 
            onPress={() => setSelectedDocImage(null)}
          >
            <MaterialIcons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
          {selectedDocImage && (
            <Image source={{ uri: selectedDocImage }} style={{ width: '94%', height: '84%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusNotificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    padding: 4,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  cardActionPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 54,
  },
  scannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTargetBox: {
    width: width * 0.72,
    height: width * 0.72,
    alignSelf: 'center',
    position: 'relative',
  },
  targetCorner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#0A84FF',
  },
  scannerBottomBar: {
    backgroundColor: 'rgba(0,0,0,0.68)',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  addOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 0.5,
  },
  addOptionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  inputBox: {
    height: 46,
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  quickDateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  saveMainBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
