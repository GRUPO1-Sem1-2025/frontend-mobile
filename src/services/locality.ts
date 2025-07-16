import { ApiLocality, Locality } from '../types/locality';
import { BASE_URL } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getLocalities(): Promise<Locality[]> {
  console.log('[DEBUG] getLocalities: Iniciando llamada a la API');

  const url = `${BASE_URL}/localidades/obtenerLocalidadesActivas`;
  console.log(`[DEBUG] URL llamada: ${url}`);

  const userToken = await AsyncStorage.getItem('userToken');
  console.log(`[DEBUG] Token obtenido: ${userToken ? '✔️' : '❌ No encontrado'}`);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      console.log(`[DEBUG] Error al buscar localidades. Status: ${resp.status}. Body: ${JSON.stringify(errorData)}`);
      throw new Error('Error cargando localidades');
    }

    const data = (await resp.json()) as ApiLocality[];
    console.log(`[DEBUG] Localidades recibidas (${data.length}):`, data);

    const filtradas = data
      .filter((l) => l.activo)
      .map(({ id, nombre, departamento }) => ({
        id,
        nombre,
        departamento,
      }));

    console.log(`[DEBUG] Localidades activas (${filtradas.length}):`, filtradas);

    return filtradas;
  } catch (error: any) {
    console.log(`[DEBUG] Excepción en getLocalities: ${error.message}`);
    throw error;
  }
}
