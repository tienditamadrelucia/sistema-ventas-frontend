import { API_URL } from "../config";

const API = `${API_URL}/api/lotes-crianza`;

async function solicitar(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers
    }
  });

  const datos = await res.json().catch(() => null);

  if (!res.ok || !datos || datos.ok === false) {
    const mensaje =
      datos?.mensaje ||
      datos?.error ||
      (res.status === 401
        ? "Debe iniciar sesión nuevamente."
        : "No se pudo completar la solicitud.");

    const error = new Error(mensaje);
    error.status = res.status;

    throw error;
  }

  return datos;
}

// =====================================================
// CONSULTAR LOTES DE POLLOS
// =====================================================
export async function obtenerLotesCrianza() {
  const datos = await solicitar(API);

  if (!Array.isArray(datos.lotes)) {
    throw new Error(
      "El servidor no devolvió una lista válida de lotes."
    );
  }

  return datos.lotes;
}

// =====================================================
// REGISTRAR UN LOTE
// =====================================================
export async function crearLoteCrianza(datos) {
  return solicitar(API, {
    method: "POST",
    body: JSON.stringify({
      nombre: datos.nombre,
      fechaInicio: datos.fechaInicio,
      cantidadInicial: datos.cantidadInicial,
      proveedor: datos.proveedor,
      observaciones: datos.observaciones
    })
  });
}

// =====================================================
// ELIMINAR LOTE
// =====================================================
export async function eliminarLoteCrianza(id) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );
}

// =====================================================
// CONSULTAR DETALLE DEL LOTE
// =====================================================
export async function obtenerDetalleLoteCrianza(id) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}`
  );
}

// =====================================================
// REGISTRAR BAJA DE ANIMALES
// =====================================================
export async function registrarBajaCrianza(id, datos) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}/bajas`,
    {
      method: "POST",
      body: JSON.stringify({
        fecha: datos.fecha,
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}

// =====================================================
// REGISTRAR PRODUCCIÓN Y SUS ENTRADAS
// =====================================================
export async function registrarProduccionCrianza(
  id,
  datos
) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}/producciones`,
    {
      method: "POST",
      body: JSON.stringify({
        fecha: datos.fecha,
        pollosProcesados: datos.pollosProcesados,
        observaciones: datos.observaciones,
        detalles: datos.detalles,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}