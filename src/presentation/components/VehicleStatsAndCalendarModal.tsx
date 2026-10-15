import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  useWindowDimensions, 
  Platform,
  Animated,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';
import { COMPONENT_NAMES } from '../../constants/telemetry';

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
  const { width: windowWidth } = useWindowDimensions();

  const [activeScreen, setActiveScreen] = useState<'stats' | 'calendar'>(initialTab);
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Slide & Fade Animation for Windows 11 Sidebar Drawer
  const slideAnim = useRef(new Animated.Value(450)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(450);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 450,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
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

  // Adaptive Colors
  const sidebarBg = isDark ? 'rgba(17, 20, 27, 0.97)' : 'rgba(255, 255, 255, 0.98)';
  const cardBg = isDark ? 'rgba(29, 34, 46, 0.75)' : '#F1F4F9';
  const textPrimary = colors.onSurface;
  const textSecondary = colors.onSurfaceVariant;
  const calCardBg = isDark ? '#10398A' : '#1D4ED8';
  const panelWidth = Math.min(430, windowWidth);

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlayRoot}>
        
        {/* CLICKABLE BACKDROP (BLUR / FADE DISMISS) */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* WINDOWS 11 NOTIFICATION CENTER / SIDEBAR DRAWER */}
        <Animated.View style={[
          styles.sidebarDrawer,
          { 
            width: panelWidth,
            backgroundColor: sidebarBg,
            borderLeftColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0, 0, 0, 0.1)',
            transform: [{ translateX: slideAnim }]
          }
        ]}>

          {/* WINDOWS NOTIFICATION CENTER TOP BAR */}
          <View style={[styles.sidebarHeader, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.3)' : 'rgba(0,0,0,0.06)' }]}>
            
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="notifications-active" size={16} color={colors.primary} />
                <Text style={{ fontFamily: F.bold, color: textSecondary, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Centro de Notificaciones
                </Text>
              </View>
              <Text style={{ fontFamily: F.extrabold, color: textPrimary, fontSize: 18, marginTop: 2 }}>
                {activeScreen === 'calendar' ? 'Calendario & Citas' : 'Métricas y Gastos'}
              </Text>
            </View>

            {/* BOTÓN CERRAR ESTILO WINDOWS */}
            <TouchableOpacity 
              onPress={handleClose} 
              style={[styles.closeCircleBtn, { backgroundColor: cardBg }]}
              accessibilityLabel="Cerrar barra lateral"
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={19} color={textPrimary} />
            </TouchableOpacity>
          </View>

          {/* SEGMENTED SWITCHER BAR (CALENDARIO / ESTADÍSTICAS) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
            <View style={[styles.segmentedTabBox, { backgroundColor: cardBg }]}>
              <TouchableOpacity 
                onPress={() => setActiveScreen('calendar')}
                style={[styles.segmentBtn, activeScreen === 'calendar' && styles.segmentBtnActive]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="event" size={15} color={activeScreen === 'calendar' ? '#000' : textSecondary} />
                <Text style={[styles.segmentText, { color: activeScreen === 'calendar' ? '#000' : textSecondary, fontFamily: F.bold }]}>
                  Calendario
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setActiveScreen('stats')}
                style={[styles.segmentBtn, activeScreen === 'stats' && styles.segmentBtnActive]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="bar-chart" size={15} color={activeScreen === 'stats' ? '#000' : textSecondary} />
                <Text style={[styles.segmentText, { color: activeScreen === 'stats' ? '#000' : textSecondary, fontFamily: F.bold }]}>
                  Estadísticas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTENIDO DESLIZABLE COMPACTO DE LA BARRA LATERAL */}
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* ============================================================== */}
            {/* SCREEN 1: CALENDARIO & PLANIFICACIÓN PREVENTIVA                */}
            {/* ============================================================== */}
            {activeScreen === 'calendar' && (
              <View>
                {/* Card Azul Compacto con la cuadrícula del Calendario */}
                <View style={[styles.calendarCard, { backgroundColor: calCardBg }]}>
                  
                  {/* Selector de Mes */}
                  <View style={styles.calendarHeaderRow}>
                    <View>
                      <Text style={{ fontFamily: F.bold, color: '#BFDBFE', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {currentYear}
                      </Text>
                      <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 20, letterSpacing: -0.3 }}>
                        {MONTH_NAMES[currentMonth]}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn} activeOpacity={0.7}>
                        <MaterialIcons name="chevron-left" size={20} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn} activeOpacity={0.7}>
                        <MaterialIcons name="chevron-right" size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Días de la semana */}
                  <View style={styles.weekDaysRow}>
                    {WEEK_DAYS.map(d => (
                      <Text key={d} style={styles.weekDayText}>{d}</Text>
                    ))}
                  </View>

                  {/* Grid de días (círculos y píldora seleccionada) */}
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
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.dayNumText,
                            isSelected ? { color: '#000', fontFamily: F.bold } : { color: '#FFF', fontFamily: F.semibold }
                          ]}>
                            {dayNum}
                          </Text>
                          
                          <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3 }}>
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
                <View style={{ marginTop: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 15 }}>
                      Actividades & Planificación
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.calDot, { backgroundColor: '#30D158', marginRight: 4 }]} />
                      <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 10, marginRight: 8 }}>Hecho</Text>
                      <View style={[styles.calDot, { backgroundColor: '#FF9500', marginRight: 4 }]} />
                      <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 10 }}>Próximo</Text>
                    </View>
                  </View>

                  {/* Servicios Realizados el Día Seleccionado */}
                  {selectedDayRecords.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontFamily: F.bold, color: colors.primary, fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>
                        Registrado el {selectedDay} de {MONTH_NAMES[currentMonth]}:
                      </Text>

                      {selectedDayRecords.map((r, idx) => (
                        <View key={r.id || idx} style={styles.timelineItem}>
                          <View style={styles.timelineIconNode}>
                            <MaterialIcons name="check-circle" size={16} color="#30D158" />
                            <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                          </View>
                          <View style={[styles.timelineContent, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 13 }}>
                                {COMPONENT_NAMES[r.type as keyof typeof COMPONENT_NAMES] || r.type}
                              </Text>
                              <Text style={{ fontFamily: F.bold, color: '#30D158', fontSize: 12 }}>
                                ${Number(r.costUSD || 0).toFixed(2)}
                              </Text>
                            </View>
                            <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 11, marginTop: 2 }}>
                              {r.odometer} km • {r.notes || 'Mantenimiento preventivo'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* PLANIFICACIÓN DE PRÓXIMOS CAMBIOS */}
                  <Text style={{ fontFamily: F.bold, color: '#FF9500', fontSize: 11, textTransform: 'uppercase', marginBottom: 10 }}>
                    Próximos Servicios Proyectados (Anticípate):
                  </Text>

                  {projectedServices.map((proj, idx) => (
                    <View key={proj.name} style={styles.timelineItem}>
                      <View style={styles.timelineIconNode}>
                        <MaterialIcons name="alarm" size={16} color={proj.color} />
                        {idx < projectedServices.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />}
                      </View>
                      <View style={[styles.timelineContent, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 13, flex: 1, paddingRight: 6 }}>
                            {proj.name}
                          </Text>
                          <View style={[styles.daysPill, { backgroundColor: 'rgba(255,149,0,0.18)' }]}>
                            <Text style={{ fontFamily: F.bold, color: proj.color, fontSize: 10 }}>
                              En ~{proj.daysLeft} d
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontFamily: F.medium, color: textSecondary, fontSize: 11.5, marginTop: 3 }}>
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
                        activeOpacity={0.8}
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
                    <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 16 }}>Actividad del Vehículo</Text>
                    <Text style={{ fontFamily: F.semibold, color: '#BFDBFE', fontSize: 11 }}>Total acumulado</Text>
                  </View>

                  {/* Gráfica de ondas / barras */}
                  <View style={styles.waveBarContainer}>
                    {[35, 65, 45, 90, 80, 55, 70, 95, 40, 60, 85, 50, 75, 100, 60, 45, 80].map((h, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.waveBar, 
                          { height: (h / 100) * 38, backgroundColor: i % 3 === 0 ? '#D4E737' : '#FFFFFF' }
                        ]} 
                      />
                    ))}
                  </View>

                  {/* Métricas clave en 3 columnas */}
                  <View style={styles.statsThreeCols}>
                    <View>
                      <Text style={{ fontFamily: F.medium, color: '#BFDBFE', fontSize: 10 }}>Kilómetros</Text>
                      <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 16, marginTop: 2 }}>
                        {stats.totalKm} <Text style={{ fontSize: 11, color: '#D4E737' }}>km</Text>
                      </Text>
                    </View>

                    <View>
                      <Text style={{ fontFamily: F.medium, color: '#BFDBFE', fontSize: 10 }}>Inversión</Text>
                      <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 16, marginTop: 2 }}>
                        ${stats.totalSpent.toFixed(0)} <Text style={{ fontSize: 11, color: '#BFDBFE' }}>USD</Text>
                      </Text>
                    </View>

                    <View>
                      <Text style={{ fontFamily: F.medium, color: '#BFDBFE', fontSize: 10 }}>Uso Estimado</Text>
                      <Text style={{ fontFamily: F.bold, color: '#FFF', fontSize: 16, marginTop: 2 }}>
                        {Math.round(stats.totalKm / 40)}h <Text style={{ fontSize: 11, color: '#BFDBFE' }}>rodaje</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* BENTO GRID 2x2 CON COMPARACIONES */}
                <View style={styles.bentoGrid}>
                  
                  {/* Cuadro 1: Kilometraje Promedio */}
                  <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 11 }}>Km Promedio</Text>
                      <MaterialIcons name="trending-up" size={15} color="#30D158" />
                    </View>
                    <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 19, marginTop: 4 }}>
                      {stats.avgDailyKm} <Text style={{ fontSize: 11, color: textSecondary }}>km/d</Text>
                    </Text>
                    <View style={[styles.compBadge, { backgroundColor: 'rgba(48,209,88,0.18)' }]}>
                      <Text style={{ fontFamily: F.bold, color: '#30D158', fontSize: 9.5 }}>+4% vs mes ant.</Text>
                    </View>
                  </View>

                  {/* Cuadro 2: Gasto en Combustible */}
                  <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 11 }}>Combustible</Text>
                      <MaterialIcons name="local-gas-station" size={15} color="#FF9500" />
                    </View>
                    <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 19, marginTop: 4 }}>
                      ${stats.fuelSpent.toFixed(0)} <Text style={{ fontSize: 11, color: textSecondary }}>USD</Text>
                    </Text>
                    <View style={[styles.compBadge, { backgroundColor: 'rgba(255,69,58,0.18)' }]}>
                      <Text style={{ fontFamily: F.bold, color: '#FF453A', fontSize: 9.5 }}>-2% gasto</Text>
                    </View>
                  </View>

                  {/* Cuadro 3: Eficiencia de Combustible */}
                  <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 11 }}>Rendimiento</Text>
                      <MaterialIcons name="eco" size={15} color="#30D158" />
                    </View>
                    <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 19, marginTop: 4 }}>
                      {stats.efficiencyKmPerL} <Text style={{ fontSize: 11, color: textSecondary }}>km/L</Text>
                    </Text>
                    <View style={[styles.compBadge, { backgroundColor: 'rgba(48,209,88,0.18)' }]}>
                      <Text style={{ fontFamily: F.bold, color: '#30D158', fontSize: 9.5 }}>Óptimo</Text>
                    </View>
                  </View>

                  {/* Cuadro 4: Costo Operativo por Km */}
                  <View style={[styles.bentoCard, { backgroundColor: cardBg, borderColor: colors.outlineVariant }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: F.semibold, color: textSecondary, fontSize: 11 }}>Costo por Km</Text>
                      <MaterialIcons name="attach-money" size={15} color="#0A84FF" />
                    </View>
                    <Text style={{ fontFamily: F.bold, color: textPrimary, fontSize: 19, marginTop: 4 }}>
                      ${stats.costPerKm} <Text style={{ fontSize: 11, color: textSecondary }}>/km</Text>
                    </Text>
                    <View style={[styles.compBadge, { backgroundColor: 'rgba(10,132,255,0.18)' }]}>
                      <Text style={{ fontFamily: F.bold, color: '#0A84FF', fontSize: 9.5 }}>Económico</Text>
                    </View>
                  </View>

                </View>
              </View>
            )}

          </ScrollView>
        </Animated.View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px)' } : {}),
  } as any,
  sidebarDrawer: {
    height: '100%',
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 52 : 22,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  closeCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedTabBox: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 18,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#D4E737', // Verde lima de alta visibilidad
  },
  segmentText: {
    fontSize: 12,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  calendarCard: {
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekDayText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 34,
  },
  dayCellCircle: {
    width: `${100 / 7}%`,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayCellActive: {
    backgroundColor: '#D4E737',
    borderRadius: 18,
  },
  dayNumText: {
    fontSize: 13,
  },
  calDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineIconNode: {
    width: 28,
    alignItems: 'center',
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  daysPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  periodSelectorBar: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 17,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#D4E737',
  },
  periodBtnText: {
    fontSize: 11.5,
  },
  statsHeroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  waveBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 44,
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 5,
    borderRadius: 2.5,
  },
  statsThreeCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.25)',
    paddingTop: 12,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  bentoCard: {
    width: '48.5%',
    borderRadius: 18,
    padding: 13,
    borderWidth: 0.5,
  },
  compBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
});
