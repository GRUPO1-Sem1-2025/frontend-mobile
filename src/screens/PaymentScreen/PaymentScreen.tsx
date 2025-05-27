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
  } = route.params as RouteParams;

  const [originName, setOriginName] = useState('...');
  const [destinationName, setDestinationName] = useState('...');
  const [loadingLocs, setLoadingLocs] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(600); // 10 minutos

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

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          Alert.alert(
            'Tiempo caducado',
            'Su reserva ha expirado. Debe volver a seleccionar los asientos y realizar la compra nuevamente.',
            [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${min}:${s}`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  const priceOut = (outboundSeats?.length || 0) * (outboundTrip?.precioPasaje || 0);
  const priceRet = tripType === 'roundtrip' && returnTrip && returnSeats
    ? returnSeats.length * (returnTrip.precioPasaje || 0)
    : 0;
  const totalPrice = priceOut + priceRet;

  const handleStripeCheckout = async () => {
    try {
      const url = await crearSesionStripe(totalPrice);
      Linking.openURL(url);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo iniciar el pago');
    }
  };

  const handleGeneratePDF = async () => {
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Resumen de Compra</h1>
          <p><strong>Origen → Destino:</strong> ${originName} → ${destinationName}</p>
          <p><strong>Fecha Ida:</strong> ${formatDate(departDate)}</p>
          ${tripType === 'roundtrip' && returnDate ? `<p><strong>Fecha Vuelta:</strong> ${formatDate(returnDate)}</p>` : ''}
          <hr />
          <p><strong>Ómnibus Ida:</strong> ${outboundTrip.busId} - ${outboundTrip.horaInicio} a ${outboundTrip.horaFin}</p>
          <p><strong>Asientos Ida:</strong> ${outboundSeats?.join(', ') || '-'}</p>
          <p><strong>Precio Ida:</strong> $${priceOut}</p>
          ${tripType === 'roundtrip' && returnTrip && returnSeats ? `
            <p><strong>Ómnibus Vuelta:</strong> ${returnTrip.busId} - ${returnTrip.horaInicio} a ${returnTrip.horaFin}</p>
            <p><strong>Asientos Vuelta:</strong> ${returnSeats?.join(', ') || '-'}</p>
            <p><strong>Precio Vuelta:</strong> $${priceRet}</p>
          ` : ''}
          <hr />
          <p><strong>Total a Pagar:</strong> $${totalPrice}</p>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
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
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>La compra ha sido reservada de forma exitosa.</Text>
        <Text style={styles.alertMessage}>
          Recuerde que tiene <Text style={styles.alertTime}>{formatTime(remainingSeconds)}</Text> para completar el proceso de compra, de lo contrario su reserva será cancelada de forma automática.
        </Text>
      </View>

      <Text style={styles.title}>Resumen de Compra</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Origen → Destino:</Text>
        <Text style={styles.value}>{originName} → {destinationName}</Text>
        <Text style={styles.label}>Fecha Ida:</Text>
        <Text style={styles.value}>{formatDate(departDate)}</Text>
        {tripType === 'roundtrip' && returnDate && (
          <>
            <Text style={styles.label}>Fecha Vuelta:</Text>
            <Text style={styles.value}>{formatDate(returnDate)}</Text>
          </>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Ómnibus Ida:</Text>
        <Text style={styles.value}>
          {outboundTrip.busId} - {outboundTrip.horaInicio} a {outboundTrip.horaFin}
        </Text>
        <Text style={styles.label}>Asientos Ida:</Text>
        <Text style={styles.value}>{outboundSeats.join(', ')}</Text>
        <Text style={styles.label}>Precio Ida:</Text>
        <Text style={styles.value}>${priceOut}</Text>
      </View>

      {tripType === 'roundtrip' && returnTrip && returnSeats && (
        <View style={styles.block}>
          <Text style={styles.label}>Ómnibus Vuelta:</Text>
          <Text style={styles.value}>
            {returnTrip.busId} - {returnTrip.horaInicio} a {returnTrip.horaFin}
          </Text>
          <Text style={styles.label}>Asientos Vuelta:</Text>
          <Text style={styles.value}>{returnSeats.join(', ')}</Text>
          <Text style={styles.label}>Precio Vuelta:</Text>
          <Text style={styles.value}>${priceRet}</Text>
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.label}>Total a Pagar:</Text>
        <Text style={styles.total}>${totalPrice}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStripeCheckout}>
        <Text style={styles.primaryButtonText}>Pagar con Stripe</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGeneratePDF}>
        <Text style={styles.secondaryButtonText}>Descargar PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
  },
  block: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#91d5f4',
    paddingBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2c3a',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#1f2c3a',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#1f2c3a',
  },
  primaryButton: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#1f2c3a',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  alertBox: {
    backgroundColor: '#fff8e1',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#f9c94e',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2c3a',
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 14,
    color: '#1f2c3a',
  },
  alertTime: {
    fontWeight: 'bold',
    color: '#d84315',
  },
});
