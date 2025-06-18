import { BASE_URL } from '../context/AuthContext';
import { Trip } from '../types/trips';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Devuelve una fecha formateada como YYYY-MM-DD
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Consulta viajes disponibles según los parámetros.
 */
export async function getAvailableTrips(
  origin: number,
  destination: number,
  departDate: Date,
  tripType: 'oneway' | 'roundtrip',
  returnDate?: Date
): Promise<Trip[]> {
  const fechaInicio = formatDateLocal(departDate);
  const fechaFin =
    tripType === 'roundtrip' && returnDate
      ? formatDateLocal(returnDate)
      : fechaInicio;

  const params = new URLSearchParams({
    fechaInicio,
    fechaFin,
    locOrigen: origin.toString(),
    locDestino: destination.toString(),
  });

  const url = `${BASE_URL}/viajes/obtenerViajesPorFechaYDestino?${params.toString()}`;

  const userToken = await AsyncStorage.getItem('userToken');
  if (!userToken) {
    throw new Error('Token de usuario no disponible');
  }

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    console.log(`[DEBUG] Error al buscar viajes: ${JSON.stringify(errorData)}`);
    throw new Error(`Error al buscar viajes: código ${resp.status}`);
  }

  return await resp.json();
}
