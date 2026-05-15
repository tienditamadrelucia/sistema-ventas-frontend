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

  const volverMenu = () => {
    navigate("/menu");
  };

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
                <th style={th}>Fecha</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {grupo.map((pago) => (
                <tr key={pago._id}>
                  <td style={td}>{pago._id}</td>
                  <td style={td}>{pago.total}</td>
                  <td style={td}>{pago.operacion}</td>
                  <td style={td}>{new Date(pago.fecha).toLocaleString()}</td>
                  <td style={tdCenter}>
                    <button
                      onClick={() => eliminarUno(tipo, pago._id)}
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
  const btnTrash = {
    background: "red",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "20px" }}>
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
      <button
        onClick={volverMenu}
        style={{
          padding: "10px 15px",
          background: "#D98897",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        ⬅️ Volver al Menú
      </button>

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
        <TablaDuplicados
          titulo="Duplicados en Vendidos"
          grupos={duplicadosVendidos}
          tipo="vendidos"
        />
      )}
    </div>
  );
}

const btn = {
  padding: "10px 15px",
  marginRight: "10px",
  background: "#3d77eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
