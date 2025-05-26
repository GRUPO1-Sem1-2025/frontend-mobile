import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAvailableTrips } from '../../services/trips';
import { Trip } from '../../types/trips';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#c6eefc',
  darkBlue: '#1f2c3a',
  lightBlue: '#c6eefc',
  midBlue: '#91d5f4',
  red: '#ff6b6b',
  green: '#3cb371',
};

type RouteParams = {
  origin: number;
  destination: number;
  tripType: 'oneway' | 'roundtrip';
  departDate: Date;
  returnDate?: Date;
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
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

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

  const toggleSelection = (trip: Trip, isReturn: boolean) => {
    const isSelected = isReturn
      ? selectedReturnTrip?.viajeId === trip.viajeId
      : selectedOutboundTrip?.viajeId === trip.viajeId;

    setLastSelectedId(trip.viajeId);

    if (isReturn) {
      setSelectedReturnTrip(isSelected ? null : trip);
    } else {
      setSelectedOutboundTrip(isSelected ? null : trip);
    }
  };

  const renderTrip = (
    trip: Trip,
    index: number,
    isReturn = false
  ) => {
    const isSelected = isReturn
      ? selectedReturnTrip?.viajeId === trip.viajeId
      : selectedOutboundTrip?.viajeId === trip.viajeId;

    const isUnavailable = trip.cantAsientosDisponibles === 0;

    const animationType = trip.viajeId === lastSelectedId && isSelected ? 'bounceIn' : undefined;
    const AnimatedView = animationType ? Animatable.View : View;

    return (
      <TouchableOpacity
        key={`${isReturn ? 'ret' : 'out'}-${trip.viajeId}`}
        onPress={() => toggleSelection(trip, isReturn)}
        disabled={isUnavailable}
      >
        <AnimatedView
          animation={animationType}
          duration={400}
          style={[styles.item, isUnavailable && styles.unavailableItem, isSelected && styles.selectedItem]}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.text}>Salida: {trip.horaInicio}</Text>
            {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.green} />}
          </View>
          <Text style={styles.text}>Llegada: {trip.horaFin}</Text>
          <Text style={styles.text}>Asientos: {trip.cantAsientosDisponibles}</Text>
          <Text style={styles.text}>Precio: ${trip.precioPasaje}</Text>
          {isUnavailable && (
            <View style={styles.unavailableLabel}>
              <Ionicons name="close-circle" size={16} color={colors.red} style={{ marginRight: 4 }} />
              <Text style={styles.unavailableText}>Sin asientos disponibles</Text>
            </View>
          )}
        </AnimatedView>
      </TouchableOpacity>
    );
  };

  const sections = [
    { title: 'Viaje de Ida', data: outboundTrips },
    ...(tripType === 'roundtrip' ? [{ title: 'Viaje de Vuelta', data: returnTrips }] : []),
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.darkBlue} />
      </View>
    );
  }

  if (
    !loading &&
    outboundTrips.length === 0 &&
    (tripType === 'oneway' || returnTrips.length === 0)
  ) {
    return (
      <View style={styles.loader}>
        <Ionicons name="alert-circle" size={48} color={colors.red} style={{ marginBottom: 12 }} />
        <Text style={styles.noTripsText}>
          No hay viajes disponibles para la fecha seleccionada.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.changeDateButton}
        >
          <Text style={styles.changeDateText}>Cambiar fecha</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.disabledButton]}
            onPress={() =>
              navigation.navigate('BusSelection', {
                tripType,
                viajeId: selectedOutboundTrip?.viajeId,
                returnViajeId: selectedReturnTrip?.viajeId ?? null,
                busId: selectedOutboundTrip?.busId,
                returnBusId: selectedReturnTrip?.busId ?? null,
                outboundTrip: selectedOutboundTrip,
                returnTrip: selectedReturnTrip,
                origin,
                destination,
                departDate: departDate.toISOString(),
                returnDate: returnDate?.toISOString() ?? null,
              })
            }
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.skyBlue },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.skyBlue,
  },
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
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  selectedItem: {
    backgroundColor: '#e8fff1',
    borderColor: colors.green,
    borderWidth: 2,
  },
  unavailableItem: {
    borderColor: colors.red,
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  text: {
    color: colors.darkBlue,
    fontSize: 16,
  },
  unavailableLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  unavailableText: {
    color: colors.red,
    fontWeight: '600',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: colors.solarYellow,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  continueButtonText: {
    color: colors.darkBlue,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noTripsText: {
    fontSize: 18,
    color: colors.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },
  changeDateButton: {
    backgroundColor: colors.solarYellow,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  changeDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkBlue,
  },
});
