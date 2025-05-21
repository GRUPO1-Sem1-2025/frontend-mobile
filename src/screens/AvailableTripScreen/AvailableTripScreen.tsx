import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAvailableTrips } from '../../services/trips';
import { Trip } from '../../types/trips';

type RouteParams = {
  origin: number;
  destination: number;
  tripType: 'oneway' | 'roundtrip';
  departDate: Date;
  returnDate?: Date;
};

const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#69c8f1',
  darkBlue: '#1f2c3a',
  lightBlue: '#c6eefc',
  midBlue: '#91d5f4',
};

export default function AvailableTripsScreen() {
  const { origin, destination, tripType, departDate, returnDate } =
    useRoute().params as RouteParams;
  const navigation = useNavigation<any>();

  const [outboundTrips, setOutboundTrips] = useState<Trip[]>([]);
  const [returnTrips, setReturnTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<Trip | null>(null);
  const [selectedReturnTrip, setSelectedReturnTrip] = useState<Trip | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const out = await getAvailableTrips(
          origin,
          destination,
          departDate,
          'oneway'
        );
        setOutboundTrips(out);

        if (tripType === 'roundtrip' && returnDate) {
          const ret = await getAvailableTrips(
            destination,
            origin,
            returnDate,
            'oneway'
          );
          setReturnTrips(ret);
        }
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [origin, destination, departDate, tripType, returnDate]);

  const canContinue =
    selectedOutboundTrip !== null &&
    (tripType === 'oneway' || selectedReturnTrip !== null);

  const renderTrip = (
    trip: Trip,
    index: number,
    isReturn = false
  ) => {
    const isSelected = isReturn
      ? selectedReturnTrip?.viajeId === trip.viajeId
      : selectedOutboundTrip?.viajeId === trip.viajeId;

    return (
      <TouchableOpacity
        key={`${isReturn ? 'ret' : 'out'}-${trip.viajeId}`}
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() =>
          isReturn
            ? setSelectedReturnTrip(trip)
            : setSelectedOutboundTrip(trip)
        }
      >
        <Text style={styles.text}>Salida: {trip.horaInicio}</Text>
        <Text style={styles.text}>Llegada: {trip.horaFin}</Text>
        <Text style={styles.text}>Asientos: {trip.cantAsientosDisponibles}</Text>
        <Text style={styles.text}>Precio: ${trip.precioPasaje}</Text>
      </TouchableOpacity>
    );
  };

  const sections = [
    { title: 'Viaje de Ida', data: outboundTrips },
    ...(tripType === 'roundtrip' ? [{ title: 'Viaje de Vuelta', data: returnTrips }] : []),
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => `trip-${item.viajeId}`}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) =>
          renderTrip(item, index, section.title === 'Viaje de Vuelta')
        }
        ListFooterComponent={() => (
          <Button
            title="Continuar"
            color={colors.solarYellow}
            disabled={!canContinue}
            onPress={() =>
              navigation.navigate('BusSelection', {
                tripType,
                viajeId: selectedOutboundTrip?.viajeId,
                returnViajeId: selectedReturnTrip?.viajeId ?? null,
                busId: selectedOutboundTrip?.busId,
                returnBusId: selectedReturnTrip?.busId ?? null,
                outboundTrip: selectedOutboundTrip, // ✅
                returnTrip: selectedReturnTrip,     // ✅
                origin,
                destination,
                departDate: departDate.toISOString(),
                returnDate: returnDate?.toISOString() ?? null,
              })
            }
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.skyBlue },
  loader: { flex: 1, justifyContent: 'center' },
  listContainer: { padding: 16 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkBlue,
    backgroundColor: colors.solarYellow,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 16,
  },
  item: {
    backgroundColor: colors.busWhite,
    borderColor: colors.midBlue,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginVertical: 8,
  },
  selectedItem: { backgroundColor: colors.lightBlue, borderColor: colors.darkBlue },
  text: { color: colors.darkBlue, fontSize: 16 },
});
