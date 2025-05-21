import { ApiLocality, Locality } from '../types/locality';
import { BASE_URL } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getLocalities(): Promise<Locality[]> {

    const url = `${BASE_URL}/localidades/obtenerLocalidadesActivas`;
    const userToken = await AsyncStorage.getItem('userToken');
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`},
    });
  if (!resp.ok) {
    throw new Error('Error cargando localidades');
  }
  const data = (await resp.json()) as ApiLocality[];
  // Filtramos y proyectamos solo lo que necesitamos
  return data
    .filter((l) => l.activo)
    .map(({ id, nombre, departamento }) => ({
      id,
      nombre,
      departamento,
    }));
}