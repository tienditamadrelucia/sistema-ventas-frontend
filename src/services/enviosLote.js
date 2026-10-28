import { API_URL } from "../config";

const API = `${API_URL}/api/envios-lote`;

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

  if (!res.ok || datos?.ok !== true) {
    const mensaje =
      typeof datos?.mensaje === "string"
        ? datos.mensaje
        : typeof datos?.error === "string"
          ? datos.error
          : res.status === 401
            ? "Debe iniciar sesión nuevamente."
            : `No se pudo completar la solicitud de envíos. HTTP ${res.status}`;

    const error = new Error(mensaje);
    error.status = res.status;

    throw error;
  }

  return datos;
}

// =====================================================
// LISTAR ENVÍOS
// =====================================================
export async function listarEnviosLote(filtros = {}) {
  const parametros = new URLSearchParams({
    sede: filtros.sede || "TIENDITA",
    estado: filtros.estado || "TODOS",
    pagina: String(filtros.pagina || 1)
  });

  if (filtros.loteId) {
    parametros.set("loteId", filtros.loteId);
  }

  if (filtros.desde || filtros.hasta) {
    parametros.set("desde", filtros.desde || "");
    parametros.set("hasta", filtros.hasta || "");
  }

  if (filtros.soloDiferencias === true) {
    parametros.set("soloDiferencias", "true");
  }

  return solicitar(
    `${API}?${parametros.toString()}`
  );
}

// =====================================================
// CONSULTAR UN ENVÍO
// =====================================================
export async function obtenerEnvioLote(
  envioId,
  sede = "TIENDITA"
) {
  const parametros = new URLSearchParams({ sede });

  return solicitar(
    `${API}/${encodeURIComponent(envioId)}` +
    `?${parametros.toString()}`
  );
}

// =====================================================
// CONFIRMAR ENVÍO DESDE MONASTERIO
// =====================================================
export async function crearEnvioLote(loteId, datos) {
  return solicitar(
    `${API}/lote/${encodeURIComponent(loteId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        fecha: datos.fecha,
        observaciones: datos.observaciones,
        detalles: datos.detalles,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}

// =====================================================
// CONFIRMAR RECEPCIÓN EN TIENDITA
// =====================================================
export async function recibirEnvioLote(envioId, datos) {
  return solicitar(
    `${API}/${encodeURIComponent(envioId)}/recepcion`,
    {
      method: "POST",
      body: JSON.stringify({
        fecha: datos.fecha,
        observaciones: datos.observaciones,
        motivoDiferencias: datos.motivoDiferencias,
        detalles: datos.detalles,
        versionEsperada: datos.versionEsperada,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}