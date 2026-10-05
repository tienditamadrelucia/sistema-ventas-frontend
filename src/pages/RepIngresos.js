import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const ReporteIngresos = () => {
  const navigate = useNavigate();

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reporte, setReporte] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  const colorPrincipal = "#5A2D16";
  const colorAccion = "#B8862D";
  const colorTabla = "#E8D1A5";
  const colorSuave = "#F5EBDD";

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
        `${API_URL}/api/ingresos/reporte?desde=${fechaDesde}&hasta=${fechaHasta}`
      );

      const datos = await resp.json();

      if (!resp.ok) {
        alert(
          datos.mensaje ||
          datos.error ||
          "Error consultando el reporte de ingresos"
        );
        setReporte([]);
        return;
      }

      setReporte(Array.isArray(datos) ? datos : datos.reporte || []);
      setConsultaRealizada(true);

    } catch (error) {
      console.error("Error consultando reporte de ingresos:", error);
      alert("Error consultando el reporte de ingresos");
      setReporte([]);
    } finally {
      setProcesando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return fecha.slice(0, 10).split("-").reverse().join("/");
  };

  const formatearMonto = (valor) => {
    const numero = Number(valor);
    if (isNaN(numero)) return "0,00";

    return numero.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const nombreMoneda = (moneda) => {
    if (moneda === "D") return "Dólares";
    if (moneda === "P") return "Pesos";
    if (moneda === "Bs") return "Bolívares";
    return moneda || "—";
  };

  const nombreOrigen = (origen) => {
    if (origen === "PARTICIPACION") return "Participación";
    if (origen === "MANUAL") return "Manual";
    return origen || "—";
  };

  const totalDolares = reporte
    .filter(i => i.moneda === "D")
    .reduce((suma, i) => suma + Number(i.monto || 0), 0);

  const totalPesos = reporte
    .filter(i => i.moneda === "P")
    .reduce((suma, i) => suma + Number(i.monto || 0), 0);

  const totalBolivares = reporte
    .filter(i => i.moneda === "Bs")
    .reduce((suma, i) => suma + Number(i.monto || 0), 0);

  const imprimirReporte = () => {
    if (reporte.length === 0) {
      alert("Primero debe generar un reporte.");
      return;
    }

    window.print();
  };

  const estilosImpresion = `
    @media print {
      @page {
        size: letter landscape;
        margin: 10mm;
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
      }

      .tabla-reporte thead {
        display: table-header-group;
      }

      .tabla-reporte tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .tabla-reporte th {
        font-size: 9px !important;
        padding: 5px !important;
      }

      .tabla-reporte td {
        font-size: 8px !important;
        padding: 4px !important;
      }

      .encabezado-reporte {
        page-break-after: avoid;
        break-after: avoid;
      }

      .totales-reporte {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `;

  return (
    <div
      className="contenedor-principal"
      style={{ padding: "20px", fontFamily: "Arial" }}
    >
      <style>{estilosImpresion}</style>

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

      <h2
        className="no-print"
        style={{
          textAlign: "center",
          color: colorPrincipal,
          marginBottom: "20px"
        }}
      >
        Reporte de Ingresos del Monasterio
      </h2>

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
              backgroundColor: reporte.length > 0 ? "#355C8A" : "#7c8591",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontFamily: "Arial Black",
              cursor: reporte.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            Imprimir / PDF
          </button>

          <button
            onClick={() => navigate("/menu-monasterio")}
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

      {reporte.length > 0 && (
        <div className="reporte-impresion">
          <div className="encabezado-reporte">
            <h2
              style={{
                textAlign: "center",
                margin: 0,
                color: colorPrincipal
              }}
            >
              MONASTERIO DE MADRES CARMELITAS DESCALZAS – VENEZUELA
            </h2>

            <p
              style={{
                textAlign: "center",
                marginTop: "5px",
                marginBottom: "20px"
              }}
            >
              <strong>Reporte de Ingresos</strong>
              <br />
              Desde: {formatearFecha(fechaDesde)}
              {" — "}
              Hasta: {formatearFecha(fechaHasta)}
            </p>
          </div>

          <table
            className="tabla-reporte"
            style={{
              width: "98%",
              borderCollapse: "collapse",
              margin: "0 auto"
            }}
          >
            <thead>
              <tr style={{ backgroundColor: colorTabla }}>
                <th style={thCentro}>Fecha</th>
                <th style={thCentro}>Recibo</th>
                <th style={thIzquierda}>Tipo de Ingreso</th>
                <th style={thIzquierda}>Descripción</th>
                <th style={thCentro}>Moneda</th>
                <th style={thDerecha}>Monto</th>
                <th style={thCentro}>Origen</th>
                <th style={thCentro}>Usuario</th>
              </tr>
            </thead>

            <tbody>
              {reporte.map((i, index) => (
                <tr
                  key={i._id || index}
                  style={{ backgroundColor: "white" }}
                >
                  <td style={tdCentro}>
                    {formatearFecha(i.fecha)}
                  </td>

                  <td style={tdCentro}>
                    {i.numeroReciboIngreso || ""}
                  </td>

                  <td style={tdIzquierda}>
                    {i.tipoIngreso?.descripcion || "—"}
                  </td>

                  <td style={tdIzquierda}>
                    {i.descripcion || ""}
                  </td>

                  <td style={tdCentro}>
                    {nombreMoneda(i.moneda)}
                  </td>

                  <td style={tdDerecha}>
                    {formatearMonto(i.monto)}
                  </td>

                  <td style={tdCentro}>
                    {nombreOrigen(i.origen)}
                  </td>

                  <td style={tdCentro}>
                    {i.usuario || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="totales-reporte"
            style={{
              width: "420px",
              maxWidth: "90%",
              margin: "25px auto 0 auto",
              border: `2px solid ${colorPrincipal}`,
              borderRadius: "6px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                backgroundColor: colorTabla,
                padding: "8px",
                textAlign: "center",
                fontWeight: "bold"
              }}
            >
              TOTALES DEL PERÍODO
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 12px",
                backgroundColor: "white"
              }}
            >
              <strong>Dólares:</strong>
              <span>$ {formatearMonto(totalDolares)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 12px",
                backgroundColor: "white"
              }}
            >
              <strong>Pesos:</strong>
              <span>COP {formatearMonto(totalPesos)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 12px",
                backgroundColor: "white"
              }}
            >
              <strong>Bolívares:</strong>
              <span>Bs {formatearMonto(totalBolivares)}</span>
            </div>
          </div>
        </div>
      )}

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
            No hay ingresos para mostrar en el período seleccionado.
          </div>
        )}
    </div>
  );
};

const thCentro = {
  textAlign: "center",
  padding: "7px",
  border: "1px solid #aaa"
};

const thIzquierda = {
  textAlign: "left",
  padding: "7px",
  border: "1px solid #aaa"
};

const thDerecha = {
  textAlign: "right",
  padding: "7px",
  border: "1px solid #aaa"
};

const tdCentro = {
  padding: "5px",
  textAlign: "center",
  fontSize: "11px",
  borderBottom: "1px solid #ddd"
};

const tdIzquierda = {
  padding: "5px",
  textAlign: "left",
  fontSize: "11px",
  borderBottom: "1px solid #ddd"
};

const tdDerecha = {
  padding: "5px",
  textAlign: "right",
  fontSize: "11px",
  borderBottom: "1px solid #ddd"
};

export default ReporteIngresos;