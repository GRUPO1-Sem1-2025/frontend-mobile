import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';

type Params = {
  amount: string;
};

export default function PayPalWebView() {
  const { amount } = useRoute().params as Params;
  const navigation = useNavigation<any>();

  const htmlContent = `
    <html>
      <head>
        <script src="https://www.paypal.com/sdk/js?client-id=AUI5UJDmsDpuR4hnwRPWBFeK47ilulQzbNJoE3yKRjRgLY5HRLSntl0tdaT0MTbWQG79oaaCeQt-OcpL"></script>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          #paypal-button-container { margin-top: 50px; }
        </style>
      </head>
      <body>
        <h2>Pagar con PayPal</h2>
        <div id="paypal-button-container"></div>
        <script>
          const amount = "${amount}";

          paypal.Buttons({
            createOrder: function(data, actions) {
              return actions.order.create({
                purchase_units: [{ amount: { value: amount } }]
              });
            },
            onApprove: function(data, actions) {
              window.ReactNativeWebView.postMessage('PAYMENT_SUCCESS');
            },
            onCancel: function(data) {
              window.ReactNativeWebView.postMessage('PAYMENT_CANCEL');
            }
          }).render('#paypal-button-container');
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      onMessage={({ nativeEvent }) => {
        if (nativeEvent.data === 'PAYMENT_SUCCESS') {
          alert('✅ Pago exitoso');
          navigation.goBack();
        } else if (nativeEvent.data === 'PAYMENT_CANCEL') {
          alert('❌ Pago cancelado');
          navigation.goBack();
        }
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
