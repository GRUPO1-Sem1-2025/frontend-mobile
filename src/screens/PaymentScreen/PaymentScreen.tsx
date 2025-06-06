import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getLocalities } from '../../services/locality';
import { crearSesionStripe } from '../../services/purchases';
import { Trip } from '../../types/trips';

type RouteParams = {
  origin: number;
  destination: number;
  tripType: 'oneway' | 'roundtrip';
  departDate: string;
  returnDate?: string;
  outboundTrip: Trip;
  returnTrip?: Trip;
  outboundSeats: number[];
  returnSeats?: number[];
  idCompraIda: number;
  idCompraVuelta: number | null;
};

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();

  const {
    origin,
    destination,
    tripType,
    departDate,
    returnDate,
    outboundTrip,
    returnTrip,
    outboundSeats,
    returnSeats,
    idCompraIda,
    idCompraVuelta,
  } = route.params as RouteParams;

  const [originName, setOriginName] = useState('...');
  const [destinationName, setDestinationName] = useState('...');
  const [loadingLocs, setLoadingLocs] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const locs = await getLocalities();
        const from = locs.find(l => Number(l.id) === Number(origin));
        const to = locs.find(l => Number(l.id) === Number(destination));
        setOriginName(from ? `${from.nombre}, ${from.departamento}` : 'Desconocido');
        setDestinationName(to ? `${to.nombre}, ${to.departamento}` : 'Desconocido');
      } catch (e) {
        console.warn('Error cargando localidades', e);
      } finally {
        setLoadingLocs(false);
      }
    })();
  }, []);

  const priceOut = (outboundSeats?.length || 0) * (outboundTrip?.precioPasaje || 0);
  const priceRet = tripType === 'roundtrip' && returnTrip && returnSeats
    ? returnSeats.length * (returnTrip.precioPasaje || 0)
    : 0;
  const totalPrice = priceOut + priceRet;

const handleStripeCheckout = async () => {
  try {
    const extraData = {
      origin: originName,
      destination: destinationName,
      departDate,
      returnDate: returnDate || '',
      outboundSeats: outboundSeats.join(','),
      returnSeats: returnSeats?.join(',') || '',
    };

    const url = await crearSesionStripe(totalPrice, idCompraIda, idCompraVuelta, extraData);
    Linking.openURL(url);
  } catch (error: any) {
    console.error(error);
    Alert.alert('Error', error.message || 'No se pudo iniciar el pago');
  }
};

  if (loadingLocs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f2c3a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resumen de Compra</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Origen → Destino:</Text>
        <Text style={styles.value}>{originName} → {destinationName}</Text>
        <Text style={styles.label}>Fecha Ida:</Text>
        <Text style={styles.value}>{departDate}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStripeCheckout}>
        <Text style={styles.primaryButtonText}>Pagar con Stripe</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 16, backgroundColor: '#c6eefc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#c6eefc' },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center', color: '#1f2c3a' },
  block: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#91d5f4', paddingBottom: 12 },
  label: { fontSize: 16, fontWeight: '500', color: '#1f2c3a', marginTop: 8 },
  value: { fontSize: 16, color: '#1f2c3a' },
  primaryButton: { backgroundColor: '#f9c94e', paddingVertical: 14, borderRadius: 8, marginTop: 20 },
  primaryButtonText: { color: '#1f2c3a', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
});
