import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";

const formatoVE = (num) => {
  return Number(num || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Utilidad = () => {
  const navigate = useNavigate();

  // ============================
  // SEDE
  // ============================
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // ============================
  // ESTADOS
  // ============================
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [reporte, setReporte] = useState({});
  const [cargando, setCargando] = useState(false);

  // ============================
  // ESTILOS
  // ============================

  const estiloBotonVolver = {
    width: "15%",
    padding: "10px",
    backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const estiloBotonBuscar = {
    padding: "8px 25px",
    backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: cargando ? "not-allowed" : "pointer",
    opacity: cargando ? 0.6 : 1
  };

  const estiloFecha = {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: esMonasterio ? "#E8D1A5" : "#EDC5CD",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  const estiloEncabezadoTabla = {
    backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B",
    color: "white",
    fontWeight: "bold"
  };

  const estiloFilaCategoria = {
    backgroundColor: esMonasterio ? "#E8D1A5" : "#EDC5CD"
  };

  // ============================
  // BUSCAR REPORTE
  // ============================
  const buscar = async () => {
    if (!desde || !hasta) {
      alert("Seleccione ambas fechas");
      return;
    }

    if (desde > hasta) {
      alert("La fecha DESDE no puede ser mayor que la fecha HASTA");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch(
        `${API_URL}/api/ventas/reporte-categoria?desde=${desde}&hasta=${hasta}&sede=${encodeURIComponent(sede)}`
      );

      const data = await res.json();

      if (!data.ok) {
        alert(data.mensaje || "No se pudo generar el reporte");
        return;
      }

      setReporte(data.reporte || {});

    } catch (error) {
      console.error("ERROR REPORTE FRONTEND:", error);
      alert("Error al obtener el reporte");
    } finally {
      setCargando(false);
    }
  };

  // ============================
  // TOTALES GENERALES
  // ============================
  const totalesGenerales = () => {
    let totalP = 0;
    let totalBs = 0;
    let totalD = 0;
    let utilidadGeneral = 0;

    Object.values(reporte).forEach((cat) => {
      Object.values(cat).forEach((prod) => {
        totalP += Number(prod.totalP || 0);
        totalBs += Number(prod.totalBs || 0);
        totalD += Number(prod.totalD || 0);
        utilidadGeneral += Number(prod.utilidad || 0);
      });
    });

    return {
      totalP,
      totalBs,
      totalD,
      utilidadGeneral
    };
  };

  const {
    totalP,
    totalBs,
    totalD,
    utilidadGeneral
  } = totalesGenerales();

  // ============================
  // RETURN
  // ============================
  return (
    <div>

      {/* ENCABEZADO */}
      <Encabezado sede={sede} />

      <div style={{ padding: "20px" }}>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontWeight: "bold"
          }}
        >
          Reporte de Utilidad por Categoría y Producto
        </h2>

        {/* ============================
            FILTRO DE FECHAS
        ============================ */}

        <div
          style={{
            width: "550px",
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
              marginBottom: "15px",
              fontWeight: "bold"
            }}
          >
            Seleccione el período
          </h3>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap"
            }}
          >
            <label style={{ fontWeight: "bold" }}>
              Desde:
            </label>

            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={estiloFecha}
            />

            <label style={{ fontWeight: "bold" }}>
              Hasta:
            </label>

            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={estiloFecha}
            />

            <button
              onClick={buscar}
              disabled={cargando}
              style={estiloBotonBuscar}
            >
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* ============================
            BOTÓN VOLVER
        ============================ */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "25px"
          }}
        >
          <button
            onClick={() =>
              navigate(esMonasterio ? "/menu-monasterio" : "/menu")
            }
            style={estiloBotonVolver}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* ============================
            CARGANDO
        ============================ */}

        {cargando && (
          <p
            style={{
              textAlign: "center",
              fontWeight: "bold"
            }}
          >
            Cargando reporte...
          </p>
        )}

        {/* ============================
            SIN RESULTADOS
        ============================ */}

        {!cargando &&
          desde &&
          hasta &&
          Object.keys(reporte).length === 0 && (
            <p
              style={{
                textAlign: "center",
                fontWeight: "bold"
              }}
            >
              No se encontraron ventas en el período seleccionado.
            </p>
          )}

        {/* ============================
            RESULTADOS
        ============================ */}

        {!cargando && Object.keys(reporte).length > 0 && (
          <div>

            {Object.entries(reporte).map(
              ([categoria, productos]) => {

                // No mostrar categorías vacías
                if (Object.keys(productos).length === 0) {
                  return null;
                }

                const utilidadCategoria =
                  Object.values(productos).reduce(
                    (acc, prod) =>
                      acc + Number(prod.utilidad || 0),
                    0
                  );

                return (
                  <div
                    key={categoria}
                    style={{ marginBottom: "40px" }}
                  >

                    {/* CATEGORÍA */}
                    <h3
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        ...estiloFilaCategoria
                      }}
                    >
                      Categoría: {categoria}
                    </h3>

                    {/* TABLA */}
                    <table
                      border="1"
                      cellPadding="10"
                      style={{
                        width: "100%",
                        textAlign: "center",
                        backgroundColor: "white",
                        borderCollapse: "collapse"
                      }}
                    >
                      <thead>
                        <tr style={estiloEncabezadoTabla}>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Costo (U)</th>
                          <th>Precio Venta (U)</th>
                          <th>Utilidad</th>
                          <th>Total P</th>
                          <th>Total Bs</th>
                          <th>Total D</th>
                        </tr>
                      </thead>

                      <tbody>
                        {Object.entries(productos).map(
                          ([descripcion, info]) => (
                            <tr key={descripcion}>
                              <td
                                style={{
                                  textAlign: "left",
                                  fontWeight: "bold"
                                }}
                              >
                                {descripcion}
                              </td>

                              <td>
                                {formatoVE(
                                  info.cantidadVendida
                                )}
                              </td>

                              <td>
                                {formatoVE(info.costo)}
                              </td>

                              <td>
                                {formatoVE(
                                  info.precioVenta
                                )}
                              </td>

                              <td
                                style={{
                                  fontWeight: "bold",
                                  color: "green"
                                }}
                              >
                                {formatoVE(
                                  info.utilidad
                                )}
                              </td>

                              <td>
                                {formatoVE(info.totalP)}
                              </td>

                              <td>
                                {formatoVE(info.totalBs)}
                              </td>

                              <td>
                                {formatoVE(info.totalD)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>

                    {/* TOTAL CATEGORÍA */}
                    <div
                      style={{
                        marginTop: "10px",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "17px",
                        color: esMonasterio
                          ? "#5A2D16"
                          : "#557A68"
                      }}
                    >
                      Utilidad total de la categoría{" "}
                      {categoria}:{" "}
                      {formatoVE(utilidadCategoria)}
                    </div>
                  </div>
                );
              }
            )}

            {/* ============================
                TOTALES GENERALES
            ============================ */}

            <h3
              style={{
                textAlign: "center",
                marginTop: "30px",
                marginBottom: "15px",
                fontWeight: "bold"
              }}
            >
              Totales Generales
            </h3>

            <table
              border="1"
              cellPadding="10"
              style={{
                width: "550px",
                maxWidth: "100%",
                margin: "0 auto",
                backgroundColor: "white",
                borderCollapse: "collapse"
              }}
            >
              <thead>
                <tr style={estiloEncabezadoTabla}>
                  <th colSpan="2">
                    RESUMEN GENERAL
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>
                    <strong>Total Pesos (P)</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatoVE(totalP)}
                  </td>
                </tr>

                <tr>
                  <td>
                    <strong>
                      Total Bolívares (Bs)
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatoVE(totalBs)}
                  </td>
                </tr>

                <tr>
                  <td>
                    <strong>
                      Total Dólares (D)
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatoVE(totalD)}
                  </td>
                </tr>

                <tr
                  style={{
                    backgroundColor: esMonasterio
                      ? "#E8D1A5"
                      : "#EDC5CD"
                  }}
                >
                  <td>
                    <strong>
                      UTILIDAD TOTAL GENERAL
                    </strong>
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      color: "green",
                      fontWeight: "bold",
                      fontSize: "18px"
                    }}
                  >
                    {formatoVE(utilidadGeneral)}
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        )}

      </div>
    </div>
  );
};

export default Utilidad;