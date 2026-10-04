import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const ReporteGastos = () => {

  const navigate = useNavigate();

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

  // PDF SIEMPRE AZUL
  const colorPDF = "#355C8A";

  // =====================================================
  // ESTADOS
  // =====================================================
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reporte, setReporte] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

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
      setConsultaRealizada(false);

      const resp = await fetch(
        `${API_URL}/api/gastos/reporte?desde=${fechaDesde}&hasta=${fechaHasta}&sede=${encodeURIComponent(sede)}`
      );

      const datos = await resp.json();

      if (!resp.ok) {
        alert(
          datos.mensaje ||
          datos.error ||
          "Error consultando el reporte de gastos"
        );

        setReporte([]);
        return;
      }

      if (Array.isArray(datos)) {
        setReporte(datos);
      } else {
        setReporte(datos.reporte || []);
      }

      setConsultaRealizada(true);

    } catch (error) {

      console.error("Error consultando reporte de gastos:", error);

      alert("Error consultando el reporte de gastos");

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

    if (esMonasterio) {
      navigate("/menu-monasterio");
    } else {
      navigate("/menu");
    }
  };

  // =====================================================
  // IMPRIMIR / GUARDAR PDF
  // =====================================================
  const imprimirReporte = () => {

    if (reporte.length === 0) {
      alert("Primero debe generar un reporte.");
      return;
    }

    window.print();
  };

  // =====================================================
  // ESTILOS DE IMPRESIÓN
  // =====================================================
  const estilosImpresion = `
    @media print {

      @page {
        size: letter portrait;
        margin: 12mm;
      }

      .no-print {
        display: none !important;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      .contenedor-principal {
        padding: 0 !important;
        margin: 0 !important;
      }

      .reporte-impresion {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .tabla-reporte {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 0 auto !important;
      }

      .tabla-reporte thead {
        display: table-header-group;
      }

      .tabla-reporte tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .tabla-reporte th {
        font-size: 10px !important;
        padding: 5px !important;
      }

      .tabla-reporte td {
        font-size: 9px !important;
        padding: 4px !important;
      }

      .encabezado-reporte {
        page-break-after: avoid;
        break-after: avoid;
      }
    }
  `;

  return (
    <div
      className="contenedor-principal"
      style={{
        padding: "20px",
        fontFamily: "Arial"
      }}
    >

      <style>{estilosImpresion}</style>

      {/* =====================================================
          PROCESANDO
      ===================================================== */}
      {procesando && (
        <div
          className="no-print"
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
          TÍTULO DE PANTALLA
      ===================================================== */}
      <h2
        className="no-print"
        style={{
          textAlign: "center",
          color: colorPrincipal,
          marginBottom: "20px"
        }}
      >
        Reporte de Gastos
      </h2>

      {/* =====================================================
          SOLICITUD DEL REPORTE
      ===================================================== */}
      <div
        className="no-print"
        style={{
          width: "550px",
          maxWidth: "90%",
          margin: "0 auto 20px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >

        <h3
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: "15px",
            fontWeight: "bold"
          }}
        >
          Seleccione rango de fechas
        </h3>

        <div
          style={{
            display: "flex",
            gap: "40px",
            marginBottom: "20px"
          }}
        >

          {/* DESDE */}
          <div style={{ width: "50%" }}>

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
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setConsultaRealizada(false);
              }}
              style={{
                width: "100%",
                padding: "7px",
                boxSizing: "border-box",
                backgroundColor: colorSuave,
                border: `1px solid ${colorPrincipal}`,
                borderRadius: "6px"
              }}
            />

          </div>

          {/* HASTA */}
          <div style={{ width: "50%" }}>

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
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setConsultaRealizada(false);
              }}
              style={{
                width: "100%",
                padding: "7px",
                boxSizing: "border-box",
                backgroundColor: colorSuave,
                border: `1px solid ${colorPrincipal}`,
                borderRadius: "6px"
              }}
            />

          </div>

        </div>

        {/* =====================================================
            BOTONES
        ===================================================== */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >

          <button
            onClick={consultar}
            disabled={procesando}
            style={{
              width: "140px",
              padding: "8px",
              backgroundColor: colorAccion,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontFamily: "Arial Black",
              cursor: procesando ? "not-allowed" : "pointer"
            }}
          >
            Buscar
          </button>

          <button
            onClick={imprimirReporte}
            disabled={reporte.length === 0}
            style={{
              width: "150px",
              padding: "8px",
              backgroundColor: 
              reporte.length > 0 ? "#355C8A" : "#7c8591",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontFamily: "Arial Black",
              cursor:
                reporte.length > 0 ? "pointer" : "not-allowed",
              opacity: 1
            }}
          >
            Imprimir / PDF
          </button>

          <button
            onClick={volverAlMenu}
            style={{
              width: "160px",
              padding: "8px",
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
          DOCUMENTO CONTABLE
      ===================================================== */}
      {reporte.length > 0 && (

        <div className="reporte-impresion">

          {/* ENCABEZADO CONTABLE */}
          <div className="encabezado-reporte">

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
              <strong>Reporte de Gastos</strong>
              <br />

              Desde: {formatearFecha(fechaDesde)}
              {" — "}
              Hasta: {formatearFecha(fechaHasta)}
            </p>

          </div>

          {/* =====================================================
              TABLA
          ===================================================== */}
          <table
            className="tabla-reporte"
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
                  Moneda
                </th>

                <th
                  style={{
                    textAlign: "right",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Monto
                </th>

                <th
                  style={{
                    textAlign: "center",
                    padding: "7px",
                    border: "1px solid #aaa"
                  }}
                >
                  Recibo
                </th>

              </tr>

            </thead>

            <tbody>

              {reporte.map((g, index) => (

                <tr key={g._id || index}>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {formatearFecha(g.fecha)}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {g.descripcion}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {g.moneda}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "right",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {Number(g.monto || 0).toFixed(2)}
                  </td>

                  <td
                    style={{
                      padding: "5px",
                      textAlign: "center",
                      fontSize: "11px",
                      borderBottom: "1px solid #ddd"
                    }}
                  >
                    {g.numeroRecibo || ""}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

      {/* =====================================================
          SIN RESULTADOS
      ===================================================== */}
      {!procesando &&
        consultaRealizada &&
        fechaDesde &&
        fechaHasta &&
        reporte.length === 0 && (

          <div
            className="no-print"
            style={{
              textAlign: "center",
              marginTop: "25px",
              fontWeight: "bold",
              color: "#666"
            }}
          >
            No hay gastos para mostrar en el período seleccionado.
          </div>

        )}

    </div>
  );
};

export default ReporteGastos;