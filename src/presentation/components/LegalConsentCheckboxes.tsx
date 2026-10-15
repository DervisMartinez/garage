import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LegalDocType } from './LegalDocModal';

interface Props {
  termsAccepted: boolean;
  onToggleTerms: () => void;
  privacyAccepted: boolean;
  onTogglePrivacy: () => void;
  onOpenDoc: (docType: LegalDocType) => void;
  showValidationErrors?: boolean;
  disabled?: boolean;
}

export const LegalConsentCheckboxes: React.FC<Props> = ({
  termsAccepted,
  onToggleTerms,
  privacyAccepted,
  onTogglePrivacy,
  onOpenDoc,
  showValidationErrors = false,
  disabled = false,
}) => {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  const tokens = {
    primary: isDark ? '#4169E1' : '#275FE3',
    secondary: '#00e3fd',
    tertiary: '#00ae78',
    alert: '#ba1a1a',
    surfaceCard: isDark ? '#191c21' : '#ffffff',
    surfaceContainer: isDark ? '#1d2025' : '#ececf0',
    outline: isDark ? '#40485c' : '#c4c6d0',
    outlineError: '#ba1a1a',
    textPrimary: isDark ? '#ffffff' : '#111319',
    textSecondary: isDark ? '#a0a5b5' : '#575b66',
  };

  const termsHasError = showValidationErrors && !termsAccepted;
  const privacyHasError = showValidationErrors && !privacyAccepted;

  return (
    <View style={styles.container}>
      {/* MENSAJE DE VALIDACIÓN SI FALTA ALGUNA CASILLA */}
      {(termsHasError || privacyHasError) && (
        <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(186,26,26,0.2)' : 'rgba(186,26,26,0.1)' }]}>
          <MaterialIcons name="error-outline" size={16} color={tokens.alert} />
          <Text style={[styles.errorBannerText, { color: tokens.alert, fontFamily: F.bold }]}>
            Debes marcar ambas casillas por separado para continuar
          </Text>
        </View>
      )}

      {/* CASILLA 1: TÉRMINOS Y CONDICIONES */}
      <View
        style={[
          styles.checkboxRowCard,
          {
            backgroundColor: tokens.surfaceCard,
            borderColor: termsHasError ? tokens.outlineError : termsAccepted ? tokens.tertiary : tokens.outline,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onToggleTerms}
          disabled={disabled}
          activeOpacity={0.7}
          style={styles.touchableArea}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                borderColor: termsAccepted ? tokens.primary : tokens.outline,
                backgroundColor: termsAccepted ? tokens.primary : 'transparent',
              },
            ]}
          >
            {termsAccepted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text style={[styles.labelMain, { color: tokens.textPrimary, fontFamily: F.medium }]}>
            He leído y acepto los{' '}
            <Text
              onPress={() => onOpenDoc('terms')}
              style={[styles.linkText, { color: tokens.primary, fontFamily: F.bold }]}
            >
              Términos y Condiciones
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() => onOpenDoc('terms')}
            style={styles.openDocChip}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.openDocText, { color: tokens.secondary, fontFamily: F.semibold }]}>
              Leer documento
            </Text>
            <MaterialIcons name="open-in-new" size={13} color={tokens.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CASILLA 2: POLÍTICA DE PRIVACIDAD */}
      <View
        style={[
          styles.checkboxRowCard,
          {
            backgroundColor: tokens.surfaceCard,
            borderColor: privacyHasError ? tokens.outlineError : privacyAccepted ? tokens.tertiary : tokens.outline,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onTogglePrivacy}
          disabled={disabled}
          activeOpacity={0.7}
          style={styles.touchableArea}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                borderColor: privacyAccepted ? tokens.primary : tokens.outline,
                backgroundColor: privacyAccepted ? tokens.primary : 'transparent',
              },
            ]}
          >
            {privacyAccepted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text style={[styles.labelMain, { color: tokens.textPrimary, fontFamily: F.medium }]}>
            He leído y acepto la{' '}
            <Text
              onPress={() => onOpenDoc('privacy')}
              style={[styles.linkText, { color: tokens.primary, fontFamily: F.bold }]}
            >
              Política de Privacidad
            </Text>
          </Text>
          <Text style={[styles.labelSub, { color: tokens.textSecondary, fontFamily: F.regular }]}>
            Consiento el tratamiento de mis datos de perfil, vehiculares, salud (grupo sanguíneo) y geolocalización para emergencias.
          </Text>
          <TouchableOpacity
            onPress={() => onOpenDoc('privacy')}
            style={styles.openDocChip}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.openDocText, { color: tokens.secondary, fontFamily: F.semibold }]}>
              Leer documento
            </Text>
            <MaterialIcons name="open-in-new" size={13} color={tokens.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* AVISO DE COOKIES Y ALMACENAMIENTO LOCAL */}
      <View style={[styles.cookiesNoticeCard, { backgroundColor: tokens.surfaceContainer }]}>
        <MaterialCommunityIcons name="cookie-outline" size={18} color={tokens.secondary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cookiesNoticeText, { color: tokens.textSecondary, fontFamily: F.regular }]}>
            GARAGE emplea almacenamiento técnico estrictamente necesario (sesión y datos de la moto). Consulta nuestra{' '}
            <Text
              onPress={() => onOpenDoc('cookies')}
              style={[styles.linkTextUnderline, { color: tokens.primary, fontFamily: F.bold }]}
            >
              Política de Cookies
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  errorBannerText: {
    fontSize: 11.5,
    flex: 1,
  },
  checkboxRowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  touchableArea: {
    paddingTop: 2,
    paddingRight: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  labelMain: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  labelSub: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  linkTextUnderline: {
    textDecorationLine: 'underline',
  },
  openDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  openDocText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  cookiesNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cookiesNoticeText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
