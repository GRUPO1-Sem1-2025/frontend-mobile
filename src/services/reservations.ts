import { BASE_URL } from '../context/AuthContext';

// 🔧 Helper para manejar respuestas de la API de manera uniforme
async function handleResponse(response: Response, errorMessage: string) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.message || errorMessage;
    throw new Error(message);
  }
  return await response.json();
}

// 📌 Obtener reservas del usuario
export async function getReservas(email: string, token: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/usuarios/ObtenerMisReservas?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return await handleResponse(response, 'No se pudieron obtener las reservas');
  } catch (error) {
    throw new Error(`Error al obtener las reservas: ${(error as Error).message}`);
  }
}

// 📌 Obtener compras del usuario
export async function getCompras(email: string, token: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/usuarios/ObtenerMisCompras?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return await handleResponse(response, 'No se pudieron obtener las compras');
  } catch (error) {
    throw new Error(`Error al obtener las compras: ${(error as Error).message}`);
  }
}

// 📌 Calificar un viaje (incluyendo comentario)
export async function calificarViaje(
  idViaje: number,
  calificacion: number,
  comentario: string,
  token: string
) {
  try {
    const body = {
      idViaje,
      calificacion,
      comentario,
    };

    const response = await fetch(`${BASE_URL}/viajes/calificarViaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return await handleResponse(response, 'No se pudo calificar el viaje');
  } catch (error) {
    throw new Error(`Error al calificar el viaje: ${(error as Error).message}`);
  }
}

// 📌 Obtener detalle de compra de un viaje
export async function getCompraViaje(
  viajeId: number,
  compraId: number,
  userId: number
) {
  try {
    const response = await fetch(
      `${BASE_URL}/viajes/obtenerCompraViaje?idViaje=${viajeId}&idCompra=${compraId}&idUsuario=${userId}`
    );
    return await handleResponse(response, 'No se pudo obtener el detalle del viaje');
  } catch (error) {
    throw new Error(`Error al obtener el detalle del viaje: ${(error as Error).message}`);
  }
}

// 📌 Obtener calificación de un viaje
export async function getCalificacionViaje(idViaje: number, token: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/viajes/verCalificacionComentario?idViaje=${idViaje}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await handleResponse(response, 'No se pudo obtener la calificación');
    console.log('Calificación obtenida:', data);
        return {
      calificacion: data.calificacion ?? 0,
      comentarios: data.comentarios ?? [],
    };

  } catch (error) {
    throw new Error(`Error al obtener la calificación: ${(error as Error).message}`);
  }
}
