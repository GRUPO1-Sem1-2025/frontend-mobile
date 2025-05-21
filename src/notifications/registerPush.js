import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync(tokenJWT) {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permisos de notificación denegados');
    return;
  }

  let expoPushToken;

  if (__DEV__) {
    // Token de prueba para desarrollo (no sirve para enviar push reales)
    expoPushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    console.warn('🚨 Usando token simulado. En modo producción se obtiene el real.');
  } else {
    const result = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    expoPushToken = result.data;
  }

  console.log('Expo Push Token:', expoPushToken);

  try {
    await fetch('http://tecnobus.uy/api/push-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expoToken: expoPushToken }),
    });
  } catch (err) {
    console.error('Error al enviar el token al backend', err);
  }
}