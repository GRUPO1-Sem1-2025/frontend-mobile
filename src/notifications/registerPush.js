import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { jwtDecode } from 'jwt-decode';
import { Alert } from 'react-native';
import { BASE_URL } from '../context/AuthContext';

export async function registerForPushNotificationsAsync(tokenJWT) {
  console.log('[🟢 PUSH] Inicio de función registerForPushNotificationsAsync');

  if (!Device.isDevice && !__DEV__) {
    console.warn('[🟢 PUSH] No es un dispositivo físico. Cancelando registro.');
    Alert.alert('Notificaciones', 'Solo funcionan en dispositivos físicos.');
    return;
  }

  console.log('[🟢 PUSH] Solicitando permisos...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  console.log('[🟢 PUSH] Permiso final de notificación:', finalStatus);

  if (finalStatus !== 'granted') {
    console.warn('[🟢 PUSH] Permiso de notificaciones denegado');
    Alert.alert('Notificaciones', 'Permiso de notificaciones denegado.');
    return;
  }

  let expoPushToken;

  if (__DEV__) {
    expoPushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    console.log('[🟢 PUSH] Modo desarrollo - token simulado:', expoPushToken);
  } else {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log('[🟢 PUSH] Obteniendo token real con projectId:', projectId);

      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      expoPushToken = result.data;
      console.log('[🟢 PUSH] Token real obtenido:', expoPushToken);
    } catch (err) {
      console.error('[🟢 PUSH] ❌ Error al obtener token de Expo:', err);
      Alert.alert('Notificaciones', 'Error al obtener el token de notificación.');
      return;
    }
  }

  let userId;
  try {
    const decoded = jwtDecode(tokenJWT);
    userId = decoded?.id;
    console.log('[🟢 PUSH] ID de usuario decodificado:', userId);
  } catch (err) {
    console.error('[🟢 PUSH] ❌ Error al decodificar JWT:', err);
    Alert.alert('Notificaciones', 'Error al decodificar el token de sesión.');
    return;
  }

  try {
    const url = `${BASE_URL}/token/guardarToken`;
    const payload = {
      id_usuario: userId,
      token: expoPushToken,
    };

    console.log('[🟢 PUSH] Enviando token al backend...');
    console.log('[🟢 PUSH] URL:', url);
    console.log('[🟢 PUSH] Payload:', payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('[🟢 PUSH] Respuesta del backend:', res.status, text);

    if (!res.ok) {
      console.error('[🟢 PUSH] ❌ Fallo al enviar token:', res.status);
    } else {
      console.log('[🟢 PUSH] ✅ Token registrado exitosamente');
    }
  } catch (err) {
    console.error('[🟢 PUSH] ❌ Error al hacer fetch a guardarToken:', err);
  }
}
