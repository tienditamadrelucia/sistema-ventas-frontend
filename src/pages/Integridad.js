import React, { useState } from "react";
import { API_URL } from "../config";

const API = `${API_URL}/admin`;

export default function ControlIntegridad() {
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

  const limpiarDuplicadosMoneda = async () => {
    if (!window.confirm("¿Eliminar duplicados automáticamente?")) return;

    setCargando(true);
    try {
      const res = await fetch(`${API}/limpiar/moneda`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!data.ok) {
        alert("Error eliminando duplicados:\n" + data.error);
        return;
      }

      alert("Duplicados eliminados:\n" + JSON.stringify(data.eliminados, null, 2));
      setDuplicados([]);
    } catch (error) {
      alert("Error de conexión eliminando duplicados");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🛠️ Control de Integridad</h2>
      <p>Herramientas administrativas para revisar y corregir inconsistencias en pagos.</p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={buscarDuplicadosMoneda}
          style={{
            padding: "10px 15px",
            marginRight: "10px",
            background: "#d63384",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Buscar duplicados en Pagos
        </button>

        <button
          onClick={limpiarDuplicadosMoneda}
          style={{
            padding: "10px 15px",
            background: "#6f42c1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Eliminar duplicados automáticamente
        </button>
      </div>

      {cargando && <p>Cargando...</p>}

      {duplicados.length > 0 && (
        <div>
          <h3>Duplicados encontrados: {duplicados.length}</h3>

          {duplicados.map((grupo, i) => (
            <div
              key={i}
              style={{
                background: "#f8f9fa",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            >
              <h4>Factura: {grupo[0].factura}</h4>

              {grupo.map((pago) => (
                <div
                  key={pago._id}
                  style={{
                    padding: "6px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <strong>ID:</strong> {pago._id}
                  <br />
                  <strong>Total:</strong> {pago.total}
                  <br />
                  <strong>Operación:</strong> {pago.operacion}
                  <br />
                  <strong>Fecha:</strong>{" "}
                  {new Date(pago.fecha).toLocaleString()}
                </div>
              ))}
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
