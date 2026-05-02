import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { registrarAccion } from "../utils/registrarAccion";

const TipoGastos = () => {
  const navigate = useNavigate();

  // -------------------------
  // ESTILOS
  // -------------------------

  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black, Arial, sans-serif",
    letterSpacing: "1px",
    cursor: "pointer",
    marginTop: "10px"
  };

  const iconoEditar = {
    fontSize: "22px",
    cursor: "pointer",
    marginRight: "10px"
  };

  const iconoEliminar = {
    fontSize: "22px",
    cursor: "pointer",
    color: "#B84A4A"
  };

  // -------------------------
  // ESTADOS
  // -------------------------

  const [tipos, setTipos] = useState([]);
  const [modo, setModo] = useState("crear");
  const [editando, setEditando] = useState(null);
  const formularioRef = useRef(null);

  const [formData, setFormData] = useState({
    descripcion: ""
  });

  const [procesando, setProcesando] = useState(false);

  // -------------------------
  // CARGAR DESDE DB
  // -------------------------

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    const res = await fetch(`${API_URL}/api/tipogastos`);
    const data = await res.json();
    setTipos(data);
  };

  // -------------------------
  // MANEJO FORMULARIO
  // -------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorFinal = typeof value === "string" ? value.toUpperCase() : value;

    setFormData({
      ...formData,
      [name]: valorFinal
    });
  };

  // -------------------------
  // GUARDAR
  // -------------------------

  const guardar = async () => {
    if (procesando) return;
    setProcesando(true);

    try {
      if (!formData.descripcion.trim()) {
        alert("Debe ingresar una descripción");
        return;
      }
      // Validar duplicado en frontend
        const existe = tipos.some(
          (t) =>
            t.descripcion.trim().toUpperCase() === formData.descripcion.trim().toUpperCase() &&
            t._id !== editando
        );

        if (existe) {
            alert("Ya existe un tipo de gasto con esa descripción");
            setProcesando(false);
            return;
        }


      if (modo === "crear") {
        const res = await fetch(`${API_URL}/api/tipogastos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const nueva = await res.json();
        setTipos([...tipos, nueva.tipo]);

      } else {
        const res = await fetch(`${API_URL}/api/tipogastos/${editando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const actualizado = await res.json();

        setTipos(
          tipos.map((t) =>
            t._id === editando ? actualizado.tipo : t
          )
        );
      }

      limpiarFormulario();
    } finally {
      setProcesando(false);
    }
  };

  // -------------------------
  // EDITAR
  // -------------------------

  const editar = (tipo) => {
    setModo("editar");
    setEditando(tipo._id);

    setFormData({
      descripcion: tipo.descripcion
    });

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // -------------------------
  // ELIMINAR
  // -------------------------

  const eliminar = async (id) => {
  if (!window.confirm("¿Eliminar este tipo de gasto?")) return;
  setProcesando(true);
  try {
    const res = await fetch(`${API_URL}/api/tipogastos/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    // ⭐ SI EL BACKEND DICE ERROR → NO ELIMINAR
    if (!res.ok) {
      alert(data.error);
      return;
    }
    // ⭐ SOLO SI ELIMINÓ → recargar lista
    await registrarAccion("Eliminó un tipo de gasto");
    await cargarGastos();
  } catch (error) {
    alert("Error eliminando tipo de gasto");
  } finally {
    setProcesando(false);
  }
};

  // -------------------------
  // LIMPIAR FORMULARIO
  // -------------------------

  const limpiarFormulario = () => {
    setModo("crear");
    setEditando(null);
    setFormData({ descripcion: "" });
  };

  // -------------------------
  // RETURN
  // -------------------------

  return (
    <div>
        {procesando && (
        <div style={{
          background: "#6699FF",
          color: "white",
          padding: "8px",
          textAlign: "center",
          fontWeight: "bold",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",      
          zIndex: 1000
        }}>
            Procesando, por favor espere...
        </div>
        )}

      <Encabezado />

      <div style={{ padding: "1px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "10px", fontWeight: "bold" }}>
          Gestión de Tipos de Gastos
        </h2>

        {/* FORMULARIO */}
        <div
          ref={formularioRef}
          style={{
            width: "450px",
            margin: "0 auto 10px auto",
            padding: "1px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
            {modo === "crear" ? "Registrar Tipo de Gasto" : "Editar Tipo de Gasto"}
          </h3>

          <input
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            style={{
              width: "87%",
              marginBottom: "10px",
              marginLeft: "20px",
              padding: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              disabled={procesando}
              onClick={guardar}
              style={{
                width: "50%",
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontFamily: "Arial Black",
                marginBottom: "10px",
                opacity: procesando ? 0.6 : 1,
                cursor: procesando ? "not-allowed" : "pointer",
                backgroundColor: modo === "crear" ? "#D98897" : "#6699FF"
              }}
            >
              {modo === "crear" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <button onClick={() => navigate("/menu")} style={estiloBoton}>
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* TABLA */}
        <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
          Lista de Tipos de Gastos
        </h3>

        <table border="1" cellPadding="8" style={{ justifyContent: "center", width: "50%", textAlign: "center", margin: "0 auto" }}>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {tipos.map((t) => (
              <tr key={t._id}>
                <td>{t.descripcion}</td>
                <td>
                  <span onClick={() => editar(t)} style={iconoEditar}>✏️</span>
                  <span onClick={() => eliminar(t._id)} style={iconoEliminar}>🗑️</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default TipoGastos;
