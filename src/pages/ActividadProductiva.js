import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { registrarAccion } from "../utils/registrarAccion";

const ActividadProductiva = () => {
  const navigate = useNavigate();

  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // -------------------------
  // ESTILOS
  // -------------------------

  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: esMonasterio ? "#5A2D16" : "#D98897",
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

  // -------------------------
  // ESTADOS
  // -------------------------

  const [actividades, setActividades] = useState([]);
  const [modo, setModo] = useState("crear");
  const [editando, setEditando] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const formularioRef = useRef(null);

  const [formData, setFormData] = useState({
    descripcion: ""
  });

  // -------------------------
  // CARGAR DESDE DB
  // -------------------------

  useEffect(() => {
    cargarActividades();
  }, []);

  const cargarActividades = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/actividades-productivas`
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando actividades productivas");
        return;
      }

      setActividades(data);
    } catch (error) {
      console.error("Error cargando actividades:", error);
      alert("Error cargando actividades productivas");
    }
  };

  // -------------------------
  // MANEJO FORMULARIO
  // -------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value.toUpperCase()
    });
  };

  // -------------------------
  // GUARDAR
  // -------------------------

  const guardar = async () => {
    if (procesando) return;

    if (!formData.descripcion.trim()) {
      alert("Debe ingresar una descripción");
      return;
    }

    const existe = actividades.some(
      (a) =>
        a.descripcion.trim().toUpperCase() ===
          formData.descripcion.trim().toUpperCase() &&
        a._id !== editando
    );

    if (existe) {
      alert("Ya existe una actividad productiva con esa descripción");
      return;
    }

    setProcesando(true);

    try {
      const url =
        modo === "crear"
          ? `${API_URL}/api/actividades-productivas`
          : `${API_URL}/api/actividades-productivas/${editando}`;

      const res = await fetch(url, {
        method: modo === "crear" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo guardar la actividad productiva");
        return;
      }

      await registrarAccion(
        modo === "crear"
          ? `Registró actividad productiva ${formData.descripcion}`
          : `Actualizó actividad productiva ${formData.descripcion}`
      );

      limpiarFormulario();
      await cargarActividades();

    } catch (error) {
      console.error("Error guardando actividad:", error);
      alert("Error guardando actividad productiva");

    } finally {
      setProcesando(false);
    }
  };

  // -------------------------
  // EDITAR
  // -------------------------

  const editar = (actividad) => {
    setModo("editar");
    setEditando(actividad._id);

    setFormData({
      descripcion: actividad.descripcion
    });

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({
        behavior: "smooth"
      });
    }, 50);
  };

  // -------------------------
  // ACTIVAR / DESACTIVAR
  // -------------------------

  const cambiarEstado = async (actividad) => {
    const nuevoEstado = !actividad.activa;

    const mensaje = nuevoEstado
      ? `¿Activar ${actividad.descripcion}?`
      : `¿Desactivar ${actividad.descripcion}?`;

    if (!window.confirm(mensaje)) return;

    setProcesando(true);

    try {
      const res = await fetch(
        `${API_URL}/api/actividades-productivas/${actividad._id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            activa: nuevoEstado
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo cambiar el estado");
        return;
      }

      await registrarAccion(
        `${nuevoEstado ? "Activó" : "Desactivó"} actividad productiva ${
          actividad.descripcion
        }`
      );

      await cargarActividades();

    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("Error cambiando estado de la actividad");

    } finally {
      setProcesando(false);
    }
  };

  // -------------------------
  // LIMPIAR
  // -------------------------

  const limpiarFormulario = () => {
    setModo("crear");
    setEditando(null);

    setFormData({
      descripcion: ""
    });
  };

  // -------------------------
  // RETURN
  // -------------------------

  return (
    <div>

      {procesando && (
        <div
          style={{
            background: "#84868A",
            color: "white",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            zIndex: 1000
          }}
        >
          Procesando, por favor espere...
        </div>
      )}

      <Encabezado sede={sede} />

      <div style={{ padding: "1px" }}>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
            fontWeight: "bold"
          }}
        >
          Gestión de Actividades Productivas
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
          <h3
            style={{
              textAlign: "center",
              marginBottom: "15px",
              fontWeight: "bold"
            }}
          >
            {modo === "crear"
              ? "Registrar Actividad Productiva"
              : "Editar Actividad Productiva"}
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

          <div
            style={{
              display: "flex",
              justifyContent: "center"
            }}
          >
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
                backgroundColor:
                  modo === "crear"
                    ? esMonasterio
                      ? "#B8862D"
                      : "#D98897"
                    : "#6699FF"
              }}
            >
              {modo === "crear" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </div>

        {/* VOLVER */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px"
          }}
        >
          <button
            onClick={() =>
              navigate(
                esMonasterio
                  ? "/menu-monasterio"
                  : "/menu"
              )
            }
            style={estiloBoton}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* TABLA */}
        <h3
          style={{
            textAlign: "center",
            marginBottom: "15px",
            fontWeight: "bold"
          }}
        >
          Lista de Actividades Productivas
        </h3>

        <table
          border="1"
          cellPadding="8"
          style={{
            width: "60%",
            textAlign: "center",
            margin: "0 auto"
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: esMonasterio
                  ? "#E8D1A5"
                  : "#F9CEAE",
                color: esMonasterio
                  ? "#33231A"
                  : "#000"
              }}
            >
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {actividades.map((a) => (
              <tr
                key={a._id}
                style={{
                  backgroundColor: esMonasterio
                    ? "#E8D1A5"
                    : "#F9CEAE"
                }}
              >
                <td>{a.descripcion}</td>

                <td>
                  {a.activa ? "ACTIVA" : "INACTIVA"}
                </td>

                <td>
                  <span
                    onClick={() => editar(a)}
                    style={iconoEditar}
                    title="Editar"
                  >
                    ✏️
                  </span>

                  <button
                    type="button"
                    onClick={() => cambiarEstado(a)}
                    disabled={procesando}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "5px",
                      border: "1px solid #aaa",
                      cursor: procesando
                        ? "not-allowed"
                        : "pointer"
                    }}
                  >
                    {a.activa ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default ActividadProductiva;