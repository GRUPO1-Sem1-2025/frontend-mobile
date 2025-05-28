import Constants from 'expo-constants';

import { BASE_URL } from '../context/AuthContext';

export async function getReservas(email: string) {
  const response = await fetch(`${BASE_URL}/usuarios/ObtenerMisReservas?email=${encodeURIComponent(email)}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('No se pudieron obtener las reservas');
  return await response.json();
}

export async function getCompras(email: string) {
  const response = await fetch(`${BASE_URL}/usuarios/ObtenerMisCompras?email=${encodeURIComponent(email)}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('No se pudieron obtener las compras');
  return await response.json();
}

// 📌 A implementar cuando el backend esté listo
export async function calificarViaje(viajeId: number, calificacion: number, token: string) {
  const body = {
    viajeId,
    calificacion,
  };

  const response = await fetch(`${BASE_URL}/usuarios/calificarViaje`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.message || 'No se pudo calificar el viaje';
    throw new Error(message);
  }

  return await response.json();
}
