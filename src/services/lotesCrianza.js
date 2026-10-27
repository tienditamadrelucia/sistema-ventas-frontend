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
        : `No se pudo completar la solicitud. HTTP ${res.status}`);

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
        pesoControlKg: datos.pesoControlKg,
        mermasKg: datos.mermasKg,
        observaciones: datos.observaciones,
        detalles: datos.detalles,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}

// =====================================================
// CONSULTAR GASTOS DEL LOTE
// =====================================================
export async function obtenerGastosLoteCrianza(id) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}/gastos`
  );
}

// =====================================================
// VINCULAR UN GASTO EXISTENTE
// =====================================================
export async function vincularGastoLote(id, datos) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}/gastos/asignar`,
    {
      method: "POST",
      body: JSON.stringify({
        gastoId: datos.gastoId,
        concepto: datos.concepto,
        montoAsignado: datos.montoAsignado
      })
    }
  );
}

// =====================================================
// CREAR GASTO Y VINCULARLO AL LOTE
// =====================================================
export async function crearGastoLoteCrianza(id, datos) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}/gastos`,
    {
      method: "POST",
      body: JSON.stringify({
        fecha: datos.fecha,
        sede: datos.sede,
        descripcion: datos.descripcion,
        moneda: datos.moneda,
        monto: datos.monto,
        montoAsignado: datos.montoAsignado,
        concepto: datos.concepto,
        actividadProductiva: datos.actividadProductiva,
        numeroRecibo: datos.numeroRecibo,
        cajaChica: datos.cajaChica,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}

// =====================================================
// BUSCAR GASTOS EXISTENTES DISPONIBLES
// =====================================================
export async function buscarGastosParaLote(
  id,
  sede,
  desde,
  hasta,
  pagina = 1
) {
  const parametros = new URLSearchParams({
    sede,
    desde,
    hasta,
    pagina: String(pagina)
  });

  return solicitar(
    `${API}/${encodeURIComponent(id)}` +
    `/gastos/disponibles?${parametros.toString()}`
  );
}

// =====================================================
// MODIFICAR PRODUCCIÓN Y SUS ENTRADAS
// =====================================================
export async function actualizarProduccionCrianza(
  id,
  produccionId,
  datos
) {
  return solicitar(
    `${API}/${encodeURIComponent(id)}` +
    `/producciones/${encodeURIComponent(produccionId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        fecha: datos.fecha,
        pollosProcesados: datos.pollosProcesados,
        pesoControlKg: datos.pesoControlKg,
        mermasKg: datos.mermasKg,
        observaciones: datos.observaciones,
        detalles: datos.detalles,
        versionEsperada: datos.versionEsperada,
        claveOperacion: datos.claveOperacion
      })
    }
  );
}