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

// Colores
const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#69c8f1',
  darkBlue: '#1f2c3a',
  lightBlue: '#c6eefc',
  midBlue: '#91d5f4',
};

type RouteParams = {
  tripType: 'oneway' | 'roundtrip';
};

type Navigation = {
  navigate: (screen: string, params?: any) => void;
};

export default function BusSelectionScreen() {
  // Extraemos tripType
  const params = useRoute().params as Partial<RouteParams> | undefined;
  const tripType = params?.tripType;

  // Si no se recibe tripType, mostramos error y retornamos UI de error
  if (tripType !== 'oneway' && tripType !== 'roundtrip') {
    console.error('Error: tripType no definido en params:', params);
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Error interno: parámetro de tipo de viaje no especificado.
        </Text>
      </View>
    );
  }

  const navigation = useNavigation<Navigation>();

  // Hardcoded por ahora
  const outboundBrand = 'Chevrolet';
  const returnBrand = 'Jetour';
  const outboundTripId = 5;
  const returnTripId = 7;

  const [busOut, setBusOut] = useState<Bus | null>(null);
  const [busRet, setBusRet] = useState<Bus | null>(null);
  const [outSeats, setOutSeats] = useState<number[]>([]);
  const [retSeats, setRetSeats] = useState<number[]>([]);
  const [selOut, setSelOut] = useState<number[]>([]);
  const [selRet, setSelRet] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        console.log('--- Inicio de load() ---');
        console.log('TripType:', tripType);

        setLoading(true);
        const buses = await getActiveBuses();
        console.log('Buses obtenidos:', buses);

        // Ida
        const foundOut = buses.find(
          b => b.marca.toLowerCase() === outboundBrand.toLowerCase()
        );
        console.log(`Bus de ida buscado (${outboundBrand}):`, foundOut);
        if (!foundOut) throw new Error(`Bus de ida '${outboundBrand}' no encontrado`);
        if (!active) return;
        setBusOut(foundOut);

        const respOut = await fetch(
          `${BASE_URL}/viajes/obtenerAsientosDisponibles?idViaje=${outboundTripId}`
        );
        console.log('Fetch asientos ida status:', respOut.status);
        if (!respOut.ok) throw new Error('Error al obtener asientos de ida');
        const outData: number[] = await respOut.json();
        console.log('Asientos ida recibidos:', outData);
        if (active) setOutSeats(outData);

        // Vuelta
        if (tripType === 'roundtrip') {
          const foundRet = buses.find(
            b => b.marca.toLowerCase() === returnBrand.toLowerCase()
          );
          console.log(`Bus de vuelta buscado (${returnBrand}):`, foundRet);
          if (!foundRet) throw new Error(`Bus de vuelta '${returnBrand}' no encontrado`);
          if (!active) return;
          setBusRet(foundRet);

          const respRet = await fetch(
            `${BASE_URL}/viajes/obtenerAsientosDisponibles?idViaje=${returnTripId}`
          );
          console.log('Fetch asientos vuelta status:', respRet.status);
          if (!respRet.ok) throw new Error('Error al obtener asientos de vuelta');
          const retData: number[] = await respRet.json();
          console.log('Asientos vuelta recibidos:', retData);
          if (active) setRetSeats(retData);
        }
        console.log('--- Fin de load() ---');
      } catch (e) {
        console.error('Error en load():', e);
        Alert.alert('Error', (e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [tripType]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkBlue} size="large" />
      </View>
    );
  }

  // Construye matriz de asientos
  const buildMatrix = (
    bus: Bus,
    seats: number[]
  ): ({ number: number; available: boolean } | null)[][] => {
    const total = bus.cant_asientos;
    const cols = 4;
    const rows = Math.ceil(total / cols);
    const matrix: ({ number: number; available: boolean } | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: ({ number: number; available: boolean } | null)[] = [];
      for (let c = 0; c < cols; c++) {
        const num = r * cols + c + 1;
        row.push(
          num <= total
            ? { number: num, available: seats.includes(num) }
            : null
        );
      }
      matrix.push(row);
    }
    return matrix;
  };

  const toggleSeat = (num: number, outbound: boolean) => {
    if (outbound) {
      setSelOut(prev =>
        prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]
      );
    } else {
      setSelRet(prev =>
        prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]
      );
    }
  };

  const matrixOut = busOut ? buildMatrix(busOut, outSeats) : [];
  console.log('Matriz ida:', matrixOut);
  const matrixRet =
    tripType === 'roundtrip' && busRet
      ? buildMatrix(busRet, retSeats)
      : [];
  console.log('Matriz vuelta:', matrixRet);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seleccioná tu asiento</Text>

      {/* Ida */}
      {busOut && (
        <>
          <Text style={styles.sectionTitle}>
            Asientos Ida ({outboundBrand})
          </Text>
          {matrixOut.map((row, ri) => (
            <View key={`out-row-${ri}`} style={styles.row}>
              {row.map((seat, ci) =>
                seat ? (
                  <TouchableOpacity
                    key={`out-${seat.number}`}
                    style={[
                      styles.seat,
                      !seat.available && styles.seatUnavailable,
                      selOut.includes(seat.number) && styles.seatSelected,
                      ci === 1 && styles.aisle,
                    ]}
                    disabled={!seat.available}
                    onPress={() => toggleSeat(seat.number, true)}
                  >
                    <Text style={styles.seatText}>{seat.number}</Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    key={`out-empty-${ri}-${ci}`}
                    style={[styles.seat, styles.seatEmpty, ci === 1 && styles.aisle]}
                  />
                )
              )}
            </View>
          ))}
        </>
      )}

      {/* Vuelta */}
      {tripType === 'roundtrip' && busRet && (
        <>
          <Text style={styles.sectionTitle}>
            Asientos Vuelta ({returnBrand})
          </Text>
          {matrixRet.map((row, ri) => (
            <View key={`ret-row-${ri}`} style={styles.row}>
              {row.map((seat, ci) =>
                seat ? (
                  <TouchableOpacity
                    key={`ret-${seat.number}`}
                    style={[
                      styles.seat,
                      !seat.available && styles.seatUnavailable,
                      selRet.includes(seat.number) && styles.seatSelected,
                      ci === 1 && styles.aisle,
                    ]}
                    disabled={!seat.available}
                    onPress={() => toggleSeat(seat.number, false)}
                  >
                    <Text style={styles.seatText}>{seat.number}</Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    key={`ret-empty-${ri}-${ci}`}
                    style={[styles.seat, styles.seatEmpty, ci === 1 && styles.aisle]}
                  />
                )
              )}
            </View>
          ))}
        </>
      )}

      <Button
        title="Ir a pagar"
        color={colors.solarYellow}
        disabled={
          selOut.length === 0 ||
          (tripType === 'roundtrip' && selRet.length === 0)
        }
        onPress={() =>
          navigation.navigate('Payment', {
            outboundSeats: selOut,
            returnSeats: selRet,
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.skyBlue,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.skyBlue,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.darkBlue,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: colors.darkBlue,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'center',
  },
  seat: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.midBlue,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.busWhite,
    marginHorizontal: 4,
  },
  seatUnavailable: {
    backgroundColor: '#ccc',
  },
  seatSelected: {
    backgroundColor: colors.lightBlue,
    borderColor: colors.darkBlue,
  },
  seatEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  seatText: {
    color: colors.darkBlue,
  },
  aisle: {
    marginHorizontal: 12,
  },
});
