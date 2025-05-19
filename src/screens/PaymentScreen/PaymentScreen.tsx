import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Trip } from '../../types/trips';

// Colores (puedes importarlos desde un archivo común)
const colors = {
  solarYellow: '#f9c94e',
  skyBlue: '#69c8f1',
  darkBlue: '#1f2c3a',
};

// Definición de parámetros que recibe la pantalla
type RouteParams = {
  origin: number;
  destination: number;
  tripType: 'oneway' | 'roundtrip';
  departDate: string;           // ISO string
  returnDate?: string;         // ISO string opcional
  outboundTrip: Trip;
  returnTrip?: Trip;
  outboundSeats: number[];
  returnSeats?: number[];
};

export default function PaymentScreen() {
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
  } = useRoute().params as RouteParams;

  // Formatea fecha y hora
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  // Calcula el precio total
  const priceOut = outboundSeats.length * outboundTrip.precioPasaje;
  const priceRet =
    tripType === 'roundtrip' && returnTrip && returnSeats
      ? returnSeats.length * returnTrip.precioPasaje
      : 0;
  const totalPrice = priceOut + priceRet;

  const handlePayPal = () => {
    // Aquí puedes integrar el SDK de PayPal o abrir un WebView
    Alert.alert('PayPal', `Redirigiendo a PayPal para pagar $${totalPrice}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resumen de Compra</Text>

      <Text style={styles.label}>Origen → Destino:</Text>
      <Text style={styles.value}>{origin} → {destination}</Text>

      <Text style={styles.label}>Fecha Ida:</Text>
      <Text style={styles.value}>{formatDate(departDate)}</Text>

      {tripType === 'roundtrip' && returnDate && (
        <>
          <Text style={styles.label}>Fecha Vuelta:</Text>
          <Text style={styles.value}>{formatDate(returnDate)}</Text>
        </>
      )}

      <Text style={styles.section}>Ómnibus Ida:</Text>
      <Text style={styles.value}>{outboundTrip.busId} - {outboundTrip.horaInicio} a {outboundTrip.horaFin}</Text>
      <Text style={styles.label}>Asientos Ida:</Text>
      <Text style={styles.value}>{outboundSeats.join(', ')}</Text>
      <Text style={styles.label}>Precio Ida:</Text>
      <Text style={styles.value}>${priceOut}</Text>

      {tripType === 'roundtrip' && returnTrip && returnSeats && (
        <>
          <Text style={styles.section}>Ómnibus Vuelta:</Text>
          <Text style={styles.value}>{returnTrip.busId} - {returnTrip.horaInicio} a {returnTrip.horaFin}</Text>
          <Text style={styles.label}>Asientos Vuelta:</Text>
          <Text style={styles.value}>{returnSeats.join(', ')}</Text>
          <Text style={styles.label}>Precio Vuelta:</Text>
          <Text style={styles.value}>${priceRet}</Text>
        </>
      )}

      <Text style={styles.section}>Total a Pagar:</Text>
      <Text style={styles.total}>${totalPrice}</Text>

      <Button
        title="Pagar con PayPal"
        color={colors.solarYellow}
        onPress={handlePayPal}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.skyBlue,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.darkBlue,
  },
  section: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkBlue,
  },
  label: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkBlue,
  },
  value: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    color: colors.darkBlue,
  },
});
