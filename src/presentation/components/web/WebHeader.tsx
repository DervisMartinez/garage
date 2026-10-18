import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useMyMoto } from '../../context/MotoContext';
import { supabase } from '../../../data/supabaseClient';

interface WebHeaderProps {
  activeTab: 'moto' | 'specs' | 'services' | 'wallet' | 'history' | 'profile';
  onSelectTab: (tab: 'moto' | 'specs' | 'services' | 'wallet' | 'history' | 'profile') => void;
  onOpenQuickOdo: () => void;
  onOpenQuickFuel: () => void;
  onOpenSOS?: () => void;
}

export const WebHeader: React.FC<WebHeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickOdo,
  onOpenQuickFuel,
}) => {
  const { colors, mode, toggleTheme } = useTheme();
  const { myMoto, motos, selectMoto, setIsAddingMoto } = useMyMoto();
  const [motoMenuVisible, setMotoMenuVisible] = useState(false);
  const { width } = useWindowDimensions();

  const isWide = width >= 1280;
  const isMedium = width >= 1180 && width < 1280;
  const isMobileWeb = width < 1180;
  const isSmallPhone = width < 480;

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  const isDark = mode === 'dark';

  const navItems = [
    { 
      id: 'moto' as const, 
      label: isWide ? 'VEHÍCULO' : 'Vehículo', 
      icon: 'engine', 
      iconFamily: 'community' as const 
    },
    { 
      id: 'specs' as const, 
      label: isWide ? 'FICHA TÉCNICA' : 'Ficha', 
      icon: 'description', 
      iconFamily: 'material' as const 
    },
    { 
      id: 'services' as const, 
      label: isWide ? 'SERVICIOS' : 'Servicios', 
      icon: 'build', 
      iconFamily: 'material' as const 
    },
    { 
      id: 'history' as const, 
      label: isWide ? 'HISTORIAL' : 'Historial', 
      icon: 'receipt-long', 
      iconFamily: 'material' as const 
    },
    { 
      id: 'wallet' as const, 
      label: 'WALLET', 
      icon: 'account-balance-wallet', 
      iconFamily: 'material' as const 
    },
    { 
      id: 'profile' as const, 
      label: isWide ? 'PERFIL' : 'Perfil', 
      icon: 'person', 
      iconFamily: 'material' as const 
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={{ width: '100%', position: Platform.OS === 'web' ? ('sticky' as any) : 'relative', top: 0, zIndex: 1000 }}>
      {/* FIXED TRANSPARENT BACKDROP FOR MOTO DROPDOWN */}
      {motoMenuVisible && (
        <TouchableOpacity 
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setMotoMenuVisible(false)}
        />
      )}

      {/* MAIN TOP NAVIGATION BAR */}
      <View style={[
        styles.headerContainer, 
        { 
          backgroundColor: isDark ? 'rgba(17, 19, 25, 0.97)' : 'rgba(255, 255, 255, 0.97)', 
          borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.35)' : 'rgba(0, 0, 0, 0.08)',
          paddingHorizontal: isWide ? 24 : (isMedium ? 16 : 12),
        }
      ]}>
        
        {/* LEFT: BRAND & MOTO SWITCHER */}
        <View style={[styles.leftGroup, { gap: isWide ? 14 : 10, marginRight: 14, flexShrink: 0 }]}>
          <TouchableOpacity 
            style={styles.logoRow} 
            activeOpacity={0.8}
            onPress={() => onSelectTab('moto')}
          >
            <View style={[styles.logoBadge, isSmallPhone && { width: 30, height: 30, borderRadius: 15 }]}>
              <MaterialCommunityIcons name="engine" size={isSmallPhone ? 17 : 20} color="#00e3fd" />
            </View>
            <Text style={[
              styles.brandText, 
              { 
                color: isDark ? '#ffffff' : '#111319',
                fontSize: isSmallPhone ? 18 : 22,
                letterSpacing: isSmallPhone ? 1.5 : 2,
              }
            ]}>
              GARAGE
            </Text>
            <View style={[styles.brandAccentDot, isSmallPhone && { marginTop: 8 }]} />
          </TouchableOpacity>

          {/* MOTO SELECTOR PILL & FLOATING DROPDOWN */}
          {myMoto && (
            <View style={{ position: 'relative', zIndex: 99999 }}>
              <TouchableOpacity
                style={[styles.motoSelectorPill, { 
                  backgroundColor: isDark ? 'rgba(29, 32, 37, 0.9)' : '#ececf0',
                  borderColor: motoMenuVisible ? '#00e3fd' : (isDark ? '#40485c' : '#d0d4dc'),
                  maxWidth: isWide ? 220 : (isSmallPhone ? 120 : 175),
                  paddingHorizontal: 10,
                }]}
                onPress={() => setMotoMenuVisible(!motoMenuVisible)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="two-wheeler" size={15} color="#4169E1" style={{ marginRight: 4 }} />
                <Text style={[styles.motoSelectorText, { color: colors.onSurface }]} numberOfLines={1}>
                  {isSmallPhone ? myMoto.model : `${myMoto.brand} ${myMoto.model}`}
                </Text>
                <MaterialIcons 
                  name={motoMenuVisible ? "arrow-drop-up" : "arrow-drop-down"} 
                  size={16} 
                  color={colors.onSurfaceVariant} 
                />
              </TouchableOpacity>

              {/* DROPDOWN MENU */}
              {motoMenuVisible && (
                <View style={[styles.dropdownMenu, { 
                  backgroundColor: isDark ? '#191c21' : '#ffffff',
                  borderColor: isDark ? 'rgba(0, 227, 253, 0.4)' : '#d0d4dc',
                  width: isSmallPhone ? 260 : 290,
                }]}>
                  <View style={styles.dropdownHeaderRow}>
                    <Text style={[styles.dropdownTitle, { color: colors.onSurfaceVariant }]}>
                      TUS VEHÍCULOS ({motos.length})
                    </Text>
                  </View>

                  <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={true}>
                    {motos.map((m) => {
                      const isCurrent = m.id === myMoto.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.dropdownItem,
                            isCurrent && { 
                              backgroundColor: isDark ? 'rgba(65, 105, 225, 0.2)' : 'rgba(39, 95, 227, 0.12)',
                              borderLeftColor: '#4169E1',
                              borderLeftWidth: 3,
                            }
                          ]}
                          onPress={() => {
                            selectMoto(m.id);
                            setMotoMenuVisible(false);
                          }}
                        >
                          <MaterialIcons 
                            name="two-wheeler" 
                            size={18} 
                            color={isCurrent ? '#00e3fd' : colors.onSurfaceVariant} 
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.dropdownItemText, { 
                              color: isCurrent ? (isDark ? '#ffffff' : '#275FE3') : colors.onSurface,
                              fontFamily: isCurrent ? F.bold : F.semibold
                            }]}>
                              {m.brand} {m.model}
                            </Text>
                            <Text style={[styles.dropdownItemSub, { color: colors.onSurfaceVariant }]}>
                              {m.currentOdometer.toLocaleString()} km {m.year ? `• Año ${m.year}` : ''}
                            </Text>
                          </View>
                          {isCurrent && (
                            <MaterialIcons name="check-circle" size={18} color="#00e3fd" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  
                  {/* BOTÓN PROMINENTE: ANEXAR OTRO VEHÍCULO */}
                  <TouchableOpacity
                    style={[styles.addNewMotoBtn, { 
                      backgroundColor: isDark ? 'rgba(0, 227, 253, 0.1)' : 'rgba(0, 174, 120, 0.1)',
                      borderColor: '#00e3fd',
                    }]}
                    onPress={() => {
                      setMotoMenuVisible(false);
                      setIsAddingMoto(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="add-circle" size={19} color="#00e3fd" />
                    <Text style={styles.addNewMotoText}>Añadir nuevo vehículo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* CENTER: DESKTOP NAVIGATION TABS (visible >= 1180px) */}
        {!isMobileWeb && (
          <View style={styles.centerNavContainer}>
            <View style={styles.centerNavScroll}>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onSelectTab(item.id)}
                    style={[
                      styles.navLink,
                      {
                        paddingVertical: 7,
                        paddingHorizontal: isWide ? 12 : 9,
                      },
                      isActive && {
                        backgroundColor: isDark ? 'rgba(65, 105, 225, 0.18)' : 'rgba(39, 95, 227, 0.12)',
                        borderColor: '#4169E1',
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    {item.iconFamily === 'community' ? (
                      <MaterialCommunityIcons 
                        name={item.icon as any} 
                        size={isWide ? 16 : 14} 
                        color={isActive ? '#00e3fd' : colors.onSurfaceVariant} 
                      />
                    ) : (
                      <MaterialIcons 
                        name={item.icon as any} 
                        size={isWide ? 16 : 14} 
                        color={isActive ? '#00e3fd' : colors.onSurfaceVariant} 
                      />
                    )}
                    <Text style={[
                      styles.navLabel, 
                      { 
                        fontSize: isWide ? 11.5 : 10.5,
                        color: isActive ? (isDark ? '#ffffff' : '#275FE3') : colors.onSurfaceVariant,
                        fontFamily: isActive ? F.bold : F.medium,
                      }
                    ]}>
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.navActiveDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* RIGHT: ACTIONS & USER */}
        <View style={[styles.rightGroup, { gap: isWide ? 8 : 6, flexShrink: 0 }]}>
          
          {/* THEME TOGGLE */}
          <TouchableOpacity
            style={[styles.iconButton, { 
              borderColor: isDark ? '#40485c' : '#d0d4dc',
              width: 34,
              height: 34,
              borderRadius: 17,
            }]}
            onPress={toggleTheme}
            accessibilityLabel={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            <MaterialIcons 
              name={isDark ? 'wb-sunny' : 'nightlight-round'} 
              size={17} 
              color={isDark ? '#ffb703' : '#4169E1'} 
            />
          </TouchableOpacity>

          {/* QUICK LOG BUTTON (+ KM) */}
          <TouchableOpacity
            style={[
              styles.quickAddButton,
              isMobileWeb && { paddingHorizontal: 9, paddingVertical: 5 }
            ]}
            onPress={onOpenQuickOdo}
            activeOpacity={0.8}
            accessibilityLabel="Actualizar kilometraje"
          >
            <MaterialIcons name="speed" size={15} color="#ffffff" />
            <Text style={styles.quickAddText}>{isSmallPhone ? 'KM' : '+ KM'}</Text>
          </TouchableOpacity>

          {/* FUEL LOG BUTTON (+ GAS) */}
          <TouchableOpacity
            style={[
              styles.fuelButton,
              isMobileWeb && { paddingHorizontal: 9, paddingVertical: 5 }
            ]}
            onPress={onOpenQuickFuel}
            activeOpacity={0.8}
            accessibilityLabel="Registrar gasolina"
          >
            <MaterialCommunityIcons name="gas-station" size={15} color="#00e3fd" />
            <Text style={styles.fuelText}>{isSmallPhone ? 'GAS' : '+ GAS'}</Text>
          </TouchableOpacity>

          {/* SIGN OUT */}
          <TouchableOpacity
            style={[styles.iconButton, { 
              borderColor: isDark ? '#40485c' : '#d0d4dc',
              width: 34,
              height: 34,
              borderRadius: 17,
            }]}
            onPress={handleSignOut}
            accessibilityLabel="Cerrar sesión"
          >
            <MaterialIcons name="logout" size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

      </View>

      {/* RESPONSIVE MOBILE WEB HORIZONTAL SUB-NAVIGATION (< 900px) */}
      {isMobileWeb && (
        <View style={[
          styles.mobileSubNav,
          { 
            backgroundColor: isDark ? 'rgba(21, 24, 32, 0.98)' : 'rgba(245, 247, 250, 0.98)',
            borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.35)' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mobileSubNavScroll}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectTab(item.id)}
                  style={[
                    styles.mobileNavChip,
                    {
                      backgroundColor: isActive 
                        ? (isDark ? 'rgba(65, 105, 225, 0.22)' : 'rgba(39, 95, 227, 0.12)') 
                        : (isDark ? 'rgba(35, 40, 52, 0.5)' : 'rgba(230, 235, 245, 0.7)'),
                      borderColor: isActive ? '#00e3fd' : (isDark ? 'rgba(64, 72, 92, 0.3)' : 'rgba(0, 0, 0, 0.08)'),
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  {item.iconFamily === 'community' ? (
                    <MaterialCommunityIcons 
                      name={item.icon as any} 
                      size={14} 
                      color={isActive ? '#00e3fd' : colors.onSurfaceVariant} 
                    />
                  ) : (
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={14} 
                      color={isActive ? '#00e3fd' : colors.onSurfaceVariant} 
                    />
                  )}
                  <Text style={[
                    styles.mobileNavChipText,
                    {
                      color: isActive ? (isDark ? '#ffffff' : '#275FE3') : colors.onSurfaceVariant,
                      fontFamily: isActive ? F.bold : F.semibold,
                    }
                  ]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.navActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    overflow: 'visible', // Permite que el menú desplegable sea visible
    position: 'relative',
    zIndex: 1000,
  },
  dropdownBackdrop: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99990,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 227, 253, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 227, 253, 0.3)',
  },
  brandText: {
    fontSize: 22,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: 2,
  },
  brandAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4169E1',
    marginLeft: -4,
    marginTop: 10,
  },
  motoSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  motoSelectorText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
    marginRight: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    zIndex: 99999,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
  },
  dropdownHeaderRow: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(64, 72, 92, 0.25)',
  },
  dropdownTitle: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  dropdownItemText: {
    fontSize: 12.5,
  },
  dropdownItemSub: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 2,
  },
  addNewMotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  addNewMotoText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#00e3fd',
    letterSpacing: 0.3,
  },
  centerNavContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 14,
  },
  centerNavScroll: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navLabel: {
    letterSpacing: 0.8,
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00e3fd',
    marginLeft: 2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4169E1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#4169E1',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  quickAddText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  fuelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 227, 253, 0.15)',
    borderColor: 'rgba(0, 227, 253, 0.4)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 16,
    gap: 4,
  },
  fuelText: {
    color: '#00e3fd',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  mobileSubNav: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  mobileSubNavScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  mobileNavChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  mobileNavChipText: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
