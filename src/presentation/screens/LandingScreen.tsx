import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';

interface Props {
  onEnter: () => void;
  onOpenSpecs?: () => void;
  onOpenWallet?: () => void;
  isLoggedIn?: boolean;
}

interface FeaturedMoto {
  index: string;
  brand: string;
  model: string;
  category: string;
  hp: string;
  displacement: string;
  topSpeed: string;
  image: any;
  quote: string;
  spanishQuote: string;
  colorAccent: string;
}

const FEATURED_MOTOS: FeaturedMoto[] = [
  {
    index: '01',
    brand: 'EMPIRE KEEWAY',
    model: 'RK 250',
    category: 'Naked Sport Pro',
    hp: '18.0 HP',
    displacement: '249 cc',
    topSpeed: '135 km/h',
    image: require('../../../assets/images/motos/EMPIRE KEEWAY/RK 250.png'),
    quote: "Don't listen to what they say. Go see.",
    spanishQuote: 'No escuches lo que dicen. Sal y compruébalo.',
    colorAccent: '#00e3fd',
  },
  {
    index: '02',
    brand: 'BERA',
    model: 'Super DT 250cc',
    category: 'Dual Sport & Trail',
    hp: '17.5 HP',
    displacement: '250 cc',
    topSpeed: '125 km/h',
    image: require('../../../assets/images/motos/BERA/Super DT 250cc.png'),
    quote: 'Every road has an end. The trail is limitless.',
    spanishQuote: 'Cada carretera tiene un fin. La ruta off-road es infinita.',
    colorAccent: '#ffb703',
  },
  {
    index: '03',
    brand: 'BERA',
    model: 'GBR 200cc',
    category: 'Sport Performance',
    hp: '15.0 HP',
    displacement: '200 cc',
    topSpeed: '120 km/h',
    image: require('../../../assets/images/motos/BERA/GBR 200cc.png'),
    quote: 'Speed is a state of mind. Precision is control.',
    spanishQuote: 'La velocidad es una actitud. La precisión es control.',
    colorAccent: '#4169E1',
  },
  {
    index: '04',
    brand: 'EMPIRE KEEWAY',
    model: 'Horse 150RL',
    category: 'Urban Commuter Icon',
    hp: '11.8 HP',
    displacement: '149.2 cc',
    topSpeed: '110 km/h',
    image: require('../../../assets/images/motos/EMPIRE KEEWAY/Horse 150RL.png'),
    quote: 'Built to endure every street, every single day.',
    spanishQuote: 'Diseñada para conquistar la ciudad todos los días.',
    colorAccent: '#00ae78',
  },
];

