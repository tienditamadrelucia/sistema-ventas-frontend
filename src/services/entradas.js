import { API_URL } from "../config";

const API_ENTRADAS = `${API_URL}/api/entradas`;

// =======================================
// SOLICITUDES CON SESIÓN Y MANEJO DE ERRORES
// =======================================
async function solicitar(ruta = "", opciones = {}) {
  try {
    const res = await fetch(`${API_ENTRADAS}${ruta}`, {
      ...opciones,
      credentials: "include"
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.ok === false) {
      const mensaje =
        data?.error ||
        data?.mensaje ||
        `No se pudo completar la solicitud. HTTP ${res.status}`;

      return {
        ok: false,
        error: [
          mensaje,
          data?.detalle
        ]
          .filter(Boolean)
          .join("\n\n"),
        status: res.status
      };
    }

    return data;
  } catch (error) {
    console.error("Error consultando entradas:", error);

    return {
      ok: false,
      error:
        "No se pudo conectar con el servidor. " +
        "Compruebe la lista antes de repetir la operación."
    };
  }
}

// =======================================
// CARGAR ENTRADAS PAGINADAS
// =======================================
export async function cargarEntradas(
  page = 1,
  limit = 20,
  sede = "TIENDITA"
) {
  const parametros = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sede
  });

  const data = await solicitar(`?${parametros}`);

  if (!Array.isArray(data.entradas)) {
    console.error("Error cargando entradas:", data);

    return {
      ...data,
      entradas: [],
      page: 1,
      totalPages: 1
    };
  }

  return data;
}

// =======================================
// CREAR ENTRADA
// =======================================
export async function crearEntrada(data) {
  return solicitar("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

// =======================================
// ACTUALIZAR ENTRADA
// =======================================
export async function actualizarEntrada(id, data) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

// =======================================
// ELIMINAR ENTRADA
// =======================================
export async function eliminarEntradaApi(id) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}