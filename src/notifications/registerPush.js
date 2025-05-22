import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {jwtDecode} from 'jwt-decode';
import { BASE_URL } from '../context/AuthContext';

export async function registerForPushNotificationsAsync(tokenJWT) {

  if (!Device.isDevice && !__DEV__) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  let expoPushToken;

  if (__DEV__) {
    expoPushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
  } else {
    try {
      const result = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      expoPushToken = result.data;
    } catch (err) {
      return;
    }
  }

  let userId;
  try {
    const decoded = jwtDecode(tokenJWT);
    userId = decoded?.id;
  } catch (err) {
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/token/guardarToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_usuario: userId,
        token: expoPushToken,
      }),
    });
    console.log('Response:', res);

    if (!res.ok) {
      console.error('❌ Fallo al enviar token al backend:', res.status);
    } else {
      console.log('✅ Token de notificación registrado exitosamente en backend');
    }
  } catch (err) {
    console.error('❌ Error al hacer fetch a guardarToken:', err);
  }
}
