import { BASE_URL } from '../context/AuthContext';
import { Trip } from '../types/trips';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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


  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });


  if (!resp.ok) {
    throw new Error(`Error al buscar viajes: código ${resp.status}`);
  }

  const data: Trip[] = await resp.json();
  return data;
}