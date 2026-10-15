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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMyMoto } from '../../context/MotoContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../../data/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 920;
  const isDark = mode === 'dark';

  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Selected card for inspector on desktop
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  // Expanded card for mobile iOS Apple Wallet stack
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);

  // Modals
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Document form fields
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
    extrabold: 'Montserrat_800ExtraBold',
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
        if (data.length > 0 && !selectedDocId) {
          setSelectedDocId(data[0].id);
        }
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
        badgeBg: 'rgba(255,255,255,0.18)',
        badgeColor: '#FFFFFF',
      };
    }

    if (!expiryStr) {
      return {
        status: 'valid',
        label: 'Sin Vencimiento',
        badgeBg: 'rgba(0, 174, 120, 0.2)',
        badgeColor: '#00ae78',
      };
    }

    const expiry = new Date(expiryStr);
    if (isNaN(expiry.getTime())) {
      return {
        status: 'valid',
        label: 'Registrado',
        badgeBg: 'rgba(0, 174, 120, 0.2)',
        badgeColor: '#00ae78',
      };
    }

    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: `Vencido (${Math.abs(diffDays)}d)`,
        badgeBg: 'rgba(186, 26, 26, 0.25)',
        badgeColor: '#ffb4ab',
        daysRemaining: diffDays,
      };
    }

    if (diffDays <= 30) {
      return {
        status: 'expiring',
        label: `Vence en ${diffDays}d`,
        badgeBg: 'rgba(255, 183, 3, 0.25)',
        badgeColor: '#ffb703',
        daysRemaining: diffDays,
      };
    }

    const formattedDate = expiry.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return {
      status: 'valid',
      label: `Vence: ${formattedDate}`,
      badgeBg: 'rgba(0, 174, 120, 0.2)',
      badgeColor: '#00ae78',
      daysRemaining: diffDays,
    };
  };

  // Modern luxury motorsport palette (never plain neon)
  const getCardStyle = (rawTitle: string) => {
    const title = rawTitle.split('||')[0].trim().toLowerCase();
    if (title.includes('licencia')) {
      return { 
        colors: ['#0a182e', '#11294d', '#1b4079'], 
        accent: '#00e3fd',
        icon: 'badge',
        typeLabel: 'LICENCIA DE CONDUCIR'
      };
    }
    if (title.includes('médico') || title.includes('medico')) {
      return { 
        colors: ['#072018', '#0c3528', '#14523e'], 
        accent: '#00ae78',
        icon: 'medical-services',
        typeLabel: 'CERTIFICADO MÉDICO'
      };
    }
    if (title.includes('seguro') || title.includes('rcv') || title.includes('póliza')) {
      return { 
        colors: ['#241208', '#3d1e0d', '#5a2d14'], 
        accent: '#ffb703',
        icon: 'security',
        typeLabel: 'PÓLIZA DE SEGURO RCV'
      };
    }
    if (title.includes('título') || title.includes('titulo')) {
      return { 
        colors: ['#14161a', '#1e2229', '#2e333d'], 
        accent: '#c4cce0',
        icon: 'description',
        typeLabel: 'TÍTULO DE PROPIEDAD'
      };
    }
    // Carnet de circulación / default
    return { 
      colors: ['#181426', '#261e3d', '#392c5c'], 
      accent: '#8ca9ff',
      icon: 'two-wheeler',
      typeLabel: 'CARNET DE CIRCULACIÓN'
    };
  };

  // Open Live QR Scanner
  const handleOpenScanner = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        alert('Se requiere acceso a la cámara para escanear el código QR de tus documentos.');
        return;
      }
    }
    setScannerVisible(true);
  };

  // Handle scanned QR Code
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScannerVisible(false);
    let detectedTitle = 'Documento Escaneado';
    let detectedDocNum = '';
    let detectedExpiry = '';
    let isMotoDoc: 'moto' | 'user' = 'moto';
    const raw = data.trim();

    if (raw.toLowerCase().includes('intt') || raw.toLowerCase().includes('vehiculo') || raw.toLowerCase().includes('placa')) {
      detectedTitle = 'Carnet de Circulación';
      isMotoDoc = 'moto';
    } else if (raw.toLowerCase().includes('seguro') || raw.toLowerCase().includes('rcv') || raw.toLowerCase().includes('poliza')) {
      detectedTitle = 'Seguro / RCV';
      isMotoDoc = 'moto';
    } else if (raw.toLowerCase().includes('licencia') || raw.toLowerCase().includes('conducir')) {
      detectedTitle = 'Licencia de Conducir';
      isMotoDoc = 'user';
    } else if (raw.toLowerCase().includes('medico') || raw.toLowerCase().includes('salud')) {
      detectedTitle = 'Certificado Médico';
      isMotoDoc = 'user';
    }

    const dateMatch = raw.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})/);
    const dateMatchAlt = raw.match(/(\d{2}[-/.]\d{2}[-/.]\d{4})/);
    if (dateMatch) {
      detectedExpiry = dateMatch[1].replace(/\//g, '-').replace(/\./g, '-');
    } else if (dateMatchAlt) {
      const parts = dateMatchAlt[1].split(/[-/.]/);
      detectedExpiry = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const numMatch = raw.match(/(?:N°|No|NUM|DOC|REG|PLACA|V-|E-|J-)[:\s]*([A-Z0-9.-]{4,20})/i);
    if (numMatch) {
      detectedDocNum = numMatch[1].trim();
    } else if (!raw.startsWith('http') && raw.length < 25) {
      detectedDocNum = raw;
    }

    setFormTitle(detectedTitle);
    setFormDocType(isMotoDoc);
    setFormDocNumber(detectedDocNum);
    setFormExpiryDate(detectedExpiry);
    setFormQrData(raw);
    setShowFormModal(true);
  };

  const handlePickImage = async () => {
    setShowOptionsModal(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0].uri) {
        setFormImageUri(result.assets[0].uri);
        setShowFormModal(true);
      }
    } catch (e) {
      alert('No se pudo abrir la galería.');
    }
  };

  const handleTakePhoto = async () => {
    setShowOptionsModal(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso de cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0].uri) {
        setFormImageUri(result.assets[0].uri);
        setShowFormModal(true);
      }
    } catch (e) {
      alert('No se pudo activar la cámara.');
    }
  };

  const handleSaveDocument = async () => {
    if (!formTitle.trim()) {
      alert('Por favor ingresa el título del documento.');
      return;
    }
    if (!userData?.id) {
      alert('Sesión de usuario no detectada.');
      return;
    }

    setUploading(true);
    try {
      let finalPublicUrl: string | null = null;
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

      const expValue = formIsPermanent ? 'PERMANENTE' : (formExpiryDate.trim() || 'INDEFINIDO');
      const docNumValue = formDocNumber.trim() || 'S/N';
      const qrValue = formQrData.trim() || '';
      const compoundTitle = `${formTitle.trim()} || ${expValue} || ${docNumValue} || ${qrValue}`;

      const { data: inserted, error: dbError } = await supabase.from('documents').insert({
        user_id: userData.id,
        moto_id: formDocType === 'moto' ? (myMoto ? myMoto.id : null) : null,
        title: compoundTitle,
        type: formDocType,
        image_url: finalPublicUrl
      }).select().single();

      if (dbError) throw dbError;
      await loadDocuments(userData.id);
      if (inserted?.id) setSelectedDocId(inserted.id);
      setShowFormModal(false);

      // Reset
      setFormTitle('Carnet de Circulación');
      setFormDocNumber('');
      setFormExpiryDate('');
      setFormIsPermanent(false);
      setFormQrData('');
      setFormImageUri(null);

      alert('Documento guardado con éxito.');
    } catch (e: any) {
      alert(e.message || 'No se pudo guardar el documento.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (doc: any) => {
    const parsed = parseDocTitle(doc.title);
    setEditingDoc(doc);
    setEditDocNumber(parsed.docNumber && parsed.docNumber !== 'S/N' ? parsed.docNumber : '');
    setEditIsPermanent(parsed.expiryDate === 'PERMANENTE');
    setEditExpiryDate(parsed.expiryDate && parsed.expiryDate !== 'PERMANENTE' && parsed.expiryDate !== 'INDEFINIDO' ? parsed.expiryDate : '');
  };

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
      alert('Datos del documento actualizados.');
    } catch (e) {
      alert('Error al actualizar.');
    }
  };

  const deleteDocument = async (id: string) => {
    const doDelete = async () => {
      await supabase.from('documents').delete().eq('id', id);
      if (userData) loadDocuments(userData.id);
      if (selectedDocId === id) setSelectedDocId(null);
      if (expandedCardId === id) setExpandedCardId(null);
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de eliminar este documento de tu billetera?');
      if (confirm) doDelete();
    } else {
      Alert.alert('Eliminar Documento', '¿Estás seguro de eliminar este documento?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete }
      ]);
    }
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

  // Selected document object for desktop inspector
  const activeDoc = documents.find(d => d.id === selectedDocId) || (documents.length > 0 ? documents[0] : null);
  const activeParsed = activeDoc ? parseDocTitle(activeDoc.title) : null;
  const activeStatus = activeDoc ? getDocumentStatus(activeDoc) : null;
  const activeStyle = activeDoc ? getCardStyle(activeDoc.title) : null;

  // Expanded document object for mobile iOS Apple Wallet stack
  const expandedDoc = documents.find(d => d.id === expandedCardId) || null;
  const expandedParsed = expandedDoc ? parseDocTitle(expandedDoc.title) : null;
  const expandedStatus = expandedDoc ? getDocumentStatus(expandedDoc) : null;

  const pilotName = userData?.user_metadata?.first_name 
    ? `${userData.user_metadata.first_name} ${userData.user_metadata.last_name || ''}`.trim().toUpperCase()
    : (myMoto?.brand ? `${myMoto.brand} PILOTO` : 'PILOTO REGISTRADO');

  // Reusable credential card front (NO EMV CHIP, NO CONTACTLESS)
  const renderCard = (
    doc: any,
    isSelected: boolean,
    isMobile: boolean,
    onPress: () => void,
    customMarginTop?: number
  ) => {
    const cardData = getCardStyle(doc.title);
    const parsed = parseDocTitle(doc.title);
    const docStatus = getDocumentStatus(doc);
    const vehicleText = doc.type === 'moto' 
      ? (myMoto ? `${myMoto.brand} ${myMoto.model}` : 'Vehículo Registrado')
      : 'Documento Personal';

    return (
      <TouchableOpacity
        key={doc.id}
        activeOpacity={0.92}
        onPress={onPress}
        style={[
          isMobile ? styles.mobileCard : styles.physicalCard,
          customMarginTop !== undefined && { marginTop: customMarginTop },
          isSelected && (isDesktop ? {
            borderColor: '#4169E1',
            borderWidth: 2,
            shadowColor: '#4169E1',
            shadowOpacity: 0.45,
            shadowRadius: 16,
            transform: [{ translateY: -4 }]
          } : {
            borderColor: '#4169E1',
            borderWidth: 1.5,
            shadowColor: '#4169E1',
            shadowOpacity: 0.35,
            shadowRadius: 12,
          })
        ]}
      >
        <LinearGradient
          colors={cardData.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Subtle Watermark Shape */}
          <View style={styles.cardWatermarkCircle} pointerEvents="none" />

          {/* CARD TOP ROW: OFFICIAL INSIGNIA & CATEGORY PILL */}
          <View style={styles.cardTopRow}>
            <View style={styles.credentialInsignia}>
              <View style={styles.insigniaIconWrap}>
                <MaterialIcons name={cardData.icon as any} size={18} color="#ffffff" />
              </View>
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.insigniaTitle}>DOCUMENTO OFICIAL</Text>
                <Text style={styles.insigniaSub}>REPÚBLICA BOLIVARIANA</Text>
              </View>
            </View>

            <View style={[styles.cardCategoryPill, { borderColor: cardData.accent, backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Text style={[styles.cardCategoryPillText, { color: cardData.accent }]}>
                {cardData.typeLabel}
              </Text>
            </View>
          </View>

          {/* CARD CENTER: DOCUMENT TITLE & NUMBER */}
          <View style={{ marginVertical: 6 }}>
            <Text style={styles.cardCleanTitle} numberOfLines={1}>
              {parsed.cleanTitle}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.docNumberPrefix}>N° </Text>
              <Text style={styles.cardEmbossedNumber}>
                {parsed.docNumber && parsed.docNumber !== 'S/N' 
                  ? parsed.docNumber 
                  : 'V-•••••••••'}
              </Text>
            </View>
          </View>

          {/* CARD FOOTER: HOLDER NAME & EXPIRATION STATUS */}
          <View style={styles.cardFooterRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.cardHolderLabel}>TITULAR • {vehicleText.toUpperCase()}</Text>
              <Text style={styles.cardHolderName} numberOfLines={1}>
                {pilotName}
              </Text>
            </View>

            <View style={[styles.cardStatusCapsule, { backgroundColor: docStatus.badgeBg }]}>
              <View style={[styles.statusDot, { backgroundColor: docStatus.badgeColor }]} />
              <Text style={[styles.cardStatusText, { color: docStatus.badgeColor }]}>
                {docStatus.label}
              </Text>
            </View>
          </View>

        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      
      {/* 1. TOP HEADER & FILTER BAR */}
      <View style={[styles.headerContainer, { maxWidth: 1240, width: '100%', alignSelf: 'center', paddingHorizontal: isDesktop ? 28 : 18, paddingTop: isDesktop ? 24 : 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#4169E1" />
              <Text style={styles.headerKicker}>GUANTERA DIGITAL • GARAGE VAULT</Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: isDesktop ? 28 : 22 }]}>
              Documentos de Circulación
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant, fontSize: isDesktop ? 13 : 11.5 }]}>
              Credenciales oficiales, carnets digitales y pólizas vigentes
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: isDesktop ? 12 : 8, flexWrap: 'wrap' }}>
            <TouchableOpacity 
              onPress={handleOpenScanner}
              style={[styles.headerActionBtn, { borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : '#d0d4dc', paddingVertical: isDesktop ? 9 : 7, paddingHorizontal: isDesktop ? 14 : 10 }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="qr-code-scanner" size={18} color="#00e3fd" />
              <Text style={[styles.headerActionBtnText, { color: colors.onSurface, fontSize: isDesktop ? 12 : 11 }]}>Escanear QR</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowOptionsModal(true)}
              style={[styles.headerPrimaryBtn, { paddingVertical: isDesktop ? 9 : 7, paddingHorizontal: isDesktop ? 16 : 12 }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={18} color="#ffffff" />
              <Text style={[styles.headerPrimaryBtnText, { fontSize: isDesktop ? 12 : 11 }]}>+ Añadir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FILTER BAR PILLS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 2, alignItems: 'center' }}
          style={[styles.filterBar, { backgroundColor: isDark ? '#191c21' : '#ececf0', borderColor: isDark ? 'rgba(64, 72, 92, 0.35)' : '#e0e0e6' }]}
        >
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            style={[styles.filterPill, statusFilter === 'all' && styles.filterPillActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, { color: statusFilter === 'all' ? '#ffffff' : colors.onSurfaceVariant }]}>
              Todos ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter('valid')}
            style={[styles.filterPill, statusFilter === 'valid' && styles.filterPillActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, { color: statusFilter === 'valid' ? '#ffffff' : colors.onSurfaceVariant }]}>
              Vigentes <Text style={{ color: '#00ae78', fontFamily: F.bold }}>({counts.valid})</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter('expiring')}
            style={[styles.filterPill, statusFilter === 'expiring' && styles.filterPillActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, { color: statusFilter === 'expiring' ? '#ffffff' : colors.onSurfaceVariant }]}>
              Por Vencer <Text style={{ color: '#ffb703', fontFamily: F.bold }}>({counts.expiring})</Text>
            </Text>
          </TouchableOpacity>

          {counts.expired > 0 && (
            <TouchableOpacity
              onPress={() => setStatusFilter('expired')}
              style={[styles.filterPill, statusFilter === 'expired' && styles.filterPillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, { color: statusFilter === 'expired' ? '#ffffff' : colors.onSurfaceVariant }]}>
                Vencidos <Text style={{ color: '#ffb4ab', fontFamily: F.bold }}>({counts.expired})</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* 2. BODY CONTENT: AUTHENTIC APPLE WALLET (MOBILE) OR DUAL-COLUMN (DESKTOP) */}
      <ScrollView 
        contentContainerStyle={{ 
          maxWidth: 1240, 
          width: '100%', 
          alignSelf: 'center', 
          paddingHorizontal: isDesktop ? 28 : 18, 
          paddingBottom: 90 
        }}
        showsVerticalScrollIndicator={false}
      >
        {uploading && (
          <View style={styles.uploadingBanner}>
            <ActivityIndicator size="small" color="#00e3fd" />
            <Text style={styles.uploadingText}>Subiendo y encriptando documento en Supabase Vault...</Text>
          </View>
        )}

        {filteredDocuments.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : '#d0d4dc' }]}>
            <MaterialIcons name="credit-card" size={54} color="#4169E1" />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {statusFilter === 'all' ? 'Tu Guantera Digital está vacía' : 'Sin documentos en esta categoría'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
              Registra tu Licencia de Conducir, Certificado Médico, Carnet de Circulación o Póliza RCV para tenerlos siempre a mano y recibir alertas de vencimiento.
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowOptionsModal(true)}
              style={styles.emptyAddBtn}
            >
              <MaterialIcons name="add" size={18} color="#ffffff" />
              <Text style={styles.emptyAddBtnText}>Añadir Primer Documento</Text>
            </TouchableOpacity>
          </View>
        ) : !isDesktop ? (
          // ==============================
          // MOBILE VIEW: AUTHENTIC APPLE WALLET
          // ==============================
          expandedCardId && expandedDoc && expandedParsed && expandedStatus ? (
            // 1. MOBILE EXPANDED FOCUSED PASS VIEW
            <View style={styles.mobileExpandedPassContainer}>
              {/* TOP CONTROLS */}
              <View style={styles.mobileExpandedHeader}>
                <TouchableOpacity
                  style={[styles.backToStackBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
                  onPress={() => setExpandedCardId(null)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="arrow-back-ios" size={13} color={colors.onSurface} style={{ marginLeft: 3 }} />
                  <Text style={[styles.backToStackText, { color: colors.onSurface }]}>Guantera Digital</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickScanBtn, { backgroundColor: isDark ? 'rgba(0, 227, 253, 0.12)' : 'rgba(39, 95, 227, 0.1)' }]}
                  onPress={handleOpenScanner}
                >
                  <MaterialIcons name="qr-code-scanner" size={18} color="#00e3fd" />
                </TouchableOpacity>
              </View>

              {/* FOCUSED CARD (TAP TO COLLAPSE) */}
              {renderCard(expandedDoc, true, true, () => setExpandedCardId(null), 0)}

              {/* PASS DETAILS SHEET (APPLE WALLET DETAILS / BACK OF PASS) */}
              <View style={[
                styles.mobilePassDetailsSheet,
                { 
                  backgroundColor: isDark ? '#191c21' : '#ffffff',
                  borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0, 0, 0, 0.08)'
                }
              ]}>
                {/* QUICK ACTIONS ROW */}
                <View style={styles.passActionsRow}>
                  <TouchableOpacity
                    style={[styles.passActionBtn, { borderColor: isDark ? '#40485c' : '#d0d4dc' }]}
                    onPress={() => handleOpenEdit(expandedDoc)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.onSurface} />
                    <Text style={[styles.passActionBtnText, { color: colors.onSurface }]}>Editar Datos</Text>
                  </TouchableOpacity>

                  {expandedDoc.image_url && (
                    <TouchableOpacity
                      style={[styles.passActionBtn, { borderColor: isDark ? '#40485c' : '#d0d4dc' }]}
                      onPress={() => setSelectedDocImage(expandedDoc.image_url)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="fullscreen" size={18} color="#00e3fd" />
                      <Text style={[styles.passActionBtnText, { color: colors.onSurface }]}>Foto Original</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.passDeleteBtn}
                    onPress={() => deleteDocument(expandedDoc.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#ffb4ab" />
                  </TouchableOpacity>
                </View>

                {/* PHOTO THUMBNAIL (IF PRESENT) */}
                {expandedDoc.image_url && (
                  <TouchableOpacity
                    style={styles.passPhotoWrap}
                    onPress={() => setSelectedDocImage(expandedDoc.image_url)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: expandedDoc.image_url }} style={styles.passPhoto} resizeMode="cover" />
                    <View style={styles.photoZoomOverlay}>
                      <MaterialIcons name="zoom-in" size={18} color="#ffffff" />
                      <Text style={styles.photoZoomText}>Toca para ver en pantalla completa</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* QR CODE BANNER */}
                {expandedParsed.qrData && (
                  <View style={[styles.qrBannerBox, { backgroundColor: isDark ? 'rgba(0, 227, 253, 0.08)' : 'rgba(39, 95, 227, 0.06)', borderColor: isDark ? 'rgba(0, 227, 253, 0.25)' : 'rgba(39, 95, 227, 0.2)' }]}>
                    <MaterialIcons name="qr-code-2" size={24} color="#00e3fd" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.qrBannerTitle, { color: colors.onSurface }]}>Código QR Verificado</Text>
                      <Text style={[styles.qrBannerData, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                        {expandedParsed.qrData}
                      </Text>
                    </View>
                    {expandedParsed.qrData.startsWith('http') && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(expandedParsed.qrData!)}
                        style={styles.openUrlBtn}
                      >
                        <Text style={styles.openUrlBtnText}>Abrir ↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* METADATA TABLE */}
                <View style={styles.inspectorDetailsTable}>
                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>N° DOCUMENTO</Text>
                    <Text style={[styles.detailTableVal, { color: colors.onSurface }]}>
                      {expandedParsed.docNumber || 'S/N'}
                    </Text>
                  </View>

                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>TITULAR</Text>
                    <Text style={[styles.detailTableVal, { color: colors.onSurface }]}>
                      {pilotName}
                    </Text>
                  </View>

                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>ESTADO DE VALIDEZ</Text>
                    <Text style={[styles.detailTableVal, { color: expandedStatus.badgeColor }]}>
                      {expandedStatus.label}
                    </Text>
                  </View>

                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>VINCULACIÓN VEHICULAR</Text>
                    <Text style={[styles.detailTableVal, { color: colors.onSurface }]}>
                      {expandedDoc.type === 'moto' ? (myMoto ? `${myMoto.brand} ${myMoto.model}` : 'Vehículo') : 'Personal'}
                    </Text>
                  </View>
                </View>

                {/* RETURN PILL */}
                <TouchableOpacity
                  style={[styles.returnToWalletBtn, { backgroundColor: isDark ? '#272a30' : '#f0f0f4' }]}
                  onPress={() => setExpandedCardId(null)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="view-carousel" size={18} color={colors.onSurface} />
                  <Text style={[styles.returnToWalletBtnText, { color: colors.onSurface }]}>Ver todas las tarjetas</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // 2. MOBILE OVERLAPPING APPLE WALLET STACK
            <View style={styles.mobileWalletStack}>
              {filteredDocuments.map((doc, index) => {
                const marginTop = index === 0 ? 0 : -145;
                return renderCard(doc, false, true, () => setExpandedCardId(doc.id), marginTop);
              })}

              {/* ADD DOCUMENT BUTTON AT BOTTOM OF STACK */}
              <TouchableOpacity
                style={[
                  styles.mobileAddBtn, 
                  { 
                    borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : '#d0d4dc',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fc',
                    marginTop: filteredDocuments.length > 0 ? 20 : 0
                  }
                ]}
                onPress={() => setShowOptionsModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addDashedIconWrap}>
                  <MaterialIcons name="add" size={24} color="#00e3fd" />
                </View>
                <Text style={[styles.addDashedTitle, { color: colors.onSurface }]}>Registrar Otro Documento</Text>
                <Text style={[styles.addDashedSubtitle, { color: colors.onSurfaceVariant }]}>
                  Foto física o escaneo de código QR
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          // ==============================
          // DESKTOP VIEW: DUAL-COLUMN INSPECTOR DASHBOARD
          // ==============================
          <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start', marginTop: 12 }}>
            
            {/* CARDS GRID */}
            <View style={{ flex: 1.3, width: '100%' }}>
              <View style={styles.cardsGrid}>
                {filteredDocuments.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  return renderCard(doc, isSelected, false, () => setSelectedDocId(doc.id));
                })}

                {/* ADD NEW DOCUMENT DASHED CARD */}
                <TouchableOpacity
                  style={[styles.addDashedCard, { borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : '#d0d4dc' }]}
                  onPress={() => setShowOptionsModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.addDashedIconWrap}>
                    <MaterialIcons name="add" size={26} color="#00e3fd" />
                  </View>
                  <Text style={[styles.addDashedTitle, { color: colors.onSurface }]}>Registrar Otro Documento</Text>
                  <Text style={[styles.addDashedSubtitle, { color: colors.onSurfaceVariant }]}>
                    Foto física o escaneo de código QR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DOCUMENT INSPECTOR (RIGHT COLUMN ON DESKTOP) */}
            {activeDoc && activeParsed && activeStatus && (
              <View style={[
                styles.inspectorPanel, 
                { 
                  backgroundColor: isDark ? '#191c21' : '#ffffff',
                  borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0, 0, 0, 0.08)'
                }
              ]}>
                
                {/* INSPECTOR HEADER */}
                <View style={styles.inspectorHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inspectorPreTitle, { color: '#00e3fd' }]}>VISOR DE DOCUMENTO OFICIAL</Text>
                    <Text style={[styles.inspectorDocTitle, { color: colors.onSurface }]}>
                      {activeParsed.cleanTitle}
                    </Text>
                  </View>

                  <View style={[styles.inspectorStatusBadge, { backgroundColor: activeStatus.badgeBg }]}>
                    <View style={[styles.statusDot, { backgroundColor: activeStatus.badgeColor }]} />
                    <Text style={[styles.inspectorStatusText, { color: activeStatus.badgeColor }]}>
                      {activeStatus.label}
                    </Text>
                  </View>
                </View>

                {/* PHOTO PREVIEW (IF AVAILABLE) */}
                {activeDoc.image_url ? (
                  <TouchableOpacity
                    style={styles.inspectorPhotoContainer}
                    onPress={() => setSelectedDocImage(activeDoc.image_url)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: activeDoc.image_url }} style={styles.inspectorPhoto} resizeMode="cover" />
                    <View style={styles.photoZoomOverlay}>
                      <MaterialIcons name="zoom-in" size={20} color="#ffffff" />
                      <Text style={styles.photoZoomText}>Ver en tamaño completo</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.inspectorNoPhotoBox, { backgroundColor: isDark ? '#272a30' : '#ececf0' }]}>
                    <MaterialIcons name="document-scanner" size={36} color={colors.onSurfaceVariant} />
                    <Text style={[styles.inspectorNoPhotoText, { color: colors.onSurfaceVariant }]}>
                      Documento registrado sin fotografía digital
                    </Text>
                  </View>
                )}

                {/* QR DATA DISPLAY (IF PRESENT) */}
                {activeParsed.qrData && (
                  <View style={[styles.qrBannerBox, { backgroundColor: isDark ? 'rgba(0, 227, 253, 0.08)' : 'rgba(39, 95, 227, 0.06)', borderColor: isDark ? 'rgba(0, 227, 253, 0.25)' : 'rgba(39, 95, 227, 0.2)' }]}>
                    <MaterialIcons name="qr-code-2" size={22} color="#00e3fd" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.qrBannerTitle, { color: colors.onSurface }]}>Código QR Verificado</Text>
                      <Text style={[styles.qrBannerData, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                        {activeParsed.qrData}
                      </Text>
                    </View>
                    {activeParsed.qrData.startsWith('http') && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(activeParsed.qrData!)}
                        style={styles.openUrlBtn}
                      >
                        <Text style={styles.openUrlBtnText}>Abrir ↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* DETAILS TABLE */}
                <View style={styles.inspectorDetailsTable}>
                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>N° DOCUMENTO</Text>
                    <Text style={[styles.detailTableVal, { color: colors.onSurface }]}>
                      {activeParsed.docNumber || 'S/N'}
                    </Text>
                  </View>

                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>FECHA DE VENCIMIENTO</Text>
                    <Text style={[styles.detailTableVal, { color: activeStatus.badgeColor }]}>
                      {activeParsed.expiryDate || 'PERMANENTE'}
                    </Text>
                  </View>

                  <View style={[styles.detailTableRow, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#ececf0' }]}>
                    <Text style={[styles.detailTableLabel, { color: colors.onSurfaceVariant }]}>VINCULACIÓN</Text>
                    <Text style={[styles.detailTableVal, { color: colors.onSurface }]}>
                      {activeDoc.type === 'moto' ? (myMoto ? `${myMoto.brand} ${myMoto.model}` : 'Vehículo') : 'Personal'}
                    </Text>
                  </View>
                </View>

                {/* ACTION BUTTONS */}
                <View style={styles.inspectorActionsRow}>
                  <TouchableOpacity
                    style={[styles.inspectorEditBtn, { borderColor: isDark ? '#40485c' : '#d0d4dc' }]}
                    onPress={() => handleOpenEdit(activeDoc)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.onSurface} />
                    <Text style={[styles.inspectorEditBtnText, { color: colors.onSurface }]}>Editar Datos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inspectorDeleteBtn}
                    onPress={() => deleteDocument(activeDoc.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="delete" size={16} color="#ffb4ab" />
                    <Text style={styles.inspectorDeleteBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>

              </View>
            )}

          </View>
        )}
      </ScrollView>

      {/* MODAL: FULL SCREEN PHOTO VIEWER */}
      {selectedDocImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.photoModalBackdrop}>
            <TouchableOpacity 
              style={styles.photoModalCloseBtn}
              onPress={() => setSelectedDocImage(null)}
            >
              <MaterialIcons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>

            <Image 
              source={{ uri: selectedDocImage }} 
              style={styles.fullScreenPhoto} 
              resizeMode="contain" 
            />
          </View>
        </Modal>
      )}

      {/* MODAL: LIVE QR SCANNER */}
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
          
          <View style={styles.scannerOverlay}>
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

            <View style={styles.scannerTargetBox}>
              <View style={[styles.targetCorner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.targetCorner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
              <View style={[styles.targetCorner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.targetCorner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
            </View>

            <View style={styles.scannerBottomBar}>
              <Text style={{ fontFamily: F.semibold, color: '#FFF', fontSize: 14, textAlign: 'center' }}>
                Apunta la cámara hacia el código QR de tu documento
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SELECCIONAR MODO */}
      <Modal visible={showOptionsModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdropCenter}>
          <View style={[styles.dialogModalBox, { backgroundColor: isDark ? '#191c21' : '#ffffff', borderColor: isDark ? '#40485c' : '#d0d4dc' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.dialogTitle, { color: colors.onSurface }]}>Añadir Documentación</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.dialogSubtitle, { color: colors.onSurfaceVariant }]}>
              ¿Cómo deseas registrar el documento?
            </Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              <TouchableOpacity 
                onPress={() => {
                  setShowOptionsModal(false);
                  handleOpenScanner();
                }}
                style={[styles.optionRowBtn, { backgroundColor: isDark ? '#272a30' : '#ececf0' }]}
              >
                <MaterialIcons name="qr-code-scanner" size={22} color="#00e3fd" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionRowTitle, { color: colors.onSurface }]}>Escanear Código QR</Text>
                  <Text style={[styles.optionRowSub, { color: colors.onSurfaceVariant }]}>Captura automática de datos oficiales</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleTakePhoto}
                style={[styles.optionRowBtn, { backgroundColor: isDark ? '#272a30' : '#ececf0' }]}
              >
                <MaterialIcons name="camera-alt" size={22} color="#00ae78" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionRowTitle, { color: colors.onSurface }]}>Tomar Foto con Cámara</Text>
                  <Text style={[styles.optionRowSub, { color: colors.onSurfaceVariant }]}>Fotografía tu documento físico</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handlePickImage}
                style={[styles.optionRowBtn, { backgroundColor: isDark ? '#272a30' : '#ececf0' }]}
              >
                <MaterialIcons name="photo-library" size={22} color="#ffb703" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionRowTitle, { color: colors.onSurface }]}>Elegir de la Galería</Text>
                  <Text style={[styles.optionRowSub, { color: colors.onSurfaceVariant }]}>Selecciona una imagen guardada</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  setShowOptionsModal(false);
                  setFormImageUri(null);
                  setShowFormModal(true);
                }}
                style={[styles.optionRowBtn, { backgroundColor: isDark ? '#272a30' : '#ececf0' }]}
              >
                <MaterialIcons name="edit-note" size={22} color="#4169E1" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionRowTitle, { color: colors.onSurface }]}>Ingreso Manual</Text>
                  <Text style={[styles.optionRowSub, { color: colors.onSurfaceVariant }]}>Registra números y fechas sin foto ahora</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: FORMULARIO DE REGISTRO */}
      <Modal visible={showFormModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdropCenter}>
          <View style={[styles.dialogModalBox, { maxWidth: 520, maxHeight: '90%', backgroundColor: isDark ? '#191c21' : '#ffffff', borderColor: isDark ? '#40485c' : '#d0d4dc' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.dialogTitle, { color: colors.onSurface }]}>Datos del Documento</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {formImageUri && (
                <View style={{ marginBottom: 14, position: 'relative' }}>
                  <Image source={{ uri: formImageUri }} style={{ width: '100%', height: 160, borderRadius: 14 }} resizeMode="cover" />
                  <TouchableOpacity 
                    onPress={() => setFormImageUri(null)}
                    style={styles.removePhotoBtn}
                  >
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Tipo de Documento:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {[
                  { label: 'Carnet de Circulación', type: 'moto' as const },
                  { label: 'Título de Propiedad', type: 'moto' as const, perm: true },
                  { label: 'Seguro / RCV', type: 'moto' as const },
                  { label: 'Licencia de Conducir', type: 'user' as const },
                  { label: 'Certificado Médico', type: 'user' as const },
                ].map(item => {
                  const isSel = formTitle === item.label;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => {
                        setFormTitle(item.label);
                        setFormDocType(item.type);
                        if (item.perm) setFormIsPermanent(true);
                      }}
                      style={[
                        styles.docTypeChip,
                        isSel && { backgroundColor: '#4169E1', borderColor: '#4169E1' }
                      ]}
                    >
                      <Text style={[styles.docTypeChipText, { color: isSel ? '#ffffff' : colors.onSurface }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>N° de Documento / Serial:</Text>
              <TextInput 
                value={formDocNumber}
                onChangeText={setFormDocNumber}
                placeholder="Ej. V-28.192.831 o N° 0482910"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[styles.textInput, { backgroundColor: isDark ? '#272a30' : '#ececf0', color: colors.onSurface }]}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, marginBottom: 0 }]}>Fecha de Vencimiento:</Text>
                <TouchableOpacity onPress={() => setFormIsPermanent(!formIsPermanent)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name={formIsPermanent ? "check-box" : "check-box-outline-blank"} size={18} color="#00e3fd" />
                  <Text style={{ fontSize: 11, fontFamily: F.bold, color: '#00e3fd' }}>Permanente</Text>
                </TouchableOpacity>
              </View>

              {!formIsPermanent && (
                <TextInput 
                  value={formExpiryDate}
                  onChangeText={setFormExpiryDate}
                  placeholder="AAAA-MM-DD (Ej. 2026-12-31)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.textInput, { backgroundColor: isDark ? '#272a30' : '#ececf0', color: colors.onSurface }]}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity 
                  onPress={() => setShowFormModal(false)}
                  style={[styles.formBtn, { borderColor: isDark ? '#40485c' : '#d0d4dc', borderWidth: 1 }]}
                >
                  <Text style={[styles.formBtnText, { color: colors.onSurface }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleSaveDocument}
                  style={[styles.formBtn, { backgroundColor: '#4169E1' }]}
                >
                  <Text style={[styles.formBtnText, { color: '#ffffff' }]}>Guardar Documento</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDITAR DATOS */}
      {editingDoc && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalBackdropCenter}>
            <View style={[styles.dialogModalBox, { backgroundColor: isDark ? '#191c21' : '#ffffff', borderColor: isDark ? '#40485c' : '#d0d4dc' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={[styles.dialogTitle, { color: colors.onSurface }]}>Editar Documento</Text>
                <TouchableOpacity onPress={() => setEditingDoc(null)}>
                  <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>N° de Documento:</Text>
              <TextInput 
                value={editDocNumber}
                onChangeText={setEditDocNumber}
                placeholder="Ej. V-28.192.831"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[styles.textInput, { backgroundColor: isDark ? '#272a30' : '#ececf0', color: colors.onSurface }]}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, marginBottom: 0 }]}>Fecha de Vencimiento:</Text>
                <TouchableOpacity onPress={() => setEditIsPermanent(!editIsPermanent)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name={editIsPermanent ? "check-box" : "check-box-outline-blank"} size={18} color="#00e3fd" />
                  <Text style={{ fontSize: 11, fontFamily: F.bold, color: '#00e3fd' }}>Permanente</Text>
                </TouchableOpacity>
              </View>

              {!editIsPermanent && (
                <TextInput 
                  value={editExpiryDate}
                  onChangeText={setEditExpiryDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.textInput, { backgroundColor: isDark ? '#272a30' : '#ececf0', color: colors.onSurface }]}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity 
                  onPress={() => setEditingDoc(null)}
                  style={[styles.formBtn, { borderColor: isDark ? '#40485c' : '#d0d4dc', borderWidth: 1 }]}
                >
                  <Text style={[styles.formBtnText, { color: colors.onSurface }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleSaveEdit}
                  style={[styles.formBtn, { backgroundColor: '#4169E1' }]}
                >
                  <Text style={[styles.formBtnText, { color: '#ffffff' }]}>Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  headerKicker: {
    color: '#4169E1',
    fontSize: 10.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 2,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  headerActionBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  headerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4169E1',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#4169E1',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  headerPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 4,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  filterPillActive: {
    backgroundColor: '#4169E1',
  },
  filterPillText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
  },
  uploadingBanner: {
    backgroundColor: 'rgba(0, 227, 253, 0.12)',
    borderColor: 'rgba(0, 227, 253, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  uploadingText: {
    color: '#00e3fd',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
    maxWidth: 460,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4169E1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  physicalCard: {
    width: 370,
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credentialInsignia: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insigniaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  insigniaTitle: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  insigniaSub: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 7.5,
    fontFamily: 'Montserrat_500Medium',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  docNumberPrefix: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  cardWatermarkCircle: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 20,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  mobileCard: {
    width: '100%',
    minHeight: 220,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  mobileWalletStack: {
    width: '100%',
    paddingBottom: 40,
    marginTop: 8,
  },
  mobileAddBtn: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  mobileExpandedPassContainer: {
    width: '100%',
    marginTop: 4,
    paddingBottom: 40,
  },
  mobileExpandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backToStackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 4,
  },
  backToStackText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
  },
  quickScanBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobilePassDetailsSheet: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  passActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  passActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  passActionBtnText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
  },
  passDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passPhotoWrap: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  passPhoto: {
    width: '100%',
    height: '100%',
  },
  returnToWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  returnToWalletBtnText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
  },
  cardCategoryPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  cardCategoryPillText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.8,
  },
  cardCleanTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.3,
  },
  cardEmbossedNumber: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 2,
    marginTop: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardHolderLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8.5,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 1,
  },
  cardHolderName: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardStatusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardStatusText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  addDashedCard: {
    width: 370,
    height: 230,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  addDashedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 227, 253, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  addDashedTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  addDashedSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  inspectorPanel: {
    flex: 1,
    minWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  inspectorPreTitle: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  inspectorDocTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.3,
  },
  inspectorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  inspectorStatusText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_700Bold',
  },
  inspectorPhotoContainer: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  inspectorPhoto: {
    width: '100%',
    height: '100%',
  },
  photoZoomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  photoZoomText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
  },
  inspectorNoPhotoBox: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  inspectorNoPhotoText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
  },
  qrBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  qrBannerTitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
  },
  qrBannerData: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 1,
  },
  openUrlBtn: {
    backgroundColor: 'rgba(0, 227, 253, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  openUrlBtnText: {
    color: '#00e3fd',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  inspectorDetailsTable: {
    marginBottom: 20,
  },
  detailTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailTableLabel: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.8,
  },
  detailTableVal: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
  },
  inspectorActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inspectorEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  inspectorEditBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  inspectorDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  inspectorDeleteBtnText: {
    color: '#ffb4ab',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  photoModalCloseBtn: {
    position: 'absolute',
    top: 30,
    right: 30,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  fullScreenPhoto: {
    width: '90%',
    height: '80%',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogModalBox: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  dialogSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_400Regular',
  },
  optionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  optionRowTitle: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
  },
  optionRowSub: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 2,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  docTypeChip: {
    borderWidth: 1,
    borderColor: 'rgba(64, 72, 92, 0.4)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  docTypeChipText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 10,
  },
  formBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBtnText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill as any,
    justifyContent: 'space-between',
    padding: 24,
  },
  scannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  scannerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTargetBox: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  targetCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#00e3fd',
  },
  scannerBottomBar: {
    paddingBottom: 40,
    alignItems: 'center',
  },
});
