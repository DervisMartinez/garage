import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
  Platform,
  Easing,
  ScrollView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';
import { VEHICLE_CATALOG, MOTO_CATALOG } from '../../data/catalog';
import { isCar } from '../../domain/entities/Moto';
import { calculateWearPercentage, COMPONENT_NAMES, ComponentType } from '../../constants/telemetry';
import { getMotoSpecs, MotoSpecs } from '../../data/specs';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenQuickService?: (componentType: ComponentType) => void;
}

interface HotspotDef {
  id: Exclude<ComponentType, 'fuel' | 'other'>;
  title: string;
  sub: string;
  topPct: number;
  leftPct: number;
  icon: string;
  iconFamily: 'material' | 'community';
  tip: string;
}

const MOTO_HOTSPOTS: HotspotDef[] = [
  {
    id: 'oil',
    title: 'Aceite de Motor 4T',
    sub: 'Lubricación & Refrigeración',
    topPct: 56,
    leftPct: 48,
    icon: 'opacity',
    iconFamily: 'material',
    tip: 'Utiliza aceite certificado 4T. Inspecciona el ojo de buey antes de rodadas largas.',
  },
  {
    id: 'brakes_front',
    title: 'Frenos Delanteros',
    sub: 'Pastillas & Disco Ventilado',
    topPct: 68,
    leftPct: 22,
    icon: 'pan-tool',
    iconFamily: 'material',
    tip: 'Reemplaza pastillas cuando el grosor del material de fricción sea menor a 2mm.',
  },
  {
    id: 'brakes_rear',
    title: 'Frenos Traseros',
    sub: 'Pastillas / Tambor Trasero',
    topPct: 66,
    leftPct: 78,
    icon: 'pan-tool',
    iconFamily: 'material',
    tip: 'Ajusta la tensión de la varilla o revisa el nivel de líquido de freno trasero.',
  },
  {
    id: 'tires_front',
    title: 'Caucho Delantero',
    sub: 'Banda de Rodamiento & Presión',
    topPct: 62,
    leftPct: 14,
    icon: 'album',
    iconFamily: 'material',
    tip: 'Verifica presión recomendada en frío (ej. 28-32 PSI) y profundidad de canales.',
  },
  {
    id: 'tires_rear',
    title: 'Caucho Trasero',
    sub: 'Tracción & Agarre',
    topPct: 62,
    leftPct: 86,
    icon: 'album',
    iconFamily: 'material',
    tip: 'Soporta el peso y tracción principal. Vigila el desgaste plano central.',
  },
  {
    id: 'chain',
    title: 'Cadena de Transmisión',
    sub: 'Tensión & Lubricación',
    topPct: 64,
    leftPct: 62,
    icon: 'link',
    iconFamily: 'material',
    tip: 'Mantén una holgura de 20-30 mm y lubrica cada 500 km con lubricante de cadena.',
  },
  {
    id: 'air_filter',
    title: 'Filtro de Aire',
    sub: 'Flujo de Admisión',
    topPct: 48,
    leftPct: 42,
    icon: 'air',
    iconFamily: 'material',
    tip: 'Limpia o reemplaza para asegurar la mezcla estequiométrica óptima de combustible.',
  },
  {
    id: 'spark_plugs',
    title: 'Bujía de Encendido',
    sub: 'Arco Eléctrico & Chispa',
    topPct: 52,
    leftPct: 54,
    icon: 'flash-on',
    iconFamily: 'material',
    tip: 'Revisa la separación de electrodos (0.7 - 0.8 mm) y color de la punta cerámica.',
  },
];

