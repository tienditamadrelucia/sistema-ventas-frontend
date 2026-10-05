import Encabezado from "../components/Encabezado";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import { API_URL } from "../config";

const Ingresos = () => {
  const navigate = useNavigate();
  const sede = localStorage.getItem("sede") || "MONASTERIO";
  const usuarioActual = localStorage.getItem("usuarioNombre") || "Usuario";
  const hoy = obtenerFechaVenezuela();
 
  const [ingresos, setIngresos] = useState([]);
  const [tiposIngreso, setTiposIngreso] = useState([]);
  const [modo, setModo] = useState("crear");
  const [ingresoEditando, setIngresoEditando] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const formularioRef = useRef(null);

  const [formData, setFormData] = useState({
    fecha: hoy,
    numeroReciboIngreso: "",
    tipoIngreso: "",
    descripcion: "",
    moneda: "",
    monto: ""
  });

  const estiloBoton = {
    width: "15%", padding: "10px", backgroundColor: "#5A2D16", color: "white",
    border: "1px solid #ccc", borderRadius: "8px", fontWeight: "900",
    fontFamily: "Arial Black", cursor: "pointer", marginTop: "10px"
  };

  const botonGuardar = {
    width: "30%", padding: "6px", backgroundColor: "#B8862D", color: "white",
    border: "none", borderRadius: "6px", fontFamily: "Arial Black",
    marginTop: "8px", opacity: procesando ? 0.6 : 1,
    cursor: procesando ? "not-allowed" : "pointer"
  };

  const iconoEditar = { fontSize: "22px", cursor: "pointer", marginRight: "10px" };
  const iconoEliminar = { fontSize: "22px", cursor: "pointer", color: "#B84A4A" };

  const cargarIngresos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ingresos?sede=MONASTERIO`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error cargando ingresos.");
      setIngresos(Array.isArray(data) ? data : data.lista || []);
    } catch (error) {
      console.error("Error cargando ingresos:", error);
      setIngresos([]);
    }
  };

  const cargarTiposIngreso = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tipoingresos`);
      const data = await res.json();
      if (!res.ok) throw new Error("Error cargando tipos de ingreso.");
      setTiposIngreso(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando tipos de ingreso:", error);
      setTiposIngreso([]);
    }
  };

  useEffect(() => {
    cargarIngresos();
    cargarTiposIngreso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setModo("crear");
    setIngresoEditando(null);
    setFormData({
      fecha: obtenerFechaVenezuela(),
      numeroReciboIngreso: "",
      tipoIngreso: "",
      descripcion: "",
      moneda: "",
      monto: ""
    });
  };

  const guardarIngreso = async () => {
    if (procesando) return;

    if (!formData.fecha || !formData.numeroReciboIngreso.trim() || !formData.tipoIngreso || !formData.moneda || !formData.monto) {
      alert("Debe completar fecha, recibo de ingreso, tipo de ingreso, moneda y monto.");
      return;
    }

    if (Number(formData.monto) <= 0) {
      alert("El monto debe ser mayor que cero.");
      return;
    }

    setProcesando(true);

    try {
      const datos = {
        ...formData,
        sede: "MONASTERIO",
        origen: modo === "crear" ? "MANUAL" : undefined,
        usuario: usuarioActual
      };

      const url = modo === "crear"
        ? `${API_URL}/api/ingresos`
        : `${API_URL}/api/ingresos/${ingresoEditando._id}`;

      const res = await fetch(url, {
        method: modo === "crear" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "No fue posible guardar el ingreso.");

      await registrarAccion(
        modo === "crear"
          ? `Registró un ingreso: Recibo ${formData.numeroReciboIngreso}`
          : `Actualizó un ingreso: Recibo ${formData.numeroReciboIngreso}`
      );

      await cargarIngresos();
      limpiarFormulario();
      alert(modo === "crear" ? "Ingreso registrado correctamente." : "Ingreso actualizado correctamente.");
    } catch (error) {
      console.error("Error guardando ingreso:", error);
      alert(error.message || "Error guardando ingreso.");
    } finally {
      setProcesando(false);
    }
  };

  const editarIngreso = (i) => {
    if (i.origen === "PARTICIPACION") {
      alert("Los ingresos generados por participaciones no se pueden modificar desde este módulo.");
      return;
    }

    setModo("editar");
    setIngresoEditando(i);
    setFormData({
      fecha: i.fecha?.substring(0, 10) || "",
      numeroReciboIngreso: i.numeroReciboIngreso || "",
      tipoIngreso: i.tipoIngreso?._id || i.tipoIngreso || "",
      descripcion: i.descripcion || "",
      moneda: i.moneda || "",
      monto: i.monto || ""
    });

    setTimeout(() => formularioRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const eliminarIngreso = async (i) => {
    if (i.origen === "PARTICIPACION") {
      alert("Los ingresos generados por participaciones no se pueden eliminar desde este módulo.");
      return;
    }

    if (!window.confirm(`¿Eliminar el Recibo de Ingreso N.º ${i.numeroReciboIngreso}?`)) return;

    setProcesando(true);

    try {
      const res = await fetch(`${API_URL}/api/ingresos/${i._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "No fue posible eliminar el ingreso.");

      await registrarAccion(`Eliminó el ingreso: Recibo ${i.numeroReciboIngreso}`);
      await cargarIngresos();
    } catch (error) {
      console.error("Error eliminando ingreso:", error);
      alert(error.message || "Error eliminando ingreso.");
    } finally {
      setProcesando(false);
    }
  };

  const formatearMonto = (valor) => {
    const numero = Number(valor);
    if (isNaN(numero)) return "0,00";
    return numero.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div>
      <Encabezado sede="MONASTERIO" />

      {procesando && (
        <div style={{ background: "#84868A", color: "white", padding: "8px", textAlign: "center", fontWeight: "bold", position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 1000 }}>
          Procesando, por favor espere...
        </div>
      )}

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>Gestión de Ingresos</h2>

        <div ref={formularioRef} style={{ width: "550px", maxWidth: "90%", margin: "0 auto 20px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "white" }}>
          <h3 style={{ textAlign: "center", marginBottom: "35px", fontWeight: "bold" }}>
            {modo === "crear" ? "Registrar Ingreso" : "Editar Ingreso"}
          </h3>

          <div style={{ display: "flex", gap: "30px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: "bold" }}>Fecha</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} style={{ width: "100%", padding: "5px", boxSizing: "border-box" }} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: "bold" }}>N.º Recibo de Ingreso</label>
              <input type="text" name="numeroReciboIngreso" value={formData.numeroReciboIngreso} onChange={handleChange} placeholder="Ej: 00055" style={{ width: "100%", padding: "5px", boxSizing: "border-box" }} />
            </div>
          </div>

          <label style={{ fontWeight: "bold" }}>Tipo de Ingreso</label>
          <select name="tipoIngreso" value={formData.tipoIngreso} onChange={handleChange} style={{ width: "100%", marginBottom: "20px", padding: "5px" }}>
            <option value="">Seleccione un tipo de ingreso</option>
            {tiposIngreso.filter(t => t.activo !== false).map(t => (
              <option key={t._id} value={t._id}>{t.descripcion}</option>
            ))}
          </select>

          <label style={{ fontWeight: "bold" }}>Descripción / Observación</label>
          <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Opcional" style={{ width: "100%", marginBottom: "20px", padding: "5px", boxSizing: "border-box" }} />

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <select name="moneda" value={formData.moneda} onChange={handleChange} style={{ width: "35%", padding: "5px" }}>
              <option value="">Moneda</option>
              <option value="D">Dólares</option>
              <option value="P">Pesos</option>
              <option value="Bs">Bolívares</option>
            </select>

            <input type="number" name="monto" min="0" step="0.01" value={formData.monto} onChange={handleChange} placeholder="Monto" style={{ width: "35%", padding: "5px" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button style={botonGuardar} onClick={guardarIngreso} disabled={procesando}>
              {modo === "crear" ? "Guardar Ingreso" : "Actualizar Ingreso"}
            </button>
          </div>

          {modo === "editar" && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={limpiarFormulario} style={{ marginTop: "8px", padding: "5px 15px", cursor: "pointer" }}>Cancelar</button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <button onClick={() => navigate("/menu-monasterio")} style={estiloBoton}>Volver al MENÚ PRINCIPAL</button>
        </div>

        <h3 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>Listado de Ingresos</h3>

        <table border="1" cellPadding="4" style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8D1A5", color: "#33231A" }}>
              <th>Fecha</th>
              <th>Recibo</th>
              <th>Tipo de Ingreso</th>
              <th>Descripción</th>
              <th>Moneda</th>
              <th>Monto</th>
              <th>Origen</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ingresos.length === 0 ? (
              <tr style={{ backgroundColor: "white" }}>
                <td colSpan="9">No hay ingresos registrados.</td>
              </tr>
            ) : ingresos.map(i => (
              <tr key={i._id} style={{ backgroundColor: "white" }}>
                <td>{i.fecha?.substring(0, 10)}</td>
                <td>{i.numeroReciboIngreso}</td>
                <td>{i.tipoIngreso?.descripcion || "—"}</td>
                <td>{i.descripcion || "—"}</td>
                <td>{i.moneda}</td>
                <td>{formatearMonto(i.monto)}</td>
                <td>{i.origen === "PARTICIPACION" ? "PARTICIPACIÓN" : "MANUAL"}</td>
                <td>{i.usuario || "—"}</td>
                <td>
                  {i.origen !== "PARTICIPACION" ? (
                    <>
                      <span onClick={() => editarIngreso(i)} style={iconoEditar}>✏️</span>
                      <span onClick={() => eliminarIngreso(i)} style={iconoEliminar}>🗑️</span>
                    </>
                  ) : "🔒"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ingresos;