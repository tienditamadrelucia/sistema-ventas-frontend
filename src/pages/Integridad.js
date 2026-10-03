import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const API = `${API_URL}/admin`;

export default function Integridad() {
  const navigate = useNavigate();

  // ============================
  // SEDE
  // ============================
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  const [duplicadosMoneda, setDuplicadosMoneda] = useState([]);
  const [duplicadosVentas, setDuplicadosVentas] = useState([]);
  const [duplicadosVendidos, setDuplicadosVendidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [vendidosTodos, setVendidosTodos] = useState([]);

  const [editando, setEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const volverMenu = () =>
    navigate(esMonasterio ? "/menu-monasterio" : "/menu");

  // ============================
  // CARGAR TODOS LOS VENDIDOS
  // ============================
  const cargarVendidosTodos = async () => {
    try {
      setCargando(true);

      const res = await fetch(
        `${API}/vendidos-todos?sede=${encodeURIComponent(sede)}`
      );

      const data = await res.json();

      if (!data.ok) {
        alert("Error cargando vendidos:\n" + data.error);
        return;
      }

      setVendidosTodos(data.registros);

    } catch (error) {
      console.error(error);
      alert("Error de conexión cargando vendidos");

    } finally {
      setCargando(false);
    }
  };

  // ============================
  // BUSCAR DUPLICADOS
  // ============================
  const buscarDuplicados = async (tipo) => {
    setCargando(true);

    try {
      const res = await fetch(
        `${API}/duplicados/${tipo}?sede=${encodeURIComponent(sede)}`
      );

      const data = await res.json();

      if (!data.ok) {
        alert("Error buscando duplicados:\n" + data.error);
        return;
      }

      if (tipo === "moneda") {
        setDuplicadosMoneda(data.duplicados);
      }

      if (tipo === "ventas") {
        setDuplicadosVentas(data.duplicados);
      }

      if (tipo === "vendidos") {
        setDuplicadosVendidos(data.duplicados);
      }

    } catch (error) {
      console.error(error);
      alert("Error de conexión buscando duplicados");

    } finally {
      setCargando(false);
    }
  };

  // ============================
  // ELIMINAR UNO
  // ============================
  const eliminarUno = async (tipo, id) => {
    if (
      !window.confirm(
        `¿Eliminar este registro duplicado de ${sede}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API}/eliminar/${tipo}/${id}?sede=${encodeURIComponent(sede)}`,
        {
          method: "DELETE"
        }
      );

      const data = await res.json();

      if (!data.ok) {
        alert("Error eliminando:\n" + data.error);
        return;
      }

      if (tipo === "moneda") {
        setDuplicadosMoneda((prev) =>
          prev
            .map((g) => g.filter((p) => p._id !== id))
            .filter((g) => g.length > 1)
        );
      }

      if (tipo === "ventas") {
        setDuplicadosVentas((prev) =>
          prev
            .map((g) => g.filter((p) => p._id !== id))
            .filter((g) => g.length > 1)
        );
      }

      if (tipo === "vendidos") {
        setDuplicadosVendidos((prev) =>
          prev
            .map((g) => g.filter((p) => p._id !== id))
            .filter((g) => g.length > 1)
        );

        setVendidosTodos((prev) =>
          prev.filter((v) => v._id !== id)
        );
      }

      alert("Registro eliminado correctamente");

    } catch (error) {
      console.error(error);
      alert("Error de conexión eliminando registro");
    }
  };

  // ============================
  // GUARDAR FECHA MANUAL
  // ============================
  const guardarFechaNueva = async (tipo, id) => {
    if (!nuevaFecha) {
      alert("Debe seleccionar una fecha");
      return;
    }

    try {
      const res = await fetch(
        `${API}/corregir-fecha/${tipo}/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fecha: nuevaFecha,
            sede
          })
        }
      );

      const data = await res.json();

      if (!data.ok) {
        alert("Error guardando fecha:\n" + data.error);
        return;
      }

      alert("Fecha actualizada correctamente");

      await buscarDuplicados(tipo);

      setEditando(null);
      setNuevaFecha("");

    } catch (error) {
      console.error(error);
      alert("Error de conexión guardando fecha");
    }
  };

  // ============================
  // ESTILOS
  // ============================
  const th = {
    border: "1px solid #ccc",
    padding: "6px",
    backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE"
  };

  const td = {
    border: "1px solid #ccc",
    padding: "6px"
  };

  const tdCenter = {
    ...td,
    textAlign: "center"
  };

  const btn = {
    padding: "10px 15px",
    marginRight: "10px",
    background: esMonasterio ? "#B8862D" : "#6f42c1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  };

  const btnTrash = {
    background: "red",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "5px"
  };

  const btnEdit = {
    background: "#0d6efd",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const btnSave = {
    background: "#198754",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const btnCancel = {
    background: "#6c757d",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer"
  };

  // ============================
  // TABLA DUPLICADOS
  // ============================
  const TablaDuplicados = ({ titulo, grupos, tipo }) => (
    <div style={{ marginTop: "30px" }}>
      <h3>
        {titulo}: {grupos.length}
      </h3>

      {grupos.map((grupo, i) => (
        <div key={i} style={{ marginBottom: "25px" }}>
          <h4>Factura: {grupo[0]?.factura}</h4>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse"
            }}
          >
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Total</th>
                <th style={th}>Operación</th>
                <th style={th}>Fecha (cruda)</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {grupo.map((pago) => (
                <React.Fragment key={pago._id}>
                  <tr>
                    <td style={td}>{pago._id}</td>
                    <td style={td}>{pago.total}</td>
                    <td style={td}>{pago.operacion}</td>
                    <td style={td}>
                      {pago.fecha || "SIN FECHA"}
                    </td>

                    <td style={tdCenter}>
                      <button
                        onClick={() =>
                          eliminarUno(tipo, pago._id)
                        }
                        style={btnTrash}
                      >
                        🗑️
                      </button>

                      <button
                        onClick={() => {
                          setEditando(pago._id);
                          setNuevaFecha("");
                        }}
                        style={btnEdit}
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>

                  {editando === pago._id && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: "10px",
                          background: "#f8f9fa"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}
                        >
                          <input
                            type="date"
                            value={nuevaFecha}
                            onChange={(e) =>
                              setNuevaFecha(e.target.value)
                            }
                          />

                          <button
                            onClick={() =>
                              guardarFechaNueva(
                                tipo,
                                pago._id
                              )
                            }
                            style={btnSave}
                          >
                            Guardar
                          </button>

                          <button
                            onClick={() => {
                              setEditando(null);
                              setNuevaFecha("");
                            }}
                            style={btnCancel}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  // ============================
  // TABLA DUPLICADOS VENDIDOS
  // ============================
  const TablaDuplicadosVendidos = ({ grupos }) => (
    <div style={{ marginTop: "30px" }}>
      <h3>
        Duplicados en Vendidos: {grupos.length}
      </h3>

      {grupos.map((grupo, i) => (
        <div key={i} style={{ marginBottom: "25px" }}>
          <h4>Factura: {grupo[0]?.factura}</h4>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse"
            }}
          >
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Código</th>
                <th style={th}>Descripción</th>
                <th style={th}>Cantidad</th>
                <th style={th}>Precio</th>
                <th style={th}>Dscto</th>
                <th style={th}>Total</th>
                <th style={th}>Fecha</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {grupo.map((v) => (
                <tr key={v._id}>
                  <td style={td}>{v._id}</td>

                  <td style={td}>
                    {v.productoId?.codigo ||
                      "SIN CÓDIGO"}
                  </td>

                  <td style={td}>
                    {v.productoId?.descripcion ||
                      "SIN DESCRIPCIÓN"}
                  </td>

                  <td style={td}>{v.cantidad}</td>
                  <td style={td}>{v.precio}</td>
                  <td style={td}>{v.dscto}</td>
                  <td style={td}>{v.total}</td>
                  <td style={td}>{v.createdAt}</td>

                  <td style={tdCenter}>
                    <button
                      onClick={() =>
                        eliminarUno("vendidos", v._id)
                      }
                      style={btnTrash}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  // ============================
  // TODOS LOS VENDIDOS
  // ============================
  const TablaVendidosTodos = ({ registros }) => (
    <div style={{ marginTop: "30px" }}>
      <h3>
        Todos los Vendidos — {sede}:{" "}
        {registros.length}
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse"
        }}
      >
        <thead>
          <tr>
            <th style={th}>Factura</th>
            <th style={th}>Código</th>
            <th style={th}>Descripción</th>
            <th style={th}>Cantidad</th>
            <th style={th}>Precio</th>
            <th style={th}>Dscto</th>
            <th style={th}>Total</th>
            <th style={th}>Fecha</th>
            <th style={th}>ID</th>
            <th style={th}>Acción</th>
          </tr>
        </thead>

        <tbody>
          {registros.map((v) => (
            <tr key={v._id}>
              <td style={td}>{v.factura}</td>

              <td style={td}>
                {v.productoId?.codigo ||
                  "SIN CÓDIGO"}
              </td>

              <td style={td}>
                {v.productoId?.descripcion ||
                  "SIN DESCRIPCIÓN"}
              </td>

              <td style={td}>{v.cantidad}</td>
              <td style={td}>{v.precio}</td>
              <td style={td}>{v.dscto}</td>
              <td style={td}>{v.total}</td>
              <td style={td}>{v.createdAt}</td>
              <td style={td}>{v._id}</td>

              <td style={tdCenter}>
                <button
                  onClick={() =>
                    eliminarUno("vendidos", v._id)
                  }
                  style={btnTrash}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ============================
  // PANTALLA
  // ============================
  return (
    <div style={{ padding: "20px" }}>
      <button
        onClick={volverMenu}
        style={{
          ...btn,
          background: esMonasterio
            ? "#5A2D16"
            : "#6699FF"
        }}
      >
        ⬅️ Volver al Menú
      </button>

      <h2>
        🛠️ Control de Integridad —{" "}
        {esMonasterio ? "MONASTERIO" : "TIENDITA"}
      </h2>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() =>
            buscarDuplicados("moneda")
          }
          style={btn}
        >
          Duplicados en Pagos
        </button>

        <button
          onClick={() =>
            buscarDuplicados("ventas")
          }
          style={btn}
        >
          Duplicados en Ventas
        </button>

        <button
          onClick={() =>
            buscarDuplicados("vendidos")
          }
          style={btn}
        >
          Duplicados en Vendidos
        </button>

        <button
          onClick={cargarVendidosTodos}
          style={btn}
        >
          Mostrar TODOS los Vendidos
        </button>
      </div>

      {cargando && (
        <p>
          <strong>Procesando, por favor espere...</strong>
        </p>
      )}

      {duplicadosMoneda.length > 0 && (
        <TablaDuplicados
          titulo="Duplicados en Pagos"
          grupos={duplicadosMoneda}
          tipo="moneda"
        />
      )}

      {duplicadosVentas.length > 0 && (
        <TablaDuplicados
          titulo="Duplicados en Ventas"
          grupos={duplicadosVentas}
          tipo="ventas"
        />
      )}

      {duplicadosVendidos.length > 0 && (
        <TablaDuplicadosVendidos
          grupos={duplicadosVendidos}
        />
      )}

      {vendidosTodos.length > 0 && (
        <TablaVendidosTodos
          registros={vendidosTodos}
        />
      )}
    </div>
  );
}