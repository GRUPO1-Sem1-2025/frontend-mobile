
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

export default function PayPalWebView() {
  const navigation = useNavigation<any>();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <script src="https://www.paypal.com/sdk/js?client-id=AUI5UJDmsDpuR4hnwRPWBFeK47ilulQzbNJoE3yKRjRgLY5HRLSntl0tdaT0MTbWQG79oaaCeQt-OcpL"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            text-align: center;
          }
          #paypal-button-container {
            margin-top: 50px;
          }
        </style>
      </head>
      <body>
        <h3>Pagar con PayPal</h3>
        <div id="paypal-button-container"></div>
        <script>
          paypal.Buttons({
            createOrder: function(data, actions) {
              return actions.order.create({
                purchase_units: [{ amount: { value: '10.00' } }]
              });
            },
            onApprove: function(data, actions) {
              window.location.href = "https://success.com";
            },
            onCancel: function(data) {
              window.location.href = "https://cancel.com";
            },
            onError: function(err) {
              window.location.href = "https://error.com";
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
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onNavigationStateChange={(event) => {
        const url = event.url;
        if (url.includes('success.com')) {
          Alert.alert('✅ Pago exitoso');
          navigation.goBack();
        } else if (url.includes('cancel.com')) {
          Alert.alert('❌ Pago cancelado');
          navigation.goBack();
        } else if (url.includes('error.com')) {
          Alert.alert('🚨 Error durante el pago');
          navigation.goBack();
        }
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
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
