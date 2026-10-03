import React, { useState } from "react";
import { API_URL } from "../config";

const ReporteEntradas = () => {

  // =====================================================
  // SEDE
  // =====================================================
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // =====================================================
  // COLORES SEGÚN SEDE
  // =====================================================
  const colorPrincipal = esMonasterio ? "#5A2D16" : "#FC9E9B";
  const colorAccion = esMonasterio ? "#B8862D" : "#84B09C";
  const colorTabla = esMonasterio ? "#E8D1A5" : "#F9CEAE";
  const colorSuave = esMonasterio ? "#F5EBDD" : "#EDC5CD";

  // =====================================================
  // ESTADOS
  // =====================================================
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reporte, setReporte] = useState([]);
  const [procesando, setProcesando] = useState(false);

  // =====================================================
  // CONSULTAR REPORTE
  // =====================================================
  const consultar = async () => {

    if (!fechaDesde || !fechaHasta) {
      alert("Debe seleccionar ambas fechas");
      return;
    }

    if (fechaDesde > fechaHasta) {
      alert("La fecha Desde no puede ser mayor que la fecha Hasta");
      return;
    }

    try {

      setProcesando(true);

      const resp = await fetch(
        `${API_URL}/api/entradas/reporte?desde=${fechaDesde}&hasta=${fechaHasta}&sede=${encodeURIComponent(sede)}`
      );

      const datos = await resp.json();

      if (!resp.ok) {
        alert(datos.mensaje || "Error consultando el reporte de entradas");
        setReporte([]);
        return;
      }

      // Compatible tanto si el backend devuelve directamente
      // el arreglo como si devuelve { ok, reporte }
      if (Array.isArray(datos)) {
        setReporte(datos);
      } else {
        setReporte(datos.reporte || []);
      }

    } catch (error) {

      console.error("Error consultando reporte de entradas:", error);
      alert("Error consultando el reporte de entradas");
      setReporte([]);

    } finally {

      setProcesando(false);

    }
  };

  // =====================================================
  // FORMATEAR FECHA
  // =====================================================
  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    return fecha
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");
  };

  // =====================================================
  // VOLVER
  // =====================================================
  const volverAlMenu = () => {
    window.close();
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial"
      }}
    >

      {/* =====================================================
          MENSAJE PROCESANDO
      ===================================================== */}
      {procesando && (
        <div
          style={{
            backgroundColor: colorPrincipal,
            color: "white",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "15px",
            borderRadius: "6px"
          }}
        >
          Procesando, por favor espere...
        </div>
      )}

      {/* =====================================================
          TÍTULO
      ===================================================== */}
      <h2
        style={{
          textAlign: "center",
          color: colorPrincipal,
          marginBottom: "20px"
        }}
      >
        Reporte de Entradas
      </h2>

      {/* =====================================================
          FORMULARIO
      ===================================================== */}
      <div
        style={{
          width: "650px",
          maxWidth: "95%",
          margin: "0 auto 25px auto",
          padding: "20px",
          border: `1px solid ${colorPrincipal}`,
          borderRadius: "10px",
          backgroundColor: "white",
          boxShadow: "0 2px 5px rgba(0,0,0,0.12)"
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >

          {/* DESDE */}
          <label style={{ fontWeight: "bold" }}>
            Desde:

            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                marginLeft: "7px",
                padding: "7px",
                backgroundColor: colorSuave,
                border: `1px solid ${colorPrincipal}`,
                borderRadius: "6px"
              }}
            />
          </label>

          {/* HASTA */}
          <label style={{ fontWeight: "bold" }}>
            Hasta:

            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                marginLeft: "7px",
                padding: "7px",
                backgroundColor: colorSuave,
                border: `1px solid ${colorPrincipal}`,
                borderRadius: "6px"
              }}
            />
          </label>

        </div>

        {/* BOTONES */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginTop: "20px"
          }}
        >

          <button
            onClick={consultar}
            disabled={procesando}
            style={{
              minWidth: "130px",
              padding: "8px 15px",
              backgroundColor: colorAccion,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontFamily: "Arial Black",
              cursor: procesando ? "not-allowed" : "pointer"
            }}
          >
            Consultar
          </button>

          <button
            onClick={volverAlMenu}
            style={{
              minWidth: "150px",
              padding: "8px 15px",
              backgroundColor: colorPrincipal,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontFamily: "Arial Black",
              cursor: "pointer"
            }}
          >
            Volver al Menú
          </button>

        </div>

      </div>

      {/* =====================================================
          REPORTE
      ===================================================== */}
      {reporte.length > 0 && (
        <>

          {/* ENCABEZADO DEL REPORTE */}
          <h2
            style={{
              textAlign: "center",
              margin: 0,
              color: colorPrincipal
            }}
          >
            {esMonasterio
              ? "MONASTERIO DE MADRES CARMELITAS DESCALZAS – VENEZUELA"
              : "TIENDITA MADRE LUCÍA – V10166638-3"}
          </h2>

          <p
            style={{
              textAlign: "center",
              marginTop: "5px",
              marginBottom: "20px"
            }}
          >
            <strong>Reporte de Entradas</strong>
            <br />

            Desde: {formatearFecha(fechaDesde)}
            {" — "}
            Hasta: {formatearFecha(fechaHasta)}
          </p>

          {/* =====================================================
              TABLA
          ===================================================== */}
          <table
            style={{
              width: "90%",
              borderCollapse: "collapse",
              margin: "0 auto"
            }}
          >

            <thead>
              <tr
                style={{
                  backgroundColor: colorTabla
                }}
              >

                <th
                  style={{
                    textAlign: "center",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Fecha
                </th>

                <th
                  style={{
                    textAlign: "center",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Categoría
                </th>

                <th
                  style={{
                    textAlign: "center",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Código
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Descripción
                </th>

                <th
                  style={{
                    textAlign: "center",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Cantidad
                </th>

              </tr>
            </thead>

            <tbody>

              {reporte.map((e, index) => (

                <tr key={e._id || index}>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {formatearFecha(e.fecha)}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {e.categoria}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {e.productoId?.codigo || e.codigo}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {e.productoId?.descripcion || ""}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {Number(e.cantidad || 0).toFixed(2)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </>
      )}

      {/* =====================================================
          SIN RESULTADOS
      ===================================================== */}
      {!procesando &&
        fechaDesde &&
        fechaHasta &&
        reporte.length === 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "25px",
              fontWeight: "bold",
              color: "#666"
            }}
          >
            No hay entradas para mostrar en el período seleccionado.
          </div>
        )}

    </div>
  );
};

export default ReporteEntradas;