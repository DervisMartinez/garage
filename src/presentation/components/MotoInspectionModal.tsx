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
import { MOTO_CATALOG } from '../../data/catalog';
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

const HOTSPOTS: HotspotDef[] = [
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

  // Selected Hotspot for detail inspection card
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDef | null>(HOTSPOTS[0]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
    const cat = MOTO_CATALOG.find((m) => m.brand === myMoto.brand && m.model === myMoto.model);
    if (cat?.imageRes) return cat.imageRes;
    return null;
  }, [myMoto]);

  // Compute Telemetry Wear for each Hotspot
  const wearMap = useMemo(() => {
    if (!myMoto) return {} as Record<string, number>;
    const map: Record<string, number> = {};

    HOTSPOTS.forEach((h) => {
      const recs = records.filter((r) => r.type === h.id);
      const lastOdo = recs.length > 0
        ? recs.reduce((prev, curr) => (prev.odometer > curr.odometer ? prev : curr)).odometer
        : (myMoto.isFromAgency ? 0 : Math.max(0, myMoto.currentOdometer - 1500));
      map[h.id] = calculateWearPercentage(myMoto.currentOdometer, lastOdo, h.id);
    });

    return map;
  }, [myMoto, records]);

  // Factory Specifications (OEM)
  const specs = useMemo(() => {
    if (!myMoto) return null;
    return getMotoSpecs(myMoto.brand, myMoto.model);
  }, [myMoto]);

  // Comprehensive Dossier for Selected Hotspot
  const dossier = useMemo(() => {
    if (!myMoto || !selectedHotspot) return null;

    const wear = wearMap[selectedHotspot.id] ?? 85;
    const statusColor = wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a';
    const statusText = wear >= 60 ? 'ÓPTIMO' : wear >= 30 ? 'PREVENTIVO' : 'CRÍTICO';

    const compRecords = records.filter((r) => r.type === selectedHotspot.id);
    const lastRecord = compRecords.length > 0
      ? compRecords.reduce((prev, curr) => (prev.odometer > curr.odometer ? prev : curr))
      : null;
    const lastOdo = lastRecord
      ? lastRecord.odometer
      : (myMoto.isFromAgency ? 0 : Math.max(0, myMoto.currentOdometer - 1500));
    const kmSince = Math.max(0, myMoto.currentOdometer - lastOdo);

    let oemSpecs: { label: string; value: string; icon: string }[] = [];
    let intervalNominal = 3000;

    switch (selectedHotspot.id) {
      case 'oil':
        oemSpecs = [
          { label: 'Viscosidad OEM', value: specs?.oilTypeRecommended || '20W-50 4T JASO MA2', icon: 'opacity' },
          { label: 'Capacidad Cárter', value: specs?.oilCapacity || '1.0 Litro', icon: 'local-gas-station' },
          { label: 'Frecuencia Sugerida', value: specs?.maintenanceIntervalOil || 'Cada 2,500 - 3,000 km', icon: 'schedule' },
        ];
        intervalNominal = 3000;
        break;
      case 'brakes_front':
        oemSpecs = [
          { label: 'Sistema', value: specs?.brakesFront || 'Disco hidráulico ventilado 240mm', icon: 'build' },
          { label: 'Espesor Mínimo', value: 'Min 2.0 mm pastillas', icon: 'straighten' },
          { label: 'Fluido Hidráulico', value: 'DOT 3 / DOT 4', icon: 'invert-colors' },
        ];
        intervalNominal = 6000;
        break;
      case 'brakes_rear':
        oemSpecs = [
          { label: 'Sistema', value: specs?.brakesRear || 'Tambor mecánico con zapatas', icon: 'build' },
          { label: 'Juego Libre Pedal', value: '20 - 30 mm holgura', icon: 'straighten' },
          { label: 'Inspección', value: 'Revisión cada 3,000 km', icon: 'schedule' },
        ];
        intervalNominal = 6000;
        break;
      case 'tires_front':
        oemSpecs = [
          { label: 'Medida Delantera', value: specs?.frontTireSize || '2.75 - 18', icon: 'album' },
          { label: 'Presión en Frío', value: specs?.frontTirePressure || '28 PSI', icon: 'speed' },
          { label: 'Profundidad Canales', value: 'Min 1.6 mm banda', icon: 'straighten' },
        ];
        intervalNominal = 12000;
        break;
      case 'tires_rear':
        oemSpecs = [
          { label: 'Medida Trasera', value: specs?.rearTireSize || '90/90 - 18', icon: 'album' },
          { label: 'Presión en Frío', value: specs?.rearTirePressure || '32 PSI', icon: 'speed' },
          { label: 'Profundidad Canales', value: 'Min 2.0 mm (Tracción)', icon: 'straighten' },
        ];
        intervalNominal = 10000;
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
          { label: 'Admisión', value: 'Elemento lavable / papel', icon: 'air' },
          { label: 'Mantenimiento', value: 'Sopleteo o reemplazo', icon: 'build' },
          { label: 'Frecuencia', value: 'Cada 4,000 km', icon: 'schedule' },
        ];
        intervalNominal = 4000;
        break;
      case 'spark_plugs':
        oemSpecs = [
          { label: 'Referencia OEM', value: specs?.sparkPlug || 'NGK D8EA', icon: 'flash-on' },
          { label: 'Luz de Electrodo', value: '0.7 - 0.8 mm', icon: 'straighten' },
          { label: 'Diagnóstico Visual', value: 'Color café claro en punta', icon: 'search' },
        ];
        intervalNominal = 6000;
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
            {HOTSPOTS.map((h) => {
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
          
          {/* LEFT SECTION: MOTORCYCLE INTERACTIVE CANVAS */}
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

            {/* STABLE 2D SCALABLE MOTORCYCLE WRAPPER */}
            <View style={styles.bikeWrapperBox}>
              <Animated.View
                style={[
                  styles.bikeTransformWrapper,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* IMAGEN DE LA MOTO */}
                {imageSource ? (
                  <Image
                    source={imageSource}
                    style={styles.bikeImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <MaterialIcons name="two-wheeler" size={160} color="#4169E1" />
                    <Text style={{ fontFamily: F.bold, color: colors.onSurfaceVariant, marginTop: 12 }}>
                      {myMoto.brand} {myMoto.model}
                    </Text>
                  </View>
                )}

                {/* SOMBRA SUAVE DE CONTACTO BAJO LA MOTO */}
                <View
                  style={[
                    styles.groundShadow,
                    { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.22)' },
                  ]}
                />

                {/* PUNTOS TÁCTILES / HOTSPOTS EN LAS PARTES DE LA MOTO */}
                {showHotspots && (
                  <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {HOTSPOTS.map((h) => {
                      const wear = wearMap[h.id] ?? 85;
                      const isSelected = selectedHotspot?.id === h.id;
                      const statusColor = wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a';
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
                              },
                            ]}
                          >
                            <Text style={{ fontFamily: F.extrabold, fontSize: 9, color: '#ffffff' }}>
                              {wear}%
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
