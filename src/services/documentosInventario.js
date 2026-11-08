import { API_URL } from "../config";

const API =
  `${API_URL}/api/documentos-inventario`;

// ==========================================
// IDENTIFICADOR PARA EVITAR DUPLICAR REINTENTOS
// ==========================================
export function crearClaveDocumento() {
  const bytes = new Uint8Array(16);

  globalThis.crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    byte => byte.toString(16).padStart(2, "0")
  ).join("");
}

// ==========================================
// SOLICITUDES CON SESIÓN
// ==========================================
async function solicitar(
  ruta = "",
  opciones = {}
) {
  let res;

  try {
    res = await fetch(`${API}${ruta}`, {
      ...opciones,
      credentials: "include"
    });
  } catch {
    const error = new Error(
      "No se pudo conectar con el servidor. " +
      "Consulte el listado antes de repetir la operación."
    );

    error.status = 0;
    error.definitivo = false;

    throw error;
  }

  const data = await res
    .json()
    .catch(() => null);

  if (
    !res.ok ||
    !data ||
    data.ok !== true
  ) {
    const error = new Error(
      data?.error ||
      data?.mensaje ||
      `No se pudo completar la solicitud. HTTP ${res.status}`
    );

    error.status = res.status;

    error.definitivo = Boolean(
      data &&
      [400, 401, 403, 404, 409, 422, 423].includes(
        res.status
      )
    );

    throw error;
  }

  return data;
}

function escribir(
  ruta,
  metodo,
  datos
) {
  if (
    !datos ||
    typeof datos.claveOperacion !== "string" ||
    !/^[a-zA-Z0-9_-]{16,100}$/.test(
      datos.claveOperacion
    )
  ) {
    const error = new Error(
      "Falta el identificador de la operación. " +
      "No se enviaron datos al servidor."
    );

    error.status = 400;
    error.definitivo = true;

    return Promise.reject(error);
  }

  return solicitar(ruta, {
    method: metodo,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  });
}

// ==========================================
// CARGAR MOTIVOS Y PERMISOS
// ==========================================
export function consultarOpcionesDocumentos(sede) {
  return solicitar(
    `/opciones?sede=${encodeURIComponent(sede)}`
  );
}

// ==========================================
// LISTAR DOCUMENTOS
// ==========================================
export function cargarDocumentos(filtros = {}) {
  const permitidos = [
    "sede",
    "tipo",
    "estado",
    "desde",
    "hasta",
    "page",
    "limit"
  ];

  const parametros = new URLSearchParams();

  for (const campo of permitidos) {
    const valor = filtros[campo];

    if (
      valor !== undefined &&
      valor !== null &&
      valor !== ""
    ) {
      parametros.set(
        campo,
        String(valor)
      );
    }
  }

  return solicitar(
    `?${parametros.toString()}`
  );
}

// ==========================================
// CONSULTAR DOCUMENTO COMPLETO
// ==========================================
export function obtenerDocumentoInventario(id) {
  return solicitar(
    `/${encodeURIComponent(id)}`
  );
}

// ==========================================
// CREAR DOCUMENTO
// ==========================================
export function crearDocumentoInventario(datos) {
  return escribir(
    "",
    "POST",
    datos
  );
}

// ==========================================
// VERIFICAR O REABRIR
// ==========================================
export function revisarDocumentoInventario(
  id,
  datos
) {
  return escribir(
    `/${encodeURIComponent(id)}/revision`,
    "POST",
    datos
  );
}

// ==========================================
// ELIMINAR DOCUMENTO COMPLETO
// ==========================================
export function eliminarDocumentoInventario(
  id,
  datos
) {
  return escribir(
    `/${encodeURIComponent(id)}`,
    "DELETE",
    datos
  );
}