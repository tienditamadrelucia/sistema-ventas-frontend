import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config"; 

// ⭐ ESTILOS (igual que EditarCliente)
const modalFondo = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const modalCaja = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  width: "350px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 0 10px rgba(0,0,0,0.3)"
};

const input = {
  marginBottom: "10px",
  padding: "8px",
  width: "100%",
  borderRadius: "4px",
  border: "1px solid #ccc"
};

const BotonGuardar = {
  backgroundColor: "#28a745",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  flex: 1
};

const BotonCancelar = {
  backgroundColor: "#dc3545",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  flex: 1
};

// ⭐ COMPONENTE
export default function ModalTasas({ fecha, onCerrar, onGuardado }) {

  const [form, setForm] = useState({
    tasaD: "",
    tasaP: "",
    cajachicaD: "",
    cajachicaP: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardar = async () => {
    if (!form.tasaD || !form.tasaP) {
      alert("Debe ingresar la tasa del dólar y del peso.");
      return;
    }
console.log("🟢 BOTÓN GUARDAR PRESIONADO");

    try {
      const res = await axios.post(
        `${API_URL}/api/tasas/guardar`,
        {
          fecha,
          tasaD: Number(form.tasaD),
          tasaP: Number(form.tasaP),
          cajachicaD: Number(form.cajachicaD || 0),
          cajachicaP: Number(form.cajachicaP || 0)
        }
      );

      if (!res.data.ok) {
        alert("Error guardando tasas");
        return;
      }

      onGuardado(res.data.tasa); // devuelve la tasa recién creada
      onCerrar();

    } catch (error) {
      console.error("Error guardando tasas:", error);
      alert("Error guardando tasas");
    }
  };
console.log("📌 FECHA RECIBIDA EN MODAL:", fecha);

  return (
    <div style={modalFondo}>
      <div style={modalCaja}>
        <h3 style={{ marginBottom: "10px" }}>
          Registrar tasas para {fecha}
        </h3>

        <input
          name="tasaD"
          value={form.tasaD}
          onChange={handleChange}
          placeholder="Tasa Dólar"
          style={input}
          type="number"
        />

        <input
          name="tasaP"
          value={form.tasaP}
          onChange={handleChange}
          placeholder="Tasa Peso"
          style={input}
          type="number"
        />

        <input
          name="cajachicaD"
          value={form.cajachicaD}
          onChange={handleChange}
          placeholder="Caja Chica Dólar"
          style={input}
          type="number"
        />

        <input
          name="cajachicaP"
          value={form.cajachicaP}
          onChange={handleChange}
          placeholder="Caja Chica Peso"
          style={input}
          type="number"
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button style={BotonGuardar} onClick={guardar}>Guardar</button>
          <button style={BotonCancelar} onClick={onCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
