import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMyMoto } from '../context/MotoContext';
import { useTheme } from '../context/ThemeContext';
import { Moto } from '../../domain/entities/Moto';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { searchMotosAPI } from '../../data/sources/api';
import { MOTO_CATALOG, CatalogMoto } from '../../data/catalog';

export const SetupScreen = () => {
  const { saveMoto, setIsAddingMoto, isAddingMoto } = useMyMoto();
  const { colors, mode, toggleTheme } = useTheme();

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [imageUri, setImageUri] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [selectedCatalogRes, setSelectedCatalogRes] = useState<any>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setSelectedCatalogRes(null); }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setSelectedCatalogRes(null); }
  };

  const handleSearch = async () => {
    if (!brand && !model) { alert('Ingresa marca o modelo para buscar'); return; }
    setIsSearching(true);
    
    try {
      // 1. Search local catalog first (case insensitive)
      const localMatches = MOTO_CATALOG.filter(moto => {
        const brandMatch = brand ? moto.brand.toLowerCase().includes(brand.toLowerCase()) : true;
        const modelMatch = model ? moto.model.toLowerCase().includes(model.toLowerCase()) : true;
        return brandMatch && modelMatch;
      });

      if (localMatches.length > 0) {
        // Map to uniform result structure
        setSearchResults(localMatches.map(m => ({
          make: m.brand,
          model: m.model,
          year: new Date().getFullYear().toString(),
          imageRes: m.imageRes,
          isLocal: true
        })));
      } else {
        // 2. Fallback to API if not in local catalog
        const results = await searchMotosAPI(brand, model);
        setSearchResults(results);
      }
    } catch (error) {
      alert('Error buscando en la API');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: any) => {
    setBrand(item.make);
    setModel(item.model);
    setYear(item.year);
    if (item.isLocal && item.imageRes) {
      setImageUri('');
      setSelectedCatalogRes(item.imageRes);
    }
    setSearchResults([]);
  };

  const handleSave = () => {
    if (!brand || !model) { alert('Por favor completa al menos marca y modelo.'); return; }
    const newMoto: Moto = {
      id: Math.random().toString(),
      brand,
      model,
      year: parseInt(year) || new Date().getFullYear(),
      imageUrl: imageUri || '',
      catalogImageRes: selectedCatalogRes, 
      currentOdometer: parseInt(odometer) || 0,
      isFromAgency: false
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

        <View style={styles.header}>
          {isAddingMoto && (
            <TouchableOpacity onPress={() => setIsAddingMoto(false)} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
              <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons name="engine" size={64} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Bienvenido a GARAGE</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{isAddingMoto ? 'Agrega otra moto a tu garaje' : '¿Cuál es tu modelo de moto?'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.imageSection}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Foto de tu Moto (Opcional)</Text>
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
            <TextInput style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} placeholder="Ej: Yamaha, Honda, Suzuki..." placeholderTextColor={colors.onSurfaceVariant} value={brand} onChangeText={setBrand} />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Modelo</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} placeholder="Ej: MT-07, CBR600, GSX-R..." placeholderTextColor={colors.onSurfaceVariant} value={model} onChangeText={setModel} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Año</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} placeholder="Ej: 2023" placeholderTextColor={colors.onSurfaceVariant} value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Odómetro Actual (km)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHigh, color: colors.onSurface }]} placeholder="Ej: 1500" placeholderTextColor={colors.onSurfaceVariant} value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
          </View>

          <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.surfaceContainerHigh }]} onPress={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <MaterialIcons name="search" size={20} color={colors.secondary} />
                <Text style={[styles.searchButtonText, { color: colors.secondary }]}>Buscar</Text>
              </View>
            )}
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <View style={[styles.resultsContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.secondary }]}>
              <Text style={[styles.resultsTitle, { color: colors.onSurface }]}>Resultados encontrados:</Text>
              {searchResults.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.resultItem, { borderBottomColor: colors.surfaceContainerHigh }]} onPress={() => handleSelectResult(item)}>
                  {item.isLocal ? (
                    <Image source={item.imageRes} style={{ width: 40, height: 30, marginRight: 8 }} resizeMode="contain" />
                  ) : (
                    <MaterialIcons name="motorcycle" size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.resultText, { color: colors.onSurface, flex: 1 }]}>{item.make} {item.model} {item.year ? `(${item.year})` : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.buttonText, { color: colors.onPrimaryContainer }]}>Comenzar</Text>
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
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontFamily: 'Montserrat_800ExtraBold', marginTop: 16 },
  subtitle: { fontSize: 16, fontFamily: 'Montserrat_500Medium', marginTop: 8 },
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
});
