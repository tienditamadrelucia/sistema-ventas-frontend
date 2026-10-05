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
                    <tr key={item.actividadId} style={{ backgroundColor: "white" }}>
                      <td style={{ ...celda, textAlign: "left", fontWeight: "bold" }}>
                        {item.actividad}
                      </td>
                      <td style={celda}>$ {formatoVE(item.ventasTiendita)}</td>
                      <td style={celda}>$ {formatoVE(item.ventasMonasterio)}</td>
                      <td style={{ ...celda, fontWeight: "bold" }}>
                        $ {formatoVE(item.ventasTotales)}
                      </td>
                      <td style={celda}>$ {formatoVE(item.costosTiendita)}</td>
                      <td style={celda}>$ {formatoVE(item.costosMonasterio)}</td>
                      <td style={{ ...celda, fontWeight: "bold" }}>
                        $ {formatoVE(item.costosTotales)}
                      </td>
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