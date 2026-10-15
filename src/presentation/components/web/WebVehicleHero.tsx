import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useMyMoto } from '../../context/MotoContext';
import { MOTO_CATALOG } from '../../../data/catalog';
import { calculateWearPercentage } from '../../../constants/telemetry';

interface WebVehicleHeroProps {
  onOpenSpecs: () => void;
  onOpenStats: () => void;
  onOpenQuickOdo: () => void;
  onOpenQuickFuel: () => void;
  onOpenSOS: () => void;
  onScrollToTelemetry: () => void;
  onOpenInspection?: () => void;
}

export const WebVehicleHero: React.FC<WebVehicleHeroProps> = ({
  onOpenSpecs,
  onOpenStats,
  onOpenQuickOdo,
  onOpenQuickFuel,
  onOpenSOS,
  onScrollToTelemetry,
  onOpenInspection,
}) => {
  const { colors, mode } = useTheme();
  const { myMoto, motos, selectMoto, records } = useMyMoto();

  const isDark = mode === 'dark';

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  // Find image of active moto
  const imageSource = useMemo(() => {
    if (!myMoto) return null;
    if (myMoto.imageUrl && myMoto.imageUrl.trim() !== '') {
      return { uri: myMoto.imageUrl };
    }
    if (myMoto.catalogImageRes) {
      return myMoto.catalogImageRes;
    }
    const cat = MOTO_CATALOG.find(
      (m) => m.brand.toLowerCase() === myMoto.brand.toLowerCase() && m.model.toLowerCase() === myMoto.model.toLowerCase()
    );
    if (cat?.imageRes) return cat.imageRes;
    // First catalog fallback if brand matches
    const brandCat = MOTO_CATALOG.find(
      (m) => m.brand.toLowerCase() === myMoto.brand.toLowerCase()
    );
    return brandCat?.imageRes || null;
  }, [myMoto]);

  // Index of active moto in motos list
  const activeIndex = useMemo(() => {
    if (!myMoto || !motos.length) return 0;
    const idx = motos.findIndex((m) => m.id === myMoto.id);
    return idx >= 0 ? idx : 0;
  }, [myMoto, motos]);

  const handlePrevMoto = () => {
    if (motos.length <= 1) return;
    const prevIdx = (activeIndex - 1 + motos.length) % motos.length;
    selectMoto(motos[prevIdx].id);
  };

  const handleNextMoto = () => {
    if (motos.length <= 1) return;
    const nextIdx = (activeIndex + 1) % motos.length;
    selectMoto(motos[nextIdx].id);
  };

  const prevMotoName = motos.length > 1 ? `${motos[(activeIndex - 1 + motos.length) % motos.length].brand} ${motos[(activeIndex - 1 + motos.length) % motos.length].model}` : '';
  const nextMotoName = motos.length > 1 ? `${motos[(activeIndex + 1) % motos.length].brand} ${motos[(activeIndex + 1) % motos.length].model}` : '';

  // Oil telemetry calculation
  const oilWear = useMemo(() => {
    if (!myMoto) return 100;
    const oilRecords = records.filter((r) => r.type === 'oil');
    const lastOilOdo = oilRecords.length > 0 ? oilRecords[0].odometer : 0;
    return calculateWearPercentage(myMoto.currentOdometer, lastOilOdo, 'oil');
  }, [myMoto, records]);

  if (!myMoto) return null;

  return (
    <View style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      <LinearGradient
        colors={isDark ? ['#111319', '#141a29', '#0f1218'] : ['#f0f4fa', '#e4ecf8', '#edf2fa']}
        style={styles.heroContainer}
      >
        {/* ATMOSPHERIC BACKGROUND RADIAL GLOW */}
        <View style={{
          position: 'absolute',
          top: '15%',
          left: '25%',
          width: 700,
          height: 520,
          borderRadius: 350,
          backgroundColor: isDark ? 'rgba(65, 105, 225, 0.14)' : 'rgba(39, 95, 227, 0.09)',
          pointerEvents: 'none',
          zIndex: 1,
        } as any} />

        {/* WATERMARK TEXT (Like "2022" in Yamaha reference image) */}
        <Text style={{
          position: 'absolute',
          top: '10%',
          left: '8%',
          fontSize: 180,
          fontFamily: F.extrabold,
          color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.035)',
          zIndex: 1,
          letterSpacing: 8,
        }}>
          {myMoto.year || '2024'}
        </Text>

        {/* HERO MAIN ROW: LEFT ARROW, CENTER BIKE, RIGHT INFO, RIGHT ARROW */}
        <View style={styles.heroContentRow}>
          
          {/* CAROUSEL PREV ARROW */}
          <TouchableOpacity
            style={[styles.carouselArrowBtn, { 
              backgroundColor: isDark ? 'rgba(25, 28, 33, 0.65)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : 'rgba(0, 0, 0, 0.1)',
              opacity: motos.length > 1 ? 1 : 0.3
            }]}
            onPress={handlePrevMoto}
            disabled={motos.length <= 1}
            activeOpacity={0.8}
            accessibilityLabel="Moto anterior"
          >
            <MaterialIcons name="chevron-left" size={32} color={colors.onSurface} />
          </TouchableOpacity>

          {/* CENTER: MOTORCYCLE SHOWCASE WITH SOFT SHADOW & 3D INSPECTION */}
          <TouchableOpacity 
            style={styles.bikeShowcaseContainer}
            onPress={onOpenInspection}
            activeOpacity={0.9}
            accessibilityLabel="Abrir inspección interactiva 3D"
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.bikeImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.bikePlaceholder}>
                <MaterialIcons name="two-wheeler" size={130} color="#4169E1" />
                <Text style={[styles.bikePlaceholderText, { color: colors.onSurfaceVariant }]}>
                  {myMoto.brand} {myMoto.model}
                </Text>
              </View>
            )}

            {/* FLOATING 3D INSPECTION BADGE */}
            <View style={{
              position: 'absolute',
              top: 8,
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: isDark ? 'rgba(17, 25, 40, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              borderWidth: 0.8,
              borderColor: '#00e3fd',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
              zIndex: 10,
            }}>
              <MaterialIcons name="3d-rotation" size={14} color="#00e3fd" />
              <Text style={{ fontFamily: F.bold, fontSize: 10.5, color: isDark ? '#ffffff' : '#111319', letterSpacing: 0.5 }}>
                TOCA PARA INSPECCIONAR EN 3D
              </Text>
            </View>

            {/* SOFT GROUND SHADOW (Like in technical presentation) */}
            <View style={{
              width: '85%',
              height: 28,
              marginHorizontal: 'auto',
              marginTop: -24,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.14)',
            } as any} />
          </TouchableOpacity>

          {/* RIGHT SIDE: VEHICLE TITLE, TELEMETRY SPECS & CTA BUTTONS */}
          <View style={styles.heroInfoBlock}>
            
            {/* BRAND & MODEL HEADLINE */}
            <View style={styles.brandBadgeRow}>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>{myMoto.brand.toUpperCase()}</Text>
              </View>
              {myMoto.year && (
                <Text style={[styles.yearText, { color: colors.onSurfaceVariant }]}>
                  MOD. {myMoto.year}
                </Text>
              )}
            </View>

            <Text style={[styles.modelHeading, { color: colors.onSurface }]}>
              {myMoto.model.toUpperCase()}
            </Text>

            {/* TELEMETRY READINGS */}
            <View style={styles.telemetryQuickSpecs}>
              <View style={styles.telemetrySpecItem}>
                <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>ODÓMETRO TOTAL</Text>
                <Text style={[styles.specValueMain, { color: isDark ? '#ffffff' : '#111319' }]}>
                  {myMoto.currentOdometer.toLocaleString()}{' '}
                  <Text style={{ fontSize: 16, color: '#00e3fd' }}>KM</Text>
                </Text>
              </View>

              <View style={styles.telemetrySpecItem}>
                <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>SALUD DE ACEITE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.specValueMain, { 
                    color: oilWear > 40 ? '#00ae78' : (oilWear > 15 ? '#ffb703' : '#ba1a1a') 
                  }]}>
                    {oilWear}%
                  </Text>
                  <View style={[styles.healthBadge, {
                    backgroundColor: oilWear > 40 ? 'rgba(0, 174, 120, 0.15)' : 'rgba(186, 26, 26, 0.15)',
                    borderColor: oilWear > 40 ? '#00ae78' : '#ba1a1a',
                  }]}>
                    <Text style={[styles.healthBadgeText, {
                      color: oilWear > 40 ? '#00ae78' : '#ffb4ab'
                    }]}>
                      {oilWear > 40 ? 'ÓPTIMO' : (oilWear > 15 ? 'ATENCIÓN' : 'CAMBIO')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ACTION BUTTONS (Matching "FIND A DEALER" style in reference) */}
            <View style={styles.ctaButtonGroup}>
              <TouchableOpacity
                style={[styles.primaryCtaBtn, { 
                  borderColor: isDark ? '#ffffff' : '#111319',
                }]}
                onPress={onOpenQuickOdo}
                activeOpacity={0.8}
              >
                <MaterialIcons name="speed" size={17} color={isDark ? '#ffffff' : '#111319'} style={{ marginRight: 8 }} />
                <Text style={[styles.primaryCtaText, { color: isDark ? '#ffffff' : '#111319' }]}>
                  ACTUALIZAR KM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCtaBtn}
                onPress={onOpenQuickFuel}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="gas-station" size={17} color="#00e3fd" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryCtaText}>CARGAR GASOLINA</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* CAROUSEL NEXT ARROW */}
          <TouchableOpacity
            style={[styles.carouselArrowBtn, { 
              backgroundColor: isDark ? 'rgba(25, 28, 33, 0.65)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : 'rgba(0, 0, 0, 0.1)',
              opacity: motos.length > 1 ? 1 : 0.3
            }]}
            onPress={handleNextMoto}
            disabled={motos.length <= 1}
            activeOpacity={0.8}
            accessibilityLabel="Moto siguiente"
          >
            <MaterialIcons name="chevron-right" size={32} color={colors.onSurface} />
          </TouchableOpacity>

        </View>

        {/* BOTTOM SUB-NAVIGATION PILLS (Matching + TOP FEATURES, + GALLERY, + SPECS in reference) */}
        <View style={styles.subPillsRow}>
          {onOpenInspection && (
            <TouchableOpacity
              style={[styles.subPill, { 
                borderColor: '#00e3fd', 
                backgroundColor: isDark ? 'rgba(0, 227, 253, 0.12)' : 'rgba(0, 227, 253, 0.08)' 
              }]}
              onPress={onOpenInspection}
              activeOpacity={0.8}
            >
              <MaterialIcons name="3d-rotation" size={14} color="#00e3fd" style={{ marginRight: 6 }} />
              <Text style={[styles.subPillText, { color: '#00e3fd', fontFamily: F.bold }]}>+ INSPECCIÓN 3D & PIEZAS</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.subPill, { borderColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]}
            onPress={onScrollToTelemetry}
            activeOpacity={0.8}
          >
            <Text style={[styles.subPillText, { color: colors.onSurface }]}>+ TELEMETRÍA Y DESGASTE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subPill, { borderColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]}
            onPress={onOpenSpecs}
            activeOpacity={0.8}
          >
            <Text style={[styles.subPillText, { color: colors.onSurface }]}>+ FICHA TÉCNICA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subPill, { borderColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]}
            onPress={onOpenStats}
            activeOpacity={0.8}
          >
            <Text style={[styles.subPillText, { color: colors.onSurface }]}>+ CALENDARIO Y GASTOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subPill, { 
              borderColor: 'rgba(186, 26, 26, 0.5)',
              backgroundColor: 'rgba(186, 26, 26, 0.12)' 
            }]}
            onPress={onOpenSOS}
            activeOpacity={0.8}
          >
            <MaterialIcons name="warning" size={14} color="#ffb4ab" style={{ marginRight: 6 }} />
            <Text style={[styles.subPillText, { color: '#ffb4ab' }]}>+ PROTOCOLO SOS</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM FOOTER CAROUSEL BAR (Matching < Aerox 155 VVA ... NMax Connected > in reference) */}
        {motos.length > 1 && (
          <View style={styles.footerCarouselBar}>
            <TouchableOpacity 
              style={styles.footerNavSide} 
              onPress={handlePrevMoto}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chevron-left" size={18} color="#00e3fd" />
              <Text style={styles.footerNavSideText}>{prevMotoName}</Text>
            </TouchableOpacity>

            {/* PAGINATION DOTS */}
            <View style={styles.footerDotsRow}>
              {motos.map((m, i) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => selectMoto(m.id)}
                  style={[
                    styles.footerDot,
                    i === activeIndex && styles.footerDotActive
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.footerNavSide} 
              onPress={handleNextMoto}
              activeOpacity={0.7}
            >
              <Text style={styles.footerNavSideText}>{nextMotoName}</Text>
              <MaterialIcons name="chevron-right" size={18} color="#00e3fd" />
            </TouchableOpacity>
          </View>
        )}

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    minHeight: 600,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 40,
    position: 'relative',
    justifyContent: 'space-between',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    gap: 24,
  },
  carouselArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bikeShowcaseContainer: {
    flex: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 440,
    position: 'relative',
  },
  bikeImage: {
    width: '100%',
    height: 450,
    maxWidth: 780,
  },
  bikePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
  },
  bikePlaceholderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginTop: 12,
  },
  heroInfoBlock: {
    flex: 1,
    maxWidth: 420,
    paddingLeft: 12,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  brandPill: {
    backgroundColor: '#4169E1',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  brandPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1.5,
  },
  yearText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 1,
  },
  modelHeading: {
    fontSize: 36,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 20,
  },
  telemetryQuickSpecs: {
    gap: 14,
    marginBottom: 26,
  },
  telemetrySpecItem: {
    gap: 4,
  },
  specLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 1.2,
  },
  specValueMain: {
    fontSize: 26,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  healthBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  healthBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.8,
  },
  ctaButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryCtaBtn: {
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  secondaryCtaBtn: {
    backgroundColor: 'rgba(0, 227, 253, 0.12)',
    borderColor: 'rgba(0, 227, 253, 0.4)',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: '#00e3fd',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.8,
  },
  subPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 2,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  subPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subPillText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.8,
  },
  footerCarouselBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(64, 72, 92, 0.25)',
    zIndex: 2,
    marginTop: 18,
  },
  footerNavSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  footerNavSideText: {
    color: '#00e3fd',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.5,
  },
  footerDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(64, 72, 92, 0.6)',
  },
  footerDotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: '#00e3fd',
  },
});
