import jwtDecode from 'jwt-decode';

export async function registerForPushNotificationsAsync(tokenJWT) {
  if (!Device.isDevice) return;

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
    console.warn('🚨 Usando token simulado. En modo producción se obtiene el real.');
  } else {
    const result = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    expoPushToken = result.data;
  }

  let userId;
  try {
    const decoded = jwtDecode(tokenJWT);
    userId = decoded?.id;
  } catch (err) {
    console.error('No se pudo decodificar el token', err);
    return;
  }

  try {
    await fetch(`${BASE_URL}/token/guardarToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_usuario: userId, expoToken: expoPushToken }),
    });
  } catch (err) {
    console.error('Error al enviar el token al backend', err);
  }
}