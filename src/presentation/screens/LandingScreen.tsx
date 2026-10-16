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
import { LegalDocModal, LegalDocType } from '../components/LegalDocModal';
import { TutorialModal } from '../components/TutorialModal';

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
  const { colors, mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';
  const { myMoto } = useMyMoto();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isDesktop = windowWidth >= 960;
  const isTablet = windowWidth >= 640 && windowWidth < 960;
  const isMobile = windowWidth < 640;

  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // Legal & Tutorial Modals state
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('terms');
  const [showTutorial, setShowTutorial] = useState(false);

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

  const openLegal = (doc: LegalDocType) => {
    setSelectedLegalDoc(doc);
    setShowLegalModal(true);
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  // Color tokens responsive to Dark / Light Mode
  const T = {
    rootBg: isDark ? '#0b0d13' : '#f5f7fa',
    heroBg: isDark ? '#0c1017' : '#ffffff',
    skyGradient: isDark ? '#0c1219' : 'rgba(235, 242, 252, 0.95)',
    mountain1: isDark ? '#162230' : '#e2e8f0',
    mountain2: isDark ? '#1b2a3b' : '#cbd5e1',
    mountain3: isDark ? '#141f2c' : '#e2e8f0',
    giantText: isDark ? 'rgba(255, 255, 255, 0.94)' : 'rgba(17, 19, 25, 0.88)',
    textPrimary: isDark ? '#ffffff' : '#111319',
    textSecondary: isDark ? '#9aa5b8' : '#5c6779',
    textMuted: isDark ? '#6b7588' : '#8893a7',
    borderHairline: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
    accentCyan: '#00e3fd',
    accentBlue: isDark ? '#4169E1' : '#275FE3',
    cardBg: isDark ? '#151a24' : '#ffffff',
    cardBgAlt: isDark ? '#11151e' : '#f8fafd',
    statsStripBg: isDark ? '#080a0f' : '#ffffff',
    footerBg: isDark ? '#07090d' : '#edf2f9',
  };

  return (
    <View style={[styles.root, { backgroundColor: T.rootBg }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* ========================================================================= */}
        {/* HERO SECTION (PORTADA PRINCIPAL BASADA EN LA IMAGEN DE REFERENCIA) */}
        {/* ========================================================================= */}
        <View style={[styles.heroContainer, { minHeight: Math.max(680, windowHeight), backgroundColor: T.heroBg }]}>
          
          {/* ATMOSPHERIC SKY & HORIZON GRADIENT */}
          <View style={[styles.atmosphericSkyLayer, { backgroundColor: T.skyGradient }]} pointerEvents="none" />
          
          {/* MOUNTAIN SILHOUETTE VECTORS IN BACKGROUND */}
          <View style={styles.mountainRidgeContainer} pointerEvents="none">
            <View style={[styles.mountainBackPeak, { backgroundColor: T.mountain1 }]} />
            <View style={[styles.mountainMainPeak, { backgroundColor: T.mountain2 }]} />
            <View style={[styles.mountainRightPeak, { backgroundColor: T.mountain3 }]} />
          </View>

          {/* GROUND MIST & RADIAL AMBIENT GLOW */}
          <View style={[styles.groundMistGlow, { backgroundColor: isDark ? 'rgba(12, 16, 23, 0.95)' : 'rgba(255, 255, 255, 0.92)' }]} pointerEvents="none" />
          <View
            style={[
              styles.radialCockpitLight,
              { backgroundColor: currentMoto.colorAccent, opacity: isDark ? 0.12 : 0.08 },
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
                <Text style={[styles.brandLogoText, { color: T.textPrimary }]}>GARAGE</Text>
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
                  <Text style={[styles.navLinkText, { color: isDark ? '#ffffff' : T.accentBlue, fontFamily: F.bold }]}>
                    Inicio
                  </Text>
                  <View style={styles.navActiveIndicator} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => scrollToSection(windowHeight * 0.95)}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLinkText, { color: T.textSecondary }]}>Telemetría</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (onOpenSpecs) onOpenSpecs();
                    else scrollToSection(windowHeight * 1.6);
                  }}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLinkText, { color: T.textSecondary }]}>Ficha Técnica</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (onOpenWallet) onOpenWallet();
                    else scrollToSection(windowHeight * 2.2);
                  }}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLinkText, { color: T.textSecondary }]}>Billetera Digital</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => scrollToSection(windowHeight * 2.8)}
                  style={styles.navLinkItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLinkText, { color: T.textSecondary }]}>Taller & SOS</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* RIGHT ACTIONS: THEME TOGGLE & ACCEDER / MI GARAJE */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              
              {/* THEME TOGGLE BUTTON */}
              <TouchableOpacity
                style={[
                  styles.themeToggleBtn,
                  {
                    borderColor: T.borderSubtle,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  }
                ]}
                onPress={toggleTheme}
                activeOpacity={0.75}
                accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                <MaterialIcons 
                  name={isDark ? 'wb-sunny' : 'nightlight-round'} 
                  size={18} 
                  color={isDark ? '#ffb703' : '#4169E1'} 
                />
              </TouchableOpacity>

              {/* ACCEDER / MI GARAJE BUTTON */}
              <TouchableOpacity
                onPress={onEnter}
                style={[
                  styles.navActionBtn,
                  {
                    borderColor: isLoggedIn ? '#00e3fd' : T.borderSubtle,
                    backgroundColor: isLoggedIn 
                      ? (isDark ? 'rgba(0, 227, 253, 0.15)' : 'rgba(0, 174, 120, 0.12)') 
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                  }
                ]}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={isLoggedIn ? 'two-wheeler' : 'login'}
                  size={16}
                  color={isLoggedIn ? (isDark ? '#00e3fd' : '#00ae78') : T.textPrimary}
                />
                <Text
                  style={[
                    styles.navActionBtnText,
                    { color: isLoggedIn ? (isDark ? '#00e3fd' : '#00ae78') : T.textPrimary },
                  ]}
                >
                  {isLoggedIn ? (myMoto ? `${myMoto.brand} ${myMoto.model}` : 'Mi Garaje') : 'Acceder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------------- CENTER COMPOSITION: GIANT "GARAGE" + MOTORCYCLE DEPTH OVERLAP ---------------- */}
          <View style={styles.centerHeroStage}>
            
            {/* LAYER 1: GIANT TYPOGRAPHY IN BACKGROUND (EXACTLY AS IN REFERENCE IMAGE) */}
            <View style={styles.giantTextWrapper} pointerEvents="none">
              <Text
                style={[
                  styles.giantText,
                  {
                    color: T.giantText,
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
              <View style={[styles.motoGroundShadow, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)' }]} />
            </Animated.View>

            {/* LAYER 3: TAGLINE & PILL CTA BUTTON */}
            <View style={styles.taglineAndCtaBox}>
              <Text style={[styles.heroQuoteText, { color: T.textPrimary }]}>
                {currentMoto.quote}
              </Text>
              <Text style={[styles.heroSubQuoteText, { color: T.textSecondary }]}>
                {currentMoto.spanishQuote}
              </Text>

              {/* THE ICONIC PILL CTA BUTTON (EXACT SHAPE & GLOW FROM REFERENCE IMAGE) */}
              <TouchableOpacity
                onPress={onEnter}
                style={[
                  styles.heroPillBtn,
                  {
                    borderColor: isDark ? 'rgba(0, 227, 253, 0.75)' : '#275FE3',
                    backgroundColor: isDark ? 'rgba(18, 24, 34, 0.82)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: isDark ? '#00e3fd' : '#275FE3',
                  }
                ]}
                activeOpacity={0.82}
              >
                <View style={[styles.pillInnerGlow, { backgroundColor: isDark ? 'rgba(0, 227, 253, 0.08)' : 'rgba(39, 95, 227, 0.08)' }]} />
                <Text style={[styles.heroPillBtnText, { color: isDark ? '#ffffff' : '#275FE3' }]}>
                  {isLoggedIn ? 'ENTRAR AL GARAJE' : 'EXPLORAR GARAJE'}
                </Text>
                <MaterialIcons 
                  name="arrow-forward" 
                  size={17} 
                  color={isDark ? '#00e3fd' : '#275FE3'} 
                  style={{ marginLeft: 6 }} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------------- BOTTOM STATUS BAR (FROM REFERENCE IMAGE) ---------------- */}
          <View style={styles.bottomStatusBar}>
            
            {/* LEFT: SLIDER / MODEL SWITCHER (< 01 > STYLE) */}
            <View style={styles.sliderControlsBox}>
              <TouchableOpacity
                onPress={handlePrev}
                style={[
                  styles.sliderArrowBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: T.borderSubtle,
                  }
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Modelo anterior"
              >
                <MaterialIcons name="chevron-left" size={24} color={T.textPrimary} />
              </TouchableOpacity>

              <View style={styles.sliderCounterBadge}>
                <Text style={[styles.sliderCounterText, { color: T.textPrimary }]}>
                  {currentMoto.index}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.sliderArrowBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: T.borderSubtle,
                  }
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Modelo siguiente"
              >
                <MaterialIcons name="chevron-right" size={24} color={T.textPrimary} />
              </TouchableOpacity>

              {/* Active Model Indicator Tag */}
              <View style={[
                styles.activeModelTagPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: T.borderSubtle,
                }
              ]}>
                <View style={[styles.modelDot, { backgroundColor: currentMoto.colorAccent }]} />
                <Text style={[styles.activeModelText, { color: T.textPrimary }]}>
                  {currentMoto.brand} • {currentMoto.model} ({currentMoto.hp} • {currentMoto.displacement})
                </Text>
              </View>
            </View>

            {/* RIGHT: COMMUNITY & SOCIAL ICONS */}
            <View style={styles.socialIconsRow}>
              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: T.borderSubtle,
                  }
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Comunidad WhatsApp"
              >
                <MaterialCommunityIcons name="whatsapp" size={19} color={T.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: T.borderSubtle,
                  }
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Instagram"
              >
                <MaterialCommunityIcons name="instagram" size={19} color={T.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: T.borderSubtle,
                  }
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Twitter / X"
              >
                <MaterialCommunityIcons name="twitter" size={19} color={T.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => scrollToSection(windowHeight * 0.95)}
                style={[
                  styles.socialBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: T.borderSubtle,
                  }
                ]}
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
        <View style={[styles.statsStrip, { backgroundColor: T.statsStripBg, borderColor: T.borderHairline }]}>
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#00e3fd' }]}>+15,000</Text>
            <Text style={[styles.statStripLabel, { color: T.textSecondary }]}>Km monitoreados en tiempo real</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.borderHairline }]} />
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#00ae78' }]}>8 Puntos</Text>
            <Text style={[styles.statStripLabel, { color: T.textSecondary }]}>Auditoría mecánica por telemetría</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.borderHairline }]} />
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: T.accentBlue }]}>100%</Text>
            <Text style={[styles.statStripLabel, { color: T.textSecondary }]}>Billetera digital sin papeles rotos</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.borderHairline }]} />
          <View style={styles.statStripItem}>
            <Text style={[styles.statStripNumber, { color: '#ffb703' }]}>0 Multas</Text>
            <Text style={[styles.statStripLabel, { color: T.textSecondary }]}>Alertas de vencimiento preventivo</Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* FEATURE 1: TELEMETRÍA PREDICTIVA EN TIEMPO REAL */}
        {/* ========================================================================= */}
        <View style={[styles.featureSection, { backgroundColor: T.cardBgAlt, borderBottomColor: T.borderHairline }]}>
          <View style={[styles.featureContentRow, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            
            {/* TEXT INFO */}
            <View style={{ flex: 1, paddingRight: isDesktop ? 40 : 0 }}>
              <View style={styles.featureCategoryBadge}>
                <MaterialIcons name="speed" size={14} color="#00e3fd" />
                <Text style={styles.featureCategoryBadgeText}>TELEMETRÍA PREDICTIVA</Text>
              </View>

              <Text style={[styles.featureTitle, { color: T.textPrimary }]}>
                Auditoría viva del desgaste de cada componente
              </Text>
              
              <Text style={[styles.featureDescription, { color: T.textSecondary }]}>
                Calculamos la vida útil de tu aceite 4T, pastillas de freno, cadena reforzada y neumáticos en base al odómetro real acumulado.
              </Text>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={[styles.bulletText, { color: T.textPrimary }]}>Alertas preventivas antes del fallo de la pieza</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={[styles.bulletText, { color: T.textPrimary }]}>Especificación exacta de lubricante según tu manual (JASO MA2)</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={[styles.bulletText, { color: T.textPrimary }]}>Registro histórico y exportable de cada cambio realizado</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onEnter}
                style={[styles.featureActionBtn, { borderColor: '#00e3fd' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.featureActionBtnText, { color: '#00e3fd' }]}>
                  PROBAR TELEMETRÍA
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="#00e3fd" />
              </TouchableOpacity>
            </View>

            {/* PREVIEW CARD: TELEMETRY */}
            <View style={[
              styles.featureCardPreview, 
              { 
                flex: 1, 
                marginTop: isDesktop ? 0 : 28,
                backgroundColor: T.cardBg,
                borderColor: T.borderHairline,
              }
            ]}>
              <View style={[styles.telemetryMockHeader, { borderBottomColor: T.borderHairline }]}>
                <View style={styles.livePulseDot} />
                <Text style={{ fontFamily: F.bold, color: T.textPrimary, fontSize: 13, letterSpacing: 0.8 }}>
                  ESTADO EN VIVO • {currentMoto.brand} {currentMoto.model}
                </Text>
              </View>

              <View style={styles.mockBarRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: F.semibold, color: T.textPrimary, fontSize: 13 }}>Aceite de Motor 4T</Text>
                  <Text style={{ fontFamily: F.bold, color: '#00ae78', fontSize: 12 }}>85% • ÓPTIMO</Text>
                </View>
                <View style={[styles.mockTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <View style={[styles.mockFill, { width: '85%', backgroundColor: '#00ae78' }]} />
                </View>
              </View>

              <View style={styles.mockBarRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: F.semibold, color: T.textPrimary, fontSize: 13 }}>Frenos Delanteros</Text>
                  <Text style={{ fontFamily: F.bold, color: '#ffb703', fontSize: 12 }}>42% • PREVENTIVO</Text>
                </View>
                <View style={[styles.mockTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <View style={[styles.mockFill, { width: '42%', backgroundColor: '#ffb703' }]} />
                </View>
              </View>

              <View style={styles.mockBarRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: F.semibold, color: T.textPrimary, fontSize: 13 }}>Cadena de Transmisión</Text>
                  <Text style={{ fontFamily: F.bold, color: '#ba1a1a', fontSize: 12 }}>18% • CRÍTICO</Text>
                </View>
                <View style={[styles.mockTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <View style={[styles.mockFill, { width: '18%', backgroundColor: '#ba1a1a' }]} />
                </View>
              </View>

              <View style={[styles.mockCardFooter, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' }]}>
                <MaterialIcons name="lightbulb" size={16} color="#ffb703" />
                <Text style={{ fontFamily: F.medium, color: T.textSecondary, fontSize: 11.5, flex: 1, lineHeight: 16 }}>
                  Sugerencia: Tensa y lubrica la cadena cada 500 km para prevenir el desgaste prematuro de la catalina.
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* ========================================================================= */}
        {/* FEATURE 2: BILLETERA DIGITAL & CARNET VIRTUAL */}
        {/* ========================================================================= */}
        <View style={[styles.featureSection, { backgroundColor: T.heroBg, borderBottomColor: T.borderHairline }]}>
          <View style={[styles.featureContentRow, { flexDirection: isDesktop ? 'row-reverse' : 'column' }]}>
            
            {/* TEXT INFO */}
            <View style={{ flex: 1, paddingLeft: isDesktop ? 40 : 0 }}>
              <View style={[styles.featureCategoryBadge, { borderColor: 'rgba(65, 105, 225, 0.4)' }]}>
                <MaterialIcons name="account-balance-wallet" size={14} color={T.accentBlue} />
                <Text style={[styles.featureCategoryBadgeText, { color: T.accentBlue }]}>DIGITAL WALLET</Text>
              </View>

              <Text style={[styles.featureTitle, { color: T.textPrimary }]}>
                Todos tus documentos al día y con código QR
              </Text>
              
              <Text style={[styles.featureDescription, { color: T.textSecondary }]}>
                Lleva el carnet de circulación, póliza de RCV, licencia de conducir, certificado médico y cédula digitalizados en tu teléfono con visualizador de fotos y contador de vencimiento.
              </Text>

              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={[styles.bulletText, { color: T.textPrimary }]}>Alertas inteligentes 30 y 15 días antes del vencimiento</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={[styles.bulletText, { color: T.textPrimary }]}>Visualizador ampliado con zoom y descarga de fotos</Text>
                </View>
                <View style={styles.bulletItem}>
                  <MaterialIcons name="check-circle" size={18} color="#00ae78" />
                  <Text style={[styles.bulletText, { color: T.textPrimary }]}>Respaldo seguro en la nube con Supabase</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onEnter}
                style={[styles.featureActionBtn, { borderColor: T.accentBlue }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.featureActionBtnText, { color: T.accentBlue }]}>
                  VER BILLETERA DIGITAL
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color={T.accentBlue} />
              </TouchableOpacity>
            </View>

            {/* PREVIEW CARD: DIGITAL WALLET */}
            <View style={[
              styles.featureCardPreview, 
              { 
                flex: 1, 
                marginTop: isDesktop ? 0 : 28,
                backgroundColor: T.cardBg,
                borderColor: T.borderHairline,
              }
            ]}>
              <View style={[
                styles.walletCardMock,
                {
                  backgroundColor: isDark ? '#1b2230' : '#f0f4fa',
                  borderColor: isDark ? 'rgba(65, 105, 225, 0.35)' : 'rgba(39, 95, 227, 0.25)',
                }
              ]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#00e3fd" />
                    <Text style={{ fontFamily: F.bold, color: T.textPrimary, fontSize: 13, letterSpacing: 0.5 }}>
                      REPÚBLICA BOLIVARIANA DE VENEZUELA
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#00ae78', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontFamily: F.bold, color: '#ffffff', fontSize: 9 }}>VIGENTE</Text>
                  </View>
                </View>

                <View style={{ marginVertical: 14 }}>
                  <Text style={{ fontFamily: F.medium, color: T.textSecondary, fontSize: 11 }}>DOCUMENTO OFICIAL</Text>
                  <Text style={{ fontFamily: F.extrabold, color: T.textPrimary, fontSize: 17, marginTop: 2 }}>
                    CERTIFICADO DE CIRCULACIÓN
                  </Text>
                  <Text style={{ fontFamily: F.bold, color: T.accentBlue, fontSize: 13, marginTop: 4 }}>
                    PLACA: AB1C23D • SERIAL: EK150-84920
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.8, borderTopColor: T.borderHairline, paddingTop: 10 }}>
                  <View>
                    <Text style={{ fontFamily: F.medium, color: T.textSecondary, fontSize: 10 }}>TITULAR</Text>
                    <Text style={{ fontFamily: F.bold, color: T.textPrimary, fontSize: 12 }}>##### #####</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: F.medium, color: T.textSecondary, fontSize: 10 }}>VENCIMIENTO</Text>
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
        <View style={[styles.finalCtaSection, { backgroundColor: isDark ? '#0a0d13' : '#eef3fa' }]}>
          <View style={styles.finalCtaGlow} pointerEvents="none" />
          <Text style={styles.finalCtaBadge}>GARAGE PILOT EXPERIENCE</Text>
          <Text style={[styles.finalCtaTitle, { color: T.textPrimary }]}>
            Toma el control absoluto de tu máquina hoy
          </Text>
          <Text style={[styles.finalCtaSubtitle, { color: T.textSecondary }]}>
            Crea tu cuenta de piloto gratis y comienza a monitorear telemetría, documentos y mantenimientos con precisión milimétrica.
          </Text>

          <TouchableOpacity
            onPress={onEnter}
            style={[styles.finalCtaBtn, { backgroundColor: T.accentBlue }]}
            activeOpacity={0.85}
          >
            <Text style={styles.finalCtaBtnText}>
              {isLoggedIn ? 'IR A MI GARAJE' : 'CREAR CUENTA GRATIS'}
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* EXPANDED FOOTER WITH LEGAL LINKS & POLICIES */}
        {/* ========================================================================= */}
        <View style={[styles.footerContainer, { backgroundColor: T.footerBg, borderTopColor: T.borderHairline }]}>
          <View style={styles.footerInner}>
            
            {/* FOOTER TOP GRID: 3 COLUMNS */}
            <View style={styles.footerGrid}>
              
              {/* COLUMN 1: BRAND IDENTITY & DESCRIPTION */}
              <View style={styles.footerColBrand}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={styles.brandIconCircle}>
                    <MaterialCommunityIcons name="engine" size={20} color="#00e3fd" />
                  </View>
                  <View>
                    <Text style={[styles.brandLogoText, { color: T.textPrimary, fontSize: 17 }]}>GARAGE</Text>
                    <Text style={styles.brandSubLogoText}>MOTO OS • V1.0</Text>
                  </View>
                </View>
                <Text style={[styles.footerDescText, { color: T.textSecondary }]}>
                  El sistema operativo integral para motociclistas. Telemetría de desgaste, ficha técnica oficial, billetera digital blindada y gestión inteligente de servicios.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ae78' }} />
                  <Text style={{ fontFamily: F.semibold, fontSize: 11, color: '#00ae78' }}>
                    SISTEMA ACTIVO Y OPERATIVO
                  </Text>
                </View>
              </View>

              {/* COLUMN 2: PLATFORM NAVIGATION */}
              <View style={styles.footerColLinks}>
                <Text style={[styles.footerSectionTitle, { color: T.textPrimary }]}>
                  PLATAFORMA
                </Text>
                <TouchableOpacity onPress={() => scrollToSection(0)} style={styles.footerLinkRow}>
                  <Text style={[styles.footerLinkText, { color: T.textSecondary }]}>Inicio & Modelos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection(windowHeight * 0.95)} style={styles.footerLinkRow}>
                  <Text style={[styles.footerLinkText, { color: T.textSecondary }]}>Telemetría en Vivo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (onOpenSpecs) onOpenSpecs(); else scrollToSection(windowHeight * 1.6); }} style={styles.footerLinkRow}>
                  <Text style={[styles.footerLinkText, { color: T.textSecondary }]}>Ficha Técnica de Motos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (onOpenWallet) onOpenWallet(); else scrollToSection(windowHeight * 2.2); }} style={styles.footerLinkRow}>
                  <Text style={[styles.footerLinkText, { color: T.textSecondary }]}>Billetera Digital Vial</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowTutorial(true)} style={styles.footerLinkRow}>
                  <Text style={[styles.footerLinkText, { color: T.accentBlue, fontFamily: F.semibold }]}>Tutorial & Guía del Piloto</Text>
                </TouchableOpacity>
              </View>

              {/* COLUMN 3: MARCO LEGAL & POLÍTICAS (REQUERIDO) */}
              <View style={styles.footerColLinks}>
                <Text style={[styles.footerSectionTitle, { color: T.textPrimary }]}>
                  MARCO LEGAL & PRIVACIDAD
                </Text>
                
                {/* 1. TÉRMINOS Y CONDICIONES */}
                <TouchableOpacity 
                  onPress={() => openLegal('terms')} 
                  style={styles.footerLinkRow}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="description" size={15} color={T.accentBlue} style={{ marginRight: 6 }} />
                  <Text style={[styles.footerLinkText, { color: T.textPrimary, fontFamily: F.semibold }]}>
                    Términos y Condiciones de Uso
                  </Text>
                </TouchableOpacity>

                {/* 2. POLÍTICA DE PRIVACIDAD */}
                <TouchableOpacity 
                  onPress={() => openLegal('privacy')} 
                  style={styles.footerLinkRow}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="security" size={15} color={T.accentBlue} style={{ marginRight: 6 }} />
                  <Text style={[styles.footerLinkText, { color: T.textPrimary, fontFamily: F.semibold }]}>
                    Política de Privacidad y Datos
                  </Text>
                </TouchableOpacity>

                {/* 3. POLÍTICA DE COOKIES */}
                <TouchableOpacity 
                  onPress={() => openLegal('cookies')} 
                  style={styles.footerLinkRow}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="cookie-outline" size={15} color={T.accentBlue} style={{ marginRight: 6 }} />
                  <Text style={[styles.footerLinkText, { color: T.textPrimary, fontFamily: F.semibold }]}>
                    Política de Cookies y Almacenamiento
                  </Text>
                </TouchableOpacity>

                {/* AVISO LEGAL */}
                <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' }}>
                  <Text style={{ fontFamily: F.regular, fontSize: 11, color: T.textSecondary, lineHeight: 15 }}>
                    Cumplimiento de estándares de protección de datos personales y seguridad vehicular.
                  </Text>
                </View>
              </View>

            </View>

            {/* FOOTER BOTTOM BAR: COPYRIGHT & SOCIAL */}
            <View style={[styles.footerBottomBar, { borderTopColor: T.borderHairline }]}>
              <Text style={[styles.footerCopyrightText, { color: T.textMuted }]}>
                © {new Date().getFullYear()} GARAGE Inc. Todos los derechos reservados.
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <TouchableOpacity onPress={() => openLegal('terms')}>
                  <Text style={[styles.footerSubLegalText, { color: T.textSecondary }]}>Términos</Text>
                </TouchableOpacity>
                <Text style={{ color: T.borderHairline }}>•</Text>
                <TouchableOpacity onPress={() => openLegal('privacy')}>
                  <Text style={[styles.footerSubLegalText, { color: T.textSecondary }]}>Privacidad</Text>
                </TouchableOpacity>
                <Text style={{ color: T.borderHairline }}>•</Text>
                <TouchableOpacity onPress={() => openLegal('cookies')}>
                  <Text style={[styles.footerSubLegalText, { color: T.textSecondary }]}>Cookies</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>

      {/* MODAL: DOCUMENTOS LEGALES (TÉRMINOS, PRIVACIDAD, COOKIES) */}
      <LegalDocModal
        visible={showLegalModal}
        initialDoc={selectedLegalDoc}
        onClose={() => setShowLegalModal(false)}
      />

      {/* MODAL: TUTORIAL Y GUÍA DEL CONDUCTOR */}
      <TutorialModal
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  atmosphericSkyLayer: {
    ...StyleSheet.absoluteFill as any,
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
    transform: [{ rotate: '45deg' }],
    borderRadius: 40,
  },
  mountainMainPeak: {
    position: 'absolute',
    bottom: -80,
    left: '42%',
    width: 720,
    height: 440,
    transform: [{ rotate: '45deg' }],
    borderRadius: 50,
  },
  mountainRightPeak: {
    position: 'absolute',
    bottom: -70,
    right: '5%',
    width: 550,
    height: 340,
    transform: [{ rotate: '45deg' }],
    borderRadius: 40,
  },
  groundMistGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    ...(Platform.OS === 'web' ? { filter: 'blur(40px)' } : {}),
  } as any,
  radialCockpitLight: {
    position: 'absolute',
    top: '32%',
    left: '30%',
    width: 500,
    height: 400,
    borderRadius: 250,
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
    fontSize: 13,
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
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  navActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
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
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  heroSubQuoteText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12.5,
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
    borderWidth: 1.5,
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
  } as any,
  heroPillBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
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
    borderWidth: 0.8,
  },
  sliderCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sliderCounterText: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    letterSpacing: 1,
  },
  activeModelTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 0.8,
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
    borderWidth: 0.8,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
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
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  featureSection: {
    paddingVertical: 70,
    paddingHorizontal: 32,
    borderBottomWidth: 0.8,
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
    lineHeight: 38,
    marginBottom: 14,
  },
  featureDescription: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
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
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  telemetryMockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 0.8,
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
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  walletCardMock: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  finalCtaSection: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: 90,
    paddingHorizontal: 24,
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
    textAlign: 'center',
    maxWidth: 680,
    lineHeight: 42,
    marginBottom: 14,
  },
  finalCtaSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 580,
    lineHeight: 22,
    marginBottom: 28,
  },
  finalCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 34,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
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
    paddingVertical: 48,
    paddingHorizontal: 32,
    borderTopWidth: 0.8,
  },
  footerInner: {
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 32,
    marginBottom: 36,
  },
  footerColBrand: {
    flex: 1.4,
    minWidth: 260,
  },
  footerColLinks: {
    flex: 1,
    minWidth: 200,
  },
  footerDescText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 380,
  },
  footerSectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  footerLinkText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
  },
  footerBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 0.8,
    flexWrap: 'wrap',
    gap: 12,
  },
  footerCopyrightText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
  },
  footerSubLegalText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
});
