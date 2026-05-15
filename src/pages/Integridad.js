import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const API = `${API_URL}/admin`;

export default function Integridad() {
  const navigate = useNavigate();

  const [duplicadosMoneda, setDuplicadosMoneda] = useState([]);
  const [duplicadosVentas, setDuplicadosVentas] = useState([]);
  const [duplicadosVendidos, setDuplicadosVendidos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [editando, setEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const volverMenu = () => navigate("/menu");

  // ============================
  // BUSCAR DUPLICADOS
  // ============================
  const buscarDuplicados = async (tipo) => {
    setCargando(true);
    try {
      const res = await fetch(`${API}/duplicados/${tipo}`);
      const data = await res.json();

      if (!data.ok) {
        alert("Error buscando duplicados:\n" + data.error);
        return;
      }

      if (tipo === "moneda") setDuplicadosMoneda(data.duplicados);
      if (tipo === "ventas") setDuplicadosVentas(data.duplicados);
      if (tipo === "vendidos") setDuplicadosVendidos(data.duplicados);

    } catch (error) {
      alert("Error de conexión buscando duplicados");
    } finally {
      setCargando(false);
    }
  };

  // ============================
  // ELIMINAR UNO
  // ============================
  const eliminarUno = async (tipo, id) => {
    if (!window.confirm("¿Eliminar este registro duplicado?")) return;
    try {
      const res = await fetch(`${API}/eliminar/${tipo}/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.ok) {
        alert("Error eliminando:\n" + data.error);
        return;
      }
      if (tipo === "moneda") {
        setDuplicadosMoneda((prev) =>
          prev.map((g) => g.filter((p) => p._id !== id)).filter((g) => g.length > 1)
        );
      }
      if (tipo === "ventas") {
        setDuplicadosVentas((prev) =>
          prev.map((g) => g.filter((p) => p._id !== id)).filter((g) => g.length > 1)
        );
      }
      if (tipo === "vendidos") {
        setDuplicadosVendidos((prev) =>
          prev.map((g) => g.filter((p) => p._id !== id)).filter((g) => g.length > 1)
        );
      }
      alert("Registro eliminado correctamente");
    } catch (error) {
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
    const res = await fetch(`${API}/corregir-fecha/${tipo}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: nuevaFecha })
    });
    const data = await res.json();
    if (!data.ok) {
      alert("Error guardando fecha:\n" + data.error);
      return;
    }
    alert("Fecha actualizada correctamente");
    buscarDuplicados(tipo);
    setEditando(null);
  };

  // ============================
  // TABLA REUTILIZABLE
  // ============================
  const TablaDuplicados = ({ titulo, grupos, tipo }) => (
    <div style={{ marginTop: "30px" }}>
      <h3>{titulo}: {grupos.length}</h3>

      {grupos.map((grupo, i) => (
        <div key={i} style={{ marginBottom: "25px" }}>
          <h4>Factura: {grupo[0].factura}</h4>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#eee" }}>
                <th style={th}>ID</th>
                <th style={th}>Total</th>
                <th style={th}>Operación</th>
                <th style={th}>Fecha (cruda)</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {grupo.map((pago) => (
                <>
                  <tr key={pago._id}>
                    <td style={td}>{pago._id}</td>
                    <td style={td}>{pago.total}</td>
                    <td style={td}>{pago.operacion}</td>

                    {/* Mostrar fecha EXACTA como viene de la BD */}
                    <td style={td}>{pago.fecha || "SIN FECHA"}</td>

                    <td style={tdCenter}>
                      <button
                        onClick={() => eliminarUno(tipo, pago._id)}
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

                  {/* FILA DE EDICIÓN */}
                  {editando === pago._id && (
                    <tr>
                      <td colSpan="5" style={{ padding: "10px", background: "#f8f9fa" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="date"
                            value={nuevaFecha}
                            onChange={(e) => setNuevaFecha(e.target.value)}
                          />

                          <button
                            onClick={() => guardarFechaNueva(tipo, pago._id)}
                            style={btnSave}
                          >
                            Guardar
                          </button>

                          <button
                            onClick={() => setEditando(null)}
                            style={btnCancel}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  const TablaDuplicadosVendidos = ({ grupos }) => (
  <div style={{ marginTop: "30px" }}>
    <h3>Duplicados en Vendidos: {grupos.length}</h3>

    {grupos.map((grupo, i) => (
      <div key={i} style={{ marginBottom: "25px" }}>
        <h4>Factura: {grupo[0].factura}</h4>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
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

                {/* Código del producto */}
                <td style={td}>{v.productoId?.codigo || "SIN CÓDIGO"}</td>

                {/* Nombre del producto */}
                <td style={td}>{v.productoId?.descripcion || "SIN DESCRIPCIÓN"}</td>

                <td style={td}>{v.cantidad}</td>
                <td style={td}>{v.precio}</td>
                <td style={td}>{v.dscto}</td>
                <td style={td}>{v.total}</td>

                {/* Fecha real */}
                <td style={td}>{v.createdAt}</td>

                <td style={tdCenter}>
                  <button
                    onClick={() => eliminarUno("vendidos", v._id)}
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

  const th = { border: "1px solid #ccc", padding: "6px" };
  const td = { border: "1px solid #ccc", padding: "6px" };
  const tdCenter = { ...td, textAlign: "center" };

  const btn = {
    padding: "10px 15px",
    marginRight: "10px",
    background: "#6f42c1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
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

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={volverMenu} style={{ ...btn, background: "#6699FF" }}>
        ⬅️ Volver al Menú
      </button>

      <h2>🛠️ Control de Integridad</h2>

      {/* BOTONES */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => buscarDuplicados("moneda")} style={btn}>
          Duplicados en Pagos
        </button>

        <button onClick={() => buscarDuplicados("ventas")} style={btn}>
          Duplicados en Ventas
        </button>

        <button onClick={() => buscarDuplicados("vendidos")} style={btn}>
          Duplicados en Vendidos
        </button>
      </div>

      {cargando && <p>Cargando...</p>}

      {/* TABLAS */}
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
      <TablaDuplicadosVendidos grupos={duplicadosVendidos} />
      )}
    </div>
  );
}
