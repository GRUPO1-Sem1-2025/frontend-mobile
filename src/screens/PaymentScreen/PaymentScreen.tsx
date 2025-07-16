import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRef } from 'react';
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
  origin: number | string;
  destination: number | string;
  tripType: 'oneway' | 'roundtrip';
  departDate: string;
  returnDate?: string;
  outboundTrip: Trip;
  returnTrip?: Trip;
  outboundSeats: number[];
  returnSeats?: number[];
  idCompraIda: number;
  idCompraVuelta: number | null;
  isTotalPrice?: boolean;
  totalPrice?: number;
  discountPercent?: number;
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
    isTotalPrice = false,
    totalPrice = 0,
    discountPercent: initialDiscountPercent = 0,
  } = route.params as RouteParams;

  const [originName, setOriginName] = useState('...');
  const [destinationName, setDestinationName] = useState('...');
  const [loadingLocs, setLoadingLocs] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(initialDiscountPercent);
  const [finalTotal, setFinalTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos

  const outCount = outboundSeats.length;
  const retCount = returnSeats?.length || 0;

  let priceOutOriginal = outboundTrip.precioPasaje;
  let priceOutFinal = priceOutOriginal;

  let priceRetOriginal = returnTrip?.precioPasaje || 0;
  let priceRetFinal = priceRetOriginal;

  useEffect(() => {
    (async () => {
      try {
        const locs = await getLocalities();
        const from = typeof origin === 'number' ? locs.find(l => Number(l.id) === Number(origin)) : null;
        const to = typeof destination === 'number' ? locs.find(l => Number(l.id) === Number(destination)) : null;
        setOriginName(from ? `${from.nombre}, ${from.departamento}` : String(origin));
        setDestinationName(to ? `${to.nombre}, ${to.departamento}` : String(destination));
      } catch (e) {
        setOriginName(String(origin));
        setDestinationName(String(destination));
      }

      if (!isTotalPrice) {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const email = payload.sub;
            const reservas = await getReservasUsuario(email);
            const match = reservas.find((r: any) =>
              r.viajeId === outboundTrip.viajeId &&
              JSON.stringify(r.numerosDeAsiento.sort()) === JSON.stringify(outboundSeats.sort())
            );
            if (match?.descuento) {
              setDiscountPercent(match.descuento);
            }
          }
        } catch (e) {
          console.warn('Error verificando descuento:', e);
        }
      }

      setLoadingLocs(false);
    })();
  }, []);

  useEffect(() => {
    const totalSinDescuento =
      outboundTrip.precioPasaje * outCount +
      (returnTrip?.precioPasaje || 0) * retCount;

    if (isTotalPrice) {
      setFinalTotal(Math.round(totalPrice));
    } else {
      const conDescuento = discountPercent > 0
        ? totalSinDescuento * (1 - discountPercent / 100)
        : totalSinDescuento;
      setFinalTotal(Math.round(conDescuento));
    }
  }, [discountPercent, outboundTrip, returnTrip, totalPrice]);

const timeRef = useRef(timeLeft);
useEffect(() => {
  timeRef.current = timeLeft;
}, [timeLeft]);

