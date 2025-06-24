import Constants from 'expo-constants';
import { BASE_URL } from '../context/AuthContext';

const extra = Constants.expoConfig?.extra || {};
const STRIPE_API_URL = extra.STRIPE_API_URL;
const STRIPE_SECRET_KEY = extra.STRIPE_SECRET_KEY;

import { Buffer } from 'buffer';
interface PurchaseRequest {
  usuarioId: number;
  viajeId: number;
  numerosDeAsiento: number[];
  estadoCompra: 'RESERVADA';
}

function decodeToken(token: string): { id: number } {
  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);
    return { id: payload.id };
  } catch (e) {
    throw new Error('Token inválido');
  }
}

export async function getReservasUsuario(email: string) {
  console.log('[DEBUG] Obteniendo reservas para el usuario:', email);
  const url = `https://backend.tecnobus.uy/usuarios/ObtenerMisReservas?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('[DEBUG] Error obteniendo reservas:', response.status);
    throw new Error('No se pudieron obtener las reservas');
  }

  return response.json();
}

export async function reservarPasaje(
  token: string,
  viajeId: number,
  numerosDeAsiento: number[]
): Promise<{ idCompra: number }> {
  const { id: usuarioId } = decodeToken(token);

  const body: PurchaseRequest = {
    usuarioId,
    viajeId,
    numerosDeAsiento,
    estadoCompra: 'RESERVADA',
  };

  console.log(body);
  const response = await fetch(`${BASE_URL}/usuarios/comprarPasaje`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  console.log('[DEBUG] Reservar pasaje response:', json);

  if (!response.ok) {
    console.error('[DEBUG] Error reservando pasaje:', json);
    const message = json?.message || 'No se pudo reservar el pasaje';
    throw new Error(message);
  }

  if (!json?.idCompra) {
    console.error('[DEBUG] Error reservando pasaje: No se recibió idCompra');
    throw new Error('No se recibió idCompra');
  }

  return { idCompra: json.idCompra };
}

export async function crearSesionStripe(
  totalUYU: number,
  idCompraIda: number,
  idCompraVuelta?: number | null,
  extraData?: Record<string, string>
): Promise<string> {
  const params = new URLSearchParams();

  const baseSuccessUrl = new URL('http://tecnobus.uy:8090/payment-success.html');
  baseSuccessUrl.searchParams.append('idCompraIda', idCompraIda.toString());
  baseSuccessUrl.searchParams.append('totalPrice', totalUYU.toString());

  if (idCompraVuelta) {
    baseSuccessUrl.searchParams.append('idCompraVuelta', idCompraVuelta.toString());
  }

if (extraData) {
  for (const [key, value] of Object.entries(extraData)) {
    if (value && !baseSuccessUrl.searchParams.has(key)) {
      baseSuccessUrl.searchParams.append(key, value);
    }
  }
}

  params.append('success_url', baseSuccessUrl.toString());
  params.append('cancel_url', 'http://tecnobus.uy:8090/payment-cancel.html');
  params.append('mode', 'payment');
  params.append('line_items[0][price_data][currency]', 'uyu');
  params.append('line_items[0][price_data][product_data][name]', 'Pasaje de ómnibus');
  params.append('line_items[0][price_data][unit_amount]', String(totalUYU * 100));
  params.append('line_items[0][quantity]', '1');

  const response = await fetch(`${STRIPE_API_URL}/v1/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || !data.url) {
    console.error('[DEBUG] Error creando sesión Stripe:', data);
    console.error('[DEBUG] Response status:', response.status);
    const message = data?.error?.message || 'No se pudo iniciar el pago';
    throw new Error(message);
  }

  return data.url;
}

export async function cambiarEstadoCompra(idCompra: number): Promise<void> {

  const response = await fetch(`${BASE_URL}/usuarios/cambiarEstadoCompra`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(idCompra),
  });

  const text = await response.text();
  console.log('[DEBUG] Respuesta /cambiarEstadoCompra:', response.status, text);

  if (!response.ok) {
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = {};
    }
    console.error('[DEBUG] Error cambiando estado de compra /cambiarEstadoCompra:', json);
    const message = json?.mensaje || 'No se pudo actualizar el estado de compra';
    throw new Error(message);
  }
}
