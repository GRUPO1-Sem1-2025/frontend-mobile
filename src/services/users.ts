import Constants from 'expo-constants';
import { BASE_URL } from '../context/AuthContext';

function decodeToken(token: string): { email: string; id: number } {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    email: payload.sub,
    id: payload.id,
  };
}

export async function getUserByEmail(token: string) {
  const { email, id } = decodeToken(token);
  const response = await fetch(`${BASE_URL}/usuarios/emails/?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error('Error al obtener usuario');
  const data = await response.json();
  return data.OK;
}

export async function updateUserProfile(token: string, data: {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}) {
  const response = await fetch(`${BASE_URL}/usuarios/modificarPerfil`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  console.log('[DEBUG] BODY /usuarios/modificarPerfil', JSON.stringify(data));
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || 'Error al guardar perfil');
  }

  return await response.json();
}
