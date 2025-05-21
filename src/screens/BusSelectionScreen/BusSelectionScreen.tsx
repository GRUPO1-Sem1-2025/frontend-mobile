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
import { getAvailableSeats } from '../../services/seats';
import { Bus } from '../../types/bus';
import { Trip } from '../../types/trips';

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
        setLoading(true);
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
    }

    load();
    return () => { active = false; };
  }, [tripType, viajeId, returnViajeId, busId, returnBusId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.darkBlue} size="large" />
      </View>
    );
  }

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
      setSelOut(prev => prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]);
    } else {
      setSelRet(prev => prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num]);
    }
  };

  const matrixOut = busOut ? buildMatrix(busOut, outSeats) : [];
  const matrixRet = tripType === 'roundtrip' && busRet && retSeats.length > 0
    ? buildMatrix(busRet, retSeats)
    : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seleccioná tu asiento</Text>

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
                <View key={`ret-empty-${ri}-${ci}`} style={[styles.seat, styles.seatEmpty, ci === 1 && styles.aisle]} />
              ))}
            </View>
          ))}
        </>
      )}

      <Button
        title="Ir a pagar"
        color={colors.solarYellow}
        disabled={selOut.length === 0 || (tripType === 'roundtrip' && selRet.length === 0)}
        onPress={() =>
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
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.skyBlue, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.skyBlue },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.darkBlue },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, color: colors.darkBlue },
  row: { flexDirection: 'row', marginBottom: 8, justifyContent: 'center' },
  seat: { width: 40, height: 40, borderWidth: 1, borderColor: colors.midBlue, borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.busWhite, marginHorizontal: 4 },
  seatUnavailable: { backgroundColor: '#ccc' },
  seatSelected: { backgroundColor: colors.lightBlue, borderColor: colors.darkBlue },
  seatEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  seatText: { color: colors.darkBlue },
  aisle: { marginHorizontal: 12 },
});
