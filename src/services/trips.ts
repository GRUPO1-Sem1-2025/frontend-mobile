
import { BASE_URL } from '../context/AuthContext';
import { Trip } from '../types/trips';

export async function getAvailableTrips(
  origin: number,
  destination: number,
  departDate: Date,
  tripType: 'oneway' | 'roundtrip',
  returnDate?: Date
): Promise<Trip[]> {
  const body = {
    fechaInicio: departDate.toISOString().slice(0, 10),
    fechaFin:
      tripType === 'roundtrip'
        ? returnDate!.toISOString().slice(0, 10)
        : departDate.toISOString().slice(0, 10),
    idLocalidadOrigen: origin,
    idLocalidadDestino: destination,
  };

  const resp = await fetch(
    `${BASE_URL}/viajes/obtenerViajesPorFechaYDestino`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    throw new Error('Error al buscar viajes');
  }
  const data: Trip[] = await resp.json();
  return data;
}
