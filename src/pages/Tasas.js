import Encabezado from "../components/Encabezado";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../services/logs";
import { obtenerTasaHoy, guardarTasas, modificarTasas } from "../services/ser_tasas.js";
import { buscarVentasDelDia } from "../services/ser_ventas.js";

const Tasas = () => {
  const navigate = useNavigate();

  // ⭐ Fecha de hoy en UTC (00:00:00)
  const hoy = new Date();
  const fechaUTC = new Date(Date.UTC(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    0, 0, 0
  ));

  const [form, setForm] = useState({
    fecha: fechaUTC,
    cajachicaP: "",
    cajachicaD: "",
    tasaP: "",
    tasaD: ""
  });

  const [existeHoy, setExisteHoy] = useState(false);
  const [modoModificar, setModoModificar] = useState(false);

  const formularioinput = {
    width: "550px",
    margin: "0 auto 20px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "white"
  };

  const estiloBotonVolver = {
    width: "15%",
    padding: "10px",
    backgroundColor: "#FC9E9B",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const estiloBoton = {
    width: "30%",
    padding: "6px",
    backgroundColor: "#F9CEAE",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px",
    marginLeft: "40px"
  };

  const estiloBotonBorrar = {
    width: "30%",
    padding: "6px",
    backgroundColor: "#84868a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px",
    marginLeft: "40px"
  };

  const estiloBotonGuardar = {
    width: "30%",
    padding: "6px",
    backgroundColor: "#84B09C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px",
    marginLeft: "40px"
  };

  // ============================
  // CARGAR TASA DEL DÍA
  // ============================
  useEffect(() => {
    registrarAccion("Ingreso al módulo Tasas de Cambio");

    const cargar = async () => {
      const res = await obtenerTasaHoy();

      if (res.ok && res.tasa) {
        setExisteHoy(true);
        setModoModificar(false);

        setForm({
          _id: res.tasa._id,
          fecha: fechaUTC,
          cajachicaP: res.tasa.cajachicaP,
          cajachicaD: res.tasa.cajachicaD,
          tasaP: res.tasa.tasaP,
          tasaD: res.tasa.tasaD
        });
      } else {
        setExisteHoy(false);
        setModoModificar(true);
      }
    };

    cargar();
  }, []);

  // ============================
  // HANDLERS
  // ============================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleGuardar = async () => {
    if (!form.cajachicaP || !form.cajachicaD || !form.tasaP || !form.tasaD) {
      alert("Debe completar todos los campos");
      return;
    }

    let res;

    // ⭐ GUARDAR NUEVA TASA
    if (!existeHoy) {
      res = await guardarTasas({
        ...form,
        fecha: fechaUTC   // ⭐ SIEMPRE UTC
      });

      if (res.ok) {
        registrarAccion("Registró tasas del día");
        alert(res.mensaje);

        localStorage.setItem("tasaDolar", form.tasaD);
        localStorage.setItem("tasaPeso", form.tasaP);
        localStorage.setItem("cajaDolar", form.cajachicaD);
        localStorage.setItem("cajaPeso", form.cajachicaP);

        window.location.reload();
      } else {
        alert(res.mensaje || "Error al guardar");
      }
    }

    // ⭐ MODIFICAR TASA EXISTENTE
    else {
      const ventas = await buscarVentasDelDia(fechaUTC);

      if ((ventas.VentasP + ventas.VentasD + ventas.VentasBs) > 0) {
        alert("No se pueden modificar las tasas porque ya existen ventas registradas hoy.");
        return;
      }

      res = await modificarTasas({
        ...form,
        fecha: fechaUTC
      });

      if (res.ok) {
        registrarAccion("Modificó tasas del día");
        alert(res.mensaje);

        localStorage.setItem("tasaDolar", form.tasaD);
        localStorage.setItem("tasaPeso", form.tasaP);
        localStorage.setItem("cajaDolar", form.cajachicaD);
        localStorage.setItem("cajaPeso", form.cajachicaP);

        window.location.reload();
      } else {
        alert(res.mensaje || "Error al modificar");
      }
    }
  };

  const handleModificar = () => {
    registrarAccion("Entró en modo Modificar tasas del día");
    setModoModificar(true);
  };

  const handleBorrar = () => {
    registrarAccion("Limpió formulario de tasas");
    setForm({
      fecha: fechaUTC,
      cajachicaP: "",
      cajachicaD: "",
      tasaP: "",
      tasaD: ""
    });
    setModoModificar(false);
  };

  const handleVolver = () => {
    navigate("/menu");
  };

  const inputsHabilitados = !existeHoy || modoModificar;

  // ============================
  // RENDER
  // ============================
  return (
    <div>
      <Encabezado />
      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
          Gestión de Tasas de Cambio y Caja Chica
        </h2>

        <div style={formularioinput}>
          <h3 style={{ height: "55px", textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
            Registrar Datos
          </h3>

          <div>
            <label style={{ marginLeft: "10px" }}>Caja Chica Pesos: </label>
            <input
              type="number"
              name="cajachicaP"
              step="0.1"
              value={form.cajachicaP}
              style={{ width: "20%", marginBottom: "10px", padding: "5px", marginLeft: "10px" }}
              onChange={handleChange}
              disabled={!inputsHabilitados}
            />

            <label style={{ marginLeft: "10px" }}>Caja Chica Dólares: </label>
            <input
              type="number"
              name="cajachicaD"
              step="0.1"
              value={form.cajachicaD}
              style={{ width: "20%", marginBottom: "10px", padding: "5px", marginLeft: "10px" }}
              onChange={handleChange}
              disabled={!inputsHabilitados}
            />
          </div>

          <div style={{ height: "25px" }}></div>

          <div>
            <label style={{ marginLeft: "10px" }}>Tasa Pesos: </label>
            <input
              type="number"
              name="tasaP"
              step="0.1"
              value={form.tasaP}
              style={{ width: "20%", marginBottom: "10px", padding: "5px", marginLeft: "50px" }}
              onChange={handleChange}
              disabled={!inputsHabilitados}
            />

            <label style={{ marginLeft: "10px" }}>Tasa Dólares: </label>
            <input
              type="number"
              name="tasaD"
              step="0.1"
              value={form.tasaD}
              style={{ width: "20%", marginBottom: "10px", padding: "5px", marginLeft: "50px" }}
              onChange={handleChange}
              disabled={!inputsHabilitados}
            />

            <div style={{ height: "20px" }}></div>

            <div style={{ display: "flex", width: "85%", justifyContent: "center", marginLeft: "20px" }}>
              <button style={estiloBotonGuardar} onClick={handleGuardar} disabled={!inputsHabilitados}>
                Guardar
              </button>

              <button style={estiloBoton} onClick={handleModificar} disabled={!existeHoy}>
                Modificar
              </button>

              <button style={estiloBotonBorrar} onClick={handleBorrar}>
                Borrar
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <button onClick={handleVolver} style={estiloBotonVolver}>
            Volver al MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tasas;
