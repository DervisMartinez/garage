import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';
import { COMPONENT_NAMES } from '../../constants/telemetry';

const { width } = Dimensions.get('window');

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

interface Props {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'stats' | 'calendar';
}

export const VehicleStatsAndCalendarModal: React.FC<Props> = ({ 
  visible, 
  onClose,
  initialTab = 'calendar'
}) => {
  const { colors, mode } = useTheme();
  const { myMoto, records } = useMyMoto();

  const [activeScreen, setActiveScreen] = useState<'stats' | 'calendar'>(initialTab);
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  const isDark = mode === 'dark';

  // Safe Date Helper
  const parseSafeDate = (d: string) => {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
    const parts = d.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  };

  // Group records by day for current viewing month
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Lunes = 0

  // Records in current month
  const monthRecords = useMemo(() => {
    const map: Record<number, any[]> = {};
    records.forEach(r => {
      const d = parseSafeDate(r.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    });
    return map;
  }, [records, currentYear, currentMonth]);

  // Projected upcoming maintenances
  const projectedServices = useMemo(() => {
    if (!myMoto) return [];
    
    const estDailyKm = 25;
    
    const lastOil = records.filter(r => r.type === 'oil').reduce((p, c) => (p?.odometer > c.odometer ? p : c), null as any);
    const oilLastKm = lastOil ? lastOil.odometer : (myMoto.isFromAgency ? 0 : myMoto.currentOdometer - 1500);
    const oilDueKm = oilLastKm + 2500;
    const kmLeftOil = Math.max(0, oilDueKm - myMoto.currentOdometer);
    const daysLeftOil = Math.ceil(kmLeftOil / estDailyKm);

    const oilTargetDate = new Date();
    oilTargetDate.setDate(oilTargetDate.getDate() + daysLeftOil);

    const lastBrakes = records.filter(r => r.type === 'brakes_front').reduce((p, c) => (p?.odometer > c.odometer ? p : c), null as any);
    const brakesLastKm = lastBrakes ? lastBrakes.odometer : myMoto.currentOdometer - 3000;
    const brakesDueKm = brakesLastKm + 6000;
    const kmLeftBrakes = Math.max(0, brakesDueKm - myMoto.currentOdometer);
    const daysLeftBrakes = Math.ceil(kmLeftBrakes / estDailyKm);
    const brakesTargetDate = new Date();
    brakesTargetDate.setDate(brakesTargetDate.getDate() + daysLeftBrakes);

    return [
      {
        type: 'oil',
        name: 'Próximo Cambio de Aceite 4T',
        dueKm: oilDueKm,
        kmLeft: kmLeftOil,
        daysLeft: daysLeftOil,
        date: oilTargetDate,
        color: '#FF9500',
        icon: 'opacity',
      },
      {
        type: 'brakes',
        name: 'Inspección de Pastillas de Freno',
        dueKm: brakesDueKm,
        kmLeft: kmLeftBrakes,
        daysLeft: daysLeftBrakes,
        date: brakesTargetDate,
        color: '#0A84FF',
        icon: 'pan-tool',
      },
    ];
  }, [myMoto, records]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalSpent = records.reduce((acc, r) => acc + (Number(r.costUSD) || 0), 0);
    const fuelRecords = records.filter(r => r.type === 'fuel');
    const fuelSpent = fuelRecords.reduce((acc, r) => acc + (Number(r.costUSD) || 0), 0);
    const serviceSpent = totalSpent - fuelSpent;

    const totalKm = myMoto?.currentOdometer || 0;
    const costPerKm = totalKm > 0 ? (totalSpent / totalKm).toFixed(3) : '0.000';

    return {
      totalSpent,
      fuelSpent,
      serviceSpent,
      totalKm,
      costPerKm,
      avgDailyKm: 28,
      efficiencyKmPerL: 32.5,
    };
  }, [myMoto, records]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectedDayRecords = monthRecords[selectedDay] || [];
  const bentoCardWidth = (width - 40 - 12) / 2;

  // Adaptive Colors
  const modalBg = colors.surface;
  const cardBg = colors.surfaceContainer;
  const pillInactiveBg = colors.surfaceContainerHigh;
  const textPrimary = colors.onSurface;
  const textSecondary = colors.onSurfaceVariant;
  const calCardBg = isDark ? '#1E3A8A' : '#2563EB';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: modalBg }}>
        
        {/* TOP BAR / TABS CONTROLLER (Estilo Pinterest / Lukáš Straňák) */}
        <View style={[styles.topHeader, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} style={[styles.backCircleBtn, { backgroundColor: cardBg }]}>
            <MaterialIcons name="close" size={24} color={textPrimary} />
          </TouchableOpacity>

          <View style={[styles.segmentedTabBox, { backgroundColor: cardBg }]}>
            <TouchableOpacity 
              onPress={() => setActiveScreen('calendar')}
              style={[styles.segmentBtn, activeScreen === 'calendar' && styles.segmentBtnActive]}
            >
              <MaterialIcons name="event" size={16} color={activeScreen === 'calendar' ? '#000' : textSecondary} />
              <Text style={[styles.segmentText, { color: activeScreen === 'calendar' ? '#000' : textSecondary, fontFamily: F.bold }]}>
                Calendario
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveScreen('stats')}
              style={[styles.segmentBtn, activeScreen === 'stats' && styles.segmentBtnActive]}
            >
              <MaterialIcons name="bar-chart" size={16} color={activeScreen === 'stats' ? '#000' : textSecondary} />
              <Text style={[styles.segmentText, { color: activeScreen === 'stats' ? '#000' : textSecondary, fontFamily: F.bold }]}>
                Estadísticas
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          
          {/* ============================================================== */}
          {/* SCREEN 1: CALENDARIO & PLANIFICACIÓN PREVENTIVA                */}
          {/* ============================================================== */}
          {activeScreen === 'calendar' && (
            <View>
              {/* Card Azul con la cuadrícula del Calendario */}
              <View style={[styles.calendarCard, { backgroundColor: calCardBg }]}>
                
                {/* Selector de Mes */}
                <View style={styles.calendarHeaderRow}>
                  <View>
                    <Text style={{ fontFamily: F.bold, color: '#BFDBFE', fontSize: 13, textTransform: 'uppercase' }}>
                      {currentYear}
                    </Text>
                    <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 26, letterSpacing: -0.5 }}>
                      {MONTH_NAMES[currentMonth]}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                      <MaterialIcons name="chevron-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                      <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Días de la semana */}
                <View style={styles.weekDaysRow}>
                  {WEEK_DAYS.map(d => (
                    <Text key={d} style={styles.weekDayText}>{d}</Text>
                  ))}
                </View>

                {/* Grid de días (círculos oscuros y píldora lima seleccionada) */}
                <View style={styles.daysGrid}>
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = selectedDay === dayNum;
                    const hasRecords = !!monthRecords[dayNum]?.length;
                    
                    const hasProjected = projectedServices.some(p => {
                      return p.date.getFullYear() === currentYear &&
                             p.date.getMonth() === currentMonth &&
                             p.date.getDate() === dayNum;
                    });

                    return (
                      <TouchableOpacity
                        key={dayNum}
                        onPress={() => setSelectedDay(dayNum)}
                        style={[
                          styles.dayCellCircle,
                          isSelected && styles.dayCellActive,
                        ]}
                      >
                        <Text style={[
                          styles.dayNumText,
                          isSelected ? { color: '#000', fontFamily: F.bold } : { color: '#FFF', fontFamily: F.semibold }
                        ]}>
                          {dayNum}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 4 }}>
                          {hasRecords && (
                            <View style={[styles.calDot, { backgroundColor: isSelected ? '#000' : '#30D158' }]} />
                          )}
                          {hasProjected && (
                            <View style={[styles.calDot, { backgroundColor: isSelected ? '#000' : '#FF9500' }]} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* TIMELINE DE ACTIVIDADES Y PLANIFICACIÓN PREVENTIVA */}
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 18 }}>
                    Actividades & Planificación
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.calDot, { backgroundColor: '#30D158', marginRight: 4 }]} />
                    <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 11, marginRight: 8 }}>Hecho</Text>
                    <View style={[styles.calDot, { backgroundColor: '#FF9500', marginRight: 4 }]} />
                    <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 11 }}>Próximo</Text>
                  </View>
                </View>

                {/* Servicios Realizados el Día Seleccionado */}
                {selectedDayRecords.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontFamily: F.bold, color: colors.primary, fontSize: 12, textTransform: 'uppercase', marginBottom: 10 }}>
                      Registrado el {selectedDay} de {MONTH_NAMES[currentMonth]}:
                    </Text>

                    {selectedDayRecords.map((r, idx) => (
                      <View key={r.id || idx} style={styles.timelineItem}>
                        <View style={styles.timelineIconNode}>
                          <MaterialIcons name="check-circle" size={18} color="#30D158" />
                          <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                        </View>
                        <View style={[styles.timelineContent, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 14 }}>
                              {COMPONENT_NAMES[r.type as keyof typeof COMPONENT_NAMES] || r.type}
                            </Text>
                            <Text style={{ fontFamily: F.bold, color: '#30D158', fontSize: 13 }}>
                              ${Number(r.costUSD || 0).toFixed(2)}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 12, marginTop: 2 }}>
                            {r.odometer} km • {r.notes || 'Mantenimiento preventivo'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* PLANIFICACIÓN DE PRÓXIMOS CAMBIOS */}
                <Text style={{ fontFamily: F.bold, color: '#FF9500', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 }}>
                  Próximos Servicios Proyectados (Anticípate):
                </Text>

                {projectedServices.map((proj, idx) => (
                  <View key={proj.name} style={styles.timelineItem}>
                    <View style={styles.timelineIconNode}>
                      <MaterialIcons name="alarm" size={18} color={proj.color} />
                      {idx < projectedServices.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />}
                    </View>
                    <View style={[styles.timelineContent, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 14, flex: 1, paddingRight: 8 }}>
                          {proj.name}
                        </Text>
                        <View style={[styles.daysPill, { backgroundColor: 'rgba(255,149,0,0.18)' }]}>
                          <Text style={{ fontFamily: F.bold, color: proj.color, fontSize: 11 }}>
                            En ~{proj.daysLeft} días
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 12, marginTop: 4 }}>
                        A los <Text style={{ color: textPrimary, fontFamily: F.bold }}>{proj.dueKm} km</Text> (Faltan {proj.kmLeft} km)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* SCREEN 2: ESTADÍSTICAS Y COMPARACIONES                        */}
          {/* ============================================================== */}
          {activeScreen === 'stats' && (
            <View>
              {/* Selector de Período */}
              <View style={[styles.periodSelectorBar, { backgroundColor: cardBg }]}>
                {(['daily', 'weekly', 'monthly'] as const).map(p => {
                  const isSel = statsPeriod === p;
                  const label = p === 'daily' ? 'Diario' : (p === 'weekly' ? 'Semanal' : 'Mensual');
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setStatsPeriod(p)}
                      style={[styles.periodBtn, isSel && styles.periodBtnActive]}
                    >
                      <Text style={[styles.periodBtnText, { color: isSel ? '#000' : textSecondary, fontFamily: isSel ? F.bold : F.semibold }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tarjeta Azul de Actividad con Gráfica de Barras */}
              <View style={[styles.statsHeroCard, { backgroundColor: calCardBg }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 18 }}>Actividad del Vehículo</Text>
                  <Text style={{ fontFamily: F.semibold, color: '#BFDBFE', fontSize: 12 }}>Total acumulado</Text>
                </View>

                {/* Gráfica de ondas / barras */}
                <View style={styles.waveBarContainer}>
                  {[35, 65, 45, 90, 80, 55, 70, 95, 40, 60, 85, 50, 75, 100, 60, 45, 80, 70, 90].map((h, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.waveBar, 
                        { height: (h / 100) * 44, backgroundColor: i % 3 === 0 ? '#D4E737' : '#FFFFFF' }
                      ]} 
                    />
                  ))}
                </View>

                {/* Métricas clave en 3 columnas */}
                <View style={styles.statsThreeCols}>
                  <View>
                    <Text style={{ fontFamily: F.medium, color: '#BFDBFE', fontSize: 11 }}>Kilómetros</Text>
                    <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 18, marginTop: 2 }}>
                      {stats.totalKm} <Text style={{ fontSize: 12, color: '#D4E737' }}>km</Text>
                    </Text>
                  </View>

                  <View>
                    <Text style={{ fontFamily: F.medium, color: '#BFDBFE', fontSize: 11 }}>Inversión</Text>
                    <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 18, marginTop: 2 }}>
                      ${stats.totalSpent.toFixed(0)} <Text style={{ fontSize: 12, color: '#BFDBFE' }}>USD</Text>
                    </Text>
                  </View>

                  <View>
                    <Text style={{ fontFamily: F.medium, color: '#BFDBFE', fontSize: 11 }}>Uso Estimado</Text>
                    <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 18, marginTop: 2 }}>
                      {Math.round(stats.totalKm / 40)}h <Text style={{ fontSize: 12, color: '#BFDBFE' }}>rodaje</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* BENTO GRID 2x2 CON COMPARACIONES (% vs PERIODO ANTERIOR) */}
              <View style={styles.bentoGrid}>
                
                {/* Cuadro 1: Kilometraje Promedio */}
                <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 12 }}>Km Promedio</Text>
                    <MaterialIcons name="trending-up" size={16} color="#30D158" />
                  </View>
                  <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 22, marginTop: 6 }}>
                    {stats.avgDailyKm} <Text style={{ fontSize: 12, color: textSecondary }}>km/d</Text>
                  </Text>
                  <View style={[styles.compBadge, { backgroundColor: 'rgba(48,209,88,0.18)' }]}>
                    <Text style={{ fontFamily: F.bold, color: '#30D158', fontSize: 10 }}>+4% vs mes ant.</Text>
                  </View>
                </View>

                {/* Cuadro 2: Gasto en Combustible */}
                <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 12 }}>Combustible</Text>
                    <MaterialIcons name="local-gas-station" size={16} color="#FF9500" />
                  </View>
                  <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 22, marginTop: 6 }}>
                    ${stats.fuelSpent.toFixed(0)} <Text style={{ fontSize: 12, color: textSecondary }}>USD</Text>
                  </Text>
                  <View style={[styles.compBadge, { backgroundColor: 'rgba(255,69,58,0.18)' }]}>
                    <Text style={{ fontFamily: F.bold, color: '#FF453A', fontSize: 10 }}>-2% gasto</Text>
                  </View>
                </View>

                {/* Cuadro 3: Eficiencia de Combustible */}
                <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 12 }}>Rendimiento</Text>
                    <MaterialIcons name="eco" size={16} color="#30D158" />
                  </View>
                  <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 22, marginTop: 6 }}>
                    {stats.efficiencyKmPerL} <Text style={{ fontSize: 12, color: textSecondary }}>km/L</Text>
                  </Text>
                  <View style={[styles.compBadge, { backgroundColor: 'rgba(48,209,88,0.18)' }]}>
                    <Text style={{ fontFamily: F.bold, color: '#30D158', fontSize: 10 }}>Óptimo</Text>
                  </View>
                </View>

                {/* Cuadro 4: Costo Operativo por Km */}
                <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 12 }}>Costo por Km</Text>
                    <MaterialIcons name="attach-money" size={16} color="#0A84FF" />
                  </View>
                  <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 22, marginTop: 6 }}>
                    ${stats.costPerKm} <Text style={{ fontSize: 12, color: textSecondary }}>/km</Text>
                  </Text>
                  <View style={[styles.compBadge, { backgroundColor: 'rgba(10,132,255,0.18)' }]}>
                    <Text style={{ fontFamily: F.bold, color: '#0A84FF', fontSize: 10 }}>Económico</Text>
                  </View>
                </View>

              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedTabBox: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 3,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#D4E737', // Verde lima de Pinterest
  },
  segmentText: {
    fontSize: 12,
  },
  calendarCard: {
    borderRadius: 28,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  weekDayText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    width: 38,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 40,
  },
  dayCellCircle: {
    width: `${100 / 7}%`,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayCellActive: {
    backgroundColor: '#D4E737',
    borderRadius: 21,
  },
  dayNumText: {
    fontSize: 14,
  },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineIconNode: {
    width: 32,
    alignItems: 'center',
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 0.5,
  },
  daysPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  periodSelectorBar: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginBottom: 18,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#D4E737',
  },
  periodBtnText: {
    fontSize: 12,
  },
  statsHeroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
  },
  waveBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 52,
    marginVertical: 18,
    paddingHorizontal: 6,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  statsThreeCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.25)',
    paddingTop: 14,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  bentoCard: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    borderWidth: 0.5,
  },
  compBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
});
