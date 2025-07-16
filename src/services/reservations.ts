import { BASE_URL } from '../context/AuthContext';

// 🔧 Helper para manejar respuestas de la API de manera uniforme
async function handleResponse(response: Response, errorMessage: string) {
  const url = response.url;
  const status = response.status;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[ERROR] ${errorMessage}. Status: ${status}. URL: ${url}. Body:`, errorData);
    const message = errorData?.message || errorMessage;
    throw new Error(message);
  }

  const data = await response.json();
  console.log(`[DEBUG] Respuesta exitosa (${status}) desde ${url}:`, data);
  return data;
}

// 📌 Obtener reservas del usuario
export async function getReservas(email: string, token: string) {
  const url = `${BASE_URL}/usuarios/ObtenerMisReservas?email=${encodeURIComponent(email)}`;
  console.log('[DEBUG] getReservas - Email:', email);
  console.log('[DEBUG] getReservas - URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await handleResponse(response, 'No se pudieron obtener las reservas');
  } catch (error) {
    console.error('[ERROR] getReservas - Excepción:', error);
    throw new Error(`Error al obtener las reservas: ${(error as Error).message}`);
  }
}

// 📌 Obtener compras del usuario
export async function getCompras(email: string, token: string) {
  const url = `${BASE_URL}/usuarios/ObtenerMisCompras?email=${encodeURIComponent(email)}`;
  console.log('[DEBUG] getCompras - Email:', email);
  console.log('[DEBUG] getCompras - URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return await handleResponse(response, 'No se pudieron obtener las compras');
  } catch (error) {
    console.error('[ERROR] getCompras - Excepción:', error);
    throw new Error(`Error al obtener las compras: ${(error as Error).message}`);
  }
}

// 📌 Calificar un viaje (incluyendo comentario)
export async function calificarViaje(
  idViaje: number,
  calificacion: number,
  comentario: string,
  idUsuario: number,
) {
  const body = {
    idViaje,
    calificacion,
    comentario: {
      idUsuario,
      comentario,
    },
  };

  console.log('[DEBUG] calificarViaje - Payload enviado:', body);

  try {
    const response = await fetch(`${BASE_URL}/viajes/calificarViaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return await handleResponse(response, 'No se pudo calificar el viaje');
  } catch (error) {
    console.error('[ERROR] calificarViaje - Excepción:', error);
    throw new Error(`Error al calificar el viaje: ${(error as Error).message}`);
  }
}

// 📌 Obtener detalle de compra de un viaje
export async function getCompraViaje(
  viajeId: number,
  compraId: number,
  userId: number
) {
  const url = `${BASE_URL}/viajes/obtenerCompraViaje?idViaje=${viajeId}&idCompra=${compraId}&idUsuario=${userId}`;
  console.log('[DEBUG] getCompraViaje - URL:', url);

  try {
    const response = await fetch(url);
    return await handleResponse(response, 'No se pudo obtener el detalle del viaje');
  } catch (error) {
    console.error('[ERROR] getCompraViaje - Excepción:', error);
    throw new Error(`Error al obtener el detalle del viaje: ${(error as Error).message}`);
  }
}

// 📌 Obtener calificación de un viaje
export async function getCalificacionViaje(idViaje: number, idUsuario: number) {
  const url = `${BASE_URL}/viajes/verCalificacionUsuario?idViaje=${idViaje}&idUsuario=${idUsuario}`;
  console.log('[DEBUG] getCalificacionViaje - URL:', url);

  try {
    const response = await fetch(url);
    const data = await handleResponse(response, 'No se pudo obtener la calificación');

    const resultado = {
      calificacion: data.calificacion ?? 0,
      comentarios: data.comentario ? [data.comentario] : [],
    };

    console.log('[DEBUG] Calificación obtenida:', resultado);
    return resultado;
  } catch (error) {
    console.error('[ERROR] getCalificacionViaje - Excepción:', error);
    throw new Error(`Error al obtener la calificación: ${(error as Error).message}`);
  }
}
