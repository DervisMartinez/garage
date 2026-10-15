import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  COOKIES_POLICY,
  LEGAL_CONSTANTS,
} from '../../data/legal';

export type LegalDocType = 'terms' | 'privacy' | 'cookies';

interface Props {
  visible: boolean;
  initialDoc?: LegalDocType;
  onClose: () => void;
  onAccept?: (docType: LegalDocType) => void;
}

export const LegalDocModal: React.FC<Props> = ({
  visible,
  initialDoc = 'terms',
  onClose,
  onAccept,
}) => {
  const { colors, mode } = useTheme();
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc);

  // Sincronizar tab si cambia initialDoc
  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialDoc);
    }
  }, [visible, initialDoc]);

  const isDark = mode === 'dark';

  const F = {
    extrabold: 'Montserrat_800ExtraBold',
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  const tokens = {
    primary: isDark ? '#4169E1' : '#275FE3',
    secondary: '#00e3fd',
    tertiary: '#00ae78',
    surface: isDark ? '#111319' : '#f5f5f7',
    surfaceCard: isDark ? '#191c21' : '#ffffff',
    surfaceContainer: isDark ? '#1d2025' : '#ececf0',
    surfaceHigh: isDark ? '#272a30' : '#e0e0e6',
    outline: isDark ? '#40485c' : '#c4c6d0',
    textPrimary: isDark ? '#ffffff' : '#111319',
    textSecondary: isDark ? '#a0a5b5' : '#575b66',
  };

  const getDocData = () => {
    switch (activeTab) {
      case 'terms':
        return TERMS_AND_CONDITIONS;
      case 'privacy':
        return PRIVACY_POLICY;
      case 'cookies':
        return COOKIES_POLICY;
    }
  };

  const currentDoc = getDocData();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.surface }]}>
        <View style={[styles.headerContainer, { borderBottomColor: tokens.outline }]}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialIcons
                name={
                  activeTab === 'terms'
                    ? 'gavel'
                    : activeTab === 'privacy'
                    ? 'security'
                    : 'cookie'
                }
                size={22}
                color={tokens.primary}
              />
              <Text
                numberOfLines={1}
                style={[styles.headerTitle, { color: tokens.textPrimary, fontFamily: F.bold }]}
              >
                Marco Legal — {LEGAL_CONSTANTS.APP_NAME}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: tokens.surfaceContainer }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={20} color={tokens.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* SELECTOR DE PESTAÑAS / DOCUMENTOS */}
          <View style={[styles.tabSelector, { backgroundColor: tokens.surfaceContainer }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('terms')}
              style={[
                styles.tabButton,
                activeTab === 'terms' && [styles.tabActive, { backgroundColor: tokens.primary }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    fontFamily: F.bold,
                    color: activeTab === 'terms' ? '#FFFFFF' : tokens.textSecondary,
                  },
                ]}
              >
                Términos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('privacy')}
              style={[
                styles.tabButton,
                activeTab === 'privacy' && [styles.tabActive, { backgroundColor: tokens.primary }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    fontFamily: F.bold,
                    color: activeTab === 'privacy' ? '#FFFFFF' : tokens.textSecondary,
                  },
                ]}
              >
                Privacidad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('cookies')}
              style={[
                styles.tabButton,
                activeTab === 'cookies' && [styles.tabActive, { backgroundColor: tokens.primary }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    fontFamily: F.bold,
                    color: activeTab === 'cookies' ? '#FFFFFF' : tokens.textSecondary,
                  },
                ]}
              >
                Cookies
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENIDO DEL DOCUMENTO */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* ENCABEZADO DEL DOCUMENTO ACTIVO */}
          <View style={[styles.docHeroCard, { backgroundColor: tokens.surfaceCard, borderColor: tokens.outline }]}>
            <Text style={[styles.docTitle, { color: tokens.textPrimary, fontFamily: F.extrabold }]}>
              {currentDoc.title}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badgePill, { backgroundColor: tokens.surfaceContainer }]}>
                <MaterialIcons name="verified" size={14} color={tokens.tertiary} />
                <Text style={[styles.badgeText, { color: tokens.textSecondary, fontFamily: F.semibold }]}>
                  Versión: {currentDoc.version}
                </Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: tokens.surfaceContainer }]}>
                <MaterialIcons name="event" size={14} color={tokens.secondary} />
                <Text style={[styles.badgeText, { color: tokens.textSecondary, fontFamily: F.medium }]}>
                  {currentDoc.effectiveDate}
                </Text>
              </View>
            </View>
          </View>

          {/* SECCIONES */}
          {currentDoc.sections.map((section) => (
            <View
              key={section.id}
              style={[
                styles.sectionCard,
                { backgroundColor: tokens.surfaceCard, borderColor: tokens.outline },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: tokens.primary, fontFamily: F.bold }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionBody, { color: tokens.textPrimary, fontFamily: F.regular }]}>
                {section.content}
              </Text>
            </View>
          ))}

          {/* PIE DE CONTACTO */}
          <View style={[styles.contactCard, { backgroundColor: tokens.surfaceContainer }]}>
            <MaterialIcons name="mail-outline" size={24} color={tokens.primary} />
            <Text style={[styles.contactTitle, { color: tokens.textPrimary, fontFamily: F.bold }]}>
              Canal Oficial de Asuntos Legales y DPO
            </Text>
            <Text style={[styles.contactBody, { color: tokens.textSecondary, fontFamily: F.medium }]}>
              Para aclaratorias, solicitudes de derechos ARCO o consultas sobre tratamiento de datos:
            </Text>
            <Text style={[styles.contactEmail, { color: tokens.primary, fontFamily: F.bold }]}>
              {LEGAL_CONSTANTS.DPO_EMAIL}
            </Text>
          </View>
        </ScrollView>

        {/* BARRA INFERIOR DE ACCIÓN */}
        <View style={[styles.footerBar, { borderTopColor: tokens.outline, backgroundColor: tokens.surfaceCard }]}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: tokens.primary }]}
            onPress={() => {
              if (onAccept) onAccept(activeTab);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
            <Text style={[styles.primaryActionText, { fontFamily: F.extrabold }]}>
              ENTENDIDO Y CERRAR
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  docHeroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.8,
  },
  docTitle: {
    fontSize: 19,
    lineHeight: 26,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.8,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 21,
  },
  contactCard: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
    marginTop: 6,
  },
  contactTitle: {
    fontSize: 13.5,
    marginTop: 4,
  },
  contactBody: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
