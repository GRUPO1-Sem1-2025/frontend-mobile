import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRoute, useNavigation } from '@react-navigation/native';
import { cambiarEstadoCompra } from '../../services/purchases';

export default function PaymentSuccessScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = route.params as any;
  const url = params?.url || '';

  useEffect(() => {
    const parsed = new URLSearchParams(url.split('?')[1]);
    const idCompraIda = Number(parsed.get('idCompraIda'));
    const idCompraVuelta = parsed.get('idCompraVuelta') ? Number(parsed.get('idCompraVuelta')) : null;

    if (idCompraIda) cambiarEstadoCompra(idCompraIda).catch(console.error);
    if (idCompraVuelta) cambiarEstadoCompra(idCompraVuelta).catch(console.error);
  }, [url]);

  const handleGeneratePDF = async () => {
    const parsed = new URLSearchParams(url.split('?')[1]);
    const origin = parsed.get('origin');
    const destination = parsed.get('destination');
    const departDate = parsed.get('departDate');
    const returnDate = parsed.get('returnDate');
    const totalPrice = parsed.get('totalPrice') || 'verificar precio';

    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Resumen de Compra</h1>
          <p><strong>Origen → Destino:</strong> ${origin} → ${destination}</p>
          <p><strong>Fecha Ida:</strong> ${departDate}</p>
          ${returnDate ? `<p><strong>Fecha Vuelta:</strong> ${returnDate}</p>` : ''}
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

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ ¡Pago exitoso!</Text>
      <TouchableOpacity style={styles.button} onPress={handleGeneratePDF}>
        <Text style={styles.buttonText}>Descargar PDF</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
        <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#c6eefc' },
  text: { fontSize: 24, color: 'green', marginBottom: 20 },
  button: { backgroundColor: '#f9c94e', padding: 14, borderRadius: 8, marginBottom: 12 },
  buttonText: { color: '#1f2c3a', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#1f2c3a', padding: 14, borderRadius: 8 },
  secondaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});
