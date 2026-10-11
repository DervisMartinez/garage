import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Moto } from '../../domain/entities/Moto';

interface Props {
  moto: Moto;
}

export const MotoCard: React.FC<Props> = ({ moto }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{moto.brand} {moto.model}</Text>
      <Text style={styles.subtitle}>Año: {moto.year}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2, // shadow for android
    shadowColor: '#000', // shadow for ios
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
