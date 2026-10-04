import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";

const ReporCredito = () => {
  const navigate = useNavigate();
  const formularioRef = useRef(null);

  // =========================================================
  // SEDE
  // =========================================================
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // =========================================================
  // COLORES SEGÚN SEDE
  // =========================================================
  const colorPrincipal = esMonasterio ? "#5A2D16" : "#FC9E9B";
  const colorAccion = esMonasterio ? "#B8862D" : "#84B09C";
  const colorTabla = esMonasterio ? "#E8D1A5" : "#F9CEAE";
  const colorSuave = esMonasterio ? "#F5EBDD" : "#EDC5CD";

  // =========================================================
  // ESTADOS
  // =========================================================
  const [desde, setDesde] = useState(obtenerFechaVenezuela());
  const [hasta, setHasta] = useState(obtenerFechaVenezuela());

  const [reporte, setReporte] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  // =========================================================
  // FORMATO NUMÉRICO
  // =========================================================
  const formatoVE = (valor) => {
    const numero = Number(valor || 0);

    return numero.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // =========================================================
  // FORMATO DE FECHA GUARDADA
  // =========================================================
  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    return String(fecha)
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");
  };

  // =========================================================
  // CARGAR REPORTE
  // =========================================================
  const cargarReporte = async () => {
    if (!desde || !hasta) {
      alert("Debe seleccionar un rango de fechas.");
      return;
    }

    if (desde > hasta) {
      alert("La fecha DESDE no puede ser mayor que la fecha HASTA.");
      return;
    }

    try {
      setProcesando(true);
      setConsultaRealizada(false);
      setReporte([]);

      const res = await fetch(
        `${API_URL}/api/ventas/reporte-creditos/${desde}/${hasta}?sede=${encodeURIComponent(
          sede
        )}`
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.msg || data.error || "No se pudo generar el reporte.");
        setReporte([]);
        setConsultaRealizada(true);
        return;
      }

      setReporte(Array.isArray(data.reporte) ? data.reporte : []);
      setConsultaRealizada(true);

      setTimeout(() => {
        formularioRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    } catch (error) {
      console.error("Error cargando reporte de créditos:", error);
      alert("Error cargando el reporte de ventas a crédito.");

      setReporte([]);
      setConsultaRealizada(true);
    } finally {
      setProcesando(false);
    }
  };

  // =========================================================
  // ELIMINAR FACTURA
  // =========================================================
  const eliminarFacturaDesdeCredito = async (factura) => {
    const confirmar = window.confirm(
      "¿Está seguro que desea ELIMINAR esta venta a CRÉDITO?\n\n" +
        `Factura: ${factura}\n` +
        `Sede: ${esMonasterio ? "MONASTERIO" : "TIENDITA"}\n\n` +
        "Se eliminarán la venta, los productos y sus movimientos asociados.\n\n" +
        "Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      const res = await fetch(
        `${API_URL}/api/facturas/eliminar-completa/${factura}?sede=${encodeURIComponent(
          sede
        )}`,
        {
          method: "DELETE"
        }
      );

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.msg || json.error || "No se pudo eliminar la factura.");
        return;
      }

      alert("Factura eliminada correctamente.");

      await cargarReporte();
    } catch (error) {
      console.error("Error eliminando factura:", error);
      alert("Hubo un error al eliminar la factura.");
    } finally {
      setProcesando(false);
    }
  };

  // =========================================================
  // IMPRIMIR / PDF
  // =========================================================
  const imprimirReporte = () => {
    if (reporte.length === 0) {
      alert("No hay información para imprimir.");
      return;
    }

    window.print();
  };

  // =========================================================
  // VOLVER
  // =========================================================
  const volverAlMenu = () => {
    navigate(esMonasterio ? "/menu-monasterio" : "/menu");
  };

  return (
    <div>
      {/* =====================================================
          ESTILOS DE IMPRESIÓN
      ===================================================== */}
      <style>
        {`
          @media print {

            @page {
              size: letter portrait;
              margin: 12mm;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              font-family: Arial, sans-serif !important;
            }

            .no-print {
              display: none !important;
            }

            .reporte-impresion {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .encabezado-contable {
              display: block !important;
            }

            .tabla-reporte {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 8px !important;
            }

            .tabla-reporte thead {
              display: table-header-group;
            }

            .tabla-reporte tfoot {
              display: table-footer-group;
            }

            .tabla-reporte th,
            .tabla-reporte td {
              border: 1px solid #000 !important;
              padding: 3px !important;
              color: black !important;
            }

            .tabla-reporte th {
              background: #eeeeee !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .fila-abonos {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .tabla-abonos {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 7px !important;
            }

            .tabla-abonos th,
            .tabla-abonos td {
              border: 1px solid #777 !important;
              padding: 2px !important;
            }

            .btn-eliminar {
              display: none !important;
            }

            .columna-eliminar {
              display: none !important;
            }

            .titulo-pantalla {
              display: none !important;
            }
          }

          @media screen {
            .encabezado-contable {
              display: none;
            }
          }
        `}
      </style>

      {/* =====================================================
          PROCESANDO
      ===================================================== */}
      {procesando && (
        <div
          className="no-print"
          style={{
            backgroundColor: "#84868A",
            color: "white",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            zIndex: 999999
          }}
        >
          Procesando, por favor espere...
        </div>
      )}

      {/* =====================================================
          ENCABEZADO DEL SISTEMA
      ===================================================== */}
      <div className="no-print">
        <Encabezado sede={sede} />
      </div>

      <div style={{ padding: "20px" }}>
        {/* ===================================================
            TÍTULO EN PANTALLA
        =================================================== */}
        <h2
          className="titulo-pantalla no-print"
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontWeight: "bold",
            color: colorPrincipal
          }}
        >
          Reporte de Ventas a Crédito
        </h2>

        {/* ===================================================
            CUADRO DE SOLICITUD
        =================================================== */}
        <div
          ref={formularioRef}
          className="no-print"
          style={{
            width: "550px",
            maxWidth: "90%",
            margin: "0 auto 20px auto",
            padding: "20px",
            border: `2px solid ${colorPrincipal}`,
            borderRadius: "10px",
            backgroundColor: "white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
          }}
        >
          <h3
            style={{
              textAlign: "center",
              marginTop: 0,
              marginBottom: "18px",
              color: colorPrincipal
            }}
          >
            Seleccione rango de fechas
          </h3>

          <div
            style={{
              display: "flex",
              gap: "30px",
              justifyContent: "center",
              marginBottom: "15px"
            }}
          >
            <div style={{ width: "45%" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "5px"
                }}
              >
                Desde
              </label>

              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #aaa"
                }}
              />
            </div>

            <div style={{ width: "45%" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "5px"
                }}
              >
                Hasta
              </label>

              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #aaa"
                }}
              />
            </div>
          </div>

          {/* BOTONES */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap"
            }}
          >
            <button
              onClick={cargarReporte}
              disabled={procesando}
              style={{
                minWidth: "130px",
                padding: "10px 18px",
                backgroundColor: colorAccion,
                color: "white",
                border: "none",
                borderRadius: "7px",
                fontWeight: "bold",
                cursor: procesando ? "not-allowed" : "pointer"
              }}
            >
              Buscar
            </button>

            <button
              onClick={imprimirReporte}
              disabled={reporte.length === 0}
              style={{
                minWidth: "150px",
                padding: "10px 18px",
                backgroundColor:
                  reporte.length > 0 ? "#355C8A" : "#7c8591",
                color: "white",
                border: "none",
                borderRadius: "7px",
                fontWeight: "bold",
                cursor:
                  reporte.length > 0 ? "pointer" : "not-allowed"
              }}
            >
              Imprimir / PDF
            </button>

            <button
              onClick={volverAlMenu}
              style={{
                minWidth: "160px",
                padding: "10px 18px",
                backgroundColor: colorPrincipal,
                color: "white",
                border: "none",
                borderRadius: "7px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Volver al Menú
            </button>
          </div>
        </div>

        {/* ===================================================
            MENSAJE SIN RESULTADOS
        =================================================== */}
        {consultaRealizada && !procesando && reporte.length === 0 && (
          <div
            className="no-print"
            style={{
              maxWidth: "700px",
              margin: "25px auto",
              padding: "18px",
              textAlign: "center",
              backgroundColor: colorSuave,
              border: `1px solid ${colorPrincipal}`,
              borderRadius: "8px",
              fontWeight: "bold"
            }}
          >
            No se encontraron ventas a crédito para el período seleccionado.
          </div>
        )}

        {/* ===================================================
            REPORTE
        =================================================== */}
        {reporte.length > 0 && (
          <div className="reporte-impresion">
            {/* ===============================================
                ENCABEZADO CONTABLE PARA IMPRESIÓN
            =============================================== */}
            <div
              className="encabezado-contable"
              style={{
                textAlign: "center",
                marginBottom: "15px"
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "bold"
                }}
              >
                {esMonasterio
                  ? "MONASTERIO DE MADRES CARMELITAS DESCALZAS – VENEZUELA"
                  : "TIENDITA MADRE LUCÍA – V10166638-3"}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginTop: "5px"
                }}
              >
                REPORTE DE VENTAS A CRÉDITO
              </div>

              <div
                style={{
                  fontSize: "11px",
                  marginTop: "5px"
                }}
              >
                Período: {formatearFecha(desde)} al{" "}
                {formatearFecha(hasta)}
              </div>
            </div>

            {/* ===============================================
                TÍTULO EN PANTALLA SOBRE LA TABLA
            =============================================== */}
            <div
              className="no-print"
              style={{
                textAlign: "center",
                marginBottom: "12px"
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: colorPrincipal
                }}
              >
                Ventas a Crédito
              </h3>

              <div style={{ marginTop: "4px", fontSize: "14px" }}>
                Del {formatearFecha(desde)} al{" "}
                {formatearFecha(hasta)}
              </div>
            </div>

            {/* ===============================================
                TABLA PRINCIPAL
            =============================================== */}
            <div style={{ overflowX: "auto" }}>
              <table
                className="tabla-reporte"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "center",
                  fontSize: "12px"
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: colorTabla
                    }}
                  >
                    <th style={estiloCelda}>Fecha</th>
                    <th style={estiloCelda}>Factura</th>
                    <th style={estiloCelda}>Cliente</th>
                    <th style={estiloCelda}>Código</th>
                    <th style={estiloCelda}>Descripción</th>
                    <th style={estiloCelda}>Cantidad</th>
                    <th style={estiloCelda}>P. Sistema</th>
                    <th style={estiloCelda}>P. Venta</th>
                    <th style={estiloCelda}>Dscto.</th>
                    <th style={estiloCelda}>Total</th>
                    <th
                      className="columna-eliminar"
                      style={estiloCelda}
                    >
                      Eliminar
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reporte.map((item, indiceReporte) => {
                    const factura = item?.venta?.factura;
                    const productos = Array.isArray(item?.productos)
                      ? item.productos
                      : [];
                    const abonos = Array.isArray(item?.abonos)
                      ? item.abonos
                      : [];

                    return (
                      <React.Fragment
                        key={
                          factura ??
                          `credito-${indiceReporte}`
                        }
                      >
                        {/* =====================================
                            PRODUCTOS
                        ===================================== */}
                        {productos.map((p, i) => (
                          <tr
                            key={`${factura}-${i}`}
                            style={{
                              backgroundColor:
                                i % 2 === 0 ? "white" : "#fafafa"
                            }}
                          >
                            {i === 0 ? (
                              <>
                                <td style={estiloCelda}>
                                  {formatearFecha(
                                    item?.venta?.fecha
                                  )}
                                </td>

                                <td style={estiloCelda}>
                                  {factura}
                                </td>

                                <td style={estiloCelda}>
                                  {item?.clienteNombre || ""}
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={estiloCelda}></td>
                                <td style={estiloCelda}></td>
                                <td style={estiloCelda}></td>
                              </>
                            )}

                            <td style={estiloCelda}>
                              {p.codigo}
                            </td>

                            <td
                              style={{
                                ...estiloCelda,
                                textAlign: "left"
                              }}
                            >
                              {p.descripcion}
                            </td>

                            <td style={estiloCelda}>
                              {formatoVE(p.cantidad)}
                            </td>

                            <td style={estiloCelda}>
                              {formatoVE(p.precioSistema)}
                            </td>

                            <td style={estiloCelda}>
                              {formatoVE(p.precioVenta)}
                            </td>

                            <td style={estiloCelda}>
                              {formatoVE(p.dscto)}
                            </td>

                            <td style={estiloCelda}>
                              {formatoVE(p.total)}
                            </td>

                            {i === 0 && (
                              <td
                                className="columna-eliminar"
                                rowSpan={Math.max(
                                  productos.length,
                                  1
                                )}
                                style={{
                                  ...estiloCelda,
                                  textAlign: "center",
                                  verticalAlign: "middle"
                                }}
                              >
                                <button
                                  className="btn-eliminar"
                                  onClick={() =>
                                    eliminarFacturaDesdeCredito(
                                      factura
                                    )
                                  }
                                  title="Eliminar factura"
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    fontSize: "18px"
                                  }}
                                >
                                  🗑️
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}

                        {/* =====================================
                            ABONOS
                        ===================================== */}
                        <tr className="fila-abonos">
                          <td
                            colSpan="10"
                            style={{
                              border: "1px solid #999",
                              padding: "8px",
                              backgroundColor: colorSuave
                            }}
                          >
                            <div
                              style={{
                                textAlign: "center",
                                fontWeight: "bold",
                                color: colorPrincipal,
                                marginBottom: "8px"
                              }}
                            >
                              ABONOS RECIBIDOS
                            </div>

                            {abonos.length > 0 ? (
                              <table
                                className="tabla-abonos"
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  backgroundColor: "white"
                                }}
                              >
                                <thead>
                                  <tr
                                    style={{
                                      backgroundColor: colorTabla
                                    }}
                                  >
                                    <th style={estiloCeldaAbono}>
                                      Fecha
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Efectivo Pesos
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Transferencia Pesos
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Efectivo Bs
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Transferencia Bs
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Punto
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Pago Móvil
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Efectivo $
                                    </th>

                                    <th style={estiloCeldaAbono}>
                                      Zelle
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {abonos.map((a, idx) => (
                                    <tr key={idx}>
                                      <td style={estiloCeldaAbono}>
                                        {formatearFecha(a.fecha)}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(a.efectivoP)}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(
                                          a.transferenciaP
                                        )}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(a.efectivoBs)}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(
                                          a.transferenciaBs
                                        )}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(a.puntoBs)}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(
                                          a.pagomovilBs
                                        )}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(a.efectivoD)}
                                      </td>

                                      <td style={estiloCeldaAbono}>
                                        {formatoVE(a.zelle)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "8px"
                                }}
                              >
                                No se han registrado abonos.
                              </div>
                            )}

                            {/* =================================
                                SALDOS
                            ================================= */}
                            <div
                              style={{
                                textAlign: "right",
                                marginTop: "12px",
                                fontFamily:
                                  '"Roboto Mono", monospace'
                              }}
                            >
                              <strong>
                                SALDOS PENDIENTES:
                              </strong>

                              <div>
                                Saldo en Pesos:{" "}
                                <strong>
                                  {formatoVE(
                                    item?.saldo?.pesos
                                  )}
                                </strong>
                              </div>

                              <div>
                                Saldo en Bs:{" "}
                                <strong>
                                  {formatoVE(
                                    item?.saldo?.bolivares
                                  )}
                                </strong>
                              </div>

                              <div>
                                Saldo en $:{" "}
                                <strong>
                                  {formatoVE(
                                    item?.saldo?.dolares
                                  )}
                                </strong>
                              </div>
                            </div>
                          </td>

                          <td
                            className="columna-eliminar"
                            style={{
                              border: "1px solid #999"
                            }}
                          ></td>
                        </tr>

                        {/* SEPARACIÓN ENTRE FACTURAS */}
                        <tr>
                          <td
                            colSpan="11"
                            style={{
                              height: "7px",
                              padding: 0,
                              border: "none",
                              backgroundColor: "white"
                            }}
                          ></td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================
// ESTILOS DE CELDAS
// =========================================================
const estiloCelda = {
  border: "1px solid #999",
  padding: "6px",
  verticalAlign: "middle"
};

const estiloCeldaAbono = {
  border: "1px solid #aaa",
  padding: "4px",
  textAlign: "center"
};

export default ReporCredito;