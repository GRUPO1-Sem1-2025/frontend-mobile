import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cambiarEstadoCompra, guardarReferenciaPago } from '../../services/purchases';

function parseQueryParams(url: string): Record<string, string> {
  try {
    const query = url.includes('?') ? url.split('?')[1] : url;
    const params: Record<string, string> = {};
    const urlParams = new URLSearchParams(query);
    for (const [key, value] of urlParams.entries()) {
      params[key] = decodeURIComponent(value);
    }
    console.debug('[DEBUG] Parsed params:', params); // Log de los parámetros
    return params;
  } catch (e) {
    console.warn('[ERROR] Error al parsear la URL:', e);
    return {};
  }
}

function formatFecha(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatHora(hora: string) {
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

export default function PaymentSuccessScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = route.params as any;

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
    session_id,
  } = parsed;

  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  useEffect(() => {
    const idaId = Number(idCompraIda);
    const vueltaId = idCompraVuelta ? Number(idCompraVuelta) : null;

    if (idaId) cambiarEstadoCompra(idaId).catch(console.error);
    if (vueltaId) cambiarEstadoCompra(vueltaId).catch(console.error);

    if (!session_id || session_id.includes('{CHECKOUT_SESSION_ID}')) {
      Alert.alert(
        'Error',
        'Stripe no devolvió un ID de sesión válido. Verifica que el pago se haya completado correctamente.'
      );
      console.debug('[DEBUG] session_id no válido:', session_id);
    } else {
      setStripeSessionId(session_id);
      if (idaId) {
        guardarReferenciaPago(idaId, session_id).catch((err) => {
          console.error('[ERROR] Error guardando referencia de pago:', err);
        });
      }
    }
  }, [idCompraIda, idCompraVuelta, session_id]);

  const handleGeneratePDF = async () => {
    const formattedTotal = parseFloat(totalPrice).toFixed(2);
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const generateTicketHTML = (seats: string[], isReturn: boolean = false) => {
      let contenido = '';
      seats.forEach((asiento) => {
        contenido += `
        <div style="page-break-after: always; padding: 24px; font-family: sans-serif;">
          <h1 style="text-align:center;">Pasaje de Ómnibus</h1>
          <h2 style="text-align:center;">Empresa: Tecnobus</h2>
          <hr/>
          <h3 style="color: #00B0F0;">Datos del Viaje</h3>
          <p>Origen: ${origin}</p>
          <p>Destino: ${destination}</p>
          <p>Fecha: ${formatFecha(isReturn ? returnDate : departDate)}</p>
          <p>Horario: ${formatHora(isReturn ? returnHoraInicio : outboundHoraInicio)} a ${formatHora(isReturn ? returnHoraFin : outboundHoraFin)}</p>
          <p>Asiento: ${asiento}</p>
          <hr/>
          <h3 style="color: #00B0F0;">Pago</h3>
          <p>Importe: $ ${formattedTotal}</p>
          <hr/>
          <h3 style="color: #00B0F0;">Observaciones</h3>
          <ul>
            <li>Presentarse 30 minutos antes de la salida.</li>
            <li>Documento de identidad obligatorio.</li>
            <li>No se permiten cambios dentro de las 24 horas previas.</li>
          </ul>
        </div>
      `;
      });
      return contenido;
    };

    const htmlIda = generateTicketHTML(outboundSeats);
    const htmlVuelta = returnSeats && returnSeats.length > 0 ? generateTicketHTML(returnSeats, true) : '';

    const html = htmlIda + htmlVuelta;

    try {
      const { uri } = await Print.printToFileAsync({ html });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'La función de compartir no está disponible.');
        return;
      }

      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      Alert.alert('PDF generado', 'Tu ticket se ha abierto. Puedes guardarlo o compartirlo.');
    } catch (error) {
      console.error('[ERROR] Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar o abrir el PDF.');
    }
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
          <Text style={styles.value}>{formatFecha(departDate)}</Text>

          <Text style={styles.label}>Ómnibus</Text>
          <Text style={styles.value}>Bus N° {outboundBusId}</Text>

          <Text style={styles.label}>Horario</Text>
          <Text style={styles.value}>
            {formatHora(outboundHoraInicio)} a {formatHora(outboundHoraFin)}
          </Text>

          <Text style={styles.label}>Asientos</Text>
          <Text style={styles.value}>{outboundSeats.join(', ')}</Text>
        </View>

        {returnDate && (
          <View style={styles.block}>
            <Text style={styles.subTitle}>VUELTA</Text>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{formatFecha(returnDate)}</Text>

            <Text style={styles.label}>Ómnibus</Text>
            <Text style={styles.value}>Bus N° {returnBusId}</Text>

            <Text style={styles.label}>Horario</Text>
            <Text style={styles.value}>
              {formatHora(returnHoraInicio)} a {formatHora(returnHoraFin)}
            </Text>

            <Text style={styles.label}>Asientos</Text>
            <Text style={styles.value}>{returnSeats.join(', ')}</Text>
          </View>
        )}

        <View style={styles.block}>
          <Text style={styles.label}>Total pagado</Text>
          <Text style={styles.total}>$ {parseFloat(totalPrice).toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleGeneratePDF}>
        <Text style={styles.primaryButtonText}>Ver Ticket en PDF</Text>
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

