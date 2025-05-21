import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Trip } from '../../types/trips';
import { getLocalities } from '../../services/locality';

const colors = {
  solarYellow: '#f9c94e',
  skyBlue: '#69c8f1',
  darkBlue: '#1f2c3a',
  busWhite: '#ffffff',
};

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

  const [originName, setOriginName] = useState<string>('...');
  const [destinationName, setDestinationName] = useState<string>('...');
  const [loadingLocs, setLoadingLocs] = useState(true);

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

  const handlePayPal = () => {
    navigation.navigate('PayPalWebView', {
      amount: totalPrice.toFixed(2),
    });
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
        <ActivityIndicator size="large" color={colors.darkBlue} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={styles.section}>Ómnibus Ida:</Text>
        <Text style={styles.value}>
          {outboundTrip.busId ?? '-'} - {outboundTrip.horaInicio ?? '-'} a {outboundTrip.horaFin ?? '-'}
        </Text>
        <Text style={styles.label}>Asientos Ida:</Text>
        <Text style={styles.value}>{outboundSeats?.join(', ') || '-'}</Text>
        <Text style={styles.label}>Precio Ida:</Text>
        <Text style={styles.value}>${priceOut}</Text>
      </View>

      {tripType === 'roundtrip' && returnTrip && returnSeats && (
        <View style={styles.block}>
          <Text style={styles.section}>Ómnibus Vuelta:</Text>
          <Text style={styles.value}>
            {returnTrip.busId ?? '-'} - {returnTrip.horaInicio ?? '-'} a {returnTrip.horaFin ?? '-'}
          </Text>
          <Text style={styles.label}>Asientos Vuelta:</Text>
          <Text style={styles.value}>{returnSeats?.join(', ') || '-'}</Text>
          <Text style={styles.label}>Precio Vuelta:</Text>
          <Text style={styles.value}>${priceRet}</Text>
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.section}>Total a Pagar:</Text>
        <Text style={styles.total}>${totalPrice}</Text>
      </View>

      <View style={styles.payButton}>
        <Button
          title="Pagar con PayPal"
          color={colors.solarYellow}
          onPress={handlePayPal}
        />
      </View>

      <View style={styles.payButton}>
        <Button
          title="Descargar PDF"
          color={colors.darkBlue}
          onPress={handleGeneratePDF}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.skyBlue,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.skyBlue,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.darkBlue,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkBlue,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkBlue,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    color: colors.darkBlue,
  },
  block: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.busWhite,
  },
  payButton: {
    marginTop: 20,
  },
});
