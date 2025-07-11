import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ToastAndroid,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cambiarEstadoCompra, guardarReferenciaPago } from '../../services/purchases';
import QRCode from 'qrcode';

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
    session_id,
  } = parsed;

  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  useEffect(() => {
    const idaId = Number(idCompraIda);
    const vueltaId = idCompraVuelta ? Number(idCompraVuelta) : null;

    if (idaId) cambiarEstadoCompra(idaId).catch(console.error);
    if (vueltaId) cambiarEstadoCompra(vueltaId).catch(console.error);

    if (!session_id || session_id.includes('{CHECKOUT_SESSION_ID}')) {
      Alert.alert('Error', 'Stripe no devolvió un ID de sesión válido.');
    } else {
      setStripeSessionId(session_id);
      if (idaId) {
        guardarReferenciaPago(idaId, session_id).catch(console.error);
      }
    }
  }, [idCompraIda, idCompraVuelta, session_id]);

  const generarTicketHTML = async () => {
    const asset = Asset.fromModule(require('../../../assets/icon.png'));
    await asset.downloadAsync();
    const base64Logo = await FileSystem.readAsStringAsync(asset.localUri || '', {
      encoding: FileSystem.EncodingType.Base64,
    });

    const asientosCompletos = [...outboundSeats, ...(returnSeats || [])];
    let contenido = '';

    for (const asiento of asientosCompletos) {
      const esIda = outboundSeats.includes(asiento);
      const fechaSalida = esIda ? departDate : returnDate;
      const horaSalida = esIda ? outboundHoraInicio : returnHoraInicio;
      const horaArribo = esIda ? outboundHoraFin : returnHoraFin;

      const qrControl = await QRCode.toDataURL(
        `${origin} - ${destination} - ${fechaSalida} - ${horaSalida} - ${asiento}`
      );

      const qrAnden =
        origin === 'Montevideo' && esIda
          ? await QRCode.toDataURL(
              `TECNOBUS,${formatFecha(fechaSalida)},${formatHora(horaSalida)},Si`
            )
          : '';

      contenido += `
        <div style="page-break-after: always; padding: 24px; font-family: sans-serif;">
          <img src="data:image/png;base64,${base64Logo}" style="width: 100px; display: block; margin: 0 auto 20px;" />
          <h1 style="text-align:center;">Pasaje de Ómnibus</h1>
          <h2 style="text-align:center;">Empresa: Tecnobus</h2>
          <hr/>
          <h3 style="color: #00B0F0;">Datos del Viaje</h3>
          <p>Origen: ${origin}</p>
          <p>Destino: ${destination}</p>
          <p>Fecha: ${formatFecha(fechaSalida)}</p>
          <p>Horario: ${formatHora(horaSalida)} a ${formatHora(horaArribo)}</p>
          <p>Asiento: ${asiento}</p>
          <hr/>
          <h3 style="color: #00B0F0;">Pago</h3>
          <p>Importe: $ ${parseFloat(totalPrice).toFixed(2)}</p>
          <hr/>
          <h3 style="color: #00B0F0;">Observaciones</h3>
          <ul>
            <li>Presentarse 30 minutos antes de la salida.</li>
            <li>Documento de identidad obligatorio.</li>
            <li>No se permiten cambios dentro de las 24 horas previas.</li>
          </ul>
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <div style="text-align: center;">
              <p style="font-weight: bold;">Control</p>
              <img src="${qrControl}" style="width: 100px;" />
            </div>
            ${
              qrAnden
                ? `<div style="text-align: center;">
                    <p style="font-weight: bold;">Acceso a andenes</p>
                    <img src="${qrAnden}" style="width: 100px;" />
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    }

    return `<html><body>${contenido}</body></html>`;
  };

const handleGeneratePDF = async () => {
  try {
    console.log('[DEBUG] Solicitando permisos de MediaLibrary...');
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[DEBUG] Permiso de MediaLibrary denegado');
      Alert.alert('Permiso denegado', 'No se pudo acceder al almacenamiento.');
      return;
    }

    console.log('[DEBUG] Generando HTML del ticket...');
    const html = await generarTicketHTML();

    console.log('[DEBUG] Creando PDF con expo-print...');
    const { uri } = await Print.printToFileAsync({ html });
    console.log('[DEBUG] PDF generado en:', uri);

    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `ticket-${idCompraIda}-${fecha}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;

    console.log(`[DEBUG] Copiando PDF a nueva ruta con nombre personalizado: ${newPath}`);
    await FileSystem.copyAsync({ from: uri, to: newPath });

    console.log('[DEBUG] Creando asset en MediaLibrary...');
    const asset = await MediaLibrary.createAssetAsync(newPath);

    console.log('[DEBUG] Agregando asset al álbum TicketsTecnobus...');
    await MediaLibrary.createAlbumAsync('TicketsTecnobus', asset, false);

    if (await Sharing.isAvailableAsync()) {
      console.log('[DEBUG] Compartiendo PDF con expo-sharing...');
      await Sharing.shareAsync(newPath, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } else {
      console.log('[DEBUG] Sharing no disponible en este dispositivo');
    }

    if (Platform.OS === 'android') {
      ToastAndroid.show(`Guardado como ${fileName}`, ToastAndroid.LONG);
    } else {
      Alert.alert('PDF guardado', `Ticket guardado como ${fileName}.`);
    }

    console.log('[DEBUG] Proceso completado con éxito ✅');

  } catch (error) {
    console.error('[ERROR] Error generando o guardando PDF:', error);
    Alert.alert('Error', 'No se pudo generar o guardar el PDF.');
  }
};

  const handleSendEmail = async () => {
    const html = await generarTicketHTML();
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Correo no disponible', 'Este dispositivo no soporta envío de correo desde la app.');
      return;
    }

    try {
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
