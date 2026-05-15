import React, { useState } from "react";
import { API_URL } from "../config";

const API = `${API_URL}/admin`;

export default function Integridad() {
  const [duplicados, setDuplicados] = useState([]);
  const [cargando, setCargando] = useState(false);

  const buscarDuplicadosMoneda = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API}/duplicados/moneda`);
      const data = await res.json();
      if (!data.ok) {
        alert("Error buscando duplicados:\n" + data.error);
        return;
      }
      setDuplicados(data.duplicados || []);
    } catch (error) {
      alert("Error de conexión buscando duplicados");
    } finally {
      setCargando(false);
    }
  };

  const eliminarUno = async (id) => {
    if (!window.confirm("¿Eliminar este registro duplicado?")) return;

    try {
      const res = await fetch(`${API_URL}/api/moneda/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.ok) {
        alert("Error eliminando:\n" + data.error);
        return;
      }

      // Quitar el registro eliminado de la tabla
      setDuplicados((prev) =>
        prev.map((grupo) => grupo.filter((p) => p._id !== id))
             .filter((grupo) => grupo.length > 1)
      );

      alert("Registro eliminado correctamente");
    } catch (error) {
      alert("Error de conexión eliminando registro");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🛠️ Control de Integridad</h2>
      <p>Revisión y depuración de pagos duplicados en dbMoneda.</p>

      <button
        onClick={buscarDuplicadosMoneda}
        style={{
          padding: "10px 15px",
          background: "#d63384",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Buscar duplicados
      </button>

      {cargando && <p>Cargando...</p>}

      {duplicados.length > 0 && (
        <div>
          <h3>Duplicados encontrados: {duplicados.length}</h3>

          {duplicados.map((grupo, i) => (
            <div key={i} style={{ marginBottom: "25px" }}>
              <h4>Factura: {grupo[0].factura}</h4>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "10px",
                }}
              >
                <thead>
                  <tr style={{ background: "#eee" }}>
                    <th style={{ border: "1px solid #ccc", padding: "6px" }}>ID</th>
                    <th style={{ border: "1px solid #ccc", padding: "6px" }}>Total</th>
                    <th style={{ border: "1px solid #ccc", padding: "6px" }}>Operación</th>
                    <th style={{ border: "1px solid #ccc", padding: "6px" }}>Fecha</th>
                    <th style={{ border: "1px solid #ccc", padding: "6px" }}>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {grupo.map((pago) => (
                    <tr key={pago._id}>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                        {pago._id}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                        {pago.total}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                        {pago.operacion}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                        {new Date(pago.fecha).toLocaleString()}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "6px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() => eliminarUno(pago._id)}
                          style={{
                            background: "red",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
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
      )}

      {duplicados.length === 0 && !cargando && (
        <p>No hay duplicados cargados aún.</p>
      )}
    </div>
  );
}
