import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";

const estados = {
  BLOQUEADO: {
    texto: "🔒 Bloqueado",
    fondo: "#D9EAD3",
    color: "#274E13"
  },
  PENDIENTE: {
    texto: "◷ Pendiente de revisión",
    fondo: "#FFF2CC",
    color: "#7F6000"
  },
  SIN_MOVIMIENTOS: {
    texto: "Sin movimientos",
    fondo: "#E7E6E6",
    color: "#444"
  }
};

function mostrarFecha(fecha) {
  return String(fecha || "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("/");
}

function mostrarVerificacion(valor) {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (!Number.isFinite(fecha.getTime())) return "—";

  return fecha.toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function RevisionDiaria() {
  const navigate = useNavigate();

  const sedeActual =
    localStorage.getItem("sede") || "TIENDITA";

  const esMonasterio = sedeActual === "MONASTERIO";

  const esAdministrador =
    localStorage
      .getItem("rolUsuario")
      ?.trim()
      .toUpperCase() === "ADMINISTRADOR";

  const hoy = obtenerFechaVenezuela();

  const [filtros, setFiltros] = useState({
    desde: `${hoy.slice(0, 7)}-01`,
    hasta: hoy,
    sede: sedeActual,
    estado: "TODOS"
  });

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const colorPrincipal = esMonasterio
    ? "#5A2D16"
    : "#FC9E9B";

  const colorAccion = esMonasterio
    ? "#B8862D"
    : "#84B09C";

  const colorTabla = esMonasterio
    ? "#E8D1A5"
    : "#F9CEAE";

  const boton = {
    padding: "9px 18px",
    backgroundColor: colorAccion,
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black, Arial, sans-serif",
    cursor: "pointer"
  };

  const campo = {
    padding: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  const celda = {
    border: "1px solid #ccc",
    padding: "10px",
    textAlign: "center"
  };

  const cambiarFiltro = (e) => {
    const { name, value } = e.target;

    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: value
    }));

    setResultado(null);
    setMensaje("");
  };

  const buscar = async (e) => {
    e.preventDefault();

    if (cargando) return;

    if (
      !filtros.desde ||
      !filtros.hasta ||
      filtros.desde > filtros.hasta
    ) {
      setMensaje("Seleccione un rango de fechas válido.");
      return;
    }

    setCargando(true);
    setMensaje("");
    setResultado(null);

    try {
      const parametros = new URLSearchParams(filtros);

      const res = await fetch(
        `${API_URL}/api/caja/revision-diaria?${parametros}`,
        {
          credentials: "include"
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.mensaje ||
          data?.error ||
          "No se pudo consultar la revisión diaria."
        );
      }

      if (
        !Array.isArray(data.dias) ||
        !data.resumen
      ) {
        throw new Error(
          "El servidor devolvió una respuesta incompleta."
        );
      }

      setResultado(data);
    } catch (error) {
      setMensaje(
        error.message ||
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  const abrirReporte = (dia) => {
    navigate("/diarioventas", {
      state: {
        fechaRevision: dia.fecha,
        sedeRevision: dia.sede
      }
    });
  };

  if (!esAdministrador) {
    return (
      <h2 style={{ color: "red", textAlign: "center" }}>
        Acceso permitido solo al administrador
      </h2>
    );
  }

  return (
    <div>
      <Encabezado sede={sedeActual} />

      <div style={{ padding: "20px" }}>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px"
          }}
        >
          Revisión de ventas por día
        </h2>

        <form
          onSubmit={buscar}
          style={{
            maxWidth: "1000px",
            margin: "0 auto 20px"
          }}
        >
          <fieldset
            disabled={cargando}
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "white"
            }}
          >
            <legend>Período, sede y estado</legend>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "end",
                flexWrap: "wrap",
                gap: "15px"
              }}
            >
              <label>
                Desde
                <br />
                <input
                  type="date"
                  name="desde"
                  value={filtros.desde}
                  onChange={cambiarFiltro}
                  style={campo}
                  required
                />
              </label>

              <label>
                Hasta
                <br />
                <input
                  type="date"
                  name="hasta"
                  value={filtros.hasta}
                  onChange={cambiarFiltro}
                  style={campo}
                  required
                />
              </label>

              <label>
                Sede
                <br />
                <select
                  name="sede"
                  value={filtros.sede}
                  onChange={cambiarFiltro}
                  style={campo}
                >
                  <option value="TIENDITA">TIENDITA</option>
                  <option value="MONASTERIO">MONASTERIO</option>
                  <option value="AMBAS">AMBAS SEDES</option>
                </select>
              </label>

              <label>
                Estado
                <br />
                <select
                  name="estado"
                  value={filtros.estado}
                  onChange={cambiarFiltro}
                  style={campo}
                >
                  <option value="TODOS">Todos</option>
                  <option value="BLOQUEADO">Bloqueados</option>
                  <option value="PENDIENTE">
                    Pendientes de revisión
                  </option>
                  <option value="SIN_MOVIMIENTOS">
                    Sin movimientos
                  </option>
                </select>
              </label>

              <button type="submit" style={boton}>
                {cargando ? "Consultando..." : "Buscar"}
              </button>
            </div>
          </fieldset>
        </form>

        {mensaje && (
          <p
            role="alert"
            style={{ color: "red", textAlign: "center" }}
          >
            {mensaje}
          </p>
        )}

        {resultado && (
          <>
            <h3 style={{ textAlign: "center" }}>
              {mostrarFecha(resultado.desde)}
              {" al "}
              {mostrarFecha(resultado.hasta)}
              {" — "}
              {resultado.sede}
            </h3>

            <p style={{ textAlign: "center" }}>
              <strong>
                {resultado.resumen.bloqueados}
                {" días bloqueados · "}
                {resultado.resumen.pendientes}
                {" pendientes · "}
                {resultado.resumen.sinMovimientos}
                {" sin movimientos"}
              </strong>
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "850px",
                  borderCollapse: "collapse",
                  backgroundColor: "white"
                }}
              >
                <thead
                  style={{ backgroundColor: colorTabla }}
                >
                  <tr>
                    <th style={celda}>Fecha</th>
                    <th style={celda}>Sede</th>
                    <th style={celda}>Estado</th>
                    <th style={celda}>Verificado por</th>
                    <th style={celda}>
                      Fecha de verificación
                    </th>
                    <th style={celda}>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {resultado.dias.map((dia) => {
                    const estadoDia = estados[dia.estado];

                    return (
                      <tr key={`${dia.sede}:${dia.fecha}`}>
                        <td style={celda}>
                          {mostrarFecha(dia.fecha)}
                        </td>

                        <td style={celda}>{dia.sede}</td>

                        <td style={celda}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor:
                                estadoDia?.fondo || "#eee",
                              color: estadoDia?.color || "#444",
                              fontWeight: "bold"
                            }}
                          >
                            {estadoDia?.texto || dia.estado}
                          </span>
                        </td>

                        <td style={celda}>
                          {dia.verificadoPor || "—"}
                        </td>

                        <td style={celda}>
                          {mostrarVerificacion(
                            dia.fechaVerificacion
                          )}
                        </td>

                        <td style={celda}>
                          <button
                            type="button"
                            style={boton}
                            onClick={() => abrirReporte(dia)}
                          >
                            Ver reporte
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {resultado.dias.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          ...celda,
                          padding: "25px"
                        }}
                      >
                        No hay días que coincidan con el filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p style={{ textAlign: "center" }}>
              Los días bloqueados tienen el dinero verificado.
              Los pendientes tienen ventas, pagos, gastos o
              registros de caja sin verificar.
            </p>

            <p style={{ textAlign: "center" }}>
              El resumen corresponde a todo el período y las
              sedes consultadas, antes del filtro de estado.
            </p>
          </>
        )}

        <p style={{ textAlign: "center" }}>
          Acceso exclusivo para el administrador.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginTop: "20px"
          }}
        >
          <button
            type="button"
            style={{
              ...boton,
              backgroundColor: colorPrincipal
            }}
            onClick={() =>
              navigate(
                esMonasterio ? "/menu-monasterio" : "/menu"
              )
            }
          >
            VOLVER AL MENÚ
          </button>

          {resultado && (
            <button
              type="button"
              style={boton}
              onClick={() => window.print()}
            >
              Imprimir / PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}