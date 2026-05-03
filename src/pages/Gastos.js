import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerGastos, crearGasto, actualizarGasto, eliminarGasto } from "../services/ser_gastos";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";

const Gastos = () => {
  const navigate = useNavigate();
  const usuarioActual = localStorage.getItem("usuario") || "ADMIN";

  const [gastos, setGastos] = useState([]);
  const [tiposGasto, setTiposGasto] = useState([]); // ⭐ NUEVO
  const [modo, setModo] = useState("crear");
  const [gastoEditando, setGastoEditando] = useState(null);
  const formularioRef = useRef(null);
  const [procesando, setProcesando] = useState(false);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().substring(0, 10),
    descripcion: "",
    moneda: "",
    monto: 0,
    numeroRecibo: 0,
    cajaChica: false
  });

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
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonGuardar = {
    width: "50%",
    padding: "6px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    marginTop: "8px",
    opacity: procesando ? 0.6 : 1,
    cursor: procesando ? "not-allowed" : "pointer"
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
  // CARGAR GASTOS
  // -------------------------

  async function cargarGastos() {
    setProcesando(true); // ⭐ NUEVO
    const data = await obtenerGastos();
    setGastos(data.lista);
    setProcesando(false); // ⭐ NUEVO
  }

  // -------------------------
  // CARGAR TIPOS DE GASTO
  // -------------------------

  async function cargarTiposGasto() {
  try {
    setProcesando(true);
    const res = await fetch(`${API_URL}/api/tipogastos`);
    const data = await res.json();

    console.log("TIPOS GASTO DESDE API:", data); // 👀

    if (Array.isArray(data)) {
      setTiposGasto(data);
    } else {
      setTiposGasto([]);
      console.error("Respuesta inesperada en /api/tipogastos:", data);
    }
  } catch (err) {
    console.error("Error cargando tipos de gasto:", err);
    setTiposGasto([]);
  } finally {
    setProcesando(false);
  }
}


  useEffect(() => {
    cargarGastos();
    cargarTiposGasto(); // ⭐ NUEVO
  }, []);

  // -------------------------
  // MANEJO DE FORMULARIO
  // -------------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  }; 

  // -------------------------
  // GUARDAR / ACTUALIZAR
  // -------------------------

  const guardarGasto = async () => {
    if (procesando) return;
    setProcesando(true); // ⭐ NUEVO

    try {
      if (!formData.fecha || !formData.descripcion || !formData.moneda || !formData.monto) {
        alert("Debe completar todos los campos obligatorios");
        return;
      }

      if (modo === "crear") {
        await crearGasto(formData);
        await registrarAccion(`Registró un gasto: ${formData.descripcion}`);
      } else {
        await actualizarGasto(gastoEditando._id, formData);
        await registrarAccion(`Actualizó un gasto: ${formData.descripcion}`);
      }

      await cargarGastos();
      limpiarFormulario();

    } catch (error) {
      console.error("Error guardando gasto:", error);
    } finally {
      setProcesando(false); // ⭐ NUEVO
    }
  };

  // -------------------------
  // EDITAR
  // -------------------------

  const editarGasto = (g) => {
    setModo("editar");
    setGastoEditando(g);

    setFormData({
      fecha: g.fecha?.substring(0, 10) || "",
      descripcion: g.descripcion || "",
      moneda: g.moneda || "",
      monto: g.monto || "",
      numeroRecibo: g.numeroRecibo || "",
      cajaChica: g.cajaChica || false
    });

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // -------------------------
  // ELIMINAR
  // -------------------------

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;

    setProcesando(true); // ⭐ NUEVO
    await eliminarGasto(id);
    await registrarAccion("Eliminó un gasto");
    await cargarGastos();
    setProcesando(false); // ⭐ NUEVO
  };

  // -------------------------
  // LIMPIAR
  // -------------------------

  const limpiarFormulario = () => {
    setModo("crear");
    setGastoEditando(null);
    setFormData({
      fecha: "",
      descripcion: "",
      moneda: "",
      monto: "",
      numeroRecibo: "",
      cajaChica: false
    });
  };

  // -------------------------
  // RENDER
  // -------------------------

  return (
    <div>
      <Encabezado />

      {/* ⭐ MENSAJE DE PROCESANDO */}
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

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
          Gestión de Gastos
        </h2>

        {/* FORMULARIO */}
        <div
          ref={formularioRef}
          style={{
            width: "550px",
            margin: "0 auto 20px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white"
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "35px", fontWeight: "bold" }}>
            {modo === "crear" ? "Registrar Gasto" : "Editar Gasto"}
          </h3>

          {/* FECHA + RECIBO */}
          <div style={{ display: "flex", flexDirection: "row", gap: "40px", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              <label style={{ fontWeight: "bold", marginTop: "12px" }}>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                style={{ width: "160px", padding: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              <label style={{ fontWeight: "bold", marginTop: "12px" }}>N° Recibo (opcional)</label>
              <input
                type="text"
                name="numeroRecibo"
                placeholder="Ej: 00125"
                value={formData.numeroRecibo}
                onChange={handleChange}
                style={{ width: "100px", padding: "5px" }}
              />
            </div>
          </div>

          {/* ⭐ SELECT DINÁMICO DE TIPOS DE GASTO */}
          <select
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "20px", padding: "5px" }}
          >
            <option value="">Seleccione un tipo de gasto</option>

            {tiposGasto.map((t) => (
              <option key={t._id} value={t.descripcion}>
                {t.descripcion}
              </option>
            ))}
          </select>

          {/* MONEDA + MONTO + CAJA CHICA */}
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <select
              name="moneda"
              value={formData.moneda}
              onChange={handleChange}
              style={{ width: "20%", marginBottom: "10px", padding: "5px" }}
            >
              <option value="">Moneda</option>
              <option value="D">Dólares</option>
              <option value="P">Pesos</option>
              <option value="Bs">Bolívares</option>
            </select>

            <input
              type="number"
              name="monto"
              placeholder="Monto"
              value={formData.monto}
              onChange={handleChange}
              style={{ width: "30%", marginBottom: "10px", padding: "5px" }}
            />

            <input
              type="checkbox"
              name="cajaChica"
              checked={formData.cajaChica}
              onChange={handleChange}
              style={{ marginRight: "10px" }}
            />
            ¿Salió de Caja Chica?
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button style={botonGuardar} onClick={guardarGasto}>
              {modo === "crear" ? "Guardar Gasto" : "Actualizar Gasto"}
            </button>
          </div>
        </div>

        {/* BOTÓN VOLVER */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <button onClick={() => navigate("/menu")} style={estiloBoton}>
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* TABLA */}
        <h3 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>
          Listado de Gastos
        </h3>

        <table border="1" cellPadding="1" style={{ width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Moneda</th>
              <th>Monto</th>
              <th>Recibo</th>
              <th>Caja Chica</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(gastos) &&
              gastos.map((g) => (
                <tr key={g._id}>
                  <td>{new Date(g.fecha).toLocaleDateString("es-VE")}</td>
                  <td>{g.descripcion}</td>
                  <td>{g.moneda}</td>
                  <td>{g.monto}</td>
                  <td>{g.numeroRecibo}</td>
                  <td>{g.cajaChica ? "Sí" : "No"}</td>

                  <td>
                    <span onClick={() => editarGasto(g)} style={iconoEditar}>✏️</span>
                    <span onClick={() => eliminar(g._id)} style={iconoEliminar}>🗑️</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Gastos;
