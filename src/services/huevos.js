import { API_URL } from "../config";

const API = `${API_URL}/api/huevos`;

// CONSULTAR INFORMACIÓN
export async function consultarHuevos(
  ruta = "",
  filtros = {}
) {
  const parametros = new URLSearchParams(
    Object.entries(filtros).filter(
      ([, valor]) =>
        valor !== "" &&
        valor !== undefined &&
        valor !== null
    )
  );

  const res = await fetch(
    `${API}${ruta}?${parametros.toString()}`,
    {
      credentials: "include"
    }
  );

  const datos = await res.json().catch(() => null);

  if (!res.ok || datos?.ok !== true) {
    throw new Error(
      datos?.mensaje ||
      `No se pudo consultar huevos. HTTP ${res.status}`
    );
  }

  return datos;
}

// GUARDAR, CORREGIR O ELIMINAR UN REGISTRO
export async function guardarHuevos(
  ruta,
  metodo,
  datos
) {
  const res = await fetch(
    `${API}${ruta}`,
    {
      method: metodo,
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    }
  );

  const respuesta = await res.json().catch(() => null);

  if (!res.ok || respuesta?.ok !== true) {
    const error = new Error(
      respuesta?.mensaje ||
      `No se pudo confirmar la operación. HTTP ${res.status}`
    );

    error.status = res.status;

    throw error;
  }

  return respuesta;
}

// IDENTIFICADOR PARA EVITAR DUPLICAR REINTENTOS
export function crearClaveHuevos() {
  if (!window.crypto?.getRandomValues) {
    throw new Error(
      "Abra el sistema mediante HTTPS."
    );
  }

  const numeros = new Uint32Array(4);

  window.crypto.getRandomValues(numeros);

  return Array.from(
    numeros,
    (numero) =>
      numero.toString(16).padStart(8, "0")
  ).join("");
}