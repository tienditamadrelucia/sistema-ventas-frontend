import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Encabezado from "./Encabezado";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";

const monedas = ["D", "P", "Bs"];

const etiquetas = {
  D: "USD",
  P: "COP",
  Bs: "Bs"
};

const formato = valor =>
  Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
 
const fechaCorta = valor =>
  valor
    ? String(valor)
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/")
    : "—";

const celda = {
  border: "1px solid #bbb",
  padding: "8px"
};

const numero = {
  ...celda,
  textAlign: "right",
  whiteSpace: "nowrap"
};

// =====================================================
// DETALLE DE LOS MOVIMIENTOS DE UNA ACTIVIDAD
// =====================================================
function DetalleActividad({ item, color }) {
  return (
    <div
      style={{
        padding: "12px",
        textAlign: "left",
        background: "#fafafa"
      }}
    >
      <h4>
        Cobros y vueltos asignados — {item.actividad}
      </h4>

      {!item.detalleIngresos.length ? (
        <p>No hay cobros asignados en este período.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white"
          }}
        >
          <thead style={{ background: color }}>
            <tr>
              <th style={celda}>Fecha del cobro</th>
              <th style={celda}>Sede</th>
              <th style={celda}>Factura</th>
              <th style={celda}>Movimiento</th>

              {monedas.map(moneda => (
                <th style={celda} key={moneda}>
                  {etiquetas[moneda]}
                </th>
              ))}

              <th style={celda}>
                Repartido entre actividades
              </th>
            </tr>
          </thead>

          <tbody>
            {item.detalleIngresos.map(detalle => (
              <tr key={detalle.id}>
                <td style={celda}>
                  {fechaCorta(detalle.fecha)}
                </td>

                <td style={celda}>
                  {detalle.sede}
                </td>

                <td style={celda}>
                  {detalle.factura ?? "—"}
                </td>

                <td style={celda}>
                  {detalle.operacion}
                </td>

                {monedas.map(moneda => (
                  <td style={numero} key={moneda}>
                    {formato(detalle.importes[moneda])}
                  </td>
                ))}

                <td style={celda}>
                  {detalle.prorrateado ? "Sí" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>
        Gastos registrados — {item.actividad}
      </h4>

      {!item.detalleGastos.length ? (
        <p>No hay gastos registrados en este período.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white"
          }}
        >
          <thead style={{ background: color }}>
            <tr>
              <th style={celda}>Fecha</th>
              <th style={celda}>Sede</th>
              <th style={celda}>Recibo</th>
              <th style={celda}>Descripción</th>
              <th style={celda}>Clasificación</th>
              <th style={celda}>Moneda</th>
              <th style={celda}>Monto</th>
            </tr>
          </thead>

          <tbody>
            {item.detalleGastos.map(detalle => (
              <tr key={detalle.id}>
                <td style={celda}>
                  {fechaCorta(detalle.fecha)}
                </td>

                <td style={celda}>
                  {detalle.sede}
                </td>

                <td style={celda}>
                  {detalle.numeroRecibo || "—"}
                </td>

                <td style={celda}>
                  {detalle.descripcion}
                </td>

                <td style={celda}>
                  {detalle.clasificacion}
                </td>

                <td style={celda}>
                  {etiquetas[detalle.moneda]}
                </td>

                <td style={numero}>
                  {formato(detalle.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// =====================================================
// REPORTE EXCLUSIVO DEL ADMINISTRADOR
// =====================================================
export default function FlujoActividades({
  onVerUtilidad
}) {
  const navigate = useNavigate();

  const sedeActual =
    localStorage.getItem("sede") || "TIENDITA";

  const esMonasterio = sedeActual === "MONASTERIO";

  const [desde, setDesde] = useState(
    obtenerFechaVenezuela()
  );

  const [hasta, setHasta] = useState(
    obtenerFechaVenezuela()
  );

  const [sede, setSede] = useState(sedeActual);
  const [resultado, setResultado] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const esAdministrador =
    localStorage.getItem("rolUsuario")
      ?.trim()
      .toUpperCase() === "ADMINISTRADOR";

  const color = esMonasterio
    ? "#E8D1A5"
    : "#F9CEAE";

  const boton = {
    border: "none",
    padding: "9px 16px",
    borderRadius: "7px",
    cursor: "pointer",
    color: "white",
    background: esMonasterio
      ? "#B8862D"
      : "#84B09C",
    fontWeight: "bold"
  };

  function limpiar() {
    setResultado(null);
    setAbierta(null);
    setError("");
  }

  async function buscar() {
    if (cargando) return;

    if (!desde || !hasta || desde > hasta) {
      setError("Seleccione un rango de fechas válido.");
      return;
    }

    limpiar();
    setCargando(true);

    try {
      const parametros = new URLSearchParams({
        desde,
        hasta,
        sede
      });

      const res = await fetch(
        `${API_URL}/api/ventas/flujo-actividad?${parametros}`,
        {
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data.mensaje ||
          "No se pudo generar el reporte"
        );
      }

      setResultado(data);
    } catch (err) {
      setError(
        err.message ||
        "No se pudo conectar con el servidor"
      );
    } finally {
      setCargando(false);
    }
  }

  if (!esAdministrador) {
    return (
      <h2 style={{ color: "red" }}>
        Acceso permitido solo al administrador
      </h2>
    );
  }

  return (
    <div>
      <Encabezado sede={sedeActual} />

      <main style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center" }}>
          Ingresos y gastos por actividad productiva
        </h2>

        <fieldset
          disabled={cargando}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "18px",
            maxWidth: "850px",
            margin: "0 auto 20px"
          }}
        >
          <legend>Período y sede</legend>

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center"
            }}
          >
            <label>
              Desde:{" "}
              <input
                type="date"
                value={desde}
                onChange={e => {
                  setDesde(e.target.value);
                  limpiar();
                }}
              />
            </label>

            <label>
              Hasta:{" "}
              <input
                type="date"
                value={hasta}
                onChange={e => {
                  setHasta(e.target.value);
                  limpiar();
                }}
              />
            </label>

            <label>
              Sede:{" "}
              <select
                value={sede}
                onChange={e => {
                  setSede(e.target.value);
                  limpiar();
                }}
              >
                <option value="TIENDITA">
                  TIENDITA
                </option>

                <option value="MONASTERIO">
                  MONASTERIO
                </option>

                <option value="AMBAS">
                  AMBAS SEDES
                </option>
              </select>
            </label>

            <button style={boton} onClick={buscar}>
              {cargando ? "Consultando..." : "Buscar"}
            </button>
          </div>
        </fieldset>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px"
          }}
        >
          <button
            style={boton}
            onClick={() =>
              navigate(
                esMonasterio
                  ? "/menu-monasterio"
                  : "/menu"
              )
            }
          >
            Volver al menú
          </button>

          <button
            style={boton}
            disabled={cargando}
            onClick={onVerUtilidad}
          >
            Ver reporte de utilidad en USD
          </button>

          <button
            style={boton}
            disabled={!resultado || cargando}
            onClick={() => window.print()}
          >
            Imprimir / PDF
          </button>
        </div>

        <p>
          Los ingresos se cuentan por fecha de cobro,
          incluidos los abonos a crédito y descontados
          los vueltos. Los gastos se cuentan por la fecha
          indicada en cada gasto, en su moneda original.
        </p>

        <p>
          Cuando una factura incluye varias actividades,
          cada moneda cobrada se reparte proporcionalmente
          al valor de sus productos. Se incluyen todas las
          clasificaciones de gastos. Lo que no puede
          asignarse aparece en «Sin actividad asignada».
        </p>

        {error && (
          <p
            role="alert"
            style={{
              color: "#a32020",
              fontWeight: "bold"
            }}
          >
            {error}
          </p>
        )}

        {cargando && (
          <p role="status">
            Consultando ingresos y gastos...
          </p>
        )}

        {resultado && (
          <>
            <h3>
              {resultado.sede === "AMBAS"
                ? "Ambas sedes"
                : resultado.sede}
              {" · "}
              {fechaCorta(resultado.desde)}
              {" al "}
              {fechaCorta(resultado.hasta)}
            </h3>

            {resultado.advertencias.length > 0 && (
              <div
                style={{
                  background: "#fff4cf",
                  padding: "12px",
                  marginBottom: "15px"
                }}
              >
                <strong>
                  Observaciones sobre los registros:
                </strong>

                <ul>
                  {resultado.advertencias.map(
                    (advertencia, indice) => (
                      <li key={indice}>
                        {advertencia.mensaje}
                        {" Casos: "}
                        {advertencia.casos}.
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {resultado.movimientosOmitidos.cantidad > 0 && (
              <p style={{ color: "#855900" }}>
                Hay{" "}
                {resultado.movimientosOmitidos.cantidad}
                {" "}movimientos de otros tipos que no se
                incluyen como cobros ni vueltos:
                {" USD "}
                {formato(
                  resultado.movimientosOmitidos.importes.D
                )}
                {", COP "}
                {formato(
                  resultado.movimientosOmitidos.importes.P
                )}
                {", Bs "}
                {formato(
                  resultado.movimientosOmitidos.importes.Bs
                )}
                . Deben revisarse por separado.
              </p>
            )}

            {!resultado.reporte.length ? (
              <p>
                No hay actividades ni movimientos para mostrar.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    background: "white"
                  }}
                >
                  <thead style={{ background: color }}>
                    <tr>
                      <th style={celda} rowSpan="2">
                        Actividad productiva
                      </th>

                      {monedas.map(moneda => (
                        <th
                          style={celda}
                          key={moneda}
                          colSpan="3"
                        >
                          {etiquetas[moneda]}
                        </th>
                      ))}
                    </tr>

                    <tr>
                      {monedas.map(moneda => (
                        <React.Fragment key={moneda}>
                          <th style={celda}>Ingresos</th>
                          <th style={celda}>Gastos</th>
                          <th style={celda}>Diferencia</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {resultado.reporte.map(item => (
                      <React.Fragment key={item.actividadId}>
                        <tr
                          style={{
                            background:
                              item.actividadId === "SIN_ACTIVIDAD"
                                ? "#fff8df"
                                : "white"
                          }}
                        >
                          <td style={celda}>
                            <strong>
                              {item.actividad}
                            </strong>

                            <br />

                            <button
                              style={{
                                ...boton,
                                padding: "4px 8px",
                                marginTop: "5px"
                              }}
                              onClick={() =>
                                setAbierta(
                                  abierta === item.actividadId
                                    ? null
                                    : item.actividadId
                                )
                              }
                            >
                              {abierta === item.actividadId
                                ? "Ocultar movimientos"
                                : "Ver movimientos"}
                            </button>
                          </td>

                          {monedas.map(moneda => (
                            <React.Fragment key={moneda}>
                              <td style={numero}>
                                {formato(
                                  item.ingresos[moneda]
                                )}
                              </td>

                              <td style={numero}>
                                {formato(
                                  item.gastos[moneda]
                                )}
                              </td>

                              <td
                                style={{
                                  ...numero,
                                  fontWeight: "bold",
                                  color:
                                    item.diferencia[moneda] < 0
                                      ? "#a32020"
                                      : "#26734d"
                                }}
                              >
                                {formato(
                                  item.diferencia[moneda]
                                )}
                              </td>
                            </React.Fragment>
                          ))}
                        </tr>

                        {abierta === item.actividadId && (
                          <tr>
                            <td
                              colSpan="10"
                              style={celda}
                            >
                              <DetalleActividad
                                item={item}
                                color={color}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr
                      style={{
                        background: color,
                        fontWeight: "bold"
                      }}
                    >
                      <td style={celda}>TOTALES</td>

                      {monedas.map(moneda => (
                        <React.Fragment key={moneda}>
                          <td style={numero}>
                            {formato(
                              resultado.totales.ingresos[moneda]
                            )}
                          </td>

                          <td style={numero}>
                            {formato(
                              resultado.totales.gastos[moneda]
                            )}
                          </td>

                          <td style={numero}>
                            {formato(
                              resultado.totales.diferencia[moneda]
                            )}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <p>
              <strong>
                Diferencia = ingresos cobrados − gastos
                del período, por moneda.
              </strong>
              {" "}El reporte de utilidad en USD continúa
              disponible con su cálculo anterior.
            </p>
          </>
        )}
      </main>
    </div>
  );
}