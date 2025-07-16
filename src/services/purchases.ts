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
    const payloadBase64 = token.split('.')[1];
    const decoded = atob(payloadBase64);
    const payload = JSON.parse(decoded);
    return { id: payload.id };
  } catch (e) {
    throw new Error('Token inválido');
  }
}

export async function getReservasUsuario(email: string) {
  console.log('[DEBUG] Obteniendo reservas para el usuario:', email);
  const url = `${BASE_URL}/usuarios/ObtenerMisReservas?email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verifica si la respuesta fue exitosa
    if (!response.ok) {
      const errorMessage = await response.text(); // Obtener mensaje de error si lo hay
      console.error('[ERROR] Error obteniendo reservas:', response.status, errorMessage);
      throw new Error(`No se pudieron obtener las reservas. Detalles: ${errorMessage}`);
    }

    // Si la respuesta es correcta, obtenemos los datos
    const data = await response.json();
    console.debug('[DEBUG] Reservas obtenidas:', data); // Log de las reservas obtenidas

    return data; // Devuelve la respuesta completa (ajustar según la estructura esperada)
  } catch (error) {
    console.error('[ERROR] Error al obtener las reservas:', error);
    throw error; // Vuelve a lanzar el error para que se pueda manejar en otro lugar
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

  console.log('[DEBUG] Reservando pasaje:', body);
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

  const rawSuccessUrl =
    `http://tecnobus.uy:8090/payment-success.html` +
    `?session_id={CHECKOUT_SESSION_ID}` +
    `&idCompraIda=${idCompraIda}` +
    (idCompraVuelta ? `&idCompraVuelta=${idCompraVuelta}` : '') +
    `&totalPrice=${totalUYU}` +
    `&origin=${encodeURIComponent(extraData?.origin || '')}` +
    `&destination=${encodeURIComponent(extraData?.destination || '')}` +
    `&departDate=${encodeURIComponent(extraData?.departDate || '')}` +
    `&outboundSeats=${encodeURIComponent(extraData?.outboundSeats || '')}` +
    `&outboundHoraInicio=${encodeURIComponent(extraData?.outboundHoraInicio || '')}` +
    `&outboundHoraFin=${encodeURIComponent(extraData?.outboundHoraFin || '')}` +
    `&outboundBusId=${encodeURIComponent(extraData?.outboundBusId || '')}`;

  const cancelUrl = `http://tecnobus.uy:8090/payment-cancel.html`;

  params.append('success_url', rawSuccessUrl);
  params.append('cancel_url', cancelUrl);
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
  console.log('[DEBUG] Respuesta crearSesionStripe:', data);

  if (!response.ok || !data.url) {
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
    const message = json?.mensaje || 'No se pudo actualizar el estado de compra';
    throw new Error(message);
  }
}
export async function guardarReferenciaPago(idCompra: number, stripeSessionId: string): Promise<void> {
  const url = `${BASE_URL}/usuarios/guardarReferenciaPago?idCompra=${idCompra}&referencia=${stripeSessionId}`;

  console.log('[DEBUG] Llamando a guardarReferenciaPago:', url);

  const response = await fetch(url, {
    method: 'POST',
  });

  const text = await response.text();
  console.log('[DEBUG] Respuesta guardarReferenciaPago:', response.status, text);

  if (!response.ok) {
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = {};
    }
    const message = json?.mensaje || 'No se pudo guardar la referencia de pago';
    throw new Error(message);
  }
}
