import Constants from 'expo-constants';
import { BASE_URL } from '../context/AuthContext';

const extra = Constants.expoConfig?.extra || {};
const STRIPE_API_URL = extra.STRIPE_API_URL;
const STRIPE_SECRET_KEY = extra.STRIPE_SECRET_KEY;

console.log('STRIPE_API_URL:', STRIPE_API_URL);
console.log('STRIPE_SECRET_KEY:', STRIPE_SECRET_KEY);

interface PurchaseRequest {
  usuarioId: number;
  viajeId: number;
  numerosDeAsiento: number[];
  estadoCompra: 'RESERVADA';
}

console.log('BASE_URL:', BASE_URL);

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

  console.log(body);
  const response = await fetch(`${BASE_URL}/usuarios/comprarPasaje`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  console.log('Reservar pasaje response:', json);

  if (!response.ok) {
    const message = json?.message || 'No se pudo reservar el pasaje';
    throw new Error(message);
  }

  if (!json?.idCompra) {
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
      if (value) {
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
    const message = data?.error?.message || 'No se pudo iniciar el pago';
    throw new Error(message);
  }

  return data.url;
}

export async function cambiarEstadoCompra(idCompra: number): Promise<void> {
  const body = { idCompra };

  const response = await fetch(`${BASE_URL}/usuarios/cambiarEstadoCompra`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const message = json?.mensaje || 'No se pudo actualizar el estado de compra';
    throw new Error(message);
  }
}
