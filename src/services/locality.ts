import { ApiLocality, Locality } from '../types/locality';
import { BASE_URL } from '../context/AuthContext';

export async function getLocalities(): Promise<Locality[]> {
  const resp = await fetch(
    `${BASE_URL}/localidades/obtenerLocalidadesActivas`
  );
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