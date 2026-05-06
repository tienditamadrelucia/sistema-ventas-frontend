import React, { useState } from "react";
import { crearCliente } from "../../services/clientes"; // asegúrate que exista este servicio

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

export default function ModalCliente({ identificacionInicial = "", onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    nombreCompleto: "",
    identificacion: identificacionInicial,
    direccion: "",
    telefono: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value.toUpperCase()
    });
  };

  const guardar = async () => {
  if (!form.nombreCompleto || !form.identificacion) {
    alert("Debe ingresar nombre y cédula");
    return;
  }
  try {
    const res = await crearCliente(form); // fetch devuelve JSON directo
    if (!res.ok) {
      alert("Error guardando cliente");
      return;
    }
    // ⭐ AQUÍ ESTÁ EL CLIENTE CREADO
    onGuardado(res.cliente);
  } catch (error) {
    console.error("Error guardando cliente:", error);
    alert("Error guardando cliente");
  }
};


  return (
    <div style={modalFondo}>
      <div style={modalCaja}>
        <h3 style={{ marginBottom: "10px" }}>Agregar Cliente</h3>

        <input
          name="nombreCompleto"
          value={form.nombreCompleto}
          onChange={handleChange}
          placeholder="Nombre completo"
          style={input}
        />

        <input
          name="identificacion"
          value={form.identificacion}
          onChange={handleChange}
          placeholder="Cédula"
          style={input}
        />

        <input
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
          placeholder="Dirección"
          style={input}
        />

        <input
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          style={input}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button style={BotonGuardar} onClick={guardar}>Guardar</button>
          <button style={BotonCancelar} onClick={onCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