const CAR_HOTSPOTS: HotspotDef[] = [
  {
    id: 'oil',
    title: 'Aceite & Filtro Motor',
    sub: 'Lubricación 1.8L DOHC 16V',
    topPct: 46,
    leftPct: 24,
    icon: 'opacity',
    iconFamily: 'material',
    tip: '4.0 Litros 10W-30 / 15W-40 Semi-Sintético. Cambio cada 5.000 km.',
  },
  {
    id: 'timing_belt',
    title: 'Correa de Distribución (Tiempo)',
    sub: 'Kit Distribución DOHC 16V',
    topPct: 44,
    leftPct: 20,
    icon: 'sync',
    iconFamily: 'material',
    tip: '¡Crítico! Motor de interferencia. Reemplazo cada 40.000 - 50.000 km junto a bomba de agua y tensores.',
  },
  {
    id: 'coolant',
    title: 'Refrigerante / Radiador',
    sub: 'Sistema Térmico Dex-Cool',
    topPct: 48,
    leftPct: 15,
    icon: 'invert-colors',
    iconFamily: 'material',
    tip: 'Capacidad 7.0 Litros al 50/50. Previene recalentamiento en el motor E-TEC II.',
  },
  {
    id: 'brakes_front',
    title: 'Frenos Delanteros',
    sub: 'Discos Ventilados 256 mm',
    topPct: 68,
    leftPct: 22,
    icon: 'pan-tool',
    iconFamily: 'material',
    tip: 'Revisa espesor de pastillas cada 10.000 km y sustitución a los 30.000 km.',
  },
  {
    id: 'brakes_rear',
    title: 'Frenos Traseros',
    sub: 'Discos Sólidos 258 mm (ABS)',
    topPct: 68,
    leftPct: 80,
    icon: 'pan-tool',
    iconFamily: 'material',
    tip: 'Discos con tambor interno de freno de mano. Vida estimada 40.000 - 50.000 km.',
  },
  {
    id: 'tires_front',
    title: 'Neumáticos Delanteros',
    sub: 'Medida 195/55 R15',
    topPct: 66,
    leftPct: 22,
    icon: 'album',
    iconFamily: 'material',
    tip: 'Mantén presión a 30 - 32 PSI en frío. Rotar cada 10.000 km para desgaste parejo.',
  },
  {
    id: 'tires_rear',
    title: 'Neumáticos Traseros',
    sub: 'Medida 195/55 R15',
    topPct: 66,
    leftPct: 80,
    icon: 'album',
    iconFamily: 'material',
    tip: 'Presión 30 - 32 PSI. Inspecciona alineación del tren multibrazo independiente.',
  },
  {
    id: 'cabin_filter',
    title: 'Filtro de Habitáculo / A/C',
    sub: 'Sistema de Climatización',
    topPct: 42,
    leftPct: 42,
    icon: 'air',
    iconFamily: 'material',
    tip: 'Ubicado tras la guantera. Reemplazar cada 15.000 km o 1 año para aire limpio.',
  },
  {
    id: 'air_filter',
    title: 'Filtro de Aire Motor',
    sub: 'Admisión de Aire MPFI',
    topPct: 40,
    leftPct: 28,
    icon: 'air',
    iconFamily: 'material',
    tip: 'Inspeccionar cada 10.000 km. Asegura mezcla de combustible y potencia óptima.',
  },
  {
    id: 'battery',
    title: 'Batería 12V 60Ah',
    sub: 'Sistema Eléctrico 550 CCA',
    topPct: 44,
    leftPct: 32,
    icon: 'battery-charging-full',
    iconFamily: 'material',
    tip: 'Vida promedio 2 a 3 años. Revisa bornes limpios y voltaje en reposo (>12.6V).',
  },
  {
    id: 'spark_plugs',
    title: 'Bujías (x4)',
    sub: 'NGK BKR6E-11 / Champion',
    topPct: 46,
    leftPct: 26,
    icon: 'flash-on',
    iconFamily: 'material',
    tip: 'Calibración 1.1 mm. Cambio cada 30.000 km junto con cables de alta tensión.',
  },
  {
    id: 'shock_absorbers',
    title: 'Amortiguadores & Suspensión',
    sub: 'McPherson Del. / Dual-Link Tras.',
    topPct: 58,
    leftPct: 50,
    icon: 'build',
    iconFamily: 'material',
    tip: 'Revisión cada 20.000 km. Reemplazar entre 60.000 y 80.000 km.',
  },
];

const HOTSPOTS = MOTO_HOTSPOTS;


