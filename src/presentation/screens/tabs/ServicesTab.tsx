import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyMoto } from '../../context/MotoContext';
import { useTheme } from '../../context/ThemeContext';
import { ComponentType, COMPONENT_NAMES, getVehicleComponents } from '../../../constants/telemetry';
import { isCar } from '../../../domain/entities/Moto';

interface ServicesTabProps {
  initialComponent?: ComponentType;
}

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const formatToYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatReadableDate = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} de ${SPANISH_MONTHS[m]} de ${y}`;
    }
    const d = new Date(dateStr);
    return `${d.getDate()} de ${SPANISH_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export const ServicesTab: React.FC<ServicesTabProps> = ({ initialComponent }) => {
  const { myMoto, records, addRecord, updateMoto } = useMyMoto();
  const { colors, isDark } = useTheme();

  const isCurrentCar = isCar(myMoto);
  const comps: ComponentType[] = getVehicleComponents(isCurrentCar);

  const [selectedComp, setSelectedComp] = useState<ComponentType>(initialComponent || 'oil');

  React.useEffect(() => {
    if (initialComponent) {
      setSelectedComp(initialComponent);
    }
  }, [initialComponent]);
  
  const [odoStr, setOdoStr] = useState(myMoto?.currentOdometer.toString() || '0');
  const [costStr, setCostStr] = useState('');
  const [notes, setNotes] = useState('');

  // Fecha del servicio: 'today' (fecha actual) o 'custom' (fecha elegida por el usuario)
  const [dateOption, setDateOption] = useState<'today' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(formatToYMD(new Date()));
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calViewDate, setCalViewDate] = useState(new Date());

  if (!myMoto) return null;

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  // Calcular estadísticas
  const totalGasto = records.reduce((sum, r) => sum + (Number(r.costUSD) || 0), 0);
  const gastoGasolina = records.filter(r => r.type === 'fuel').reduce((sum, r) => sum + (Number(r.costUSD) || 0), 0);
  const gastoMantenimiento = totalGasto - gastoGasolina;

  const handleSave = () => {
    const odo = parseInt(odoStr);
    if (isNaN(odo)) { alert('Odómetro inválido'); return; }

    let recordDateISO: string;

    if (dateOption === 'today') {
      recordDateISO = new Date().toISOString();
    } else {
      const parts = customDate.trim().split('-');
      if (parts.length !== 3) {
        alert('Formato de fecha inválido. Utiliza el formato AAAA-MM-DD');
        return;
      }
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);

      if (isNaN(y) || isNaN(m) || isNaN(d) || m < 0 || m > 11 || d < 1 || d > 31) {
        alert('Por favor introduce una fecha válida.');
        return;
      }

      // Usamos mediodía (12:00) para evitar desfases de huso horario local vs UTC
      const parsedDate = new Date(y, m, d, 12, 0, 0);
      if (isNaN(parsedDate.getTime())) {
        alert('Fecha no válida.');
        return;
      }
      recordDateISO = parsedDate.toISOString();
    }
    
    addRecord({
      id: Math.random().toString(),
      type: selectedComp,
      date: recordDateISO,
      odometer: odo,
      costUSD: parseFloat(costStr) || 0,
      notes: notes
    });

    if (odo > myMoto.currentOdometer) {
      updateMoto({ currentOdometer: odo });
    }

    alert('Servicio registrado exitosamente');
    setCostStr('');
    setNotes('');
    setDateOption('today');
    setCustomDate(formatToYMD(new Date()));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 160 }} 
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontFamily: F.bold, color: colors.onSurface }}>Registrar Actividad</Text>
        <Text style={{ fontSize: 14, fontFamily: F.regular, color: colors.onSurfaceVariant, marginTop: 4 }}>
          Guarda tus repostajes de gasolina y mantenimientos.
        </Text>
      </View>

      {/* ESTADISTICAS */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLow, padding: 16, borderRadius: 20, borderColor: colors.outlineVariant, borderWidth: 0.5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontFamily: F.bold, color: colors.onSurfaceVariant, fontSize: 12 }}>TOTAL GASTADO</Text>
          <Text style={{ fontFamily: F.extrabold, color: colors.primary, fontSize: 22, marginTop: 4 }}>${totalGasto.toFixed(2)}</Text>
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: 14 }}>
            <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 10 }}>⛽ GASOLINA</Text>
            <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 14 }}>${gastoGasolina.toFixed(2)}</Text>
          </View>
          <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: 14 }}>
            <Text style={{ fontFamily: F.semibold, color: colors.onSurfaceVariant, fontSize: 10 }}>🔧 REPUESTOS</Text>
            <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 14 }}>${gastoMantenimiento.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <View>
          <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>1. ¿Qué componente cambiaste?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {comps.map(c => (
              <TouchableOpacity 
                key={c}
                onPress={() => setSelectedComp(c)}
                style={{ 
                  backgroundColor: selectedComp === c ? colors.primary : colors.surfaceContainer, 
                  paddingHorizontal: 16, 
                  paddingVertical: 10, 
                  borderRadius: 20 
                }}>
                <Text style={{ fontFamily: F.bold, fontSize: 12, color: selectedComp === c ? colors.onPrimary : colors.onSurface }}>{COMPONENT_NAMES[c]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2. SELECCIÓN DE FECHA (HOY VS OTRA FECHA) */}
        <View>
          <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>
            2. ¿Cuándo realizaste este servicio?
          </Text>

          {/* Selector de modo: Hoy vs Colocar otra fecha */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            {/* OPCIÓN: HOY */}
            <TouchableOpacity
              onPress={() => setDateOption('today')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                backgroundColor: dateOption === 'today' 
                  ? (isDark ? 'rgba(0, 227, 253, 0.12)' : 'rgba(39, 95, 227, 0.1)') 
                  : colors.surfaceContainer,
                borderColor: dateOption === 'today' ? (isDark ? '#00e3fd' : '#275FE3') : colors.outlineVariant,
                gap: 10,
              }}
            >
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: dateOption === 'today' ? (isDark ? '#00e3fd' : '#275FE3') : colors.outlineVariant,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dateOption === 'today' ? (isDark ? '#00e3fd' : '#275FE3') : 'transparent',
              }}>
                {dateOption === 'today' && (
                  <MaterialIcons name="check" size={14} color={isDark ? '#111319' : '#ffffff'} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: colors.onSurface }}>
                  Hoy (Día actual)
                </Text>
                <Text style={{ fontFamily: F.regular, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                  {formatReadableDate(formatToYMD(new Date()))}
                </Text>
              </View>
            </TouchableOpacity>

            {/* OPCIÓN: COLOCAR FECHA */}
            <TouchableOpacity
              onPress={() => setDateOption('custom')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                backgroundColor: dateOption === 'custom' 
                  ? (isDark ? 'rgba(0, 227, 253, 0.12)' : 'rgba(39, 95, 227, 0.1)') 
                  : colors.surfaceContainer,
                borderColor: dateOption === 'custom' ? (isDark ? '#00e3fd' : '#275FE3') : colors.outlineVariant,
                gap: 10,
              }}
            >
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: dateOption === 'custom' ? (isDark ? '#00e3fd' : '#275FE3') : colors.outlineVariant,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dateOption === 'custom' ? (isDark ? '#00e3fd' : '#275FE3') : 'transparent',
              }}>
                {dateOption === 'custom' && (
                  <MaterialIcons name="check" size={14} color={isDark ? '#111319' : '#ffffff'} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: colors.onSurface }}>
                  Colocar fecha
                </Text>
                <Text style={{ fontFamily: F.regular, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                  {dateOption === 'custom' ? formatReadableDate(customDate) : 'Indicar fecha anterior'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* DETALLES CUANDO SE ELIGE "COLOCAR FECHA" */}
          {dateOption === 'custom' && (
            <View style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              gap: 10,
              marginTop: 4,
            }}>
              {/* ATAJOS RÁPIDOS */}
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={{ fontFamily: F.bold, fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                  Atajos rápidos:
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    setCustomDate(formatToYMD(d));
                  }}
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: colors.outlineVariant,
                  }}
                >
                  <Text style={{ fontFamily: F.semibold, fontSize: 11, color: colors.onSurface }}>Ayer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 3);
                    setCustomDate(formatToYMD(d));
                  }}
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: colors.outlineVariant,
                  }}
                >
                  <Text style={{ fontFamily: F.semibold, fontSize: 11, color: colors.onSurface }}>Hace 3 días</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setCustomDate(formatToYMD(d));
                  }}
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: colors.outlineVariant,
                  }}
                >
                  <Text style={{ fontFamily: F.semibold, fontSize: 11, color: colors.onSurface }}>Hace 1 semana</Text>
                </TouchableOpacity>
              </View>

              {/* INPUT DE FECHA + BOTÓN CALENDARIO */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceContainer,
                borderRadius: 14,
                paddingHorizontal: 14,
                borderWidth: 0.5,
                borderColor: colors.outlineVariant,
                height: 50,
              }}>
                <MaterialIcons name="event" size={20} color={colors.primary} />
                <TextInput
                  style={{
                    flex: 1,
                    height: 50,
                    fontFamily: F.bold,
                    color: colors.onSurface,
                    marginLeft: 12,
                    fontSize: 14,
                  }}
                  value={customDate}
                  onChangeText={setCustomDate}
                  placeholder="AAAA-MM-DD (Ej: 2026-10-20)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  {...(Platform.OS === 'web' ? ({ type: 'date' } as any) : {})}
                />
                <TouchableOpacity
                  onPress={() => {
                    // Sincronizar vista del mes con la fecha personalizada
                    const parts = customDate.split('-');
                    if (parts.length === 3) {
                      const y = parseInt(parts[0], 10);
                      const m = parseInt(parts[1], 10) - 1;
                      if (!isNaN(y) && !isNaN(m)) {
                        setCalViewDate(new Date(y, m, 1));
                      }
                    }
                    setShowCalendarModal(true);
                  }}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(0, 227, 253, 0.12)' : 'rgba(39, 95, 227, 0.1)',
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Abrir calendario visual"
                >
                  <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={{ fontFamily: F.regular, fontSize: 11, color: colors.onSurfaceVariant }}>
                📅 Fecha que se registrará: <Text style={{ fontFamily: F.bold, color: colors.onSurface }}>{formatReadableDate(customDate)}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* 3. KILOMETRAJE */}
        <View>
          <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>3. Kilometraje (Odómetro) al momento del cambio</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: 16, paddingHorizontal: 16, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
            <MaterialIcons name="speed" size={20} color={colors.onSurfaceVariant} />
            <TextInput 
              style={{ flex: 1, height: 50, fontFamily: F.bold, color: colors.onSurface, marginLeft: 12 }} 
              value={odoStr}
              onChangeText={setOdoStr}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* 4. COSTO */}
        <View>
          <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>4. Costo del repuesto / Mano de obra (USD)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: 16, paddingHorizontal: 16, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
            <MaterialIcons name="attach-money" size={20} color={colors.onSurfaceVariant} />
            <TextInput 
              style={{ flex: 1, height: 50, fontFamily: F.bold, color: colors.onSurface, marginLeft: 12 }} 
              value={costStr}
              onChangeText={setCostStr}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* 5. DETALLES O LITROS */}
        {selectedComp === 'fuel' && (
          <View>
            <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>5. Litros Anexados</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: 16, paddingHorizontal: 16, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
              <MaterialIcons name="local-gas-station" size={20} color={colors.onSurfaceVariant} />
              <TextInput 
                style={{ flex: 1, height: 50, fontFamily: F.bold, color: colors.onSurface, marginLeft: 12 }} 
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: 4"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {selectedComp !== 'fuel' && (
          <View>
            <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase' }}>5. Notas / Detalles</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: 16, paddingHorizontal: 16, borderWidth: 0.5, borderColor: colors.outlineVariant }}>
              <MaterialIcons name="notes" size={20} color={colors.onSurfaceVariant} />
              <TextInput 
                style={{ flex: 1, height: 50, fontFamily: F.regular, color: colors.onSurface, marginLeft: 12 }} 
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: Yamalube 10w40"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleSave}
          style={{ backgroundColor: colors.primary, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
          <Text style={{ fontFamily: F.bold, color: colors.onPrimaryContainer, fontSize: 16, textTransform: 'uppercase' }}>Guardar Registro</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* MODAL: SELECCIONAR FECHA EN CALENDARIO */}
      <Modal visible={showCalendarModal} transparent={true} animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: isDark ? '#191c24' : '#ffffff',
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(64, 72, 92, 0.4)' : '#d0d4dc',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Header del modal */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontFamily: F.bold, fontSize: 11, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Seleccionar Fecha
                </Text>
                <Text style={{ fontFamily: F.extrabold, fontSize: 18, color: colors.onSurface }}>
                  {SPANISH_MONTHS[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))}
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' }}
                  accessibilityLabel="Mes anterior"
                >
                  <MaterialIcons name="chevron-left" size={22} color={colors.onSurface} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))}
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' }}
                  accessibilityLabel="Mes siguiente"
                >
                  <MaterialIcons name="chevron-right" size={22} color={colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Días de la semana */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
              {WEEK_DAYS.map((wd, idx) => (
                <Text key={idx} style={{ width: 38, textAlign: 'center', fontFamily: F.bold, fontSize: 11, color: colors.onSurfaceVariant }}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Cuadrícula de días */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {Array.from({ length: new Date(calViewDate.getFullYear(), calViewDate.getMonth(), 1).getDay() }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />
              ))}
              {Array.from({ length: new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${calViewDate.getFullYear()}-${String(calViewDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = customDate === dateStr;
                const isToday = formatToYMD(new Date()) === dateStr;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    onPress={() => {
                      setCustomDate(dateStr);
                      setDateOption('custom');
                      setShowCalendarModal(false);
                    }}
                    style={{
                      width: `${100 / 7}%`,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isSelected ? colors.primary : (isToday ? (isDark ? 'rgba(0, 227, 253, 0.2)' : 'rgba(39, 95, 227, 0.15)') : 'transparent'),
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: colors.primary,
                    }}>
                      <Text style={{
                        fontFamily: isSelected || isToday ? F.bold : F.regular,
                        fontSize: 12,
                        color: isSelected ? colors.onPrimary : colors.onSurface,
                      }}>
                        {dayNum}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones inferiores */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, borderTopWidth: 0.5, borderTopColor: colors.outlineVariant, paddingTop: 14 }}>
              <TouchableOpacity
                onPress={() => {
                  setCustomDate(formatToYMD(new Date()));
                  setDateOption('today');
                  setShowCalendarModal(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: F.semibold, fontSize: 12, color: colors.onSurface }}>Usar Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCalendarModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: F.bold, fontSize: 12, color: colors.onPrimary }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
