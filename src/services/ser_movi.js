import { API_URL } from "../config";

export async function Consultar(
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

  const res = await fetch(
    `${API_URL}/api/movimientos/` +
    `${encodeURIComponent(productoId)}?${parametros}`,
    {
      credentials: "include"
    }
  );

  const data = await res.json();

  if (
    !res.ok ||
    !data.ok ||
    !Array.isArray(data.movimientos)
  ) {
    throw new Error(
      data.mensaje ||
      "No se pudieron consultar los movimientos."
    );
  }

  if (!Number.isFinite(data.stockInicial)) {
    throw new Error(
      "No se pudo confirmar el saldo inicial de la consulta."
    );
  }

  return Object.assign(
    data.movimientos,
    {
      stockInicial: data.stockInicial
    }
  );
}