export const MotoInspectionModal: React.FC<Props> = ({
  visible,
  onClose,
  onOpenQuickService,
}) => {
  const { colors, mode } = useTheme();
  const { myMoto, records } = useMyMoto();
  const { width: windowWidth } = useWindowDimensions();

  const isDark = mode === 'dark';
  const isDesktop = windowWidth >= 900;
  const useNativeDriver = Platform.OS !== 'web';

  const isVehicleCar = isCar(myMoto);
  const activeHotspots = isVehicleCar ? CAR_HOTSPOTS : MOTO_HOTSPOTS;

  // Selected Hotspot for detail inspection card
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDef | null>(activeHotspots[0]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Synchronize hotspot when active vehicle changes
  useEffect(() => {
    setSelectedHotspot(activeHotspots[0]);
  }, [isVehicleCar, myMoto?.id]);

  // Animated Values for zoom and hotspot pulse
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Radar pulse animation for hotspots
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.45,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, useNativeDriver]);

  // Resolve Image Source
  const imageSource = useMemo(() => {
    if (!myMoto) return null;
    if (myMoto.imageUrl) return { uri: myMoto.imageUrl };
    const cat = VEHICLE_CATALOG.find(
      (m) => m.brand.toLowerCase() === myMoto.brand.toLowerCase() && m.model.toLowerCase() === myMoto.model.toLowerCase()
    ) || VEHICLE_CATALOG.find(
      (m) => m.brand.toLowerCase() === myMoto.brand.toLowerCase()
    );
    if (cat?.imageRes) return cat.imageRes;
    return null;
  }, [myMoto]);

  // Compute Telemetry Wear for each Hotspot
  const wearMap = useMemo(() => {
    if (!myMoto) return {} as Record<string, number>;
    const map: Record<string, number> = {};

    activeHotspots.forEach((h) => {
      const recs = records.filter((r) => r.type === h.id);
      const isConfigured = recs.length > 0 || !!myMoto.isFromAgency;
      if (!isConfigured) {
        map[h.id] = 0;
        return;
      }
      const lastOdo = recs.length > 0
        ? recs.reduce((prev, curr) => (prev.odometer > curr.odometer ? prev : curr)).odometer
        : 0;
      map[h.id] = calculateWearPercentage(myMoto.currentOdometer, lastOdo, h.id, undefined, isVehicleCar);
    });

    return map;
  }, [myMoto, records, activeHotspots, isVehicleCar]);

  // Factory Specifications (OEM)
  const specs = useMemo(() => {
    if (!myMoto) return null;
    return getMotoSpecs(myMoto.brand, myMoto.model);
  }, [myMoto]);

  // Comprehensive Dossier for Selected Hotspot
  const dossier = useMemo(() => {
    if (!myMoto || !selectedHotspot) return null;

    const compRecords = records.filter((r) => r.type === selectedHotspot.id);
    const isConfigured = compRecords.length > 0 || !!myMoto.isFromAgency;
    const wear = isConfigured ? (wearMap[selectedHotspot.id] ?? 0) : 0;
    const statusColor = !isConfigured ? '#ff9500' : (wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a');
    const statusText = !isConfigured ? 'AJUSTAR' : (wear >= 60 ? 'ÓPTIMO' : wear >= 30 ? 'PREVENTIVO' : 'CRÍTICO');

    const lastRecord = compRecords.length > 0
      ? compRecords.reduce((prev, curr) => (prev.odometer > curr.odometer ? prev : curr))
      : null;
    const lastOdo = lastRecord ? lastRecord.odometer : 0;
    const kmSince = isConfigured ? Math.max(0, myMoto.currentOdometer - lastOdo) : 0;

    let oemSpecs: { label: string; value: string; icon: string }[] = [];
    let intervalNominal = 3000;

    switch (selectedHotspot.id) {
      case 'oil':
        oemSpecs = [
          { label: 'Viscosidad OEM', value: specs?.oilTypeRecommended || (isVehicleCar ? '10W-30 / 15W-40 Semi-Sintético' : '20W-50 4T JASO MA2'), icon: 'opacity' },
          { label: 'Capacidad Cárter', value: specs?.oilCapacity || (isVehicleCar ? '4.0 Litros (con filtro)' : '1.0 Litro'), icon: 'local-gas-station' },
          { label: 'Frecuencia Sugerida', value: specs?.maintenanceIntervalOil || (isVehicleCar ? 'Cada 5.000 - 7.500 km' : 'Cada 2,500 - 3,000 km'), icon: 'schedule' },
        ];
        intervalNominal = isVehicleCar ? 6000 : 3000;
        break;
      case 'timing_belt':
        oemSpecs = [
          { label: 'Tipo de Correa', value: specs?.timingBeltType || 'Correa DOHC 16V (162 dientes)', icon: 'sync' },
          { label: 'Reemplazo Mandatorio', value: specs?.maintenanceIntervalTimingBelt || 'Cada 40.000 - 50.000 km (Crítico)', icon: 'schedule' },
          { label: 'Componentes del Kit', value: 'Correa + Polea Tensora + Bomba Agua', icon: 'build' },
        ];
        intervalNominal = 45000;
        break;
      case 'coolant':
        oemSpecs = [
          { label: 'Especificación', value: 'Dex-Cool 50/50 Larga Duración', icon: 'invert-colors' },
          { label: 'Capacidad Radiador', value: specs?.coolantCapacity || '7.0 Litros', icon: 'local-gas-station' },
          { label: 'Frecuencia Cambio', value: 'Cada 40.000 km o 2 años', icon: 'schedule' },
        ];
        intervalNominal = 40000;
        break;
      case 'cabin_filter':
        oemSpecs = [
          { label: 'Ubicación', value: 'Bajo tablero / tras guantera', icon: 'air' },
          { label: 'Frecuencia Sugerida', value: 'Cada 15.000 km o 1 año', icon: 'schedule' },
          { label: 'Elemento', value: 'Carbón activo anti-polen y A/C', icon: 'check-circle' },
        ];
        intervalNominal = 15000;
        break;
      case 'battery':
        oemSpecs = [
          { label: 'Capacidad OEM', value: specs?.battery || '12V 60Ah - 550 CCA', icon: 'battery-charging-full' },
          { label: 'Voltaje en Reposo', value: '12.6V a 12.8V', icon: 'speed' },
          { label: 'Vida Útil Estimada', value: '2 a 3 años / 40.000 km', icon: 'schedule' },
        ];
        intervalNominal = 40000;
        break;
      case 'shock_absorbers':
        oemSpecs = [
          { label: 'Suspensión Delantera', value: specs?.suspensionFront || 'McPherson con barra estabilizadora', icon: 'build' },
          { label: 'Suspensión Trasera', value: specs?.suspensionRear || 'Dual-Link multibrazo independiente', icon: 'build' },
          { label: 'Reemplazo Sugerido', value: 'Cada 60.000 - 80.000 km', icon: 'schedule' },
        ];
        intervalNominal = 60000;
        break;
      case 'brakes_front':
        oemSpecs = [
          { label: 'Sistema', value: specs?.brakesFront || (isVehicleCar ? 'Discos ventilados 256 mm' : 'Disco hidráulico ventilado 240mm'), icon: 'build' },
          { label: 'Espesor Mínimo', value: 'Min 2.0 mm pastillas', icon: 'straighten' },
          { label: 'Fluido Hidráulico', value: isVehicleCar ? 'DOT 4' : 'DOT 3 / DOT 4', icon: 'invert-colors' },
        ];
        intervalNominal = isVehicleCar ? 30000 : 6000;
        break;
      case 'brakes_rear':
        oemSpecs = [
          { label: 'Sistema', value: specs?.brakesRear || (isVehicleCar ? 'Discos sólidos 258 mm (ABS)' : 'Tambor mecánico con zapatas'), icon: 'build' },
          { label: 'Freno de Mano', value: isVehicleCar ? 'Tambor interno en disco' : 'Varilla de ajuste 20-30mm', icon: 'straighten' },
          { label: 'Inspección', value: isVehicleCar ? 'Cada 20.000 km' : 'Revisión cada 3,000 km', icon: 'schedule' },
        ];
        intervalNominal = isVehicleCar ? 45000 : 6000;
        break;
      case 'tires_front':
        oemSpecs = [
          { label: 'Medida Delantera', value: specs?.frontTireSize || (isVehicleCar ? '195/55 R15' : '2.75 - 18'), icon: 'album' },
          { label: 'Presión en Frío', value: specs?.frontTirePressure || (isVehicleCar ? '30 - 32 PSI' : '28 PSI'), icon: 'speed' },
          { label: 'Profundidad Canales', value: 'Min 1.6 mm banda', icon: 'straighten' },
        ];
        intervalNominal = isVehicleCar ? 40000 : 12000;
        break;
      case 'tires_rear':
        oemSpecs = [
          { label: 'Medida Trasera', value: specs?.rearTireSize || (isVehicleCar ? '195/55 R15' : '90/90 - 18'), icon: 'album' },
          { label: 'Presión en Frío', value: specs?.rearTirePressure || (isVehicleCar ? '30 - 32 PSI' : '32 PSI'), icon: 'speed' },
          { label: 'Profundidad Canales', value: 'Min 2.0 mm (Tracción)', icon: 'straighten' },
        ];
        intervalNominal = isVehicleCar ? 40000 : 10000;
        break;
      case 'chain':
        oemSpecs = [
          { label: 'Paso de Cadena', value: specs?.chainType || 'Paso 428H reforzada', icon: 'link' },
          { label: 'Tensión / Flecha', value: '20 - 30 mm holgura', icon: 'straighten' },
          { label: 'Lubricación', value: 'Cada 500 km / lluvia', icon: 'opacity' },
        ];
        intervalNominal = 10000;
        break;
      case 'air_filter':
        oemSpecs = [
          { label: 'Admisión', value: isVehicleCar ? 'Filtro de aire MPFI' : 'Elemento lavable / papel', icon: 'air' },
          { label: 'Mantenimiento', value: isVehicleCar ? 'Sustitución recomendada' : 'Sopleteo o reemplazo', icon: 'build' },
          { label: 'Frecuencia', value: isVehicleCar ? 'Cada 15.000 - 20.000 km' : 'Cada 4,000 km', icon: 'schedule' },
        ];
        intervalNominal = isVehicleCar ? 20000 : 4000;
        break;
      case 'spark_plugs':
        oemSpecs = [
          { label: 'Referencia OEM', value: specs?.sparkPlug || (isVehicleCar ? 'NGK BKR6E-11 / Champion' : 'NGK D8EA'), icon: 'flash-on' },
          { label: 'Luz de Electrodo', value: isVehicleCar ? '1.1 mm' : '0.7 - 0.8 mm', icon: 'straighten' },
          { label: 'Diagnóstico Visual', value: 'Color café claro en electrodo', icon: 'search' },
        ];
        intervalNominal = isVehicleCar ? 30000 : 6000;
        break;
    }

    const estKmRemaining = Math.max(0, Math.round(intervalNominal * (wear / 100)));

    return {
      wear,
      statusColor,
      statusText,
      lastOdo,
      kmSince,
      estKmRemaining,
      lastDate: lastRecord
        ? new Date(lastRecord.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : (myMoto.isFromAgency ? 'De Agencia' : 'Registro Inicial'),
      oemSpecs,
    };
  }, [myMoto, selectedHotspot, wearMap, records, specs]);

  const handleZoom = (level: number) => {
    setZoomLevel(level);
    Animated.spring(scaleAnim, {
      toValue: level,
      friction: 6,
      tension: 80,
      useNativeDriver,
    }).start();
  };

  const handleResetView = () => {
    setZoomLevel(1);
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver }).start();
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  if (!myMoto) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.rootContainer, { backgroundColor: isDark ? '#0c0e14' : '#f0f3f8' }]}>
        
        {/* ATMOSPHERIC BACKGROUND GRID & RADIAL COCKPIT GLOW */}
        <View style={styles.backgroundGridOverlay} pointerEvents="none" />
        <View
          style={[
            styles.cockpitRadialGlow,
            { backgroundColor: isDark ? 'rgba(65, 105, 225, 0.12)' : 'rgba(39, 95, 227, 0.08)' },
          ]}
          pointerEvents="none"
        />

        {/* TOP TECHNICAL HUD BAR */}
        <View style={[styles.topHudBar, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.35)' : 'rgba(0,0,0,0.08)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.brandBadge, { backgroundColor: isDark ? 'rgba(0, 227, 253, 0.12)' : 'rgba(39, 95, 227, 0.1)' }]}>
              <MaterialCommunityIcons name="engine" size={20} color="#00e3fd" />
            </View>
            <View>
              <Text style={{ fontFamily: F.extrabold, color: colors.onSurface, fontSize: 16 }}>
                {myMoto.brand} {myMoto.model}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <View style={[styles.statusLiveDot, { backgroundColor: '#00ae78' }]} />
                <Text style={{ fontFamily: F.bold, color: '#00ae78', fontSize: 10.5, letterSpacing: 0.8 }}>
                  INSPECCIÓN TÉCNICA INTERACTIVA
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 10 }}>•</Text>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 10.5 }}>
                  {myMoto.currentOdometer.toLocaleString()} km
                </Text>
              </View>
            </View>
          </View>

          {/* CERRAR VISOR */}
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.closeHudBtn, { backgroundColor: isDark ? 'rgba(29, 34, 46, 0.8)' : '#e5e9f0' }]}
            accessibilityLabel="Cerrar inspección"
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* QUICK COMPONENT SELECTOR RIBBON */}
        <View style={[styles.chipsRibbonBar, { borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.25)' : 'rgba(0,0,0,0.06)' }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {activeHotspots.map((h) => {
              const isSelected = selectedHotspot?.id === h.id;
              const wear = wearMap[h.id] ?? 85;
              const statusDotColor = wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a';

              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => setSelectedHotspot(h)}
                  activeOpacity={0.8}
                  style={[
                    styles.componentChip,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(0, 227, 253, 0.15)' : 'rgba(65, 105, 225, 0.12)')
                        : (isDark ? 'rgba(29, 34, 46, 0.5)' : '#ffffff'),
                      borderColor: isSelected ? '#00e3fd' : (isDark ? 'rgba(64, 72, 92, 0.4)' : '#e0e4ec'),
                    },
                  ]}
                >
                  <View style={[styles.chipStatusDot, { backgroundColor: statusDotColor }]} />
                  <Text
                    style={{
                      fontFamily: isSelected ? F.bold : F.medium,
                      fontSize: 11.5,
                      color: isSelected ? (isDark ? '#00e3fd' : '#275fe3') : colors.onSurface,
                    }}
                  >
                    {h.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: F.bold,
                      fontSize: 10,
                      color: statusDotColor,
                      marginLeft: 2,
                    }}
                  >
                    {wear}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* MAIN BODY AREA: DESKTOP SPLIT OR MOBILE STACK */}
        <View style={[styles.mainBodyContainer, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          
          {/* LEFT SECTION: VEHICLE INTERACTIVE CANVAS */}
          <View style={[styles.canvasContainer, { flex: isDesktop ? 1.15 : 1 }]}>
            
            {/* WATERMARK MODEL BACKGROUND */}
            <Text
              style={[
                styles.watermarkText,
                { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.035)' },
              ]}
              pointerEvents="none"
            >
              {myMoto.model}
            </Text>

            {/* STABLE 2D SCALABLE VEHICLE WRAPPER */}
            <View style={styles.bikeWrapperBox}>
              <Animated.View
                style={[
                  styles.bikeTransformWrapper,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* IMAGEN DEL VEHÍCULO */}
                {imageSource ? (
                  <Image
                    source={imageSource}
                    style={styles.bikeImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <MaterialIcons name={isVehicleCar ? "directions-car" : "two-wheeler"} size={160} color="#4169E1" />
                    <Text style={{ fontFamily: F.bold, color: colors.onSurfaceVariant, marginTop: 12 }}>
                      {myMoto.brand} {myMoto.model}
                    </Text>
                  </View>
                )}

                {/* SOMBRA SUAVE DE CONTACTO BAJO EL VEHÍCULO */}
                <View
                  style={[
                    styles.groundShadow,
                    { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.22)' },
                  ]}
                />

                {/* PUNTOS TÁCTILES / HOTSPOTS EN LAS PARTES DEL VEHÍCULO */}
                {showHotspots && (
                  <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {activeHotspots.map((h) => {
                      const isConfigured = records.some(r => r.type === h.id) || !!myMoto.isFromAgency;
                      const wear = isConfigured ? (wearMap[h.id] ?? 0) : 0;
                      const isSelected = selectedHotspot?.id === h.id;
                      const statusColor = !isConfigured ? '#ff9500' : (wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a');
                      const leftPos = h.leftPct;

                      return (
                        <TouchableOpacity
                          key={h.id}
                          onPress={() => setSelectedHotspot(h)}
                          activeOpacity={0.85}
                          style={[
                            styles.hotspotNode,
                            {
                              top: `${h.topPct}%`,
                              left: `${leftPos}%`,
                            },
                          ]}
                        >
                          {/* Pulsing Concentric Ring */}
                          <Animated.View
                            style={[
                              styles.pulseRing,
                              {
                                borderColor: isSelected ? '#00e3fd' : statusColor,
                                transform: [{ scale: pulseAnim }],
                                opacity: isSelected ? 0.95 : 0.6,
                                borderWidth: isSelected ? 2 : 1.4,
                              },
                            ]}
                          />

                          {/* Glowing Center Pin */}
                          <View
                            style={[
                              styles.hotspotPin,
                              {
                                backgroundColor: isSelected ? statusColor : (isDark ? '#191c21' : '#ffffff'),
                                borderColor: isSelected ? '#00e3fd' : statusColor,
                                borderWidth: isSelected ? 2.2 : 1.8,
                              },
                            ]}
                          >
                            {h.iconFamily === 'community' ? (
                              <MaterialCommunityIcons
                                name={h.icon as any}
                                size={12}
                                color={isSelected ? '#ffffff' : statusColor}
                              />
                            ) : (
                              <MaterialIcons
                                name={h.icon as any}
                                size={12}
                                color={isSelected ? '#ffffff' : statusColor}
                              />
                            )}
                          </View>

                          {/* Floating Percentage Badge */}
                          <View
                            style={[
                              styles.percentBadge,
                              {
                                backgroundColor: statusColor,
                                borderColor: isSelected ? '#ffffff' : statusColor,
                                minWidth: !isConfigured ? 24 : undefined,
                              },
                            ]}
                          >
                            <Text style={{ fontFamily: F.extrabold, fontSize: !isConfigured ? 7.5 : 9, color: '#ffffff' }}>
                              {!isConfigured ? '!' : `${wear}%`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Animated.View>
            </View>

            {/* INSTRUCTION PILL */}
            <View style={styles.instructionBanner} pointerEvents="none">
              <MaterialIcons name="touch-app" size={14} color="#00e3fd" />
              <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 11 }}>
                Toca los puntos luminosos para inspeccionar cada pieza
              </Text>
            </View>

            {/* FLOATING ACTION TOOLBAR (HUD & ZOOM CONTROLS) */}
            <View
              style={[
                styles.floatingControlsBar,
                {
                  backgroundColor: isDark ? 'rgba(23, 27, 36, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                  borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              {/* TOGGLE PUNTOS */}
              <TouchableOpacity
                onPress={() => setShowHotspots(!showHotspots)}
                style={[styles.toolBtn, showHotspots && styles.toolBtnActive]}
                accessibilityLabel="Alternar puntos de inspección"
                activeOpacity={0.7}
              >
                <MaterialIcons name="visibility" size={17} color={showHotspots ? '#00e3fd' : colors.onSurfaceVariant} />
                <Text
                  style={[
                    styles.toolBtnText,
                    { color: showHotspots ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold },
                  ]}
                >
                  {showHotspots ? 'HUD ON' : 'HUD OFF'}
                </Text>
              </TouchableOpacity>

              <View style={[styles.toolDivider, { backgroundColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]} />

              {/* ZOOM CONTROLS */}
              <TouchableOpacity
                onPress={() => handleZoom(1)}
                style={[styles.toolBtn, zoomLevel === 1 && styles.toolBtnActive]}
                accessibilityLabel="Zoom 1x"
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toolBtnText,
                    { color: zoomLevel === 1 ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold },
                  ]}
                >
                  1.0x
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleZoom(1.4)}
                style={[styles.toolBtn, zoomLevel === 1.4 && styles.toolBtnActive]}
                accessibilityLabel="Zoom 1.4x"
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toolBtnText,
                    { color: zoomLevel === 1.4 ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold },
                  ]}
                >
                  1.4x
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleZoom(1.8)}
                style={[styles.toolBtn, zoomLevel === 1.8 && styles.toolBtnActive]}
                accessibilityLabel="Zoom 1.8x"
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toolBtnText,
                    { color: zoomLevel === 1.8 ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold },
                  ]}
                >
                  1.8x
                </Text>
              </TouchableOpacity>

              <View style={[styles.toolDivider, { backgroundColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]} />

              {/* RESET VIEW */}
              <TouchableOpacity
                onPress={handleResetView}
                style={styles.toolBtn}
                accessibilityLabel="Restablecer posición inicial"
                activeOpacity={0.7}
              >
                <MaterialIcons name="restart-alt" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* RIGHT / BOTTOM SECTION: HIGH-PRECISION TECHNICAL DOSSIER */}
          {selectedHotspot && dossier && (
            <View style={[styles.dossierWrapper, { flex: isDesktop ? 0.85 : undefined }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.dossierScrollContent}
              >
                <View
                  style={[
                    styles.dossierCard,
                    {
                      backgroundColor: isDark ? 'rgba(19, 23, 31, 0.96)' : '#ffffff',
                      borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : '#e2e6ee',
                    },
                  ]}
                >
                  {/* CARD HEADER */}
                  <View style={styles.detailCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View
                        style={[
                          styles.partIconCircle,
                          {
                            backgroundColor: isDark ? 'rgba(65, 105, 225, 0.16)' : 'rgba(39, 95, 227, 0.1)',
                            borderColor: dossier.statusColor,
                          },
                        ]}
                      >
                        {selectedHotspot.iconFamily === 'community' ? (
                          <MaterialCommunityIcons name={selectedHotspot.icon as any} size={22} color="#4169E1" />
                        ) : (
                          <MaterialIcons name={selectedHotspot.icon as any} size={22} color="#4169E1" />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: F.extrabold, color: colors.onSurface, fontSize: 17 }}>
                          {selectedHotspot.title}
                        </Text>
                        <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 12 }}>
                          {selectedHotspot.sub}
                        </Text>
                      </View>
                    </View>

                    {/* STATUS BADGE PILL */}
                    <View
                      style={[
                        styles.statusBadgePill,
                        {
                          backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
                          borderColor: dossier.statusColor,
                        },
                      ]}
                    >
                      <View style={[styles.statusMiniDot, { backgroundColor: dossier.statusColor }]} />
                      <Text style={{ fontFamily: F.extrabold, color: dossier.statusColor, fontSize: 11 }}>
                        {dossier.wear}% • {dossier.statusText}
                      </Text>
                    </View>
                  </View>

                  {/* WEAR PROGRESS BAR GAUGE */}
                  <View style={{ marginVertical: 14 }}>
                    <View
                      style={[
                        styles.trackBar,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                      ]}
                    >
                      <View
                        style={[
                          styles.fillBar,
                          { width: `${dossier.wear}%`, backgroundColor: dossier.statusColor },
                        ]}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                      <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 10.5 }}>
                        0% (Desgaste Total)
                      </Text>
                      <Text style={{ fontFamily: F.bold, color: dossier.statusColor, fontSize: 11 }}>
                        {dossier.wear}% de Vida Útil Restante
                      </Text>
                      <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 10.5 }}>
                        100% (Nuevo)
                      </Text>
                    </View>
                  </View>

                  {/* TELEMETRY STATS TRIPLE PILLS */}
                  <View style={styles.telemetryStatsRow}>
                    <View
                      style={[
                        styles.telemetryMiniStat,
                        {
                          backgroundColor: isDark ? 'rgba(29, 34, 46, 0.65)' : '#f4f6fa',
                          borderColor: isDark ? 'rgba(64, 72, 92, 0.35)' : '#e5e9f0',
                        },
                      ]}
                    >
                      <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                        Último Servicio
                      </Text>
                      <Text style={{ fontFamily: F.extrabold, fontSize: 13, color: colors.onSurface, marginTop: 2 }}>
                        {dossier.lastOdo.toLocaleString()} km
                      </Text>
                      <Text style={{ fontFamily: F.regular, fontSize: 10, color: colors.onSurfaceVariant }}>
                        {dossier.lastDate}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.telemetryMiniStat,
                        {
                          backgroundColor: isDark ? 'rgba(29, 34, 46, 0.65)' : '#f4f6fa',
                          borderColor: isDark ? 'rgba(64, 72, 92, 0.35)' : '#e5e9f0',
                        },
                      ]}
                    >
                      <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                        Rodado con Pieza
                      </Text>
                      <Text style={{ fontFamily: F.extrabold, fontSize: 13, color: colors.onSurface, marginTop: 2 }}>
                        {dossier.kmSince.toLocaleString()} km
                      </Text>
                      <Text style={{ fontFamily: F.regular, fontSize: 10, color: '#00ae78' }}>
                        En odómetro actual
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.telemetryMiniStat,
                        {
                          backgroundColor: isDark ? 'rgba(29, 34, 46, 0.65)' : '#f4f6fa',
                          borderColor: isDark ? 'rgba(64, 72, 92, 0.35)' : '#e5e9f0',
                        },
                      ]}
                    >
                      <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                        Estimado Restante
                      </Text>
                      <Text style={{ fontFamily: F.extrabold, fontSize: 13, color: dossier.statusColor, marginTop: 2 }}>
                        ~{dossier.estKmRemaining.toLocaleString()} km
                      </Text>
                      <Text style={{ fontFamily: F.regular, fontSize: 10, color: colors.onSurfaceVariant }}>
                        Antes de servicio
                      </Text>
                    </View>
                  </View>

                  {/* FACTORY OEM SPECIFICATIONS GRID */}
                  <View style={{ marginTop: 14 }}>
                    <Text
                      style={{
                        fontFamily: F.bold,
                        fontSize: 11,
                        letterSpacing: 0.8,
                        color: colors.onSurfaceVariant,
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      Especificaciones Técnicas OEM ({myMoto.brand} {myMoto.model})
                    </Text>

                    <View style={styles.oemGrid}>
                      {dossier.oemSpecs.map((item, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.oemCardItem,
                            {
                              backgroundColor: isDark ? 'rgba(29, 34, 46, 0.45)' : '#f8fafc',
                              borderColor: isDark ? 'rgba(64, 72, 92, 0.3)' : '#e6eaf0',
                            },
                          ]}
                        >
                          <MaterialIcons name={item.icon as any} size={15} color="#00e3fd" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant }}>
                              {item.label}
                            </Text>
                            <Text style={{ fontFamily: F.bold, fontSize: 12, color: colors.onSurface, marginTop: 1 }}>
                              {item.value}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* TECHNICAL TIP BANNER */}
                  <View
                    style={[
                      styles.tipBox,
                      {
                        backgroundColor: isDark ? 'rgba(29, 34, 46, 0.65)' : '#f4f6fa',
                        borderColor: isDark ? 'rgba(64, 72, 92, 0.35)' : '#e5e9f0',
                        marginTop: 14,
                      },
                    ]}
                  >
                    <MaterialIcons name="lightbulb" size={17} color="#ffb703" />
                    <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 11.5, flex: 1, lineHeight: 17 }}>
                      {selectedHotspot.tip}
                    </Text>
                  </View>

                  {/* REGISTER MAINTENANCE CTA */}
                  {onOpenQuickService && (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onOpenQuickService(selectedHotspot.id);
                      }}
                      style={styles.actionServiceBtn}
                      activeOpacity={0.85}
                    >
                      <MaterialIcons name="build" size={16} color="#ffffff" />
                      <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 13, textTransform: 'uppercase' }}>
                        Registrar Mantenimiento de {selectedHotspot.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGridOverlay: {
    ...StyleSheet.absoluteFill as any,
    opacity: 0.04,
  },
  cockpitRadialGlow: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: 600,
    height: 450,
    borderRadius: 300,
    ...(Platform.OS === 'web' ? { filter: 'blur(70px)' } : {}),
  } as any,
  topHudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
    paddingBottom: 14,
    borderBottomWidth: 0.8,
    zIndex: 20,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  closeHudBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsRibbonBar: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.8,
    zIndex: 15,
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  componentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  chipStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mainBodyContainer: {
    flex: 1,
  },
  canvasContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
  watermarkText: {
    position: 'absolute',
    bottom: '15%',
    alignSelf: 'center',
    fontSize: 120,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  bikeWrapperBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bikeTransformWrapper: {
    width: '88%',
    maxWidth: 680,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bikeImage: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  groundShadow: {
    position: 'absolute',
    bottom: -15,
    width: '78%',
    height: 24,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { filter: 'blur(10px)' } : {}),
    zIndex: 1,
  } as any,
  hotspotNode: {
    position: 'absolute',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  hotspotPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  percentBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  instructionBanner: {
    position: 'absolute',
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29, 34, 46, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(64, 72, 92, 0.4)',
  },
  floatingControlsBar: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 20,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  toolBtnActive: {
    backgroundColor: 'rgba(0, 227, 253, 0.14)',
  },
  toolBtnText: {
    fontSize: 11,
  },
  toolDivider: {
    width: 1,
    height: 16,
  },
  dossierWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    zIndex: 30,
  },
  dossierScrollContent: {
    paddingVertical: 4,
  },
  dossierCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  partIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trackBar: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3.5,
  },
  telemetryStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  telemetryMiniStat: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  oemGrid: {
    gap: 6,
  },
  oemCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4169E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
  },
});
