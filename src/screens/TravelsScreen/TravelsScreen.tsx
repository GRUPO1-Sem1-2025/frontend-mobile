import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TravelsScreens() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Viajes</Text>
      {/* Aquí iría tu contenido de viajes */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
  },
});