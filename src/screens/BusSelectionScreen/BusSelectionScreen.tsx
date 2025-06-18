import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getActiveBuses } from '../../services/buses';
import { getAvailableSeats } from '../../services/seats';
import { reservarPasaje } from '../../services/purchases';
import { AuthContext } from '../../context/AuthContext';
import { Bus } from '../../types/bus';
import { Trip } from '../../types/trips';

const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#c6eefc',
  darkBlue: '#1f2c3a',
  lightBlue: '#c6eefc',
  midBlue: '#91d5f4',
  red: '#ff6b6b',
  green: '#3cb371',
  gray: '#e0e0e0',
};

type RouteParams = {
  tripType: 'oneway' | 'roundtrip';
  viajeId: number;
  returnViajeId?: number | null;
  busId: number;
  returnBusId?: number | null;
  outboundTrip: Trip;
  returnTrip?: Trip;
  origin: number;
  destination: number;
  departDate: string;
  returnDate?: string;
};

export default function BusSelectionScreen() {
  const {
    tripType,
    viajeId,
    returnViajeId,
    busId,
    returnBusId,
    outboundTrip,
    returnTrip,
    origin,
    destination,
    departDate,
    returnDate,
  } = useRoute().params as RouteParams;

  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);

  const [busOut, setBusOut] = useState<Bus | null>(null);
  const [busRet, setBusRet] = useState<Bus | null>(null);
  const [outSeats, setOutSeats] = useState<number[]>([]);
  const [retSeats, setRetSeats] = useState<number[]>([]);
  const [selOut, setSelOut] = useState<number[]>([]);
  const [selRet, setSelRet] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [reserving, setReserving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          setLoading(true);
          setLoadingMessage('Recargando asientos...');
          setSelOut([]);
          setSelRet([]);
          const buses = await getActiveBuses();

          const foundOut = buses.find(b => b.id === busId);
          if (!foundOut) throw new Error(`Bus de ida ID '${busId}' no encontrado`);
          if (!active) return;
          setBusOut(foundOut);

          const outData = await getAvailableSeats(viajeId);
          if (active) setOutSeats(outData);

          if (tripType === 'roundtrip' && returnViajeId && returnBusId) {
            const foundRet = buses.find(b => b.id === returnBusId);
            if (!foundRet) throw new Error(`Bus de vuelta ID '${returnBusId}' no encontrado`);
            if (!active) return;
            setBusRet(foundRet);

            const retData = await getAvailableSeats(returnViajeId);
            if (active) setRetSeats(retData);
          }
        } catch (e) {
          Alert.alert('Error', (e as Error).message);
        } finally {
          if (active) setLoading(false);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [tripType, viajeId, returnViajeId, busId, returnBusId])
  );

  const toggleSeat = (num: number, outbound: boolean) => {
    if (outbound) {
      setSelOut(prev => prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]);
    } else {
      setSelRet(prev => prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]);
    }
  };

  const buildMatrix = (bus: Bus, seats: number[]): ({ number: number; available: boolean } | null)[][] => {
    const total = bus.cant_asientos;
    const cols = 4;
    const rows = Math.ceil(total / cols);
    const matrix: ({ number: number; available: boolean } | null)[][] = [];

    for (let r = 0; r < rows; r++) {
      const row: ({ number: number; available: boolean } | null)[] = [];
      for (let c = 0; c < cols; c++) {
        const num = r * cols + c + 1;
        if (num <= total) {
          row.push({ number: num, available: seats.includes(num) });
        } else {
          row.push(null);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  const handleReservar = async () => {
    if (!token) return Alert.alert('Error', 'Sesión expirada');
    try {
      setReserving(true);
      const reservaIda = await reservarPasaje(token, viajeId, selOut);
const idCompraIda = reservaIda.idCompra;
let idCompraVuelta = null;
      if (tripType === 'roundtrip' && returnViajeId) {
        const reservaVuelta = await reservarPasaje(token, returnViajeId, selRet);
        idCompraVuelta = reservaVuelta.idCompra;
      }

      navigation.navigate('Payment', {
        tripType,
        outboundTrip,
        returnTrip,
        outboundSeats: selOut,
        returnSeats: selRet,
        departDate,
        returnDate,
        origin,
        destination,
        idCompraIda,
        idCompraVuelta,
      });
    } catch (e) {
      console.log('[DEBUG] Error reservando pasaje:', e);
      Alert.alert('Error', (e as Error).message);
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkBlue} size="large" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  const matrixOut = busOut ? buildMatrix(busOut, outSeats) : [];
  const matrixRet = tripType === 'roundtrip' && busRet ? buildMatrix(busRet, retSeats) : [];
  const isDisabled = selOut.length === 0 || (tripType === 'roundtrip' && selRet.length === 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seleccioná tu asiento</Text>

      <View style={styles.legend}>
        <View style={[styles.legendItem, { backgroundColor: colors.gray }]} />
        <Text style={styles.legendText}>Disponible</Text>
        <View style={[styles.legendItem, { backgroundColor: colors.green }]} />
        <Text style={styles.legendText}>Seleccionado</Text>
        <View style={[styles.legendItem, { backgroundColor: colors.red }]} />
        <Text style={styles.legendText}>Ocupado</Text>
      </View>

      {busOut && (
        <>
          <Text style={styles.sectionTitle}>Asientos Ida</Text>
          {matrixOut.map((row, ri) => (
            <View key={`out-row-${ri}`} style={styles.row}>
              {row.map((seat, ci) => seat ? (
                <TouchableOpacity
                  key={`out-${seat.number}`}
                  style={[
                    styles.seat,
                    seat.available ? styles.seatAvailable : styles.seatUnavailable,
                    selOut.includes(seat.number) && styles.seatSelected,
                    ci === 1 && styles.aisle,
                  ]}
                  disabled={!seat.available}
                  onPress={() => toggleSeat(seat.number, true)}
                >
                  <Text style={styles.seatText}>{seat.number}</Text>
                </TouchableOpacity>
              ) : (
                <View key={`out-empty-${ri}-${ci}`} style={[styles.seat, styles.seatEmpty, ci === 1 && styles.aisle]} />
              ))}
            </View>
          ))}
        </>
      )}

      {matrixRet.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Asientos Vuelta</Text>
          {matrixRet.map((row, ri) => (
            <View key={`ret-row-${ri}`} style={styles.row}>
              {row.map((seat, ci) => seat ? (
                <TouchableOpacity
                  key={`ret-${seat.number}`}
                  style={[
                    styles.seat,
                    seat.available ? styles.seatAvailable : styles.seatUnavailable,
                    selRet.includes(seat.number) && styles.seatSelected,
                    ci === 1 && styles.aisle,
                  ]}
                  disabled={!seat.available}
                  onPress={() => toggleSeat(seat.number, false)}
                >
                  <Text style={styles.seatText}>{seat.number}</Text>
                </TouchableOpacity>
              ) : (
                <View key={`ret-empty-${ri}-${ci}`} style={[styles.seat, styles.seatEmpty, ci === 1 && styles.aisle]} />
              ))}
            </View>
          ))}
        </>
      )}

      <TouchableOpacity
        style={[styles.payButton, (isDisabled || reserving) && styles.disabledButton]}
        disabled={isDisabled || reserving}
        onPress={handleReservar}
      >
        <Text style={styles.payButtonText}>{reserving ? 'Reservando...' : 'Ir a pagar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.skyBlue, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.skyBlue },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.darkBlue },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, color: colors.darkBlue },
  row: { flexDirection: 'row', marginBottom: 8, justifyContent: 'center' },
  seat: { width: 40, height: 40, borderWidth: 1, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  seatAvailable: { backgroundColor: colors.gray, borderColor: colors.midBlue },
  seatUnavailable: { backgroundColor: colors.red, borderColor: colors.red },
  seatSelected: { backgroundColor: colors.green, borderColor: colors.darkBlue },
  seatEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  seatText: { color: colors.darkBlue },
  aisle: { marginHorizontal: 12 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    width: 16,
    height: 16,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  legendText: {
    marginRight: 12,
    color: colors.darkBlue,
    fontSize: 14,
  },
  payButton: {
    backgroundColor: colors.solarYellow,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 24,
  },
  payButtonText: {
    color: colors.darkBlue,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkBlue,
  },
});
