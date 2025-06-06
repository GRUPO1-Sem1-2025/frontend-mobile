import Constants from 'expo-constants';
import { BASE_URL } from '../context/AuthContext';

const extra = Constants.expoConfig?.extra || {};
const STRIPE_API_URL = extra.STRIPE_API_URL;
const STRIPE_SECRET_KEY = extra.STRIPE_SECRET_KEY;

interface PurchaseRequest {
  usuarioId: number;
  viajeId: number;
  numerosDeAsiento: number[];
  estadoCompra: 'RESERVADA';
}

function decodeToken(token: string): { id: number } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id };
  } catch (e) {
    throw new Error('Token inválido');
  }
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

  const response = await fetch(`${BASE_URL}/usuarios/comprarPasaje`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();

  if (!response.ok || !json?.idCompra) {
    const message = json?.message || 'No se pudo reservar el pasaje';
    throw new Error(message);
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

  // Agregar IDs de compra y extraData como query params en el success_url
  let successUrl = `http://tecnobus.uy:8090/payment-success.html?idCompraIda=${idCompraIda}&totalPrice=${totalUYU}`;
  if (idCompraVuelta) {
    successUrl += `&idCompraVuelta=${idCompraVuelta}`;
  }

  if (extraData) {
    Object.entries(extraData).forEach(([key, value]) => {
      successUrl += `&${key}=${encodeURIComponent(value)}`;
    });
  }

  params.append('success_url', successUrl);
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
    const message = data?.error?.message || 'No se pudo iniciar el pago';
    throw new Error(message);
  }

  return data.url;
}

export async function cambiarEstadoCompra(idCompra: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/usuarios/cambiarEstadoCompra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idCompra }),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const message = json?.message || 'Error al cambiar el estado de compra';
    throw new Error(message);
  }
}
