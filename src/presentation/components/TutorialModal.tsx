import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: 'speed',
    badge: 'PASO 1',
    title: 'Odómetro al Día',
    subtitle: 'El motor del cálculo predictivo',
    desc: 'Cada vez que abras GARAGE o termines una jornada, actualiza tus kilómetros. La app calculará con precisión el desgaste real de tu aceite, cauchos, frenos y bujías.',
    highlight: '💡 Toca la tarjeta de Odómetro en cualquier momento para ajustarlo.',
  },
  {
    icon: 'account-balance-wallet',
    badge: 'PASO 2',
    title: 'Billetera Digital',
    subtitle: 'Tus papeles siempre en el bolsillo',
    desc: 'Digitaliza tu Licencia, Certificado Médico, RCV y Carnet de Circulación. Toca cualquier tarjeta para expandirla y mostrar la foto en alta definición ante cualquier requerimiento vial.',
    highlight: '💡 Si tienes varias motos, los documentos de cada vehículo se filtran solos.',
  },
  {
    icon: 'local-gas-station',
    badge: 'PASO 3',
    title: 'Carga de Gasolina',
    subtitle: 'Tanqueos y autonomía',
    desc: 'Toca el botón flotante azul con el surtidor para registrar litros y costo. Con eso, GARAGE estima tu consumo por litro y el nivel de combustible restante.',
    highlight: '💡 Calcula el gasto exacto en USD y los kilómetros recorridos.',
  },
  {
    icon: 'build-circle',
    badge: 'PASO 4',
    title: 'Salud Mecánica',
    subtitle: 'Mantenimiento antes de fallar',
    desc: 'En la pestaña "Servicios" consulta las barras de vida útil de tus componentes. Si algo cae al 15% o menos, la app activará alertas rojas para prevenir accidentes.',
    highlight: '💡 En Aceite puedes elegir Mineral, Semi o Sintético para ajustar la duración.',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const F = {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semibold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
    extrabold: 'Montserrat_800ExtraBold',
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('@garage_tutorial_seen', 'true');
    } catch {}
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}>
          
          {/* Header Bar */}
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.badgeText, { color: colors.onPrimaryContainer, fontFamily: F.bold }]}>
                {step.badge}
              </Text>
            </View>
            <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
              <Text style={{ color: colors.onSurfaceVariant, fontFamily: F.semibold, fontSize: 13 }}>
                Saltar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Central Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name={step.icon as any} size={48} color={colors.primary} />
          </View>

          {/* Texts */}
          <Text style={[styles.title, { color: colors.onSurface, fontFamily: F.extrabold }]}>
            {step.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.primary, fontFamily: F.semibold }]}>
            {step.subtitle}
          </Text>
          <Text style={[styles.desc, { color: colors.onSurfaceVariant, fontFamily: F.medium }]}>
            {step.desc}
          </Text>

          {/* Highlight Tip */}
          <View style={[styles.tipBox, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <Text style={[styles.tipText, { color: colors.onSurface, fontFamily: F.medium }]}>
              {step.highlight}
            </Text>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === currentStep ? colors.primary : colors.surfaceContainerHighest,
                    width: i === currentStep ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {currentStep > 0 ? (
              <TouchableOpacity
                onPress={handlePrev}
                style={[styles.backBtn, { borderColor: colors.outlineVariant }]}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            ) : <View style={{ width: 44 }} />}

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextBtnText, { color: colors.onPrimary, fontFamily: F.bold }]}>
                {currentStep === STEPS.length - 1 ? '¡Listo para Rodar!' : 'Siguiente'}
              </Text>
              <MaterialIcons
                name={currentStep === STEPS.length - 1 ? 'check' : 'arrow-forward'}
                size={20}
                color={colors.onPrimary}
              />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  skipBtn: {
    padding: 4,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  tipBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontSize: 15,
  },
});
