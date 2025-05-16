// src/screens/BusSelectionScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Button,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getActiveBuses } from '../../services/buses';
import { Bus } from '../../types/bus';
import { BASE_URL } from '../../context/AuthContext';

type RouteParams = { busId: number };

type Navigation = {
  navigate: (screen: string, params?: any) => void;
};

export default function BusSelectionScreen() {
  const { busId } = useRoute().params as RouteParams;
  const navigation = useNavigation<Navigation>();
  const [bus, setBus] = useState<Bus | null>(null);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const buses = await getActiveBuses();
        const found = buses.find((b) => b.marca === 'Chevrolet');
        if (!found) throw new Error('Bus no encontrado');
        setBus(found);

        const resp = await fetch(
          `${BASE_URL}/viajes/obtenerAsientosDisponibles?idViaje=5`
        );
        if (!resp.ok) throw new Error('Error al obtener asientos');
        const seats: number[] = await resp.json();
        setAvailableSeats(seats);
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [busId]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }
  if (!bus) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Bus no disponible</Text>
      </View>
    );
  }

  // Configuración de asientos
  const totalSeats = bus.cant_asientos;
  const columns = 4;
  const rows = Math.ceil(totalSeats / columns);
  
  const matrix: ({ number: number; available: boolean } | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: ({ number: number; available: boolean } | null)[] = [];
    for (let c = 0; c < columns; c++) {
      const seatNumber = r * columns + c + 1;
      if (seatNumber <= totalSeats) {
        row.push({ number: seatNumber, available: availableSeats.includes(seatNumber) });
      } else {
        row.push(null);
      }
    }
    matrix.push(row);
  }

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber) ? prev.filter((n) => n !== seatNumber) : [...prev, seatNumber]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seleccioná tu asiento</Text>
      <Text style={styles.selectedText}>
        Asientos seleccionados: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'ninguno'}
      </Text>

      <View style={styles.busContainer}>
        {matrix.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((seat, colIndex) =>
              seat ? (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.seat,
                    !seat.available && styles.seatUnavailable,
                    selectedSeats.includes(seat.number) && styles.seatSelected,
                    colIndex === 1 && styles.aisle,
                  ]}
                  disabled={!seat.available}
                  onPress={() => toggleSeat(seat.number)}
                >
                  <Text style={styles.seatText}>{seat.number}</Text>
                </TouchableOpacity>
              ) : (
                <View
                  key={colIndex}
                  style={[
                    styles.seat,
                    styles.seatEmpty,
                    colIndex === 1 && styles.aisle,
                  ]}
                />
              )
            )}
          </View>
        ))}
        {/* Baño al fondo del bus */}
        <View style={styles.bathroom}>
          <Text style={styles.bathroomText}>Baño</Text>
        </View>
      </View>

      <Button
        title="Ir a pagar"
        disabled={selectedSeats.length === 0}
        onPress={() => navigation.navigate('Payment', { selectedSeats })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', fontSize: 16 },

  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  selectedText: { marginBottom: 16, fontSize: 16 },

  busContainer: {
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  row: { flexDirection: 'row', marginBottom: 8 },
  seat: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0',
  },
  seatUnavailable: { backgroundColor: '#ccc' },
  seatSelected: { backgroundColor: 'skyblue' },
  seatEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  seatText: { color: '#000' },
  aisle: { marginRight: 20 },

  bathroom: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  bathroomText: { fontWeight: 'bold' },
});
