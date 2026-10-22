import { API_URL } from "../config";

const API = `${API_URL}/api/gastos`;

async function solicitar(ruta = "", opciones = {}) {
  const res = await fetch(`${API}${ruta}`, {
    ...opciones,
    credentials: "include"
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.ok === false) {
    const error = new Error(
      data?.mensaje ||
      data?.error ||
      `No se pudo completar la solicitud (${res.status}).`
    );

    error.status = res.status;
    throw error;
  }

  if (!data) {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  return data;
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

// OBTENER GASTOS
export async function obtenerGastos(sede = "TIENDITA") {
  try {
    return await solicitar(
      `?sede=${encodeURIComponent(sede)}`
    );
  } catch (error) {
    console.error("Error obteniendo gastos:", error);

    return {
      ok: false,
      lista: [],
      mensaje: error.message
    };
  }
}

// CREAR GASTO NORMAL
export async function crearGasto(gasto) {
  return solicitar(
    "",
    opcionesJSON("POST", gasto)
  );
}

// ACTUALIZAR GASTO NORMAL
export async function actualizarGasto(id, gasto) {
  return solicitar(
    `/${encodeURIComponent(id)}`,
    opcionesJSON("PUT", gasto)
  );
}

// ELIMINAR GASTO NORMAL
export async function eliminarGasto(id) {
  return solicitar(
    `/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );
}

// REGISTRAR COMPRA CON SUS ENTRADAS
export async function crearCompraReventa(compra) {
  return solicitar(
    "/compra-reventa",
    opcionesJSON("POST", compra)
  );
}