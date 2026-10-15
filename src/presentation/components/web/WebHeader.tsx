import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useMyMoto } from '../../context/MotoContext';
import { supabase } from '../../../data/supabaseClient';

interface WebHeaderProps {
  activeTab: 'moto' | 'specs' | 'services' | 'wallet' | 'history' | 'profile';
  onSelectTab: (tab: 'moto' | 'specs' | 'services' | 'wallet' | 'history' | 'profile') => void;
  onOpenQuickOdo: () => void;
  onOpenQuickFuel: () => void;
  onOpenSOS: () => void;
}

export const WebHeader: React.FC<WebHeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickOdo,
  onOpenQuickFuel,
  onOpenSOS,
}) => {
  const { colors, mode, toggleTheme } = useTheme();
  const { myMoto, motos, selectMoto, setIsAddingMoto } = useMyMoto();
  const [motoMenuVisible, setMotoMenuVisible] = useState(false);
  const { width } = useWindowDimensions();

  const isWide = width >= 1340;
  const isMedium = width >= 1100 && width < 1340;
  const isCompact = width < 1100;

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
      label: isWide ? 'VEHÍCULO' : (isMedium ? 'Vehículo' : 'Moto'), 
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
      label: isWide ? 'SERVICIOS' : (isMedium ? 'Servicios' : 'Serv.'), 
      icon: 'build', 
      iconFamily: 'material' as const 
    },
    { 
      id: 'history' as const, 
      label: isWide ? 'HISTORIAL' : (isMedium ? 'Historial' : 'Hist.'), 
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
    <View style={{ width: '100%', position: Platform.OS === 'web' ? ('sticky' as any) : 'relative', top: 0, zIndex: 100 }}>
      <View style={[
        styles.headerContainer, 
        { 
          backgroundColor: isDark ? 'rgba(17, 19, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
          borderBottomColor: isDark ? 'rgba(64, 72, 92, 0.35)' : 'rgba(0, 0, 0, 0.08)',
          paddingHorizontal: isWide ? 24 : (isMedium ? 16 : 10),
        }
      ]}>
        
        {/* LEFT: BRAND & MOTO SWITCHER */}
        <View style={[styles.leftGroup, { gap: isWide ? 14 : 8, flexShrink: 0 }]}>
          <TouchableOpacity 
            style={styles.logoRow} 
            activeOpacity={0.8}
            onPress={() => onSelectTab('moto')}
          >
            <View style={[styles.logoBadge, isCompact && { width: 30, height: 30, borderRadius: 15 }]}>
              <MaterialCommunityIcons name="engine" size={isCompact ? 17 : 20} color="#00e3fd" />
            </View>
            <Text style={[
              styles.brandText, 
              { 
                color: isDark ? '#ffffff' : '#111319',
                fontSize: isCompact ? 18 : 22,
                letterSpacing: isCompact ? 1.5 : 2,
              }
            ]}>
              GARAGE
            </Text>
            <View style={[styles.brandAccentDot, isCompact && { marginTop: 8 }]} />
          </TouchableOpacity>

          {/* MOTO SELECTOR PILL */}
          {myMoto && (
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={[styles.motoSelectorPill, { 
                  backgroundColor: isDark ? 'rgba(29, 32, 37, 0.9)' : '#ececf0',
                  borderColor: isDark ? '#40485c' : '#d0d4dc',
                  maxWidth: isWide ? 200 : (isMedium ? 150 : 120),
                  paddingHorizontal: isCompact ? 8 : 10,
                }]}
                onPress={() => setMotoMenuVisible(!motoMenuVisible)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="two-wheeler" size={15} color="#4169E1" style={{ marginRight: 4 }} />
                <Text style={[styles.motoSelectorText, { color: colors.onSurface }]} numberOfLines={1}>
                  {isCompact ? myMoto.model : `${myMoto.brand} ${myMoto.model}`}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* DROPDOWN MENU */}
              {motoMenuVisible && (
                <View style={[styles.dropdownMenu, { 
                  backgroundColor: isDark ? '#191c21' : '#ffffff',
                  borderColor: isDark ? '#40485c' : '#e0e0e6',
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }]}>
                  <Text style={[styles.dropdownTitle, { color: colors.onSurfaceVariant }]}>TUS MOTOS</Text>
                  <ScrollView style={{ maxHeight: 220 }}>
                    {motos.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.dropdownItem,
                          m.id === myMoto.id && { backgroundColor: isDark ? 'rgba(65, 105, 225, 0.18)' : 'rgba(39, 95, 227, 0.12)' }
                        ]}
                        onPress={() => {
                          selectMoto(m.id);
                          setMotoMenuVisible(false);
                        }}
                      >
                        <MaterialIcons 
                          name="two-wheeler" 
                          size={16} 
                          color={m.id === myMoto.id ? '#4169E1' : colors.onSurfaceVariant} 
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[styles.dropdownItemText, { 
                            color: m.id === myMoto.id ? '#4169E1' : colors.onSurface,
                            fontFamily: m.id === myMoto.id ? F.bold : F.medium
                          }]}>
                            {m.brand} {m.model}
                          </Text>
                          <Text style={[styles.dropdownItemSub, { color: colors.onSurfaceVariant }]}>
                            {m.currentOdometer.toLocaleString()} km
                          </Text>
                        </View>
                        {m.id === myMoto.id && (
                          <MaterialIcons name="check" size={16} color="#4169E1" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <TouchableOpacity
                    style={[styles.addNewMotoBtn, { borderTopColor: isDark ? '#272a30' : '#ececf0' }]}
                    onPress={() => {
                      setMotoMenuVisible(false);
                      setIsAddingMoto(true);
                    }}
                  >
                    <MaterialIcons name="add" size={18} color="#00e3fd" />
                    <Text style={styles.addNewMotoText}>Añadir nueva moto</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* CENTER: DESKTOP NAVIGATION TABS (Scrollable & Flex-friendly) */}
        <View style={styles.centerNavContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.centerNavScroll,
              {
                gap: isWide ? 8 : (isMedium ? 5 : 4),
              }
            ]}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectTab(item.id)}
                  style={[
                    styles.navLink,
                    {
                      paddingVertical: isWide ? 7 : (isMedium ? 6 : 5),
                      paddingHorizontal: isWide ? 12 : (isMedium ? 9 : 7),
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
                      fontSize: isWide ? 11.5 : (isMedium ? 10.5 : 10),
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
          </ScrollView>
        </View>

        {/* RIGHT: ACTIONS & USER */}
        <View style={[styles.rightGroup, { gap: isWide ? 8 : 6, flexShrink: 0 }]}>
          
          {/* THEME TOGGLE */}
          <TouchableOpacity
            style={[styles.iconButton, { 
              borderColor: isDark ? '#40485c' : '#d0d4dc',
              width: isCompact ? 32 : 36,
              height: isCompact ? 32 : 36,
              borderRadius: isCompact ? 16 : 18,
            }]}
            onPress={toggleTheme}
            accessibilityLabel={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            <MaterialIcons 
              name={isDark ? 'wb-sunny' : 'nightlight-round'} 
              size={isCompact ? 16 : 18} 
              color={isDark ? '#ffb703' : '#4169E1'} 
            />
          </TouchableOpacity>

          {/* SOS EMERGENCY BUTTON */}
          <TouchableOpacity
            style={[
              styles.sosButton,
              isCompact && { paddingHorizontal: 8, paddingVertical: 5 }
            ]}
            onPress={onOpenSOS}
            activeOpacity={0.8}
            accessibilityLabel="Emergencia SOS"
          >
            <MaterialIcons name="warning" size={15} color="#ffb4ab" />
            {width >= 1050 && <Text style={styles.sosText}>SOS</Text>}
          </TouchableOpacity>

          {/* QUICK LOG BUTTON */}
          <TouchableOpacity
            style={[
              styles.quickAddButton,
              isCompact && { paddingHorizontal: 8, paddingVertical: 5 }
            ]}
            onPress={onOpenQuickOdo}
            activeOpacity={0.8}
            accessibilityLabel="Actualizar kilometraje"
          >
            <MaterialIcons name="speed" size={15} color="#ffffff" />
            {width >= 1050 && <Text style={styles.quickAddText}>+ KM</Text>}
          </TouchableOpacity>

          {/* FUEL LOG BUTTON */}
          <TouchableOpacity
            style={[
              styles.fuelButton,
              isCompact && { paddingHorizontal: 8, paddingVertical: 5 }
            ]}
            onPress={onOpenQuickFuel}
            activeOpacity={0.8}
            accessibilityLabel="Registrar gasolina"
          >
            <MaterialCommunityIcons name="gas-station" size={15} color="#00e3fd" />
            {width >= 1050 && <Text style={styles.fuelText}>+ GAS</Text>}
          </TouchableOpacity>

          {/* SIGN OUT */}
          <TouchableOpacity
            style={[styles.iconButton, { 
              borderColor: isDark ? '#40485c' : '#d0d4dc',
              width: isCompact ? 32 : 36,
              height: isCompact ? 32 : 36,
              borderRadius: isCompact ? 16 : 18,
            }]}
            onPress={handleSignOut}
            accessibilityLabel="Cerrar sesión"
          >
            <MaterialIcons name="logout" size={isCompact ? 15 : 17} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

      </View>
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
    overflow: 'hidden',
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
    top: 42,
    left: 0,
    width: 250,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    zIndex: 999,
  },
  dropdownTitle: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontSize: 12,
  },
  dropdownItemSub: {
    fontSize: 10,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 2,
  },
  addNewMotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  addNewMotoText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#00e3fd',
  },
  centerNavContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  centerNavScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.25)',
    borderColor: '#ffb4ab',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  sosText: {
    color: '#ffb4ab',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4169E1',
    paddingVertical: 6,
    paddingHorizontal: 11,
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
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  fuelText: {
    color: '#00e3fd',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
});
