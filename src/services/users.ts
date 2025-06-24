import Constants from 'expo-constants';
import { BASE_URL } from '../context/AuthContext';
import { Buffer } from 'buffer';

function decodeToken(token: string): { email: string } {
  if (!token || typeof token !== 'string') {
    throw new Error('Token no proporcionado o inválido');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token con estructura inválida');
  }

  try {
    const payloadBase64 = parts[1];
    const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedPayload);

    if (!payload.sub) {
      throw new Error('El token no contiene "sub" (email)');
    }

    return { email: payload.sub };
  } catch (e) {
    throw new Error('Token inválido o mal decodificado');
  }
}

export async function getUserByEmail(token: string) {
  const { email } = decodeToken(token);
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
