import { BASE_URL } from '../context/AuthContext';

export async function getAvailableSeats(viajeId: number): Promise<number[]> {
  const resp = await fetch(`${BASE_URL}/viajes/obtenerAsientosDisponibles?idViaje=${viajeId}`);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    console.log(`[DEBUG] Error al buscar asientos /obtenerAsientosDisponibles: ${JSON.stringify(errorData)}`);
    throw new Error('Error al obtener asientos disponibles');
  }
  return await resp.json();
}
