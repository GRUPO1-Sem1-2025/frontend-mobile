import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cambiarEstadoCompra } from '../../services/purchases';

export default function PaymentSuccessScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = route.params as any;
  const url = params?.url || '';

  useEffect(() => {
    const parsed = new URLSearchParams(url.split('?')[1]);
    const idCompraIda = Number(parsed.get('idCompraIda'));
    const idCompraVuelta = parsed.get('idCompraVuelta')
      ? Number(parsed.get('idCompraVuelta'))
      : null;

    if (idCompraIda) cambiarEstadoCompra(idCompraIda).catch(console.error);
    if (idCompraVuelta) cambiarEstadoCompra(idCompraVuelta).catch(console.error);
  }, [url]);

  const handleGeneratePDF = async () => {
    const parsed = new URLSearchParams(url.split('?')[1]);
    const origin = parsed.get('origin');
    const destination = parsed.get('destination');
    const departDate = parsed.get('departDate');
    const returnDate = parsed.get('returnDate');
    const totalPrice = parsed.get('totalPrice');

    const outboundHoraInicio = parsed.get('outboundHoraInicio');
    const outboundHoraFin = parsed.get('outboundHoraFin');
    const outboundBusId = parsed.get('outboundBusId');
    const outboundSeats = parsed.get('outboundSeats');

    const returnHoraInicio = parsed.get('returnHoraInicio');
    const returnHoraFin = parsed.get('returnHoraFin');
    const returnBusId = parsed.get('returnBusId');
    const returnSeats = parsed.get('returnSeats');

    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Resumen de Compra</h1>
          <p><strong>Origen → Destino:</strong> ${origin} → ${destination}</p>
          <p><strong>Fecha Ida:</strong> ${departDate}</p>
          <p><strong>Ómnibus Ida:</strong> Bus N° ${outboundBusId} - ${outboundHoraInicio} a ${outboundHoraFin}</p>
          <p><strong>Asientos Ida:</strong> ${outboundSeats}</p>
          ${
            returnDate
              ? `
            <hr />
            <p><strong>Fecha Vuelta:</strong> ${returnDate}</p>
            <p><strong>Ómnibus Vuelta:</strong> Bus N° ${returnBusId} - ${returnHoraInicio} a ${returnHoraFin}</p>
            <p><strong>Asientos Vuelta:</strong> ${returnSeats}</p>
          `
              : ''
          }
          <hr />
          <p><strong>Total a Pagar:</strong> $${totalPrice}</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AppDrawer' }],
    });
  };

  const parsed = new URLSearchParams(url.split('?')[1]);
  const origin = parsed.get('origin');
  const destination = parsed.get('destination');
  const departDate = parsed.get('departDate');
  const returnDate = parsed.get('returnDate');
  const totalPrice = parsed.get('totalPrice');
  const outboundHoraInicio = parsed.get('outboundHoraInicio');
  const outboundHoraFin = parsed.get('outboundHoraFin');
  const outboundBusId = parsed.get('outboundBusId');
  const outboundSeats = parsed.get('outboundSeats');
  const returnHoraInicio = parsed.get('returnHoraInicio');
  const returnHoraFin = parsed.get('returnHoraFin');
  const returnBusId = parsed.get('returnBusId');
  const returnSeats = parsed.get('returnSeats');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>✅ ¡Pago exitoso!</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Origen → Destino:</Text>
        <Text style={styles.value}>{origin} → {destination}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Fecha Ida:</Text>
        <Text style={styles.value}>{departDate}</Text>
        <Text style={styles.label}>Ómnibus Ida:</Text>
        <Text style={styles.value}>Bus N° {outboundBusId} - {outboundHoraInicio} a {outboundHoraFin}</Text>
        <Text style={styles.label}>Asientos Ida:</Text>
        <Text style={styles.value}>{outboundSeats}</Text>
      </View>

      {returnDate && (
        <View style={styles.block}>
          <Text style={styles.label}>Fecha Vuelta:</Text>
          <Text style={styles.value}>{returnDate}</Text>
          <Text style={styles.label}>Ómnibus Vuelta:</Text>
          <Text style={styles.value}>Bus N° {returnBusId} - {returnHoraInicio} a {returnHoraFin}</Text>
          <Text style={styles.label}>Asientos Vuelta:</Text>
          <Text style={styles.value}>{returnSeats}</Text>
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.label}>Total a Pagar:</Text>
        <Text style={styles.total}>${totalPrice}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleGeneratePDF}>
        <Text style={styles.primaryButtonText}>Descargar PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
        <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 16, backgroundColor: '#c6eefc' },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center', color: 'green' },
  block: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#91d5f4', paddingBottom: 12 },
  label: { fontSize: 16, fontWeight: '500', color: '#1f2c3a', marginTop: 8 },
  value: { fontSize: 16, color: '#1f2c3a' },
  total: { fontSize: 20, fontWeight: 'bold', marginVertical: 8, color: '#1f2c3a' },
  primaryButton: { backgroundColor: '#f9c94e', paddingVertical: 14, borderRadius: 8, marginTop: 20 },
  primaryButtonText: { color: '#1f2c3a', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#1f2c3a', paddingVertical: 14, borderRadius: 8, marginTop: 12 },
  secondaryButtonText: { color: '#ffffff', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
});