export const LandingScreen: React.FC<Props> = ({
  onEnter,
  onOpenSpecs,
  onOpenWallet,
  isLoggedIn = false,
}) => {
  const { colors, isDark } = useTheme();
  const { myMoto } = useMyMoto();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isDesktop = windowWidth >= 960;
  const isTablet = windowWidth >= 640 && windowWidth < 960;

  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const currentMoto = FEATURED_MOTOS[currentIndex];

  const handlePrev = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.15, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    setCurrentIndex((prev) => (prev === 0 ? FEATURED_MOTOS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.15, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    setCurrentIndex((prev) => (prev === FEATURED_MOTOS.length - 1 ? 0 : prev + 1));
  };

  const scrollToSection = (offsetY: number) => {
    scrollRef.current?.scrollTo({ y: offsetY, animated: true });
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* ========================================================================= */}
        {/* HERO SECTION (PORTADA PRINCIPAL BASADA EN LA IMAGEN DE REFERENCIA) */}
        {/* ========================================================================= */}
        <View style={[styles.heroContainer, { minHeight: Math.max(680, windowHeight) }]}>
          
          {/* ATMOSPHERIC SKY & MOUNTAIN HORIZON GRADIENT */}
          <View style={styles.atmosphericSkyLayer} pointerEvents="none" />
          
          {/* MOUNTAIN SILHOUETTE VECTORS IN BACKGROUND */}
          <View style={styles.mountainRidgeContainer} pointerEvents="none">
            {/* SVG Ridge Peaks */}
            <View style={styles.mountainBackPeak} />
            <View style={styles.mountainMainPeak} />
            <View style={styles.mountainRightPeak} />
          </View>

          {/* GROUND MIST & RADIAL AMBIENT GLOW */}
          <View style={styles.groundMistGlow} pointerEvents="none" />
          <View
            style={[
              styles.radialCockpitLight,
              { backgroundColor: currentMoto.colorAccent },
            ]}
            pointerEvents="none"
          />

          {/* ---------------- TOP NAVIGATION BAR ---------------- */}
          <View style={styles.navBar}>
            {/* BRAND LOGO */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.brandIconCircle}>
                <MaterialCommunityIcons name="engine" size={22} color="#00e3fd" />
              </View>
              <View>
                <Text style={styles.brandLogoText}>GARAGE</Text>
                <Text style={styles.brandSubLogoText}>MOTO OS • V1.0</Text>
              </View>
            </View>

            {/* NAV LINKS (DESKTOP) */}
            {isDesktop && (
              <View style={styles.navLinksRow}>
                <TouchableOpacity
                  onPress={() => scrollToSection(0)}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLinkText, { color: '#ffffff' }]}>Inicio</Text>
                  <View style={styles.navActiveIndicator} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => scrollToSection(windowHeight * 0.95)}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navLinkText}>Telemetría</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (onOpenSpecs) onOpenSpecs();
                    else scrollToSection(windowHeight * 1.6);
                  }}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navLinkText}>Ficha Técnica</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (onOpenWallet) onOpenWallet();
                    else scrollToSection(windowHeight * 2.2);
                  }}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navLinkText}>Billetera Digital</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => scrollToSection(windowHeight * 2.8)}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navLinkText}>Taller & SOS</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* RIGHT ACTION: ACCEDER / MI GARAJE */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={onEnter}
                style={[
                  styles.navActionBtn,
                  isLoggedIn && { backgroundColor: 'rgba(0, 227, 253, 0.15)', borderColor: '#00e3fd' },
                ]}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={isLoggedIn ? 'two-wheeler' : 'login'}
                  size={16}
                  color={isLoggedIn ? '#00e3fd' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.navActionBtnText,
                    isLoggedIn && { color: '#00e3fd' },
                  ]}
                >
                  {isLoggedIn ? (myMoto ? `${myMoto.brand} ${myMoto.model}` : 'Mi Garaje') : 'Acceder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------------- CENTER COMPOSITION: GIANT "GARAGE" + MOTORCYCLE DEPTH OVERLAP ---------------- */}
          <View style={styles.centerHeroStage}>
            
            {/* LAYER 1: GIANT TYPOGRAPHY IN BACKGROUND (EXACTLY AS "Explore" IN REFERENCE) */}
            <View style={styles.giantTextWrapper} pointerEvents="none">
              <Text
                style={[
                  styles.giantText,
                  {
                    fontSize: isDesktop ? 168 : isTablet ? 110 : 66,
                    letterSpacing: isDesktop ? 14 : isTablet ? 8 : 4,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                GARAGE
              </Text>
            </View>

            {/* LAYER 2: MOTORCYCLE PROFILE CUTTING IN FRONT OF THE GIANT TEXT (DEPTH EFFECT) */}
            <Animated.View
              style={[
                styles.motoImageWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      scale: isDesktop ? 1.05 : isTablet ? 0.95 : 0.88,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={currentMoto.image}
                style={styles.motoImage}
                resizeMode="contain"
              />
              
              {/* CONTACT GROUND SHADOW */}
              <View style={styles.motoGroundShadow} />
            </Animated.View>

            {/* LAYER 3: TAGLINE & PILL CTA (PLACED ON BOTTOM HALF OF STAGE) */}
            <View style={styles.taglineAndCtaBox}>
              <Text style={styles.heroQuoteText}>
                {currentMoto.quote}
              </Text>
              <Text style={styles.heroSubQuoteText}>
                {currentMoto.spanishQuote}
              </Text>

              {/* THE ICONIC PILL CTA BUTTON (EXACT SHAPE & GLOW FROM REFERENCE IMAGE) */}
              <TouchableOpacity
                onPress={onEnter}
                style={styles.heroPillBtn}
                activeOpacity={0.82}
              >
                <View style={styles.pillInnerGlow} />
                <Text style={styles.heroPillBtnText}>
                  {isLoggedIn ? 'ENTRAR AL GARAJE' : 'EXPLORAR GARAJE'}
                </Text>
                <MaterialIcons name="arrow-forward" size={17} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------------- BOTTOM STATUS BAR (FROM REFERENCE IMAGE) ---------------- */}
          <View style={styles.bottomStatusBar}>
            
            {/* LEFT: SLIDER / MODEL SWITCHER (< 5 > STYLE) */}
            <View style={styles.sliderControlsBox}>
              <TouchableOpacity
                onPress={handlePrev}
                style={styles.sliderArrowBtn}
                activeOpacity={0.7}
                accessibilityLabel="Modelo anterior"
              >
                <MaterialIcons name="chevron-left" size={24} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.sliderCounterBadge}>
                <Text style={styles.sliderCounterText}>
                  {currentMoto.index}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNext}
                style={styles.sliderArrowBtn}
                activeOpacity={0.7}
                accessibilityLabel="Modelo siguiente"
              >
                <MaterialIcons name="chevron-right" size={24} color="#ffffff" />
              </TouchableOpacity>

              {/* Active Model Indicator Tag */}
              <View style={styles.activeModelTagPill}>
                <View style={[styles.modelDot, { backgroundColor: currentMoto.colorAccent }]} />
                <Text style={styles.activeModelText}>
                  {currentMoto.brand} • {currentMoto.model} ({currentMoto.hp} • {currentMoto.displacement})
                </Text>
              </View>
            </View>

            {/* RIGHT: COMMUNITY & SOCIAL ICONS (FROM REFERENCE IMAGE) */}
            <View style={styles.socialIconsRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.7}
                accessibilityLabel="Comunidad WhatsApp"
              >
                <MaterialCommunityIcons name="whatsapp" size={19} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.7}
                accessibilityLabel="Instagram"
              >
                <MaterialCommunityIcons name="instagram" size={19} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.7}
                accessibilityLabel="Twitter / X"
              >
                <MaterialCommunityIcons name="twitter" size={19} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => scrollToSection(windowHeight * 0.95)}
                style={styles.socialBtn}
                activeOpacity={0.7}
                accessibilityLabel="Explorar características"
              >
                <MaterialIcons name="arrow-downward" size={19} color="#00e3fd" />
              </TouchableOpacity>
            </View>

          </View>

        </View>

        {/* ========================================================================= */}
        {/* PLATFORM VALUE STATS STRIP */}
        {/* ========================================================================= */}
        <View style={styles.statsStrip}>
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#00e3fd' }]}>+15,000</Text>
            <Text style={styles.statStripLabel}>Km monitoreados en tiempo real</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#00ae78' }]}>8 Puntos</Text>
            <Text style={styles.statStripLabel}>Auditoría mecánica por telemetría</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#4169E1' }]}>100%</Text>
            <Text style={styles.statStripLabel}>Billetera digital sin papeles rotos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#ffb703' }]}>0 Multas</Text>
            <Text style={styles.statStripLabel}>Alertas de vencimiento preventivo</Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* FEATURE 1: TELEMETRÍA PREDICTIVA EN TIEMPO REAL */}
        {/* ========================================================================= */}
        <View style={[styles.featureSection, { backgroundColor: '#0c0f16' }]}>
          <View style={[styles.featureContentRow, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            
            {/* TEXT INFO */}
            <View style={{ flex: 1, paddingRight: isDesktop ? 40 : 0 }}>
              <View style={styles.featureCategoryBadge}>
                <MaterialIcons name="speed" size={14} color="#00e3fd" />
                <Text style={styles.featureCategoryBadgeText}>TELEMETRÍA PREDICTIVA</Text>
              </View>

              <Text style={styles.featureTitle}>
                Auditoría viva del desgaste de cada componente
              </Text>
              
              <Text style={styles.featureDescription}>
                Olvídate de calcular mentalmente cuándo te toca el cambio de aceite o pastillas de freno. GARAGE calcula en tiempo real el desgaste anatómico de tu moto basándose en tu odómetro y tolerancias de fábrica.
              </Text>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={styles.bulletText}>Aceite 4T, bujía, filtro de aire y cadena calibrados en vivo</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={styles.bulletText}>Semáforo dinámico de alerta: Óptimo, Preventivo y Crítico</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={styles.bulletText}>Visor interactivo con puntos de inspección luminosos</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onEnter}
                style={[styles.featureActionBtn, { borderColor: '#00e3fd' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.featureActionBtnText, { color: '#00e3fd' }]}>
                  PROBAR VISOR MECÁNICO
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="#00e3fd" />
              </TouchableOpacity>
            </View>

            {/* PREVIEW CARD */}
            <View style={[styles.featureCardPreview, { flex: 1, marginTop: isDesktop ? 0 : 28 }]}>
              <View style={styles.telemetryMockHeader}>
                <MaterialCommunityIcons name="engine" size={24} color="#00e3fd" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 15 }}>
                    Ciclos de Mantenimiento Sugerido
                  </Text>
                  <Text style={{ fontFamily: F.regular, color: '#8b94a5', fontSize: 11 }}>
                    Odómetro: 14,250 km • Modo Activo
                  </Text>
                </View>
                <View style={styles.livePulseDot} />
              </View>

              {/* ITEM ROWS */}
              <View style={styles.mockBarRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: F.semibold, color: '#ffffff', fontSize: 13 }}>Aceite de Motor 4T</Text>
                  <Text style={{ fontFamily: F.bold, color: '#00ae78', fontSize: 12 }}>85% • ÓPTIMO</Text>
                </View>
                <View style={styles.mockTrack}>
                  <View style={[styles.mockFill, { width: '85%', backgroundColor: '#00ae78' }]} />
                </View>
              </View>

              <View style={styles.mockBarRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: F.semibold, color: '#ffffff', fontSize: 13 }}>Frenos Delanteros</Text>
                  <Text style={{ fontFamily: F.bold, color: '#ffb703', fontSize: 12 }}>42% • PREVENTIVO</Text>
                </View>
                <View style={styles.mockTrack}>
                  <View style={[styles.mockFill, { width: '42%', backgroundColor: '#ffb703' }]} />
                </View>
              </View>

              <View style={styles.mockBarRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: F.semibold, color: '#ffffff', fontSize: 13 }}>Cadena de Transmisión</Text>
                  <Text style={{ fontFamily: F.bold, color: '#ba1a1a', fontSize: 12 }}>18% • CRÍTICO</Text>
                </View>
                <View style={styles.mockTrack}>
                  <View style={[styles.mockFill, { width: '18%', backgroundColor: '#ba1a1a' }]} />
                </View>
              </View>

              <View style={styles.mockCardFooter}>
                <MaterialIcons name="lightbulb" size={16} color="#ffb703" />
                <Text style={{ fontFamily: F.medium, color: '#c4cce0', fontSize: 11.5, flex: 1, lineHeight: 16 }}>
                  Sugerencia: Tensa y lubrica la cadena cada 500 km para prevenir el desgaste prematuro de la catalina.
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* ========================================================================= */}
        {/* FEATURE 2: BILLETERA DIGITAL & CARNET VIRTUAL */}
        {/* ========================================================================= */}
        <View style={[styles.featureSection, { backgroundColor: '#11151e' }]}>
          <View style={[styles.featureContentRow, { flexDirection: isDesktop ? 'row-reverse' : 'column' }]}>
            
            {/* TEXT INFO */}
            <View style={{ flex: 1, paddingLeft: isDesktop ? 40 : 0 }}>
              <View style={[styles.featureCategoryBadge, { borderColor: 'rgba(65, 105, 225, 0.4)' }]}>
                <MaterialIcons name="account-balance-wallet" size={14} color="#4169E1" />
                <Text style={[styles.featureCategoryBadgeText, { color: '#8ca9ff' }]}>DIGITAL WALLET</Text>
              </View>

              <Text style={styles.featureTitle}>
                Todos tus documentos al día y con código QR
              </Text>
              
              <Text style={styles.featureDescription}>
                Lleva el carnet de circulación, póliza de RCV, licencia de conducir, certificado médico y cédula digitalizados en tu teléfono con visualizador de fotos y contador de vencimiento.
              </Text>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={styles.bulletText}>Alertas inteligentes 30 y 15 días antes del vencimiento</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={styles.bulletText}>Visualizador ampliado con zoom y descarga de fotos</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={styles.bulletText}>Respaldo seguro en la nube con Supabase</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onEnter}
                style={[styles.featureActionBtn, { borderColor: '#4169E1' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.featureActionBtnText, { color: '#8ca9ff' }]}>
                  VER BILLETERA DIGITAL
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="#8ca9ff" />
              </TouchableOpacity>
            </View>

            {/* PREVIEW CARD: DIGITAL WALLET */}
            <View style={[styles.featureCardPreview, { flex: 1, marginTop: isDesktop ? 0 : 28 }]}>
              {/* WALLET CARD SIMULATION */}
              <View style={styles.walletCardMock}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#00e3fd" />
                    <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 13, letterSpacing: 0.5 }}>
                      REPÚBLICA BOLIVARIANA DE VENEZUELA
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#00ae78', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 9 }}>VIGENTE</Text>
                  </View>
                </View>

                <View style={{ marginVertical: 14 }}>
                  <Text style={{ fontFamily: F.medium, color: '#8b94a5', fontSize: 11 }}>DOCUMENTO OFICIAL</Text>
                  <Text style={{ fontFamily: F.extrabold, color: '#ffffff', fontSize: 17, marginTop: 2 }}>
                    CERTIFICADO DE CIRCULACIÓN
                  </Text>
                  <Text style={{ fontFamily: F.bold, color: '#00e3fd', fontSize: 13, marginTop: 4 }}>
                    PLACA: AB1C23D • SERIAL: EK150-84920
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.8, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 10 }}>
                  <View>
                    <Text style={{ fontFamily: F.medium, color: '#8b94a5', fontSize: 10 }}>TITULAR</Text>
                    <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 12 }}>DERVIS MARTINEZ</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: F.medium, color: '#8b94a5', fontSize: 10 }}>VENCIMIENTO</Text>
                    <Text style={{ fontFamily: F.bold, color: '#00ae78', fontSize: 12 }}>PERMANENTE</Text>
                  </View>
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* ========================================================================= */}
        {/* FINAL CALL TO ACTION (CTA) */}
        {/* ========================================================================= */}
        <View style={styles.finalCtaSection}>
          <View style={styles.finalCtaGlow} pointerEvents="none" />
          <Text style={styles.finalCtaBadge}>GARAGE PILOT EXPERIENCE</Text>
          <Text style={styles.finalCtaTitle}>
            Toma el control absoluto de tu máquina hoy
          </Text>
          <Text style={styles.finalCtaSubtitle}>
            Crea tu cuenta de piloto gratis y comienza a monitorear telemetría, documentos y mantenimientos con precisión milimétrica.
          </Text>

          <TouchableOpacity
            onPress={onEnter}
            style={styles.finalCtaBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.finalCtaBtnText}>
              {isLoggedIn ? 'IR A MI GARAJE' : 'CREAR CUENTA GRATIS'}
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* FOOTER */}
        {/* ========================================================================= */}
        <View style={styles.footerContainer}>
          <View style={styles.footerInner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="engine" size={20} color="#00e3fd" />
              <Text style={{ fontFamily: F.extrabold, color: '#ffffff', fontSize: 15 }}>
                GARAGE
              </Text>
              <Text style={{ fontFamily: F.regular, color: '#8b94a5', fontSize: 12, marginLeft: 6 }}>
                • Plataforma de Gestión de Motocicletas
              </Text>
            </View>

            <Text style={{ fontFamily: F.regular, color: '#687387', fontSize: 12 }}>
              © {new Date().getFullYear()} GARAGE Inc. Todos los derechos reservados.
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0d13',
  },
  heroContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: '#0c1017',
  },
  atmosphericSkyLayer: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: '#0c1219',
    opacity: 0.95,
  },
  mountainRidgeContainer: {
    position: 'absolute',
    bottom: '18%',
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
    opacity: 0.45,
  },
  mountainBackPeak: {
    position: 'absolute',
    bottom: -60,
    left: '10%',
    width: 600,
    height: 360,
    backgroundColor: '#162230',
    transform: [{ rotate: '45deg' }],
    borderRadius: 40,
  },
  mountainMainPeak: {
    position: 'absolute',
    bottom: -80,
    left: '42%',
    width: 720,
    height: 440,
    backgroundColor: '#1b2a3b',
    transform: [{ rotate: '45deg' }],
    borderRadius: 50,
  },
  mountainRightPeak: {
    position: 'absolute',
    bottom: -70,
    right: '5%',
    width: 550,
    height: 340,
    backgroundColor: '#141f2c',
    transform: [{ rotate: '45deg' }],
    borderRadius: 40,
  },
  groundMistGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'rgba(12, 16, 23, 0.95)',
    ...(Platform.OS === 'web' ? { filter: 'blur(40px)' } : {}),
  } as any,
  radialCockpitLight: {
    position: 'absolute',
    top: '32%',
    left: '30%',
    width: 500,
    height: 400,
    borderRadius: 250,
    opacity: 0.12,
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  } as any,
  navBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
    paddingBottom: 16,
    zIndex: 30,
  },
  brandIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 227, 253, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 227, 253, 0.35)',
  },
  brandLogoText: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  brandSubLogoText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    color: '#00e3fd',
    letterSpacing: 1,
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  navLinkItem: {
    position: 'relative',
    paddingVertical: 6,
  },
  navLinkText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
  },
  navActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00e3fd',
    borderRadius: 1,
  },
  navActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  navActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  centerHeroStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    paddingVertical: 20,
  },
  giantTextWrapper: {
    position: 'absolute',
    top: '26%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  giantText: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: 'rgba(255, 255, 255, 0.94)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  motoImageWrapper: {
    zIndex: 2,
    width: '90%',
    maxWidth: 720,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  motoImage: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  motoGroundShadow: {
    position: 'absolute',
    bottom: -15,
    width: '75%',
    height: 25,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    ...(Platform.OS === 'web' ? { filter: 'blur(12px)' } : {}),
    zIndex: 1,
  } as any,
  taglineAndCtaBox: {
    zIndex: 5,
    alignItems: 'center',
    marginTop: -20,
    paddingHorizontal: 20,
  },
  heroQuoteText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  heroSubQuoteText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  heroPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(18, 24, 34, 0.75)',
    shadowColor: '#00e3fd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  pillInnerGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 227, 253, 0.06)',
  } as any,
  heroPillBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
    color: '#ffffff',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bottomStatusBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
    zIndex: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  sliderControlsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sliderCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sliderCounterText: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 1,
  },
  activeModelTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 6,
  },
  modelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeModelText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  socialIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#080a0f',
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexWrap: 'wrap',
    gap: 16,
  },
  statStripItem: {
    alignItems: 'center',
  },
  statStripNumber: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 24,
    letterSpacing: 0.5,
  },
  statStripLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#8b94a5',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureSection: {
    paddingVertical: 70,
    paddingHorizontal: 32,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureContentRow: {
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  featureCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: 'rgba(0, 227, 253, 0.4)',
    backgroundColor: 'rgba(0, 227, 253, 0.08)',
    marginBottom: 14,
  },
  featureCategoryBadgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10.5,
    color: '#00e3fd',
    letterSpacing: 1,
  },
  featureTitle: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 30,
    color: '#ffffff',
    lineHeight: 38,
    marginBottom: 14,
  },
  featureDescription: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#9aa5b8',
    lineHeight: 22,
    marginBottom: 20,
  },
  bulletList: {
    gap: 10,
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: '#cdd5e4',
  },
  featureActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  featureActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  featureCardPreview: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#151a24',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  telemetryMockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 14,
    marginBottom: 16,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ae78',
  },
  mockBarRow: {
    marginBottom: 14,
  },
  mockTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  mockFill: {
    height: '100%',
    borderRadius: 3,
  },
  mockCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  walletCardMock: {
    backgroundColor: '#1b2230',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(65, 105, 225, 0.35)',
  },
  finalCtaSection: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: 90,
    paddingHorizontal: 24,
    backgroundColor: '#0a0d13',
    overflow: 'hidden',
  },
  finalCtaGlow: {
    position: 'absolute',
    top: '20%',
    width: 500,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(65, 105, 225, 0.15)',
    ...(Platform.OS === 'web' ? { filter: 'blur(90px)' } : {}),
  } as any,
  finalCtaBadge: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: '#00e3fd',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  finalCtaTitle: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 34,
    color: '#ffffff',
    textAlign: 'center',
    maxWidth: 680,
    lineHeight: 42,
    marginBottom: 14,
  },
  finalCtaSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#9aa5b8',
    textAlign: 'center',
    maxWidth: 580,
    lineHeight: 22,
    marginBottom: 28,
  },
  finalCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4169E1',
    paddingHorizontal: 34,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  finalCtaBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  footerContainer: {
    backgroundColor: '#07090d',
    paddingVertical: 30,
    paddingHorizontal: 32,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerInner: {
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
});
