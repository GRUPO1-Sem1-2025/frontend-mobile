import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { jwtDecode } from 'jwt-decode';
import { Alert } from 'react-native';



const extra = Constants.expoConfig?.extra || {};
const NOTIFICACIONES_URL = extra.NOTIFICACIONES_URL;

export async function registerForPushNotificationsAsync(tokenJWT) {
  console.log('[DEBUG registerPush] Inicio de función registerForPushNotificationsAsync');

  if (!Device.isDevice && !__DEV__) {
    console.warn('[DEBUG registerPush] No es un dispositivo físico. Cancelando registro.');
    Alert.alert('Notificaciones', 'Solo funcionan en dispositivos físicos.');
    return;
  }

  console.log('[DEBUG registerPush] Solicitando permisos...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  console.log('[DEBUG registerPush] Permiso final de notificación:', finalStatus);

  if (finalStatus !== 'granted') {
    console.warn('[DEBUG registerPush] Permiso de notificaciones denegado');
    Alert.alert('Notificaciones', 'Permiso de notificaciones denegado.');
    return;
  }

  let expoPushToken;

  if (__DEV__) {
    expoPushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    console.log('[DEBUG registerPush] Modo desarrollo - token simulado:', expoPushToken);
  } else {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log('[DEBUG registerPush] Obteniendo token real con projectId:', projectId);

      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      expoPushToken = result.data;
      console.log('[DEBUG registerPush] Token real obtenido:', expoPushToken);
    } catch (err) {
      console.error('[DEBUG registerPush] ❌ Error al obtener token de Expo:', err);
      Alert.alert('Notificaciones', 'Error al obtener el token de notificación.');
      return;
    }
  }

  let userId;
  try {
    const decoded = jwtDecode(tokenJWT);
    userId = decoded?.id;
    console.log('[DEBUG registerPush] ID de usuario decodificado:', userId);
  } catch (err) {
    console.error('[DEBUG registerPush] ❌ Error al decodificar JWT:', err);
    Alert.alert('Notificaciones', 'Error al decodificar el token de sesión.');
    return;
  }

  try {
    const url = `${NOTIFICACIONES_URL}/usuarios/token`;
    const payload = {
      usuarioId: userId,
      token: expoPushToken,
    };

    console.log('[DEBUG registerPush] Enviando token al backend...');
    console.log('[DEBUG registerPush] URL:', url);
    console.log('[DEBUG registerPush] Payload:', payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('[DEBUG registerPush] Respuesta del backend:', res.status, text);

    if (!res.ok) {
      console.error('[DEBUG registerPush] ❌ Fallo al enviar token:', res.status);
    } else {
      console.log('[DEBUG registerPush] ✅ Token registrado exitosamente');
    }
  } catch (err) {
    console.error('[DEBUG registerPush] ❌ Error al hacer fetch a guardarToken:', err);
  }
}
