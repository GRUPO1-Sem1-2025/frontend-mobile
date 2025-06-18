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

  // Si hay una URL (deep link), parseamos sus parámetros. Si no, usamos params directo.
  const parsed = params?.url ? parseQueryParams(params.url) : params;

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

  console.log('[DEBUG] route.params:', route.params);
  console.log('[DEBUG] parsed data:', parsed);

  useEffect(() => {
    const idaId = Number(idCompraIda);
    const vueltaId = idCompraVuelta ? Number(idCompraVuelta) : null;
    console.log('[DEBUG] idCompraIda:', idCompraIda);
    console.log('[DEBUG] idCompraVuelta:', idCompraVuelta);
    if (idaId) cambiarEstadoCompra(idaId).catch(console.error);
    if (vueltaId) cambiarEstadoCompra(vueltaId).catch(console.error);

  }, [idCompraIda, idCompraVuelta]);

  const handleGeneratePDF = async () => {
   const html = `
  <html>
    <head>
      <style>
        body {
          font-family: sans-serif;
          padding: 24px;
          color: #1f2c3a;
        }
        h1 {
          color: green;
          text-align: center;
        }
        .section {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid #91d5f4;
          border-radius: 8px;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .sub-title {
          font-size: 18px;
          font-weight: bold;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .label {
          font-weight: 600;
          margin-top: 8px;
        }
        .value {
          margin-left: 8px;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          margin-top: 12px;
          color: #1f2c3a;
        }
      </style>
    </head>
    <body>
      <h1>Resumen de Compra</h1>

      <div class="section">
        <div class="section-title">Datos del Viaje</div>
        <p><span class="label">Origen:</span><span class="value">${origin}</span></p>
        <p><span class="label">Destino:</span><span class="value">${destination}</span></p>

        <div class="sub-title">Ida</div>
        <p><span class="label">Fecha:</span><span class="value">${departDate}</span></p>
        <p><span class="label">Ómnibus:</span><span class="value">Bus N° ${outboundBusId}</span></p>
        <p><span class="label">Horario:</span><span class="value">${outboundHoraInicio} a ${outboundHoraFin}</span></p>
        <p><span class="label">Asientos:</span><span class="value">${outboundSeats}</span></p>

        ${
          returnDate
            ? `
          <div class="sub-title">Vuelta</div>
          <p><span class="label">Fecha:</span><span class="value">${returnDate}</span></p>
          <p><span class="label">Ómnibus:</span><span class="value">Bus N° ${returnBusId}</span></p>
          <p><span class="label">Horario:</span><span class="value">${returnHoraInicio} a ${returnHoraFin}</span></p>
          <p><span class="label">Asientos:</span><span class="value">${returnSeats}</span></p>
        `
            : ''
        }

        <p class="total">Total pagado: $${totalPrice}</p>
      </div>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del viaje</Text>

        <View style={styles.block}>
          <Text style={styles.label}>Origen</Text>
          <Text style={styles.value}>{origin}</Text>

          <Text style={styles.label}>Destino</Text>
          <Text style={styles.value}>{destination}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.subTitle}>IDA</Text>
          <Text style={styles.label}>Fecha</Text>
          <Text style={styles.value}>{departDate}</Text>

          <Text style={styles.label}>Ómnibus</Text>
          <Text style={styles.value}>Bus N° {outboundBusId}</Text>

          <Text style={styles.label}>Horario</Text>
          <Text style={styles.value}>{outboundHoraInicio} a {outboundHoraFin}</Text>

          <Text style={styles.label}>Asientos</Text>
          <Text style={styles.value}>{outboundSeats}</Text>
        </View>

        {returnDate && (
          <View style={styles.block}>
            <Text style={styles.subTitle}>VUELTA</Text>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{returnDate}</Text>

            <Text style={styles.label}>Ómnibus</Text>
            <Text style={styles.value}>Bus N° {returnBusId}</Text>

            <Text style={styles.label}>Horario</Text>
            <Text style={styles.value}>{returnHoraInicio} a {returnHoraFin}</Text>

            <Text style={styles.label}>Asientos</Text>
            <Text style={styles.value}>{returnSeats}</Text>
          </View>
        )}

        <View style={styles.block}>
          <Text style={styles.label}>Total pagado</Text>
          <Text style={styles.total}>$ {totalPrice}</Text>
        </View>
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
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2c3a',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#1f2c3a',
  },
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
