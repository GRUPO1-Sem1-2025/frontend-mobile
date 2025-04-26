import React, { useState, useEffect } from 'react';
import {
  View, Text, ActivityIndicator, FlatList, StyleSheet, Button, Alert
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getActiveBuses } from '../../services/buses';
import { Bus } from '../../types/bus';

type RouteParams = { busId: number };

export default function BusSelectionScreen() {
  const { busId } = useRoute().params as RouteParams;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await getActiveBuses();
        // filtra solo el bus solicitado (si tu API no lo hace ya)
        setBuses(all.filter(b => b.id === busId));
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [busId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <FlatList
      data={buses}
      keyExtractor={b => b.id.toString()}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>Sin buses</Text>}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text>Marca: {item.marca}</Text>
          <Text>Asientos totales: {item.cant_asientos}</Text>
          <Text>Activo: {item.activo ? 'Sí' : 'No'}</Text>
          <Button title="Usar este bus" onPress={() => {/* ... */}} />
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
