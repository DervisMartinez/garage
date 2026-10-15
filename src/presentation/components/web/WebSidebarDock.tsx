import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface WebSidebarDockProps {
  onOpenSOS: () => void;
  onOpenQuickOdo: () => void;
  onOpenQuickFuel: () => void;
  onOpenSpecs: () => void;
  onOpenStats: () => void;
}

export const WebSidebarDock: React.FC<WebSidebarDockProps> = ({
  onOpenSOS,
  onOpenQuickOdo,
  onOpenQuickFuel,
  onOpenSpecs,
  onOpenStats,
}) => {
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const isDark = mode === 'dark';

  // On narrower desktop viewports (< 1200px), shortcuts are directly available in the top navbar
  if (width < 1200) {
    return null;
  }

  return (
    <View style={{ position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute', left: 24, top: '50%', transform: [{ translateY: -120 }], zIndex: 90 }}>
      <View style={[styles.dockContainer, { 
        backgroundColor: isDark ? 'rgba(25, 28, 33, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)',
      } as any]}>
        
        {/* SOS BUTTON */}
        <TouchableOpacity 
          style={[styles.dockIcon, { backgroundColor: 'rgba(186, 26, 26, 0.18)' }]} 
          onPress={onOpenSOS}
          accessibilityLabel="Protocolo de Emergencia SOS"
          activeOpacity={0.7}
        >
          <MaterialIcons name="warning" size={19} color="#ffb4ab" />
        </TouchableOpacity>

        {/* ODOMETER */}
        <TouchableOpacity 
          style={styles.dockIcon} 
          onPress={onOpenQuickOdo}
          accessibilityLabel="Actualizar Odómetro"
          activeOpacity={0.7}
        >
          <MaterialIcons name="speed" size={19} color="#4169E1" />
        </TouchableOpacity>

        {/* FUEL */}
        <TouchableOpacity 
          style={styles.dockIcon} 
          onPress={onOpenQuickFuel}
          accessibilityLabel="Registrar Combustible"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="gas-station" size={19} color="#00e3fd" />
        </TouchableOpacity>

        {/* SPECS */}
        <TouchableOpacity 
          style={styles.dockIcon} 
          onPress={onOpenSpecs}
          accessibilityLabel="Ficha Técnica"
          activeOpacity={0.7}
        >
          <MaterialIcons name="description" size={19} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* STATS */}
        <TouchableOpacity 
          style={styles.dockIcon} 
          onPress={onOpenStats}
          accessibilityLabel="Estadísticas y Calendario"
          activeOpacity={0.7}
        >
          <MaterialIcons name="calendar-today" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  dockIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  } as any,
});
