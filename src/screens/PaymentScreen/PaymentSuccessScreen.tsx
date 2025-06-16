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

function parseQueryParams(url: string): Record<string, string> {
  try {
    const query = url.includes('?') ? url.split('?')[1] : url;
    const params = new URLSearchParams(query);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      result[key] = decodeURIComponent(value);
    }
    return result;
  } catch (e) {
    console.warn('Error al parsear la URL:', e);
    return {};
  }
}

export default function PaymentSuccessScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = route.params as any;
  const url = params?.url || '';

  const parsed = parseQueryParams(url);

  const {
    idCompraIda,
    idCompraVuelta,
    origin,
    destination,
    departDate,
    returnDate,
    totalPrice,
    outboundHoraInicio,
    outboundHoraFin,
    outboundBusId,
    outboundSeats,
    returnHoraInicio,
    returnHoraFin,
    returnBusId,
    returnSeats,
  } = parsed;

  useEffect(() => {
    const idaId = Number(idCompraIda);
    const vueltaId = idCompraVuelta ? Number(idCompraVuelta) : null;

    if (idaId) cambiarEstadoCompra(idaId).catch(console.error);
    if (vueltaId) cambiarEstadoCompra(vueltaId).catch(console.error);
  }, [idCompraIda, idCompraVuelta]);

  const handleGeneratePDF = async () => {
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
          <p><strong>Total pago:</strong> $${totalPrice}</p>
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
