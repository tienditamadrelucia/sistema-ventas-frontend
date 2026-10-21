import { API_URL } from "../config";

const API = `${API_URL}/api/moneda`;

async function solicitar(ruta = "", opciones = {}) {
  try {
    const res = await fetch(`${API}${ruta}`, {
      ...opciones,
      credentials: "include"
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json || json.ok === false) {
      return {
        ok: false,
        mensaje:
          json?.mensaje ||
          json?.msg ||
          json?.error ||
          "No se pudo completar la solicitud",
        status: res.status
      };
    }

    return {
      ok: true,
      data: json
    };
  } catch {
    return {
      ok: false,
      mensaje: "No se pudo conectar con el servidor",
      status: 0
    };
  }
}

function opcionesJSON(method, datos) {
  return {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  };
}

export const registrarMoneda = datos =>
  solicitar("", opcionesJSON("POST", datos));

export const actualizarMoneda = (id, datos) =>
  solicitar(
    `/${encodeURIComponent(id)}`,
    opcionesJSON("PUT", datos)
  );

export const eliminarMoneda = async id => {
  const resultado = await solicitar(
    `/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  return resultado.ok
    ? resultado.data
    : resultado;
};

export const obtenerMovimientos = async () => {
  const resultado = await solicitar();

  return resultado.ok
    ? resultado.data
    : resultado;
};

export const obtenerMovimientoPorId = async id => {
  const resultado = await solicitar(
    `/${encodeURIComponent(id)}`
  );

  return resultado.ok
    ? resultado.data
    : resultado;
};

async function buscarMovimiento(
  factura,
  sede,
  operacion,
  campo
) {
  const sedeActual =
    sede ||
    localStorage.getItem("sede") ||
    "TIENDITA";

  const resultado = await solicitar(
    `/factura/${encodeURIComponent(factura)}` +
    `?sede=${encodeURIComponent(sedeActual)}`
  );

  if (!resultado.ok) {
    return resultado;
  }

  if (!Array.isArray(resultado.data.lista)) {
    return {
      ok: false,
      mensaje: "La respuesta de movimientos no es válida"
    };
  }

  const movimiento = resultado.data.lista.find(
    item => item.operacion === operacion
  );

  return {
    ok: true,
    [campo]: movimiento || null
  };
}

export const buscarPagoPorFactura = (factura, sede) =>
  buscarMovimiento(
    factura,
    sede,
    "VENTA",
    "pago"
  );

export const buscarVueltoPorFactura = (factura, sede) =>
  buscarMovimiento(
    factura,
    sede,
    "VUELTOS",
    "vuelto"
  );