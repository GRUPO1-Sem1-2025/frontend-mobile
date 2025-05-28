import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompras, getReservas, calificarViaje } from '../../services/reservations';

export default function TravelsScreens() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [token, setToken] = useState('');
  const [calificaciones, setCalificaciones] = useState<{ [viajeId: number]: number }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (!storedToken) throw new Error('Token no encontrado');

        setToken(storedToken);

        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const email = payload.sub;
        setUserEmail(email);

        const [reservasData, comprasData] = await Promise.all([
          getReservas(email),
          getCompras(email),
        ]);

        setReservas(reservasData || []);
        setCompras(comprasData || []);

        // TODO: Cuando esté disponible el endpoint, cargar calificaciones reales aquí
        const dummyRatings = comprasData.reduce((acc: any, comp: any) => {
          if (comp.viajeId === 16) acc[16] = 4; // simula viaje calificado
          return acc;
        }, {});
        setCalificaciones(dummyRatings);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRate = async (viajeId: number, stars: number) => {
    try {
      await calificarViaje(viajeId, stars, token);
      setCalificaciones(prev => ({ ...prev, [viajeId]: stars }));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo calificar el viaje');
    }
  };

  const renderStars = (viajeId: number) => {
    const current = calificaciones[viajeId] || 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRate(viajeId, star)}
            disabled={current > 0}
          >
            <FontAwesome
              name="star"
              size={20}
              color={star <= current ? '#f9c94e' : '#ccc'}
              style={{ marginHorizontal: 2 }}
            />
          </TouchableOpacity>
        ))}
        {current > 0 && (
          <Text style={styles.ratedText}>Calificado: {current}/5</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f2c3a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mis Viajes</Text>

      <Text style={styles.sectionTitle}>Reservas</Text>
      {reservas.length === 0 ? (
        <Text style={styles.message}>No tenés reservas activas.</Text>
      ) : (
        reservas.map((res, index) => (
          <View key={`res-${index}`} style={styles.card}>
            <Text style={styles.cardText}>Viaje ID: {res.viajeId}</Text>
            <Text style={styles.cardText}>Asientos: {res.numerosDeAsiento.join(', ')}</Text>
            <Text style={styles.cardText}>Estado: {res.estadoCompra}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Compras</Text>
      {compras.length === 0 ? (
        <Text style={styles.message}>No tenés compras realizadas.</Text>
      ) : (
        compras.map((comp, index) => (
          <View key={`comp-${index}`} style={styles.card}>
            <Text style={styles.cardText}>Viaje ID: {comp.viajeId}</Text>
            <Text style={styles.cardText}>Asientos: {comp.numerosDeAsiento.join(', ') || 'No asignados'}</Text>
            <Text style={styles.cardText}>Estado: {comp.estadoCompra}</Text>
            {renderStars(comp.viajeId)}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#c6eefc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#c6eefc',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 16,
    color: '#1f2c3a',
  },
  sectionTitle: {
    fontSize: 20,
    marginTop: 16,
    color: '#1f2c3a',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#1f2c3a',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2c3a',
  },
  message: {
    fontSize: 16,
    color: '#1f2c3a',
    marginTop: 8,
  },
});
