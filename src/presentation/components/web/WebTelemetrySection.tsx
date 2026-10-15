import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useMyMoto } from '../../context/MotoContext';
import { calculateWearPercentage, COMPONENT_NAMES, COMPONENT_LIFESPAN_KM } from '../../../constants/telemetry';
import { getMotoSpecs } from '../../../data/specs';

interface WebTelemetrySectionProps {
  onOpenSpecs: () => void;
  onOpenQuickOdo: () => void;
  onOpenQuickFuel: () => void;
  onOpenServicesTab: () => void;
}

export const WebTelemetrySection: React.FC<WebTelemetrySectionProps> = ({
  onOpenSpecs,
  onOpenQuickOdo,
  onOpenQuickFuel,
  onOpenServicesTab,
}) => {
  const { colors, mode } = useTheme();
  const { myMoto, records } = useMyMoto();
  const { width: windowWidth } = useWindowDimensions();

  const isDark = mode === 'dark';

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  const specs = useMemo(() => {
    if (!myMoto) return null;
    return getMotoSpecs(myMoto.brand, myMoto.model);
  }, [myMoto]);

  // Telemetry wear calculations
  const wearData = useMemo(() => {
    if (!myMoto) return [];

    const getComponentLastOdo = (type: string, fallback: number) => {
      const rec = records.find((r) => r.type === type);
      return rec ? rec.odometer : fallback;
    };

    const oilWear = calculateWearPercentage(
      myMoto.currentOdometer,
      getComponentLastOdo('oil', 0),
      'oil'
    );

    const brakesFrontWear = calculateWearPercentage(
      myMoto.currentOdometer,
      getComponentLastOdo('brakes_front', 0),
      'brakes_front'
    );

    const chainWear = calculateWearPercentage(
      myMoto.currentOdometer,
      getComponentLastOdo('chain', 0),
      'chain'
    );

    const tiresWear = calculateWearPercentage(
      myMoto.currentOdometer,
      getComponentLastOdo('tires_front', 0),
      'tires_front'
    );

    return [
      {
        id: 'oil',
        name: 'Aceite de Motor (4T)',
        wear: oilWear,
        maxKm: COMPONENT_LIFESPAN_KM.oil,
        icon: 'opacity',
        iconFamily: 'material',
        recommendation: specs?.oilTypeRecommended || '20W-50 4T JASO MA2',
      },
      {
        id: 'brakes',
        name: 'Pastillas de Freno',
        wear: brakesFrontWear,
        maxKm: COMPONENT_LIFESPAN_KM.brakes_front,
        icon: 'disc-alert',
        iconFamily: 'community',
        recommendation: specs?.brakesFront || 'Disco hidráulico',
      },
      {
        id: 'chain',
        name: 'Cadena de Transmisión',
        wear: chainWear,
        maxKm: COMPONENT_LIFESPAN_KM.chain,
        icon: 'link',
        iconFamily: 'material',
        recommendation: specs?.chainType || 'Paso 428H reforzada',
      },
      {
        id: 'tires',
        name: 'Neumáticos (Presión)',
        wear: tiresWear,
        maxKm: COMPONENT_LIFESPAN_KM.tires_front,
        icon: 'tire',
        iconFamily: 'community',
        recommendation: `Del: ${specs?.frontTirePressure || '28 PSI'} • Tras: ${specs?.rearTirePressure || '32 PSI'}`,
      },
    ];
  }, [myMoto, records, specs]);

  // Financial summary
  const totalFuelUSD = useMemo(() => {
    return records
      .filter((r) => r.type === 'fuel')
      .reduce((sum, r) => sum + (r.costUSD || 0), 0);
  }, [records]);

  const totalMaintenanceUSD = useMemo(() => {
    return records
      .filter((r) => r.type !== 'fuel')
      .reduce((sum, r) => sum + (r.costUSD || 0), 0);
  }, [records]);

  if (!myMoto) return null;

  return (
    <View nativeID="telemetry-section" style={{ width: '100%', paddingVertical: windowWidth < 1200 ? 24 : 40, paddingHorizontal: windowWidth < 1200 ? 20 : 48 }}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MaterialCommunityIcons name="gauge" size={20} color="#00e3fd" />
            <Text style={[styles.sectionSubtitle, { color: '#00e3fd' }]}>TELEMETRÍA EN TIEMPO REAL</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Desgaste y Ciclos de Mantenimiento
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.openServicesBtn, { borderColor: isDark ? '#40485c' : '#d0d4dc' }]}
          onPress={onOpenServicesTab}
          activeOpacity={0.8}
        >
          <Text style={[styles.openServicesBtnText, { color: colors.onSurface }]}>VER TODOS LOS SERVICIOS</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#4169E1" />
        </TouchableOpacity>
      </View>

      {/* 4 TELEMETRY WEAR CARDS (GRID) */}
      <View style={styles.wearCardsGrid}>
        {wearData.map((item) => {
          const isHealthy = item.wear > 40;
          const isWarning = item.wear <= 40 && item.wear > 15;
          const statusColor = isHealthy ? '#00ae78' : (isWarning ? '#ffb703' : '#ba1a1a');

          return (
            <View 
              key={item.id}
              style={[
                styles.wearCard,
                { 
                  backgroundColor: isDark ? '#191c21' : '#ffffff',
                  borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0, 0, 0, 0.08)',
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, { backgroundColor: isDark ? '#272a30' : '#ececf0' }]}>
                  {item.iconFamily === 'community' ? (
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={statusColor} />
                  ) : (
                    <MaterialIcons name={item.icon as any} size={20} color={statusColor} />
                  )}
                </View>

                <View style={[styles.statusPill, { 
                  backgroundColor: `${statusColor}1A`, 
                  borderColor: statusColor 
                }]}>
                  <Text style={[styles.statusPillText, { color: statusColor }]}>
                    {isHealthy ? 'ÓPTIMO' : (isWarning ? 'ATENCIÓN' : 'RECAMBIO')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                {item.name}
              </Text>
              
              <Text style={[styles.cardRecommendation, { color: colors.onSurfaceVariant }]}>
                {item.recommendation}
              </Text>

              {/* PROGRESS BAR */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#272a30' : '#e0e0e6' }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${item.wear}%`, 
                        backgroundColor: statusColor 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.wearPercentText, { color: statusColor }]}>
                  {item.wear}%
                </Text>
              </View>

              <Text style={[styles.wearSubDetail, { color: colors.onSurfaceVariant }]}>
                Ciclo nominal: {item.maxKm.toLocaleString()} km
              </Text>
            </View>
          );
        })}
      </View>

      {/* SECOND ROW: QUICK SPECS & EXPENSE SUMMARY (Like Slide 2 & 3 in reference) */}
      <View style={styles.bottomOverviewRow}>
        
        {/* QUICK SPECS OVERVIEW */}
        <View style={[styles.overviewCard, { 
          backgroundColor: isDark ? '#191c21' : '#ffffff',
          borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0, 0, 0, 0.08)',
        }]}>
          <View style={styles.overviewCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="tune" size={18} color="#00e3fd" />
              <Text style={[styles.overviewTitle, { color: colors.onSurface }]}>
                Especificaciones Clave de Fábrica
              </Text>
            </View>
            <TouchableOpacity onPress={onOpenSpecs}>
              <Text style={styles.viewFullSpecsLink}>Ficha Completa ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.specsGrid}>
            <View style={styles.specMiniItem}>
              <Text style={[styles.specMiniLabel, { color: colors.onSurfaceVariant }]}>CILINDRADA</Text>
              <Text style={[styles.specMiniValue, { color: colors.onSurface }]}>
                {specs?.displacement || 'N/D'}
              </Text>
            </View>

            <View style={styles.specMiniItem}>
              <Text style={[styles.specMiniLabel, { color: colors.onSurfaceVariant }]}>POTENCIA</Text>
              <Text style={[styles.specMiniValue, { color: colors.onSurface }]}>
                {specs?.hp || 'N/D'}
              </Text>
            </View>

            <View style={styles.specMiniItem}>
              <Text style={[styles.specMiniLabel, { color: colors.onSurfaceVariant }]}>TANQUE</Text>
              <Text style={[styles.specMiniValue, { color: colors.onSurface }]}>
                {specs?.fuelCapacity || 'N/D'}
              </Text>
            </View>

            <View style={styles.specMiniItem}>
              <Text style={[styles.specMiniLabel, { color: colors.onSurfaceVariant }]}>TRANSMISIÓN</Text>
              <Text style={[styles.specMiniValue, { color: colors.onSurface }]}>
                {specs?.transmission || 'Manual'}
              </Text>
            </View>
          </View>
        </View>

        {/* FINANCIAL & LOG OVERVIEW */}
        <View style={[styles.overviewCard, { 
          backgroundColor: isDark ? '#191c21' : '#ffffff',
          borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0, 0, 0, 0.08)',
        }]}>
          <View style={styles.overviewCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="account-balance-wallet" size={18} color="#4169E1" />
              <Text style={[styles.overviewTitle, { color: colors.onSurface }]}>
                Balance de Gastos del Vehículo
              </Text>
            </View>
          </View>

          <View style={styles.financeMetricsRow}>
            <View style={styles.financeMetricBox}>
              <Text style={[styles.specMiniLabel, { color: colors.onSurfaceVariant }]}>TOTAL COMBUSTIBLE</Text>
              <Text style={[styles.financeAmount, { color: '#00e3fd' }]}>
                ${totalFuelUSD.toFixed(2)}{' '}
                <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>USD</Text>
              </Text>
              <TouchableOpacity onPress={onOpenQuickFuel} style={{ marginTop: 6 }}>
                <Text style={styles.actionLinkText}>+ Registrar carga</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.financeDivider, { backgroundColor: isDark ? '#272a30' : '#e0e0e6' }]} />

            <View style={styles.financeMetricBox}>
              <Text style={[styles.specMiniLabel, { color: colors.onSurfaceVariant }]}>TOTAL MANTENIMIENTO</Text>
              <Text style={[styles.financeAmount, { color: '#4169E1' }]}>
                ${totalMaintenanceUSD.toFixed(2)}{' '}
                <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>USD</Text>
              </Text>
              <TouchableOpacity onPress={onOpenServicesTab} style={{ marginTop: 6 }}>
                <Text style={styles.actionLinkText}>+ Nuevo servicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.3,
  },
  openServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  openServicesBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.8,
  },
  wearCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  wearCard: {
    flex: 1,
    minWidth: 260,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusPillText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 4,
  },
  cardRecommendation: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wearPercentText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    width: 44,
    textAlign: 'right',
  },
  wearSubDetail: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
  },
  bottomOverviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  overviewCard: {
    flex: 1,
    minWidth: 380,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  overviewTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  viewFullSpecsLink: {
    color: '#4169E1',
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  specMiniItem: {
    flex: 1,
    minWidth: 130,
    gap: 2,
  },
  specMiniLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.8,
  },
  specMiniValue: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
  },
  financeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  financeMetricBox: {
    flex: 1,
    alignItems: 'center',
  },
  financeDivider: {
    width: 1,
    height: 48,
    marginHorizontal: 12,
  },
  financeAmount: {
    fontSize: 24,
    fontFamily: 'Montserrat_800ExtraBold',
    marginTop: 4,
  },
  actionLinkText: {
    color: '#00e3fd',
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
  },
});
