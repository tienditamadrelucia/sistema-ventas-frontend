import React, { useRef, useState } from "react";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import {
  buscarGastosParaLote,
  vincularGastoLote
} from "../services/lotesCrianza";

const campo = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px"
};

const boton = {
  padding: "9px 15px",
  backgroundColor: "#B8862D",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontFamily: "Arial",
  fontWeight: "bold",
  cursor: "pointer"
};

const celda = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left"
};

function dinero(valor) {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fechaTexto(fecha) {
  return String(fecha || "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("/");
}

export default function VincularGastoLote({
  loteId,
  fechaInicio,
  conceptos = [],
  onGuardado
}) {
  const ocupadoRef = useRef(false);

  const clavePendiente =
    `vincularGastoLote:${
      localStorage.getItem("usuarioNombre") || ""
    }:${loteId}`;

  const [pendiente, setPendiente] = useState(() => {
    try {
      const datos = JSON.parse(
        sessionStorage.getItem(clavePendiente) || "null"
      );

      return (
        datos &&
        typeof datos.gastoId === "string" &&
        typeof datos.concepto === "string" &&
        Number.isFinite(datos.montoAsignado) &&
        datos.seleccion
      )
        ? datos
        : null;
    } catch {
      return null;
    }
  });

  const [filtros, setFiltros] = useState({
    sede: "TIENDITA",
    desde: String(
      fechaInicio || obtenerFechaVenezuela()
    ).slice(0, 10),
    hasta: obtenerFechaVenezuela().slice(0, 10)
  });

  const [resultado, setResultado] = useState(null);
  const [seleccion, setSeleccion] = useState(
    pendiente?.seleccion || null
  );
  const [concepto, setConcepto] = useState(
    pendiente?.concepto || ""
  );
  const [monto, setMonto] = useState(
    pendiente?.montoAsignado || ""
  );

  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  function cambiarFiltro(e) {
    const { name, value } = e.target;

    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: value
    }));

    setResultado(null);
    setSeleccion(null);
    setConcepto("");
    setMonto("");
  }

  async function buscar(pagina = 1) {
    if (ocupadoRef.current || pendiente) return;

    ocupadoRef.current = true;
    setBuscando(true);
    setError("");
    setMensaje("");
    setSeleccion(null);
    setConcepto("");
    setMonto("");

    try {
      const datos = await buscarGastosParaLote(
        loteId,
        filtros.sede,
        filtros.desde,
        filtros.hasta,
        pagina
      );

      setResultado(datos);
    } catch (fallo) {
      setResultado(null);
      setError(fallo.message);
    } finally {
      ocupadoRef.current = false;
      setBuscando(false);
    }
  }

  function elegir(gasto) {
    if (ocupadoRef.current || pendiente) return;

    setSeleccion(gasto);
    setMonto(gasto.disponible);
    setConcepto("");
    setError("");
    setMensaje("");
  }

  function borrarPendiente() {
    try {
      sessionStorage.removeItem(clavePendiente);
    } catch {
      // No cambia el resultado confirmado por el servidor.
    }

    setPendiente(null);
  }

  async function guardar(e) {
    e.preventDefault();

    if (ocupadoRef.current || !seleccion) return;

    let solicitud = pendiente;

    if (!solicitud) {
      const numero = Number(monto);
      const centavos = Math.round(numero * 100);

      if (
        !Number.isFinite(numero) ||
        numero <= 0 ||
        !Number.isSafeInteger(centavos) ||
        Math.abs(numero * 100 - centavos) >= 0.000001 ||
        centavos > Math.round(seleccion.disponible * 100)
      ) {
        setError(
          "Revise el importe: debe ser mayor que cero, tener hasta dos decimales y no superar lo disponible."
        );
        return;
      }

      if (
        !conceptos.some(
          (item) => item.codigo === concepto
        )
      ) {
        setError("Seleccione el concepto del lote.");
        return;
      }

      solicitud = {
        gastoId: seleccion.gastoId,
        concepto,
        montoAsignado: centavos / 100,
        seleccion
      };

      try {
        sessionStorage.setItem(
          clavePendiente,
          JSON.stringify(solicitud)
        );
      } catch {
        setError(
          "No se pudo conservar la solicitud. No se envió la vinculación."
        );
        return;
      }

      setPendiente(solicitud);
    }

    ocupadoRef.current = true;
    setGuardando(true);
    setError("");
    setMensaje("");

    let guardado = false;

    try {
      const respuesta = await vincularGastoLote(
        loteId,
        solicitud
      );

      borrarPendiente();
      setSeleccion(null);
      setResultado(null);
      setConcepto("");
      setMonto("");
      setMensaje(respuesta.mensaje);
      guardado = true;
    } catch (fallo) {
      if ([400, 409, 423].includes(fallo.status)) {
        borrarPendiente();
        setError(fallo.message);
      } else {
        setError(
          `${fallo.message} ` +
          "Reintente la misma vinculación antes de preparar otra."
        );
      }
    } finally {
      ocupadoRef.current = false;
      setGuardando(false);
    }

    if (guardado && onGuardado) {
      try {
        await onGuardado();
      } catch {
        setMensaje(
          "El gasto quedó vinculado. Actualice la consulta para ver los totales."
        );
      }
    }
  }

  const bloqueado =
    buscando || guardando || Boolean(pendiente);

  return (
    <section
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <h3
        style={{
          margin: 0,
          padding: "12px",
          backgroundColor: "#E8D1A5"
        }}
      >
        Vincular gasto existente
      </h3>

      <div style={{ padding: "18px" }}>
        <p>
          Busque en la sede que pagó el gasto.
          Vincularlo no genera otra salida de dinero.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscar(1);
          }}
        >
          <fieldset
            disabled={bloqueado}
            style={{
              border: "none",
              padding: 0,
              margin: 0,
              minWidth: 0
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px"
              }}
            >
              <label>
                Sede que pagó
                <select
                  style={campo}
                  name="sede"
                  value={filtros.sede}
                  onChange={cambiarFiltro}
                >
                  <option value="TIENDITA">TIENDITA</option>
                  <option value="MONASTERIO">MONASTERIO</option>
                </select>
              </label>

              <label>
                Desde
                <input
                  style={campo}
                  type="date"
                  name="desde"
                  value={filtros.desde}
                  onChange={cambiarFiltro}
                  required
                />
              </label>

              <label>
                Hasta
                <input
                  style={campo}
                  type="date"
                  name="hasta"
                  value={filtros.hasta}
                  onChange={cambiarFiltro}
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              style={{ ...boton, marginTop: "14px" }}
            >
              {buscando ? "BUSCANDO..." : "BUSCAR"}
            </button>
          </fieldset>
        </form>

        {resultado && (
          <>
            {resultado.gastos.length === 0 ? (
              <p>
                No hay gastos disponibles en esta página.
                {resultado.hayMas
                  ? " Puede consultar la siguiente."
                  : ""}
              </p>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  marginTop: "20px"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead style={{ backgroundColor: "#E8D1A5" }}>
                    <tr>
                      <th style={celda}>Fecha</th>
                      <th style={celda}>Descripción</th>
                      <th style={celda}>Moneda</th>
                      <th style={celda}>Total del gasto</th>
                      <th style={celda}>Disponible</th>
                      <th style={celda}>Elegir</th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultado.gastos.map((gasto) => (
                      <tr key={gasto.gastoId}>
                        <td style={celda}>
                          {fechaTexto(gasto.fecha)}
                        </td>
                        <td style={celda}>
                          {gasto.descripcion}
                        </td>
                        <td style={celda}>{gasto.moneda}</td>
                        <td style={celda}>
                          {dinero(gasto.monto)}
                        </td>
                        <td style={celda}>
                          {dinero(gasto.disponible)}
                        </td>
                        <td style={celda}>
                          <button
                            type="button"
                            style={boton}
                            disabled={bloqueado}
                            onClick={() => elegir(gasto)}
                          >
                            SELECCIONAR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginTop: "12px"
              }}
            >
              <button
                type="button"
                style={boton}
                disabled={
                  bloqueado || resultado.pagina <= 1
                }
                onClick={() =>
                  buscar(resultado.pagina - 1)
                }
              >
                ANTERIOR
              </button>

              <span>Página {resultado.pagina}</span>

              <button
                type="button"
                style={boton}
                disabled={bloqueado || !resultado.hayMas}
                onClick={() =>
                  buscar(resultado.pagina + 1)
                }
              >
                SIGUIENTE
              </button>
            </div>
          </>
        )}

        {seleccion && (
          <form
            onSubmit={guardar}
            style={{
              marginTop: "20px",
              padding: "15px",
              border: "1px solid #B8862D",
              borderRadius: "6px"
            }}
          >
            <p>
              <strong>Gasto seleccionado:</strong>{" "}
              {seleccion.descripcion}
            </p>

            <p>
              Pagado por {seleccion.sedePagadora} ·
              Disponible:{" "}
              {dinero(seleccion.disponible)}{" "}
              {seleccion.moneda}
            </p>

            <fieldset
              disabled={guardando || Boolean(pendiente)}
              style={{
                padding: 0,
                margin: 0,
                border: "none",
                minWidth: 0
              }}
            >
              <label>
                Concepto del lote
                <select
                  style={campo}
                  value={concepto}
                  onChange={(e) =>
                    setConcepto(e.target.value)
                  }
                  required
                >
                  <option value="">Seleccione</option>
                  {conceptos.map((item) => (
                    <option
                      key={item.codigo}
                      value={item.codigo}
                    >
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: "block",
                  marginTop: "12px",
                  maxWidth: "300px"
                }}
              >
                Importe para este lote ({seleccion.moneda})
                <input
                  style={campo}
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={seleccion.disponible}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </label>
            </fieldset>

            <button
              type="submit"
              disabled={guardando}
              style={{ ...boton, marginTop: "15px" }}
            >
              {guardando
                ? "PROCESANDO..."
                : pendiente
                  ? "REINTENTAR LA MISMA VINCULACIÓN"
                  : "VINCULAR AL LOTE"}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" style={{ color: "#b00020" }}>
            {error}
          </p>
        )}

        {mensaje && (
          <p role="status" style={{ color: "#286140" }}>
            {mensaje}
          </p>
        )}
      </div>
    </section>
  );
}