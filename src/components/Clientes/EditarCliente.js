import { actualizarCliente } from "../../services/clientes";
import React, { useState, useEffect } from "react";


// ⭐ ESTILOS (deben ir ARRIBA)
const BotonRosado = {
  width: "35%",
  padding: "10px",
  backgroundColor: "#D98897",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontWeight: "800",
  fontFamily: "Arial Black",
  cursor: "pointer",
  marginTop: "5px"
};

const BotonAzul = {
  width: "35%",
  padding: "10px",
  backgroundColor: "#6699FF",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontWeight: "800",
  fontFamily: "Arial Black",
  cursor: "pointer",
  marginTop: "5px"
};

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

const btnGuardar = {
  backgroundColor: "#28a745",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  flex: 1
};

const btnCancelar = {
  backgroundColor: "#dc3545",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  flex: 1
};

// ⭐ COMPONENTE
export default function EditarCliente({ cliente, onCerrar, onGuardado }) {

  // ⭐ useState SIEMPRE debe ejecutarse
  const [form, setForm] = useState({    
    nombreCompleto: cliente?.nombreCompleto || "",
    direccion: cliente?.direccion || "",
    telefono: cliente?.telefono || ""
  });

  useEffect(() => {
    if (cliente) {
        setForm({
          nombreCompleto: cliente.nombreCompleto || "",
          direccion: cliente.direccion || "",
          telefono: cliente.telefono || ""
        });
    }
    }, [cliente]);
    // ⭐ Protección después del hook (permitido)
    if (!cliente) return null;
  
    const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value.toUpperCase()
    });
  };

  const validarTelefono = (tel) => {
  const soloDigitos = tel.replace(/\D/g, "");
  // Ajusta min/max según tu regla (ej: 7 a 15 dígitos)
  return soloDigitos.length >= 7 && soloDigitos.length <= 15;
};

const guardar = async () => {
  // Validaciones cliente-side
  if (!form.nombreCompleto || form.nombreCompleto.trim() === "") {
    alert("Nombre obligatorio");
    return;
  }
  if (!validarTelefono(form.telefono)) {
    alert("Teléfono inválido. Debe contener solo números y tener entre 7 y 15 dígitos.");
    return;
  }
  // Asegurar mayúsculas (por si hay algún campo que no pase por handleChange)
  const payload = {
    nombreCompleto: (form.nombreCompleto || "").toUpperCase(),
    direccion: (form.direccion || "").toUpperCase(),
    telefono: (form.telefono || "").replace(/\D/g, "")
  };
  try {
    // actualizarCliente debe devolver la respuesta completa (axios style)
    const respuesta = await actualizarCliente(cliente._id, payload);
    // Comprobaciones defensivas
    if (!respuesta) {
      throw new Error("Respuesta vacía del servicio");
    }
    // Si usas axios, la data suele estar en respuesta.data
    const data = respuesta.data ?? respuesta; // compatibilidad con fetch o axios
    if (!data) {
      throw new Error("No se recibió data del servidor");
    }
    // Si tu backend devuelve { ok: true, cliente: {...} }
    const clienteActualizado = data.cliente ?? data; // compatibilidad
    if (!clienteActualizado) {
      throw new Error("El servidor no devolvió el cliente actualizado");
    }
    // Llamar al callback del padre con el objeto cliente actualizado
    onGuardado(clienteActualizado);
    } catch (err) {
        console.error("Error al guardar cliente:", err);
        alert("Error al guardar cliente: " + (err.message || "revise la consola"));
      }
    };

  return (
    <div style={modalFondo}>
      <div style={modalCaja}>
        <h3 style={{ marginBottom: "10px" }}>Actualizar datos del cliente</h3>

        <input
          name="nombreCompleto"
          value={form.nombreCompleto}
          onChange={handleChange}
          placeholder="Nombre completo"
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
          <button style={BotonRosado} onClick={guardar}>Guardar</button>
          <button style={BotonAzul} onClick={onCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

