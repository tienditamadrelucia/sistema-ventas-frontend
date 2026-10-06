import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";

const formatoVE = (num) => Number(num || 0).toLocaleString("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const Utilidad = () => {
  const navigate = useNavigate();
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [reporte, setReporte] = useState([]);
  const [totales, setTotales] = useState({
    ventasTiendita: 0,
    ventasMonasterio: 0,
    ventasTotales: 0,
    costosTiendita: 0,
    costosMonasterio: 0,
    costosTotales: 0,
    utilidad: 0,
    margen: 0
  });
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const [actividadAbierta, setActividadAbierta] = useState(null);

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-VE", { timeZone: "UTC" });
};

const simboloMoneda = (moneda) => {
  if (moneda === "D") return "$";
  if (moneda === "P") return "COP";
  if (moneda === "Bs") return "Bs.";
  return moneda || "";
};

  const buscar = async () => {
    if (!desde || !hasta) return alert("Seleccione ambas fechas.");
    if (desde > hasta) return alert("La fecha DESDE no puede ser mayor que la fecha HASTA.");

    setCargando(true);
    setBuscado(true);

    try {
      const res = await fetch(`${API_URL}/api/ventas/utilidad-actividad?desde=${desde}&hasta=${hasta}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setReporte([]);
        return alert(data.mensaje || "No se pudo generar el reporte.");
      }

      setReporte(Array.isArray(data.reporte) ? data.reporte : []);
      setTotales(data.totales || {
        ventasTiendita: 0,
        ventasMonasterio: 0,
        ventasTotales: 0,
        costosTiendita: 0,
        costosMonasterio: 0,
        costosTotales: 0,
        utilidad: 0,
        margen: 0
      });
    } catch (error) {
      console.error("ERROR UTILIDAD POR ACTIVIDAD:", error);
      setReporte([]);
      alert("Error al obtener el reporte.");
    } finally {
      setCargando(false);
    }
  };

  const estiloBoton = {
    padding: "9px 24px",
    border: "none",
    borderRadius: "7px",
    color: "white",
    fontFamily: "Arial Black, Arial, sans-serif",
    cursor: "pointer"
  };

  const colorResultado = (valor) => {
    if (Number(valor) < 0) return "#B22222";
    if (Number(valor) > 0) return "#26734D";
    return "#333";
  };

  return (
    <div>
      <Encabezado sede={sede} />

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Reporte de Utilidad por Actividad Productiva
        </h2>

        <div style={{
          width: "600px",
          maxWidth: "95%",
          margin: "0 auto 20px",
          padding: "18px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", marginTop: 0 }}>Seleccione el período</h3>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <label style={{ fontWeight: "bold" }}>Desde:</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={{
                padding: "7px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: esMonasterio ? "#F5EBDD" : "#EDC5CD"
              }}
            />

            <label style={{ fontWeight: "bold" }}>Hasta:</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={{
                padding: "7px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: esMonasterio ? "#F5EBDD" : "#EDC5CD"
              }}
            />

            <button
              onClick={buscar}
              disabled={cargando}
              style={{
                ...estiloBoton,
                backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
                opacity: cargando ? 0.6 : 1
              }}
            >
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <button
            onClick={() => navigate(esMonasterio ? "/menu-monasterio" : "/menu")}
            style={{
              ...estiloBoton,
              backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B"
            }}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {cargando && (
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            Calculando utilidad...
          </p>
        )}

        {!cargando && buscado && reporte.length === 0 && (
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            No se encontraron ventas ni costos de producción asociados a actividades productivas en el período seleccionado.
          </p>
        )}

        {!cargando && reporte.length > 0 && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
                textAlign: "center"
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
                    fontWeight: "bold"
                  }}>
                    <th style={celda}>Actividad Productiva</th>
                    <th style={celda}>Ventas Tiendita</th>
                    <th style={celda}>Ventas Monasterio</th>
                    <th style={celda}>Ventas Totales</th>
                    <th style={celda}>Costos Tiendita</th>
                    <th style={celda}>Costos Monasterio</th>
                    <th style={celda}>Costos Totales</th>
                    <th style={celda}>Utilidad</th>
                    <th style={celda}>Margen</th>
                  </tr>
                </thead>

<tbody>
  {reporte.map((item) => (
    <React.Fragment key={item.actividadId}>
      <tr style={{ backgroundColor: "white" }}>
        <td style={{ ...celda, textAlign: "left", fontWeight: "bold" }}>
          {item.actividad}
          <button
            onClick={() => setActividadAbierta(
              actividadAbierta === item.actividadId ? null : item.actividadId
            )}
            style={{
              marginLeft: "10px",
              padding: "4px 9px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
              color: "white",
              fontWeight: "bold"
            }}
          >
            {actividadAbierta === item.actividadId ? "Ocultar costos" : "Ver costos"}
          </button>
        </td>

        <td style={celda}>$ {formatoVE(item.ventasTiendita)}</td>
        <td style={celda}>$ {formatoVE(item.ventasMonasterio)}</td>
        <td style={{ ...celda, fontWeight: "bold" }}>$ {formatoVE(item.ventasTotales)}</td>
        <td style={celda}>$ {formatoVE(item.costosTiendita)}</td>
        <td style={celda}>$ {formatoVE(item.costosMonasterio)}</td>
        <td style={{ ...celda, fontWeight: "bold" }}>$ {formatoVE(item.costosTotales)}</td>

        <td style={{
          ...celda,
          fontWeight: "bold",
          color: colorResultado(item.utilidad)
        }}>
          $ {formatoVE(item.utilidad)}
        </td>

        <td style={{
          ...celda,
          fontWeight: "bold",
          color: colorResultado(item.utilidad)
        }}>
          {formatoVE(item.margen)} %
        </td>
      </tr>

      {actividadAbierta === item.actividadId && (
        <tr>
          <td colSpan="9" style={{ padding: "12px", backgroundColor: "white" }}>
            <div style={{
              border: "1px solid #bbb",
              borderRadius: "7px",
              padding: "12px",
              backgroundColor: esMonasterio ? "#F5EBDD" : "#fff8f8"
            }}>
              <h4 style={{ margin: "0 0 10px 0", textAlign: "left" }}>
                Detalle de costos — {item.actividad}
              </h4>

              {!item.detalleCostos || item.detalleCostos.length === 0 ? (
                <p style={{ textAlign: "left", margin: 0 }}>
                  No hay costos registrados para esta actividad en el período.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "white"
                  }}>
                    <thead>
                      <tr style={{
                        backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE"
                      }}>
                        <th style={celda}>Fecha</th>
                        <th style={celda}>Sede</th>
                        <th style={celda}>Descripción</th>
                        <th style={celda}>Recibo</th>
                        <th style={celda}>Clasificación</th>
                        <th style={celda}>Moneda</th>
                        <th style={celda}>Monto original</th>
                        <th style={celda}>Tasa usada</th>
                        <th style={celda}>Costo USD</th>
                      </tr>
                    </thead>

                    <tbody>
                      {item.detalleCostos.map((costo) => (
                        <tr key={costo.id} style={{ backgroundColor: "white" }}>
                          <td style={celda}>{formatearFecha(costo.fecha)}</td>
                          <td style={celda}>{costo.sede}</td>
                          <td style={{ ...celda, textAlign: "left" }}>{costo.descripcion}</td>
                          <td style={celda}>{costo.numeroRecibo || "-"}</td>
                          <td style={celda}>{costo.clasificacion}</td>
                          <td style={celda}>{costo.moneda}</td>
                          <td style={{ ...celda, textAlign: "right" }}>
                            {simboloMoneda(costo.moneda)} {formatoVE(costo.montoOriginal)}
                          </td>
                          <td style={{ ...celda, textAlign: "right" }}>
                            {costo.moneda === "D" ? "-" : formatoVE(costo.tasaUsada)}
                          </td>
                          <td style={{ ...celda, textAlign: "right", fontWeight: "bold" }}>
                            $ {formatoVE(costo.montoDolares)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr style={{
                        backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
                        fontWeight: "bold"
                      }}>
                        <td colSpan="8" style={{ ...celda, textAlign: "right" }}>
                          TOTAL COSTOS:
                        </td>
                        <td style={{ ...celda, textAlign: "right" }}>
                          $ {formatoVE(item.costosTotales)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  ))}
</tbody>
                <tfoot>
                  <tr style={{
                    backgroundColor: esMonasterio ? "#F5EBDD" : "#EDC5CD",
                    fontWeight: "bold"
                  }}>
                    <td style={{ ...celda, textAlign: "left" }}>TOTALES</td>
                    <td style={celda}>$ {formatoVE(totales.ventasTiendita)}</td>
                    <td style={celda}>$ {formatoVE(totales.ventasMonasterio)}</td>
                    <td style={celda}>$ {formatoVE(totales.ventasTotales)}</td>
                    <td style={celda}>$ {formatoVE(totales.costosTiendita)}</td>
                    <td style={celda}>$ {formatoVE(totales.costosMonasterio)}</td>
                    <td style={celda}>$ {formatoVE(totales.costosTotales)}</td>
                    <td style={{ ...celda, color: colorResultado(totales.utilidad) }}>
                      $ {formatoVE(totales.utilidad)}
                    </td>
                    <td style={{ ...celda, color: colorResultado(totales.utilidad) }}>
                      {formatoVE(totales.margen)} %
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{
              width: "500px",
              maxWidth: "95%",
              margin: "30px auto",
              padding: "18px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "white"
            }}>
              <h3 style={{ textAlign: "center", marginTop: 0 }}>
                Resultado General
              </h3>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={celda}><strong>Ventas Totales</strong></td>
                    <td style={{ ...celda, textAlign: "right" }}>
                      $ {formatoVE(totales.ventasTotales)}
                    </td>
                  </tr>

                  <tr>
                    <td style={celda}><strong>Costos de Producción</strong></td>
                    <td style={{ ...celda, textAlign: "right" }}>
                      $ {formatoVE(totales.costosTotales)}
                    </td>
                  </tr>

                  <tr style={{
                    backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE"
                  }}>
                    <td style={celda}><strong>UTILIDAD</strong></td>
                    <td style={{
                      ...celda,
                      textAlign: "right",
                      fontWeight: "bold",
                      fontSize: "18px",
                      color: colorResultado(totales.utilidad)
                    }}>
                      $ {formatoVE(totales.utilidad)}
                    </td>
                  </tr>

                  <tr>
                    <td style={celda}><strong>Margen</strong></td>
                    <td style={{
                      ...celda,
                      textAlign: "right",
                      fontWeight: "bold"
                    }}>
                      {formatoVE(totales.margen)} %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const celda = {
  border: "1px solid #bbb",
  padding: "9px"
};

export default Utilidad;