import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
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
import { getMotoSpecs } from '../../data/specs';

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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isDark = mode === 'dark';
  const isDesktop = windowWidth >= 900;

  // Selected Hotspot for detail inspection card
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDef | null>(HOTSPOTS[0]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);

  // 3D Motion & Pan Animated Values
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const rotY = useRef(new Animated.Value(0)).current;
  const rotX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Radar pulse animation for hotspots
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.45,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Auto-spin animation
  useEffect(() => {
    let spinLoop: Animated.CompositeAnimation | null = null;
    if (isAutoSpinning) {
      spinLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 6000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(spinAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      spinLoop.start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
    return () => {
      spinLoop?.stop();
    };
  }, [isAutoSpinning, spinAnim]);

  // PanResponder to allow dragging and rotating the motorcycle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Horizontal drag rotates the bike in 3D
        rotY.setValue(gestureState.dx * 0.22);
        // Vertical drag tilts the bike and moves it slightly
        rotX.setValue(-gestureState.dy * 0.12);
        panX.setValue(gestureState.dx * 0.35);
        panY.setValue(gestureState.dy * 0.35);
      },
      onPanResponderRelease: () => {
        // Smoothly spring back to rest position
        Animated.parallel([
          Animated.spring(panX, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
          Animated.spring(panY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
          Animated.spring(rotY, { toValue: 0, friction: 5, tension: 60, useNativeDriver: true }),
          Animated.spring(rotX, { toValue: 0, friction: 5, tension: 60, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

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

  // Specs
  const specs = useMemo(() => {
    if (!myMoto) return null;
    return getMotoSpecs(myMoto.brand, myMoto.model);
  }, [myMoto]);

  const handleZoom = (level: number) => {
    setZoomLevel(level);
    Animated.spring(scaleAnim, {
      toValue: level,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleToggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleResetView = () => {
    setIsAutoSpinning(false);
    setIsFlipped(false);
    setZoomLevel(1);
    Animated.parallel([
      Animated.spring(panX, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(panY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(rotY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(rotX, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(spinAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  // Interpolated 3D Rotation
  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const rotYInterpolation = rotY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['-35deg', '0deg', '35deg'],
  });

  const rotXInterpolation = rotX.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  if (!myMoto) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.rootContainer, { backgroundColor: isDark ? '#0c0e14' : '#f0f3f8' }]}>
        
        {/* ATMOSPHERIC BACKGROUND GRID & RADIAL COCKPIT GLOW */}
        <View style={styles.backgroundGridOverlay} pointerEvents="none" />
        <View style={[styles.cockpitRadialGlow, { backgroundColor: isDark ? 'rgba(65, 105, 225, 0.12)' : 'rgba(39, 95, 227, 0.08)' }]} pointerEvents="none" />

        {/* WATERMARK MODEL BACKGROUND */}
        <Text style={[styles.watermarkText, { color: isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.04)' }]} pointerEvents="none">
          {myMoto.model}
        </Text>

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
                  INSPECCIÓN 3D EN TIEMPO REAL
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

        {/* MAIN INTERACTIVE CANVAS AREA */}
        <View style={styles.canvasContainer}>
          
          {/* TOUCH GESTURE AREA WITH 3D ROTATION */}
          <View 
            style={styles.gestureCatchArea} 
            {...panResponder.panHandlers}
          >
            <Animated.View
              style={[
                styles.bikeTransformWrapper,
                {
                  transform: [
                    { translateX: panX },
                    { translateY: panY },
                    { perspective: 1200 },
                    { rotateY: isAutoSpinning ? spinInterpolation : rotYInterpolation },
                    { rotateX: rotXInterpolation },
                    { scale: scaleAnim },
                    { scaleX: isFlipped ? -1 : 1 },
                  ],
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
              <View style={[styles.groundShadow, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.22)' }]} />

              {/* PUNTOS TÁCTILES / HOTSPOTS EN LAS PARTES DE LA MOTO */}
              {showHotspots && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                  {HOTSPOTS.map((h) => {
                    const wear = wearMap[h.id] ?? 85;
                    const isSelected = selectedHotspot?.id === h.id;

                    const statusColor = wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a';

                    // Si está invertida la vista, espejamos la coordenada X para mantener la precisión anatómica
                    const leftPos = isFlipped ? 100 - h.leftPct : h.leftPct;

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
                        {/* Radar Pulse Concentric Ring */}
                        <Animated.View
                          style={[
                            styles.pulseRing,
                            {
                              borderColor: statusColor,
                              transform: [{ scale: pulseAnim }],
                              opacity: isSelected ? 0.9 : 0.6,
                            },
                          ]}
                        />

                        {/* Glowing Center Pin */}
                        <View
                          style={[
                            styles.hotspotPin,
                            {
                              backgroundColor: isSelected ? statusColor : (isDark ? '#191c21' : '#ffffff'),
                              borderColor: statusColor,
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
                        <View style={[styles.percentBadge, { backgroundColor: statusColor }]}>
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
              Arrastra para girar 3D • Toca los puntos luminosos para auditar piezas
            </Text>
          </View>

          {/* FLOATING ACTION TOOLBAR (CONTROLES 3D & ZOOM) */}
          <View style={[styles.floatingControlsBar, { backgroundColor: isDark ? 'rgba(23, 27, 36, 0.88)' : 'rgba(255, 255, 255, 0.92)', borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0,0,0,0.1)' }]}>
            
            {/* TOGGLE PUNTOS */}
            <TouchableOpacity
              onPress={() => setShowHotspots(!showHotspots)}
              style={[styles.toolBtn, showHotspots && styles.toolBtnActive]}
              accessibilityLabel="Alternar puntos de inspección"
              activeOpacity={0.7}
            >
              <MaterialIcons name="visibility" size={17} color={showHotspots ? '#00e3fd' : colors.onSurfaceVariant} />
              <Text style={[styles.toolBtnText, { color: showHotspots ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold }]}>
                {showHotspots ? 'HUD ON' : 'HUD OFF'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.toolDivider, { backgroundColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]} />

            {/* VOLTEAR LADO */}
            <TouchableOpacity
              onPress={handleToggleFlip}
              style={[styles.toolBtn, isFlipped && styles.toolBtnActive]}
              accessibilityLabel="Invertir lado de la moto"
              activeOpacity={0.7}
            >
              <MaterialIcons name="flip" size={17} color={isFlipped ? '#00e3fd' : colors.onSurfaceVariant} />
              <Text style={[styles.toolBtnText, { color: isFlipped ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold }]}>
                Voltear
              </Text>
            </TouchableOpacity>

            <View style={[styles.toolDivider, { backgroundColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]} />

            {/* AUTO SPIN 360 */}
            <TouchableOpacity
              onPress={() => setIsAutoSpinning(!isAutoSpinning)}
              style={[styles.toolBtn, isAutoSpinning && styles.toolBtnActive]}
              accessibilityLabel="Giro continuo 360"
              activeOpacity={0.7}
            >
              <MaterialIcons name="360" size={18} color={isAutoSpinning ? '#00e3fd' : colors.onSurfaceVariant} />
              <Text style={[styles.toolBtnText, { color: isAutoSpinning ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold }]}>
                360°
              </Text>
            </TouchableOpacity>

            <View style={[styles.toolDivider, { backgroundColor: isDark ? 'rgba(64, 72, 92, 0.5)' : '#d0d4dc' }]} />

            {/* ZOOM TOGGLES */}
            <TouchableOpacity
              onPress={() => handleZoom(zoomLevel === 1 ? 1.4 : zoomLevel === 1.4 ? 1.8 : 1)}
              style={[styles.toolBtn, zoomLevel > 1 && styles.toolBtnActive]}
              accessibilityLabel="Nivel de zoom"
              activeOpacity={0.7}
            >
              <MaterialIcons name="zoom-in" size={18} color={zoomLevel > 1 ? '#00e3fd' : colors.onSurfaceVariant} />
              <Text style={[styles.toolBtnText, { color: zoomLevel > 1 ? '#00e3fd' : colors.onSurfaceVariant, fontFamily: F.bold }]}>
                {zoomLevel}x
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

        {/* BOTTOM INSPECTION DETAIL CARD (ESTADO DE LA PARTE TOCADA) */}
        {selectedHotspot && (
          <View style={[styles.bottomDetailPanel, { backgroundColor: isDark ? 'rgba(19, 23, 31, 0.96)' : 'rgba(255, 255, 255, 0.97)', borderColor: isDark ? 'rgba(64, 72, 92, 0.45)' : 'rgba(0,0,0,0.1)' }]}>
            
            <View style={styles.detailCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.partIconCircle, { backgroundColor: isDark ? 'rgba(65, 105, 225, 0.16)' : 'rgba(39, 95, 227, 0.12)' }]}>
                  {selectedHotspot.iconFamily === 'community' ? (
                    <MaterialCommunityIcons name={selectedHotspot.icon as any} size={20} color="#4169E1" />
                  ) : (
                    <MaterialIcons name={selectedHotspot.icon as any} size={20} color="#4169E1" />
                  )}
                </View>

                <View>
                  <Text style={{ fontFamily: F.extrabold, color: colors.onSurface, fontSize: 16 }}>
                    {selectedHotspot.title}
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11.5 }}>
                    {selectedHotspot.sub}
                  </Text>
                </View>
              </View>

              {/* WEAR STATUS PILL */}
              {(() => {
                const wear = wearMap[selectedHotspot.id] ?? 85;
                const statusColor = wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a';
                const statusText = wear >= 60 ? 'ÓPTIMO' : wear >= 30 ? 'PREVENTIVO' : 'CRÍTICO';
                return (
                  <View style={[styles.statusBadgePill, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.06)', borderColor: statusColor }]}>
                    <View style={[styles.statusMiniDot, { backgroundColor: statusColor }]} />
                    <Text style={{ fontFamily: F.extrabold, color: statusColor, fontSize: 11 }}>
                      {wear}% • {statusText}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* WEAR PROGRESS BAR */}
            {(() => {
              const wear = wearMap[selectedHotspot.id] ?? 85;
              const statusColor = wear >= 60 ? '#00ae78' : wear >= 30 ? '#ffb703' : '#ba1a1a';
              return (
                <View style={{ marginVertical: 10 }}>
                  <View style={[styles.trackBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                    <View style={[styles.fillBar, { width: `${wear}%`, backgroundColor: statusColor }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11 }}>
                      0% (Desgaste Total)
                    </Text>
                    <Text style={{ fontFamily: F.bold, color: statusColor, fontSize: 11 }}>
                      {wear}% de Vida Útil Restante
                    </Text>
                    <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11 }}>
                      100% (Nuevo)
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* TECHNICAL ADVICE & SERVICE CTA */}
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 10, alignItems: isDesktop ? 'center' : 'stretch', marginTop: 4 }}>
              <View style={[styles.tipBox, { flex: 1, backgroundColor: isDark ? 'rgba(29, 34, 46, 0.6)' : '#f4f6fa' }]}>
                <MaterialIcons name="lightbulb" size={15} color="#ffb703" />
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11, flex: 1, lineHeight: 16 }}>
                  {selectedHotspot.tip}
                </Text>
              </View>

              {onOpenQuickService && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenQuickService(selectedHotspot.id);
                  }}
                  style={styles.actionServiceBtn}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="build" size={15} color="#ffffff" />
                  <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 12 }}>
                    Registrar Mantenimiento
                  </Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        )}

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
    backgroundColor: 'transparent',
  },
  cockpitRadialGlow: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 600,
    height: 450,
    borderRadius: 300,
    filter: 'blur(60px)',
  } as any,
  watermarkText: {
    position: 'absolute',
    bottom: '22%',
    alignSelf: 'center',
    fontSize: 140,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: 10,
    textTransform: 'uppercase',
  },
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
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gestureCatchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bikeTransformWrapper: {
    width: '88%',
    maxWidth: 680,
    height: 320,
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
    height: 26,
    borderRadius: 13,
    filter: 'blur(10px)',
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
    borderWidth: 1.5,
  },
  hotspotPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.8,
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
    borderColor: '#ffffff',
  },
  instructionBanner: {
    position: 'absolute',
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29, 34, 46, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(64, 72, 92, 0.4)',
  },
  floatingControlsBar: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
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
    paddingVertical: 6,
    borderRadius: 16,
  },
  toolBtnActive: {
    backgroundColor: 'rgba(0, 227, 253, 0.12)',
  },
  toolBtnText: {
    fontSize: 11,
  },
  toolDivider: {
    width: 1,
    height: 18,
  },
  bottomDetailPanel: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 30,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  actionServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4169E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
});
