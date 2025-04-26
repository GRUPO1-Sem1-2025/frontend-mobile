// src/services/buses.ts
import { BASE_URL } from '../context/AuthContext';
import { Bus } from '../types/bus';

/**
 * Obtiene la lista de autobuses activos.
 */
export async function getActiveBuses(): Promise<Bus[]> {
  const resp = await fetch(`${BASE_URL}/buses/obtenerOmnibusActivos`);
  if (!resp.ok) {
    throw new Error('Error al cargar buses');
  }
  const data: Bus[] = await resp.json();
  return data;
}