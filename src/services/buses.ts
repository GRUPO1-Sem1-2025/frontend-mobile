// src/services/buses.ts
import { BASE_URL } from '../context/AuthContext';
import { Bus } from '../types/bus';

/**
 * Obtiene la lista de autobuses activos.
 */
export async function getActiveBuses(): Promise<Bus[]> {
  console.log('[DEBUG] getActiveBuses: Iniciando llamada a la API');

  try {
    const url = `${BASE_URL}/buses/obtenerOmnibusActivos`;
    console.log(`[DEBUG] URL llamada: ${url}`);

    const resp = await fetch(url);

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      console.log(`[DEBUG] Error al buscar buses. Status: ${resp.status}. Body: ${JSON.stringify(errorData)}`);
      throw new Error('Error al cargar buses');
    }

    const data: Bus[] = await resp.json();
    console.log(`[DEBUG] Buses recibidos (${data.length}):`, data);

    return data;
  } catch (error: any) {
    console.log(`[DEBUG] Excepción en getActiveBuses: ${error.message}`);
    throw error;
  }
}