useFocusEffect(
  React.useCallback(() => {
    let interval: NodeJS.Timeout;

    if (timeRef.current > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            Alert.alert(
              'Tiempo expirado',
              'El tiempo para completar el pago ha expirado.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval); // se limpia al perder el foco
  }, [])
);

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const formatWithDiscount = (final: number, original: number) => {
    if (discountPercent > 0 && original > final) {
      return (
        <Text style={styles.value}>
          ${final}{' '}
          <Text style={{ color: '#d84315' }}>← ${original}</Text>
        </Text>
      );
    }
    return <Text style={styles.value}>${final}</Text>;
  };

  const formatDate = (str: string) => {
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleStripeCheckout = async () => {
    const data = {
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
    try {
      const url = await crearSesionStripe(finalTotal, idCompraIda, idCompraVuelta, data);
      Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo iniciar el pago');
    }
  };

  const subtotalOut = priceOutFinal * outCount;
  const subtotalOutOriginal = priceOutOriginal * outCount;
  const subtotalRet = priceRetFinal * retCount;
  const subtotalRetOriginal = priceRetOriginal * retCount;

  return (
    <ScrollView contentContainerStyle={styles.container}>
<View style={styles.alertBox}>
  <Text style={styles.alertMessage}>
    Tenés <Text style={styles.alertTime}>{formatTime(timeLeft)}</Text> para completar tu compra.
    Si no realizás el pago antes de que el tiempo expire, la reserva se cancelará automáticamente.
  </Text>
</View>
      {loadingLocs ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>IDA</Text>
            <Text style={styles.label}>Origen:</Text>
            <Text style={styles.value}>{originName}</Text>

            <Text style={styles.label}>Destino:</Text>
            <Text style={styles.value}>{destinationName}</Text>

            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{formatDate(departDate)}</Text>

            <Text style={styles.label}>Horario:</Text>
            <Text style={styles.value}>{outboundTrip.horaInicio} a {outboundTrip.horaFin}</Text>

            <Text style={styles.label}>Ómnibus:</Text>
            <Text style={styles.value}>Ómnibus {outboundTrip.busId}</Text>

            <Text style={styles.label}>Asientos:</Text>
            <Text style={styles.value}>{outboundSeats.join(', ')}</Text>

            <Text style={styles.label}>Precio por pasaje:</Text>
            {formatWithDiscount(priceOutFinal, priceOutOriginal)}

            <Text style={styles.label}>Subtotal:</Text>
            {formatWithDiscount(subtotalOut, subtotalOutOriginal)}
          </View>

          {tripType === 'roundtrip' && returnTrip && retCount > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>VUELTA</Text>
              <Text style={styles.label}>Origen:</Text>
              <Text style={styles.value}>{destinationName}</Text>

              <Text style={styles.label}>Destino:</Text>
              <Text style={styles.value}>{originName}</Text>

              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>{formatDate(returnDate!)}</Text>

              <Text style={styles.label}>Horario:</Text>
              <Text style={styles.value}>{returnTrip.horaInicio} a {returnTrip.horaFin}</Text>

              <Text style={styles.label}>Ómnibus:</Text>
              <Text style={styles.value}>Ómnibus {returnTrip.busId}</Text>

              <Text style={styles.label}>Asientos:</Text>
              <Text style={styles.value}>{returnSeats?.join(', ')}</Text>

              <Text style={styles.label}>Precio por pasaje:</Text>
              {formatWithDiscount(priceRetFinal, priceRetOriginal)}

              <Text style={styles.label}>Subtotal:</Text>
              {formatWithDiscount(subtotalRet, subtotalRetOriginal)}
            </View>
          )}
        </>
      )}

      {discountPercent > 0 && (
        <View style={styles.discountBox}>
          <View style={styles.discountRow}>
            <FontAwesome name="ticket" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.discountText}>Descuento aplicado</Text>
          </View>
          <Text style={styles.discountAmount}>-{discountPercent}%</Text>
        </View>
      )}

      <View style={styles.totalBox}>
        <Text style={styles.totalText}>Total a Pagar:</Text>
        <Text style={styles.totalAmount}>${finalTotal}</Text>
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
    justifyContent: 'flex-start',
    padding: 16,
    backgroundColor: '#c6eefc',
  },
  sectionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2c3a',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
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
  card: {
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
  discountBox: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  totalBox: {
    backgroundColor: '#1f2c3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  totalAmount: {
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
  timer: {
  fontSize: 16,
  textAlign: 'center',
  color: '#1f2c3a',
  marginBottom: 12,
},
timerValue: {
  fontWeight: 'bold',
  color: '#d84315',
},
  primaryButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
