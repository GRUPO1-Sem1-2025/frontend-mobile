// src/services/purchases.ts
import { BASE_URL } from '../context/AuthContext';
export async function reservarPasaje(
  token: string,
  viajeId: number,
  numerosDeAsiento: number[]
): Promise<void> {
  const usuarioId = JSON.parse(atob(token.split('.')[1])).id;

  const body = {
    usuarioId,
    viajeId,
    numerosDeAsiento,
    estadoCompra: 'RESERVADA',
  };

  const url =  `${BASE_URL}/usuarios/comprarPasaje`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('No se pudo reservar el pasaje');
  }
}
