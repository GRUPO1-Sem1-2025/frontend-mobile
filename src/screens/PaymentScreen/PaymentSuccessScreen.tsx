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
import * as IntentLauncher from 'expo-intent-launcher';
import * as MailComposer from 'expo-mail-composer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cambiarEstadoCompra, guardarReferenciaPago } from '../../services/purchases';
import * as Sharing from 'expo-sharing';

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
  } = parsed;

  const session_id = parsed.session_id;
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
    } else {
      console.log('[DEBUG] Stripe session_id recibido:', session_id);
      setStripeSessionId(session_id);

      if (idaId) {
        guardarReferenciaPago(idaId, session_id).catch((err) => {
          console.error('[DEBUG] Error guardando referencia de pago:', err);
        });
      }
    }
  }, [idCompraIda, idCompraVuelta, session_id]);

  const generarHTML = () => {
    const formattedTotal = parseFloat(totalPrice).toFixed(2);
    return `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1f2c3a; }
            h1 { text-align: center; color: green; }
            .section { border: 1px solid #91d5f4; padding: 16px; border-radius: 8px; margin-top: 20px; }
            .label { font-weight: bold; }
            .value { margin-left: 8px; }
          </style>
        </head>
        <body>
          <h1>Resumen de Compra</h1>
          <div class="section">
            <p><span class="label">Origen:</span><span class="value">${origin}</span></p>
            <p><span class="label">Destino:</span><span class="value">${destination}</span></p>
            <p><span class="label">Fecha Ida:</span><span class="value">${formatFecha(departDate)}</span></p>
            <p><span class="label">Horario Ida:</span><span class="value">${formatHora(outboundHoraInicio)} a ${formatHora(outboundHoraFin)}</span></p>
            <p><span class="label">Asientos Ida:</span><span class="value">${outboundSeats}</span></p>
            ${returnDate ? `
              <p><span class="label">Fecha Vuelta:</span><span class="value">${formatFecha(returnDate)}</span></p>
              <p><span class="label">Horario Vuelta:</span><span class="value">${formatHora(returnHoraInicio)} a ${formatHora(returnHoraFin)}</span></p>
              <p><span class="label">Asientos Vuelta:</span><span class="value">${returnSeats}</span></p>
            ` : ''}
            <p><span class="label">Total pagado:</span><span class="value">$${formattedTotal}</span></p>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async () => {
    try {
      const html = generarHTML();
      const { uri } = await Print.printToFileAsync({ html });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'La función de compartir/abrir archivos no está disponible en este dispositivo.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'public.pdf',
      });

      Alert.alert('PDF generado', 'Tu ticket se ha abierto. Puedes guardarlo en tus Descargas o compartirlo desde el visor de PDF.');
    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar o abrir el PDF.');
    }
  };

  const handleSendEmail = async () => {
    try {
      const html = generarHTML();
      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Correo no disponible', 'Este dispositivo no soporta envío de correo desde la app.');
        return;
      }

      await MailComposer.composeAsync({
        recipients: [],
        subject: 'Tu ticket de viaje',
        body: 'Adjunto encontrarás el ticket de tu compra reciente.',
        attachments: [uri],
      });
    } catch (error) {
      console.error('Error al enviar email:', error);
      Alert.alert('Error', 'No se pudo enviar el correo.');
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
          <Text style={styles.value}>{outboundSeats}</Text>
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
            <Text style={styles.value}>{returnSeats}</Text>
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

      <TouchableOpacity style={styles.secondaryButton} onPress={handleSendEmail}>
        <Text style={styles.secondaryButtonText}>Enviar por Email</Text>
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
