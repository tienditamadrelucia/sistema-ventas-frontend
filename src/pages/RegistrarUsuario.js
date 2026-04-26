import Encabezado from "../components/Encabezado";
import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

function RegistrarUsuario() {

  const [nombre, setNombre] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState("usuario");
  const [mensaje, setMensaje] = useState("");

  const registrar = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("${API_URL}/api/auth/register", {
        nombre,
        contraseña,
        rol
      });

      setMensaje(res.data.mensaje);
      setNombre("");
      setContraseña("");
      setRol("usuario");

    } catch (error) {
      setMensaje(error.response?.data?.mensaje || "Error al registrar");
    }
  };

  return (
    <div>
      <Encabezado />
    <div style={{ padding: "20px" }}>
      <h2>Registrar Usuario</h2>

      {mensaje && (
        <div style={{
          backgroundColor: "#D98897",
          color: "white",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "15px"
        }}>
          {mensaje}
        </div>
      )}

      <form onSubmit={registrar} style={{ maxWidth: "400px" }}>

        <label>Nombre de Usuario</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <label>Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        >
          <option value="admin">Administrador</option>
          <option value="cajero">Cajero</option>
          <option value="supervisor">Supervisor</option>
          <option value="usuario">Usuario</option>
        </select>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#D98897",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Arial Black",
            cursor: "pointer"
          }}
        >
          Registrar
        </button>

      </form>
    </div>
  </div>      
  );
}

export default RegistrarUsuario;