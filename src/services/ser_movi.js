import { API_URL } from "../config";

// CONSULTAR MOVIMIENTOS E INCIDENCIAS
export async function ConsultarDetalle(
  productoId,
  fechaInicio,
  fechaFin,
  sede = "TIENDITA"
) {
  const parametros = new URLSearchParams({
    fechaInicio,
    fechaFin,
    sede
  });

  const url =
    `${API_URL}/api/movimientos/` +
    `${encodeURIComponent(productoId)}?${parametros}`;

  const res = await fetch(url, {
    credentials: "include"
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    throw new Error(
      data?.mensaje ||
      `No se pudieron consultar los movimientos (${res.status}).`
    );
  }

  if (!Array.isArray(data.movimientos)) {
    throw new Error(
      "El servidor no devolvió una lista válida de movimientos."
    );
  }

  return {
    movimientos: data.movimientos,
    incidencias: Array.isArray(data.incidencias)
      ? data.incidencias
      : [],
    advertencia: data.advertencia || ""
  };
}

// CONSERVAR COMPATIBILIDAD CON OTRAS PANTALLAS
export async function Consultar(
  productoId,
  fechaInicio,
  fechaFin,
  sede = "TIENDITA"
) {
  const resultado = await ConsultarDetalle(
    productoId,
    fechaInicio,
    fechaFin,
    sede
  );

  return resultado.movimientos;
}