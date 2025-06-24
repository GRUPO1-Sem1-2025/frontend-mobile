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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalities } from '../../services/locality';
import { crearSesionStripe, getReservasUsuario } from '../../services/purchases';
import { Trip } from '../../types/trips';
import { FontAwesome } from '@expo/vector-icons';

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
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const priceOut = (outboundSeats?.length || 0) * (outboundTrip?.precioPasaje || 0);
  const priceRet =
    tripType === 'roundtrip' && returnTrip && returnSeats
      ? returnSeats.length * (returnTrip.precioPasaje || 0)
      : 0;
  const totalPrice = priceOut + priceRet;

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

      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const { email } = decodeToken(token);
          const reservas = await getReservasUsuario(email);

          const match = reservas.find((r: any) =>
            r.viajeId === outboundTrip.viajeId &&
            r.numerosDeAsiento.every((n: number) => outboundSeats.includes(n))
          );

          if (match && match.descuento > 0) {
            setDiscountPercent(match.descuento);
            const discounted = totalPrice * (1 - match.descuento / 100);
            setFinalTotal(Math.round(discounted));
            return;
          }
        }
      } catch (e) {
        console.warn('Error verificando descuento:', e);
      }

      setFinalTotal(totalPrice); // sin descuento
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

  function decodeToken(token: string): { email: string } {
    try {
      const payloadBase64 = token.split('.')[1];
      // Use atob for Base64 decoding
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      return { email: payload.sub };
    } catch {
      throw new Error('Token inválido');
    }
  }

  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${min}:${s}`;
  };

  const handleStripeCheckout = async () => {
    try {
      const extraData = {
        origin: originName,
        destination: destinationName,
        departDate,
        returnDate: returnDate || '',
        outboundSeats: outboundSeats.join(','),
        returnSeats: returnSeats?.join(',') || '',
        outboundHoraInicio: outboundTrip.horaInicio,
        outboundHoraFin: outboundTrip.horaFin,
        returnHoraInicio: returnTrip?.horaInicio || '',
        returnHoraFin: returnTrip?.horaFin || '',
        outboundBusId: String(outboundTrip.busId),
        returnBusId: returnTrip ? String(returnTrip.busId) : '',
        totalPrice: String(finalTotal),
      };

      const url = await crearSesionStripe(finalTotal, idCompraIda, idCompraVuelta, extraData);
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

      <View style={styles.alertBox}>
        <Text style={styles.alertMessage}>
          Recuerde que tiene{' '}
          <Text style={styles.alertTime}>{formatTime(remainingSeconds)}</Text>{' '}
          para completar el proceso de pago.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Origen → Destino:</Text>
        <Text style={styles.value}>{originName} → {destinationName}</Text>
        <Text style={styles.label}>Fecha Ida:</Text>
        <Text style={styles.value}>{new Date(departDate).toLocaleDateString()}</Text>
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
          <Text style={styles.label}>Fecha Vuelta:</Text>
          <Text style={styles.value}>{new Date(returnDate || '').toLocaleDateString()}</Text>
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

      <View style={styles.totalBlock}>
        {discountPercent > 0 && (
          <View style={styles.discountBox}>
            <View style={styles.discountRow}>
              <FontAwesome name="ticket" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.discountText}>Descuento aplicado</Text>
            </View>
            <Text style={styles.discountAmount}>
              -{discountPercent}% (${totalPrice - finalTotal})
            </Text>
          </View>
        )}
        <Text style={styles.totalLabel}>Total a Pagar:</Text>
        <Text style={styles.total}>${finalTotal}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStripeCheckout}>
        <Text style={styles.primaryButtonText}>Pagar con Stripe</Text>
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
    fontSize: 26,
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
    fontWeight: 'bold',
  },
  block: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2c3a',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#1f2c3a',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  discountBox: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  discountAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  totalBlock: {
    backgroundColor: '#1f2c3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
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
  alertBox: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#f9c94e',
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