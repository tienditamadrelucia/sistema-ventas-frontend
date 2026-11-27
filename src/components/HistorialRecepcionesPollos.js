import React, { useEffect, useState } from "react";
import {
  listarEnviosLote,
  obtenerEnvioLote
} from "../services/enviosLote";

const boton = {
  padding: "9px 15px",
  backgroundColor: "#84B09C",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer"
};

const campo = {
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "15px"
};

const celda = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "center"
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "white"
};

function fechaVisible(valor) {
  if (!valor) return "—";
  return String(valor).slice(0, 10).split("-").reverse().join("/");
}

function nombreUsuario(usuario) {
  return usuario?.nombre || usuario?.usuario || "No disponible";
}

function kilos(valor) {
  if (valor === null || valor === undefined) return "—";
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

function cantidad(valor, presentacion) {
  if (presentacion === "SOLO_PESO" || valor == null) return "—";
  return `${valor} ${presentacion === "PAQUETE_DOS" ? "paquetes de 2" : "piezas"}`;
}

export default function HistorialRecepcionesPollos({ revision = 0 }) {
  const [recepciones, setRecepciones] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtros, setFiltros] = useState({});
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [actualizacion, setActualizacion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await listarEnviosLote({
          sede: "TIENDITA",
          estado: "RECEPCIONES",
          pagina,
          ...filtros
        });

        if (!activo) return;

        setRecepciones(respuesta.envios || []);
        setTotal(respuesta.total || 0);
        setTotalPaginas(respuesta.totalPaginas || 1);
      } catch (err) {
        if (activo) {
          setRecepciones([]);
          setTotal(0);
          setTotalPaginas(1);
          setError(err.message);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => { activo = false; };
  }, [pagina, filtros, revision, actualizacion]);

  function buscar(evento) {
    evento.preventDefault();

    if (!desde || !hasta) {
      setError("Seleccione ambas fechas.");
      return;
    }

    if (desde > hasta) {
      setError("La fecha inicial supera la fecha final.");
      return;
    }

    setPagina(1);
    setFiltros({ desde, hasta });
  }

  function limpiar() {
    setDesde("");
    setHasta("");
    setPagina(1);
    setFiltros({});
  }

  async function verDetalle(id) {
    setConsultando(true);
    setError("");

    try {
      const respuesta = await obtenerEnvioLote(id, "TIENDITA");
      if (!respuesta.envio) {
        throw new Error("No se encontró el detalle de la recepción.");
      }
      setDetalle(respuesta.envio);
    } catch (err) {
      setError(err.message);
    } finally {
      setConsultando(false);
    }
  }

  useEffect(() => {
    if (!detalle) return;

    function cerrar(evento) {
      if (evento.key === "Escape") setDetalle(null);
    }

    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [detalle]);

  return (
    <fieldset style={{
      margin: "30px auto 20px",
      padding: "20px",
      border: "1px solid #ccc",
      borderRadius: "8px"
    }}>
      <legend style={{ fontWeight: "bold", color: "#5A2D16" }}>
        HISTORIAL DE RECEPCIONES DE POLLOS
      </legend>

      <form onSubmit={buscar} style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <label>
          Desde:
          <br />
          <input type="date" style={campo} value={desde}
            onChange={(e) => setDesde(e.target.value)} />
        </label>

        <label>
          Hasta:
          <br />
          <input type="date" style={campo} value={hasta}
            onChange={(e) => setHasta(e.target.value)} />
        </label>

        <button type="submit" style={boton} disabled={cargando}>
          BUSCAR
        </button>

        <button type="button" style={boton} disabled={cargando}
          onClick={limpiar}>
          VER TODAS
        </button>

        <button type="button" style={boton} disabled={cargando}
          onClick={() => setActualizacion((v) => v + 1)}>
          ACTUALIZAR
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "red", textAlign: "center" }}>
          {error}
        </p>
      )}

      {cargando ? (
        <p style={{ textAlign: "center" }}>
          Cargando historial de recepciones...
        </p>
      ) : (
        <>
          <p style={{ textAlign: "center" }}>
            Total de recepciones: <strong>{total}</strong>
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={tabla}>
              <thead style={{ backgroundColor: "#F9CEAE" }}>
                <tr>
                  <th style={celda}>Fecha de recepción</th>
                  <th style={celda}>Lote</th>
                  <th style={celda}>Recibido por</th>
                  <th style={celda}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {recepciones.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={celda}>
                      No hay recepciones para mostrar.
                    </td>
                  </tr>
                ) : recepciones.map((item) => (
                  <tr key={item._id}>
                    <td style={celda}>
                      {fechaVisible(item.fechaRecepcion)}
                    </td>
                    <td style={celda}>
                      {item.loteId?.nombre || "Lote no disponible"}
                    </td>
                    <td style={celda}>
                      {nombreUsuario(item.recibidoPor)}
                    </td>
                    <td style={celda}>
                      <button type="button" style={boton}
                        disabled={consultando}
                        onClick={() => verDetalle(item._id)}>
                        VER
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginTop: "15px"
          }}>
            <button type="button" style={boton}
              disabled={pagina <= 1}
              onClick={() => setPagina((v) => v - 1)}>
              ANTERIOR
            </button>

            <span>Página {pagina} de {totalPaginas}</span>

            <button type="button" style={boton}
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((v) => v + 1)}>
              SIGUIENTE
            </button>
          </div>
        </>
      )}

      {consultando && (
        <p style={{ textAlign: "center" }}>
          Consultando detalle...
        </p>
      )}

      {detalle && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "15px",
          zIndex: 9999
        }}>
          <div role="dialog" aria-modal="true"
            aria-labelledby="titulo-detalle-pollos"
            style={{
              backgroundColor: "white",
              width: "100%",
              maxWidth: "1100px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "10px",
              padding: "20px",
              boxSizing: "border-box"
            }}>
            <h2 id="titulo-detalle-pollos" style={{
              textAlign: "center",
              backgroundColor: "#5A2D16",
              color: "white",
              padding: "12px",
              borderRadius: "6px"
            }}>
              DETALLE DE LA RECEPCIÓN
            </h2>

            <p><strong>Envío:</strong> {detalle.numeroEnvio}</p>
            <p><strong>Lote:</strong> {detalle.loteId?.nombre || "—"}</p>
            <p><strong>Fecha de envío:</strong> {fechaVisible(detalle.fechaEnvio)}</p>
            <p><strong>Fecha de recepción:</strong> {fechaVisible(detalle.fechaRecepcion)}</p>
            <p><strong>Enviado por:</strong> {nombreUsuario(detalle.enviadoPor)}</p>
            <p><strong>Recibido por:</strong> {nombreUsuario(detalle.recibidoPor)}</p>

            <p>
              <strong>Estado: </strong>
              <span style={{
                color: detalle.estado === "RECIBIDO_CON_DIFERENCIAS"
                  ? "#B22222" : "#226644",
                fontWeight: "bold"
              }}>
                {String(detalle.estado || "").replace(/_/g, " ")}
              </span>
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={tabla}>
                <thead style={{ backgroundColor: "#F9CEAE" }}>
                  <tr>
                    <th style={celda}>Producto enviado</th>
                    <th style={celda}>Producto recibido</th>
                    <th style={celda}>Cantidad enviada</th>
                    <th style={celda}>Kg enviados</th>
                    <th style={celda}>Cantidad recibida</th>
                    <th style={celda}>Kg recibidos</th>
                    <th style={celda}>Diferencia</th>
                  </tr>
                </thead>

                <tbody>
                  {(detalle.detalles || []).map((item, indice) => {
                    const recibido = item.recepcion || {};
                    const diferencia = recibido.pesoRecibidoKg == null
                      ? null
                      : Math.round(
                          (Number(recibido.pesoRecibidoKg) -
                           Number(item.pesoEnviadoKg)) * 1000
                        ) / 1000;

                    const diferenciaCantidad =
                      item.presentacion === "SOLO_PESO" ||
                      recibido.presentacionesRecibidas == null
                        ? null
                        : Number(recibido.presentacionesRecibidas) -
                          Number(item.presentacionesEnviadas);

                    const hayDiferencia =
                      (diferencia !== null && diferencia !== 0) ||
                      (diferenciaCantidad !== null && diferenciaCantidad !== 0);

                    return (
                      <tr key={item.productoOrigenId || indice}>
                        <td style={celda}>{item.descripcionOrigen}</td>
                        <td style={celda}>{recibido.descripcionDestino || "—"}</td>
                        <td style={celda}>
                          {cantidad(item.presentacionesEnviadas, item.presentacion)}
                        </td>
                        <td style={celda}>{kilos(item.pesoEnviadoKg)}</td>
                        <td style={celda}>
                          {cantidad(recibido.presentacionesRecibidas, item.presentacion)}
                        </td>
                        <td style={celda}>{kilos(recibido.pesoRecibidoKg)}</td>
                        <td style={{
                          ...celda,
                          color: hayDiferencia ? "#B22222" : "#226644"
                        }}>
                          {diferencia === null ? "—" : `${kilos(diferencia)} kg`}
                          {diferenciaCantidad !== null && (
                            <div>{cantidad(diferenciaCantidad, item.presentacion)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p>
              <strong>Observaciones del envío:</strong>{" "}
              {detalle.observacionesEnvio || "Ninguna"}
            </p>
            <p>
              <strong>Observaciones de la recepción:</strong>{" "}
              {detalle.observacionesRecepcion || "Ninguna"}
            </p>
            <p>
              <strong>Motivo de las diferencias:</strong>{" "}
              {detalle.motivoDiferencias || "Ninguno"}
            </p>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button type="button"
                style={{ ...boton, backgroundColor: "#FC9E9B" }}
                onClick={() => setDetalle(null)}>
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}