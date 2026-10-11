import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Animated, 
  Dimensions,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';
import { DashboardTab } from './tabs/DashboardTab';
import { ProfileTab } from './tabs/ProfileTab';
import { HistoryTab } from './tabs/HistoryTab';
import { ServicesTab } from './tabs/ServicesTab';
import { WalletTab } from './tabs/WalletTab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MainApp = () => {
  const { colors, mode } = useTheme();
  const { myMoto, updateMoto, addRecord } = useMyMoto();
  const [activeTab, setActiveTab] = useState<'moto' | 'services' | 'wallet' | 'history' | 'profile'>('moto');
  const insets = useSafeAreaInsets();

  // Quick Action Sheet state
  const [quickActionVisible, setQuickActionVisible] = useState(false);
  const [quickOdoVisible, setQuickOdoVisible] = useState(false);
  const [quickFuelVisible, setQuickFuelVisible] = useState(false);
  const [newOdoInput, setNewOdoInput] = useState('');
  const [fuelLitersInput, setFuelLitersInput] = useState('');
  const [fuelUsdInput, setFuelUsdInput] = useState('');

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
  };

  // 5 Main Tabs flanking the Central [+] Quick Add Button
  const tabs = [
    { id: 'moto' as const, icon: 'engine', iconFamily: 'community' as const, label: 'Vehículo' },
    { id: 'services' as const, icon: 'build', iconFamily: 'material' as const, label: 'Servicios' },
    // Center [+] is rendered independently in the middle
    { id: 'history' as const, icon: 'receipt-long', iconFamily: 'material' as const, label: 'Historial' },
    { id: 'wallet' as const, icon: 'account-balance-wallet', iconFamily: 'material' as const, label: 'Wallet' },
    { id: 'profile' as const, icon: 'person', iconFamily: 'material' as const, label: 'Perfil' },
  ];

  // Animated values for raised bubble effect (as seen in user design reference)
  const tabAnims = useRef(
    tabs.map(t => ({
      scale: new Animated.Value(t.id === 'moto' ? 1.15 : 1),
      translateY: new Animated.Value(t.id === 'moto' ? -8 : 0),
    }))
  ).current;

  const plusScale = useRef(new Animated.Value(1)).current;

  const handleTabPress = (id: 'moto' | 'services' | 'wallet' | 'history' | 'profile', index: number) => {
    setActiveTab(id);

    // Spring elevate the active tab and lower inactive tabs
    tabs.forEach((_, i) => {
      const isTarget = i === index;
      Animated.parallel([
        Animated.spring(tabAnims[i].scale, {
          toValue: isTarget ? 1.18 : 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(tabAnims[i].translateY, {
          toValue: isTarget ? -8 : 0,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handlePlusPress = () => {
    // Quick pop animation
    Animated.sequence([
      Animated.timing(plusScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(plusScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true })
    ]).start();

    setQuickActionVisible(true);
  };

  const handleSaveQuickOdo = () => {
    const odo = parseInt(newOdoInput);
    if (!odo || !myMoto || odo <= myMoto.currentOdometer) {
      Alert.alert('Atención', 'Ingresa un kilometraje mayor al actual.');
      return;
    }
    updateMoto({ currentOdometer: odo });
    setQuickOdoVisible(false);
    setNewOdoInput('');
    Alert.alert('Éxito', `Odómetro actualizado a ${odo} km.`);
  };

  const handleSaveQuickFuel = () => {
    const liters = parseFloat(fuelLitersInput);
    const usd = parseFloat(fuelUsdInput);
    if (!liters || !usd || !myMoto) {
      Alert.alert('Atención', 'Ingresa litros y monto en USD válidos.');
      return;
    }
    addRecord({
      id: Math.random().toString(),
      type: 'fuel',
      date: new Date().toISOString(),
      odometer: myMoto.currentOdometer,
      costUSD: usd,
      notes: `Carga de ${liters} Litros`
    });
    setQuickFuelVisible(false);
    setFuelLitersInput('');
    setFuelUsdInput('');
    Alert.alert('Éxito', 'Carga de combustible registrada en tu historial.');
  };

  const isDark = mode === 'dark';
  const barBg = isDark ? 'rgba(18,18,20,0.96)' : 'rgba(255,255,255,0.96)';
  const borderHairline = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, paddingBottom: 68 + insets.bottom }}>
          {activeTab === 'moto' && <DashboardTab />}
          {activeTab === 'services' && <ServicesTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'wallet' && <WalletTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </View>
      </KeyboardAvoidingView>

      {/* CURVED / RAISED FLOATING BOTTOM BAR CON BOTÓN [+] CENTRAL */}
      <View style={[styles.bottomNav, { 
        backgroundColor: barBg, 
        borderTopColor: borderHairline, 
        paddingBottom: Math.max(insets.bottom, 10),
        height: 64 + Math.max(insets.bottom, 10),
      }]}>

        {/* TAB 1: VEHÍCULO */}
        {(() => {
          const item = tabs[0];
          const isActive = activeTab === item.id;
          const { scale, translateY } = tabAnims[0];
          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => handleTabPress(item.id, 0)} 
              style={styles.navItem} 
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.iconBubble,
                isActive && { backgroundColor: isDark ? 'rgba(10,132,255,0.18)' : 'rgba(0,122,255,0.14)', borderColor: colors.primary, borderWidth: 1 },
                { transform: [{ scale }, { translateY }] }
              ]}>
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={22} 
                  color={isActive ? colors.primary : colors.onSurfaceVariant} 
                />
              </Animated.View>
              <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.onSurfaceVariant, fontFamily: isActive ? F.bold : F.medium }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* TAB 2: SERVICIOS */}
        {(() => {
          const item = tabs[1];
          const isActive = activeTab === item.id;
          const { scale, translateY } = tabAnims[1];
          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => handleTabPress(item.id, 1)} 
              style={styles.navItem} 
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.iconBubble,
                isActive && { backgroundColor: isDark ? 'rgba(10,132,255,0.18)' : 'rgba(0,122,255,0.14)', borderColor: colors.primary, borderWidth: 1 },
                { transform: [{ scale }, { translateY }] }
              ]}>
                <MaterialIcons 
                  name={item.icon as any} 
                  size={22} 
                  color={isActive ? colors.primary : colors.onSurfaceVariant} 
                />
              </Animated.View>
              <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.onSurfaceVariant, fontFamily: isActive ? F.bold : F.medium }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* BOTÓN CENTRAL [+] DE ACCIÓN RÁPIDA (ELEVADO / FLOTANTE) */}
        <TouchableOpacity 
          onPress={handlePlusPress} 
          style={styles.centerPlusItem} 
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ scale: plusScale }] }}>
            <LinearGradient
              colors={['#0A84FF', '#0062D2']}
              style={styles.centerPlusCircle}
            >
              <MaterialIcons name="add" size={28} color="#FFF" />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* TAB 3: HISTORIAL */}
        {(() => {
          const item = tabs[2];
          const isActive = activeTab === item.id;
          const { scale, translateY } = tabAnims[2];
          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => handleTabPress(item.id, 2)} 
              style={styles.navItem} 
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.iconBubble,
                isActive && { backgroundColor: isDark ? 'rgba(10,132,255,0.18)' : 'rgba(0,122,255,0.14)', borderColor: colors.primary, borderWidth: 1 },
                { transform: [{ scale }, { translateY }] }
              ]}>
                <MaterialIcons 
                  name={item.icon as any} 
                  size={22} 
                  color={isActive ? colors.primary : colors.onSurfaceVariant} 
                />
              </Animated.View>
              <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.onSurfaceVariant, fontFamily: isActive ? F.bold : F.medium }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* TAB 4: WALLET */}
        {(() => {
          const item = tabs[3];
          const isActive = activeTab === item.id;
          const { scale, translateY } = tabAnims[3];
          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => handleTabPress(item.id, 3)} 
              style={styles.navItem} 
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.iconBubble,
                isActive && { backgroundColor: isDark ? 'rgba(10,132,255,0.18)' : 'rgba(0,122,255,0.14)', borderColor: colors.primary, borderWidth: 1 },
                { transform: [{ scale }, { translateY }] }
              ]}>
                <MaterialIcons 
                  name={item.icon as any} 
                  size={22} 
                  color={isActive ? colors.primary : colors.onSurfaceVariant} 
                />
              </Animated.View>
              <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.onSurfaceVariant, fontFamily: isActive ? F.bold : F.medium }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* TAB 5: PERFIL */}
        {(() => {
          const item = tabs[4];
          const isActive = activeTab === item.id;
          const { scale, translateY } = tabAnims[4];
          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => handleTabPress(item.id, 4)} 
              style={styles.navItem} 
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.iconBubble,
                isActive && { backgroundColor: isDark ? 'rgba(10,132,255,0.18)' : 'rgba(0,122,255,0.14)', borderColor: colors.primary, borderWidth: 1 },
                { transform: [{ scale }, { translateY }] }
              ]}>
                <MaterialIcons 
                  name={item.icon as any} 
                  size={22} 
                  color={isActive ? colors.primary : colors.onSurfaceVariant} 
                />
              </Animated.View>
              <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.onSurfaceVariant, fontFamily: isActive ? F.bold : F.medium }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })()}

      </View>

      {/* MODAL: ACCIONES RÁPIDAS AL TOCAR [+] */}
      <Modal visible={quickActionVisible} transparent={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={[styles.quickSheet, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.outlineVariant }]} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 19 }}>Acciones Rápidas</Text>
              <TouchableOpacity onPress={() => setQuickActionVisible(false)} style={styles.sheetCloseBtn}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 18 }}>
              Registra novedades de tu vehículo en segundos sin tener que buscar entre menús:
            </Text>

            <View style={{ gap: 12 }}>
              {/* Opción 1: Actualizar Odómetro */}
              <TouchableOpacity 
                onPress={() => {
                  setQuickActionVisible(false);
                  setQuickOdoVisible(true);
                }}
                style={[styles.quickOptionRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                  <MaterialIcons name="speed" size={24} color="#0A84FF" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Actualizar Odómetro</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Actual: {myMoto?.currentOdometer || 0} km • Registra tu recorrido de hoy
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 2: Cargar Combustible */}
              <TouchableOpacity 
                onPress={() => {
                  setQuickActionVisible(false);
                  setQuickFuelVisible(true);
                }}
                style={[styles.quickOptionRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
                  <MaterialIcons name="local-gas-station" size={24} color="#FF9500" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Cargar Combustible</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Registra litros, gasto en USD y tanqueo
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 3: Registrar Servicio */}
              <TouchableOpacity 
                onPress={() => {
                  setQuickActionVisible(false);
                  setActiveTab('services');
                }}
                style={[styles.quickOptionRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(175,82,222,0.15)' }]}>
                  <MaterialIcons name="build" size={24} color="#AF52DE" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Registrar Servicio</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Aceite, frenos, repuestos y costos
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Opción 4: Subir Documento a Wallet */}
              <TouchableOpacity 
                onPress={() => {
                  setQuickActionVisible(false);
                  setActiveTab('wallet');
                }}
                style={[styles.quickOptionRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                  <MaterialIcons name="qr-code-scanner" size={24} color="#30D158" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 15 }}>Escanear QR o Carnet</Text>
                  <Text style={{ fontFamily: F.regular, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                    Adjuntar foto de documento o leer código QR
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 26 }} />
          </View>
        </View>
      </Modal>

      {/* MODAL RÁPIDO: ACTUALIZAR ODÓMETRO */}
      <Modal visible={quickOdoVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 18, textAlign: 'center' }}>
              Actualizar Odómetro
            </Text>
            <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Odómetro actual: {myMoto?.currentOdometer || 0} km
            </Text>

            <TextInput 
              value={newOdoInput}
              onChangeText={setNewOdoInput}
              placeholder={`Mayor a ${myMoto?.currentOdometer || 0} km`}
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              style={[styles.dialogInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.bold }]}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setQuickOdoVisible(false)} style={[styles.dialogBtn, { borderColor: colors.outlineVariant, borderWidth: 0.5 }]}>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveQuickOdo} style={[styles.dialogBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ fontFamily: F.bold, color: colors.onPrimary }}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL RÁPIDO: CARGAR COMBUSTIBLE */}
      <Modal visible={quickFuelVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 18, textAlign: 'center' }}>
              Cargar Combustible
            </Text>
            <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Registra los datos de tu tanqueo
            </Text>

            <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 6 }}>LITROS CARGADOS:</Text>
            <TextInput 
              value={fuelLitersInput}
              onChangeText={setFuelLitersInput}
              placeholder="Ej. 10"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              style={[styles.dialogInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.bold, marginBottom: 12 }]}
            />

            <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 6 }}>COSTO EN USD ($):</Text>
            <TextInput 
              value={fuelUsdInput}
              onChangeText={setFuelUsdInput}
              placeholder="Ej. 5.00"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              style={[styles.dialogInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: F.bold }]}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity onPress={() => setQuickFuelVisible(false)} style={[styles.dialogBtn, { borderColor: colors.outlineVariant, borderWidth: 0.5 }]}>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveQuickFuel} style={[styles.dialogBtn, { backgroundColor: '#FF9500' }]}>
                <Text style={{ fontFamily: F.bold, color: '#FFF' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderTopWidth: 0.5, 
    position: 'absolute', 
    bottom: 0, 
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: 8,
  },
  navItem: { 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navLabel: { 
    fontSize: 10, 
    letterSpacing: 0.1,
  },
  centerPlusItem: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    top: -16,
  },
  centerPlusCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  quickSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    borderWidth: 0.5,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  quickOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 0.5,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 22,
    borderWidth: 0.5,
  },
  dialogInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dialogBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
