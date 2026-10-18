import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMyMoto } from '../context/MotoContext';
import { useTheme } from '../context/ThemeContext';
import { Moto, VehicleType, isCar } from '../../domain/entities/Moto';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { searchMotosAPI } from '../../data/sources/api';
import { MOTO_CATALOG, CAR_CATALOG, VEHICLE_CATALOG, CatalogVehicle } from '../../data/catalog';

export const SetupScreen = () => {
  const { saveMoto, setIsAddingMoto, isAddingMoto } = useMyMoto();
  const { colors, mode, toggleTheme } = useTheme();

  const [vehicleType, setVehicleType] = useState<VehicleType>('moto');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [imageUri, setImageUri] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [selectedCatalogRes, setSelectedCatalogRes] = useState<any>(null);

  const isCarSelected = vehicleType === 'car';

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setSelectedCatalogRes(null); }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setSelectedCatalogRes(null); }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    
    try {
      const activeCatalog = isCarSelected ? CAR_CATALOG : MOTO_CATALOG;
      
      // If empty query, show all in that catalog
      const localMatches = activeCatalog.filter(v => {
        if (!brand && !model) return true;
        const brandMatch = brand ? v.brand.toLowerCase().includes(brand.toLowerCase()) : true;
        const modelMatch = model ? v.model.toLowerCase().includes(model.toLowerCase()) : true;
        return brandMatch && modelMatch;
      });

      if (localMatches.length > 0) {
        setSearchResults(localMatches.map(m => ({
          make: m.brand,
          model: m.model,
          year: m.year ? m.year.toString() : (isCarSelected ? '2011' : new Date().getFullYear().toString()),
          imageRes: m.imageRes,
          isLocal: true,
          vehicleType: m.vehicleType || (isCarSelected ? 'car' : 'moto')
        })));
      } else if (!isCarSelected) {
        // Fallback to API for motorcycles if not in local catalog
        const results = await searchMotosAPI(brand, model);
        setSearchResults(results.map((r: any) => ({ ...r, vehicleType: 'moto' })));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      alert('Error buscando en el catálogo');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: any) => {
    setBrand(item.make);
    setModel(item.model);
    setYear(item.year || (isCarSelected ? '2011' : ''));
    if (item.vehicleType) {
      setVehicleType(item.vehicleType);
    }
    if (item.isLocal && item.imageRes) {
      setImageUri('');
      setSelectedCatalogRes(item.imageRes);
    }
    setSearchResults([]);
  };

  const handleQuickSelectVehicle = (item: CatalogVehicle) => {
    setBrand(item.brand);
    setModel(item.model);
    setYear(item.year ? item.year.toString() : (isCarSelected ? '2011' : '2023'));
    setVehicleType(item.vehicleType || (isCarSelected ? 'car' : 'moto'));
    setImageUri('');
    setSelectedCatalogRes(item.imageRes);
    setSearchResults([]);
  };

  const handleSave = () => {
    if (!brand || !model) { 
      alert(isCarSelected ? 'Por favor completa marca y modelo de tu carro.' : 'Por favor completa al menos marca y modelo.'); 
      return; 
    }

    const inferredType: VehicleType = isCar({ brand, model, vehicleType }) ? 'car' : vehicleType;

    const newMoto: Moto = {
      id: Math.random().toString(),
      brand,
      model,
      year: parseInt(year) || (isCarSelected ? 2011 : new Date().getFullYear()),
      plate: plate.trim() || undefined,
      imageUrl: imageUri || '',
      catalogImageRes: selectedCatalogRes, 
      currentOdometer: parseInt(odometer) || 0,
      isFromAgency: false,
      vehicleType: inferredType,
    };
    saveMoto(newMoto);
    setIsAddingMoto(false);
  };

  const hasCustomImage = imageUri.length > 0;
  const hasCatalogImage = selectedCatalogRes !== null;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceContainerHigh }]} onPress={toggleTheme}>
          <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={20} color={colors.primary} />
        </TouchableOpacity>

        {isAddingMoto && (
          <TouchableOpacity 
            onPress={() => setIsAddingMoto(false)} 
            style={[styles.returnPillBtn, { 
              backgroundColor: mode === 'dark' ? 'rgba(65, 105, 225, 0.15)' : 'rgba(39, 95, 227, 0.1)',
              borderColor: mode === 'dark' ? 'rgba(0, 227, 253, 0.4)' : '#275FE3',
            }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={18} color={mode === 'dark' ? '#00e3fd' : '#275FE3'} />
            <Text style={[styles.returnPillText, { color: colors.onSurface }]}>
              Volver al Garaje
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <MaterialCommunityIcons name="engine" size={60} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Bienvenido a GARAGE</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {isAddingMoto ? 'Agrega otro vehículo a tu garaje' : '¿Qué tipo de vehículo vas a registrar?'}
          </Text>
        </View>

        {/* SELECTOR DE TIPO DE VEHÍCULO: MOTOCICLETA VS CARRO */}
        <View style={styles.typeSelectorWrapper}>
          <Text style={[styles.selectorLabel, { color: colors.onSurfaceVariant }]}>
            SELECCIONA TIPO DE VEHÍCULO
          </Text>
          <View style={[styles.typeSelectorContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <TouchableOpacity 
              style={[
                styles.typeBtn, 
                !isCarSelected && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }
              ]} 
              onPress={() => {
                setVehicleType('moto');
                setSelectedCatalogRes(null);
                setSearchResults([]);
              }}
              activeOpacity={0.85}
            >
              <MaterialIcons name="two-wheeler" size={22} color={!isCarSelected ? '#FFFFFF' : colors.onSurfaceVariant} />
              <Text style={[styles.typeBtnText, { color: !isCarSelected ? '#FFFFFF' : colors.onSurfaceVariant }]}>
                Motocicleta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.typeBtn, 
                isCarSelected && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }
              ]} 
              onPress={() => {
                setVehicleType('car');
                setSelectedCatalogRes(null);
                setSearchResults([]);
              }}
              activeOpacity={0.85}
            >
              <MaterialIcons name="directions-car" size={22} color={isCarSelected ? '#FFFFFF' : colors.onSurfaceVariant} />
              <Text style={[styles.typeBtnText, { color: isCarSelected ? '#FFFFFF' : colors.onSurfaceVariant }]}>
                Carro / Auto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCESO RÁPIDO DESDE EL CATÁLOGO DISPONIBLE */}
        <View style={{ marginVertical: 8 }}>
          <Text style={[styles.quickPickTitle, { color: colors.onSurfaceVariant }]}>
            {isCarSelected ? 'AUTOS EN CATÁLOGO OFICIAL:' : 'MOTOS DESTACADAS EN CATÁLOGO:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {(isCarSelected ? CAR_CATALOG : MOTO_CATALOG.slice(0, 6)).map((catItem) => (
              <TouchableOpacity
                key={catItem.id}
                onPress={() => handleQuickSelectVehicle(catItem)}
                style={[
                  styles.quickPickCard,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: (brand === catItem.brand && model === catItem.model) ? colors.primary : colors.outlineVariant,
                    borderWidth: (brand === catItem.brand && model === catItem.model) ? 2 : 0.8
                  }
                ]}
                activeOpacity={0.85}
              >
                <Image source={catItem.imageRes} style={styles.quickPickImg} resizeMode="contain" />
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.quickPickBrand, { color: colors.primary }]}>{catItem.brand}</Text>
                  <Text style={[styles.quickPickModel, { color: colors.onSurface }]} numberOfLines={1}>{catItem.model}</Text>
                  {catItem.category && (
                    <Text style={[styles.quickPickCategory, { color: colors.onSurfaceVariant }]}>{catItem.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.form}>
          <View style={styles.imageSection}>
            <Text style={[styles.label, { color: colors.onSurface }]}>
              {isCarSelected ? 'Foto de tu Carro (Opcional)' : 'Foto de tu Moto (Opcional)'}
            </Text>
            {hasCustomImage ? (
              <View style={[styles.imagePreview, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.primary }]}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                <TouchableOpacity style={[styles.removeImageBtn, { backgroundColor: colors.error }]} onPress={() => setImageUri('')}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : hasCatalogImage ? (
              <View style={[styles.imagePreview, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.primary }]}>
                <Image source={selectedCatalogRes} style={styles.previewImage} resizeMode="contain" />
                <TouchableOpacity style={[styles.removeImageBtn, { backgroundColor: colors.error }]} onPress={() => setSelectedCatalogRes(null)}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity style={[styles.imageBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh }]} onPress={pickImage}>
                  <MaterialIcons name="photo-library" size={28} color={colors.primary} />
                  <Text style={[styles.imageBtnText, { color: colors.onSurface }]}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.imageBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh }]} onPress={takePhoto}>
                  <MaterialIcons name="camera-alt" size={28} color={colors.secondary} />
                  <Text style={[styles.imageBtnText, { color: colors.onSurface }]}>Cámara</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Marca</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} 
              placeholder={isCarSelected ? "Ej: Chevrolet, Toyota, Ford..." : "Ej: Yamaha, Honda, Bera..."} 
              placeholderTextColor={colors.onSurfaceVariant} 
              value={brand} 
              onChangeText={setBrand} 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Modelo</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} 
              placeholder={isCarSelected ? "Ej: Optra 2011, Corolla, Aveo..." : "Ej: SBR 150, Horse 150, RK 250..."} 
              placeholderTextColor={colors.onSurfaceVariant} 
              value={model} 
              onChangeText={setModel} 
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.onSurface }]}>Año</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} 
                placeholder={isCarSelected ? "2011" : "2023"} 
                placeholderTextColor={colors.onSurfaceVariant} 
                value={year} 
                onChangeText={setYear} 
                keyboardType="numeric" 
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={[styles.label, { color: colors.onSurface }]}>Placa (Opcional)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} 
                placeholder="Ej: AB123CD" 
                placeholderTextColor={colors.onSurfaceVariant} 
                value={plate} 
                onChangeText={setPlate} 
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Odómetro Actual (km)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} 
              placeholder="Ej: 145000" 
              placeholderTextColor={colors.onSurfaceVariant} 
              value={odometer} 
              onChangeText={setOdometer} 
              keyboardType="numeric" 
            />
          </View>

          <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.surfaceContainerHigh }]} onPress={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <MaterialIcons name="search" size={20} color={colors.secondary} />
                <Text style={[styles.searchButtonText, { color: colors.secondary }]}>
                  {isCarSelected ? 'Buscar en Catálogo de Autos' : 'Buscar en Catálogo de Motos'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <View style={[styles.resultsContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.secondary }]}>
              <Text style={[styles.resultsTitle, { color: colors.onSurface }]}>Resultados encontrados:</Text>
              {searchResults.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.resultItem, { borderBottomColor: colors.surfaceContainerHigh }]} onPress={() => handleSelectResult(item)}>
                  {item.isLocal && item.imageRes ? (
                    <Image source={item.imageRes} style={{ width: 48, height: 32, marginRight: 8 }} resizeMode="contain" />
                  ) : (
                    <MaterialIcons 
                      name={item.vehicleType === 'car' ? "directions-car" : "motorcycle"} 
                      size={22} 
                      color={colors.primary} 
                    />
                  )}
                  <Text style={[styles.resultText, { color: colors.onSurface, flex: 1 }]}>
                    {item.make} {item.model} {item.year ? `(${item.year})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.buttonText, { color: colors.onPrimaryContainer }]}>
              {isCarSelected ? 'Registrar Auto y Comenzar' : 'Comenzar'}
            </Text>
            <MaterialIcons name="arrow-forward" size={24} color={colors.onPrimaryContainer} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'center', maxWidth: 640, width: '100%', alignSelf: 'center' },
  themeToggle: { position: 'absolute', top: 40, right: 24, padding: 8, borderRadius: 20, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Montserrat_800ExtraBold', marginTop: 12 },
  subtitle: { fontSize: 15, fontFamily: 'Montserrat_500Medium', marginTop: 6, textAlign: 'center' },
  typeSelectorWrapper: { marginBottom: 16 },
  selectorLabel: { fontSize: 11, fontFamily: 'Montserrat_700Bold', letterSpacing: 0.8, marginBottom: 8 },
  typeSelectorContainer: { flexDirection: 'row', borderRadius: 16, padding: 4, borderWidth: 1, gap: 6 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  typeBtnText: { fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  quickPickTitle: { fontSize: 11, fontFamily: 'Montserrat_700Bold', letterSpacing: 0.6, marginBottom: 6 },
  quickPickCard: { width: 130, padding: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickPickImg: { width: 100, height: 60 },
  quickPickBrand: { fontSize: 10, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase' },
  quickPickModel: { fontSize: 12, fontFamily: 'Montserrat_700Bold', textAlign: 'center' },
  quickPickCategory: { fontSize: 9, fontFamily: 'Montserrat_500Medium' },
  form: { gap: 16 },
  imageSection: { gap: 10 },
  imageButtons: { flexDirection: 'row', gap: 12 },
  imageBtn: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, borderStyle: 'dashed' },
  imageBtnText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
  imagePreview: { borderWidth: 2, borderRadius: 12, padding: 8, alignItems: 'center', position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  input: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 16, fontFamily: 'Montserrat_400Regular' },
  searchButton: { padding: 14, borderRadius: 8, alignItems: 'center' },
  searchButtonText: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  resultsContainer: { padding: 12, borderRadius: 8, borderWidth: 1 },
  resultsTitle: { fontFamily: 'Montserrat_700Bold', marginBottom: 8, fontSize: 14 },
  resultItem: { paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultText: { fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  button: { padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 32 },
  buttonText: { fontSize: 16, fontFamily: 'Montserrat_800ExtraBold', textTransform: 'uppercase' },
  returnPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  returnPillText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.3,
  },
});

