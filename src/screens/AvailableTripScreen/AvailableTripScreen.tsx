import React, { useState, useEffect } from 'react';
import {
  View, Text, ActivityIndicator, FlatList, Button, StyleSheet, Alert
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

export default function AvailableTripsScreen() {
  const { origin, destination, tripType, departDate, returnDate } =
    useRoute().params as RouteParams;
  const navigation = useNavigation<any>();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getAvailableTrips(
          origin, destination, departDate, tripType, returnDate
        );
        setTrips(data);
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [origin, destination, departDate, tripType, returnDate]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <FlatList
      data={trips}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>Sin viajes</Text>}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text>Salida: {item.horaInicio}</Text>
          <Text>Llegada: {item.horaFin}</Text>
          <Text>Asientos Disponibles: {item.cantAsientosDisponibles}</Text>
          <Text>Precio: ${item.precioPasaje}</Text>
          <Button
            title="Seleccionar"
            onPress={() =>
              navigation.navigate('BusSelection', { busId: item.busId })
            }
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  empty: { textAlign: 'center', marginTop: 32 },
  item: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
});
