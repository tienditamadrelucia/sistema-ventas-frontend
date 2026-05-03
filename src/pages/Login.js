import { useState } from "react";
import axios from "axios";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { buscarUsuario } from "../services/usuarios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

axios.defaults.withCredentials = true;

const estiloBoton = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#ff7aa2",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontWeight: "900",
  fontFamily: "Arial Black, Arial, sans-serif",
  letterSpacing: "1px",
  cursor: "pointer",
  marginTop: "10px"
}; 

function Login() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarContraseña, setMostrarContraseña] = useState(false);  
  const [procesando, setProcesando] = useState(false);

  const manejarLogin = async (e) => {
  setProcesando(true);     
  e.preventDefault();    

  const encontrado = await buscarUsuario(nombre, contraseña);  
    if (!encontrado || !encontrado.ok) { // Asegúrate de verificar que encontrado no sea undefined
      setMensaje("Frontend: Usuario o contraseña incorrectos");
      return;
  }
  localStorage.setItem("usuarioNombre", encontrado.usuario.usuario);
  localStorage.setItem("rolUsuario", encontrado.usuario.rol);
  // 🔹 Verificar si existen tasas de hoy
  const res = await fetch(`${API_URL}/api/tasas/hoy`);
  const data = await res.json();
  if (!data.tasa) {
    alert("⚠️ No hay tasas registradas para hoy. Por favor regístrelas antes de continuar.");
    navigate("/tasas", { replace: true });
    return;
  }
  setProcesando(false);
  navigate("/menu", { replace: true });
};

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
        zIndex: 999999
        }}>
          Procesando, por favor espere...
      </div>
      )}

    <div style={{
      width: "350px",
      margin: "80px auto",
      padding: "25px",
      borderRadius: "12px",
      backgroundColor: "#ffffff",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
      }}
    >

      <img
        src={logo}
        alt="Logo Tiendita Madre Lucía"
        style={{
          width: "120px",
          display: "block",
          margin: "0 auto 20px"
        }}
      />

      <h2 style={{
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "20px"
      }}>
        SISTEMA DE INVENTARIO Y VENTAS DE LA TIENDITA MADRE LUCÍA
      </h2>

      <form onSubmit={manejarLogin}>

        <div style={{ position: "relative", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Usuario"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{
              width: "90%",
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              paddingRight: "30px"   // espacio para la X
              }}
          />

          <button
            type="button"
            onClick={() => setNombre("")}
            style={{
              position: "absolute",
              right: "5px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#888"
            }}
            >
            ✖
          </button>
        </div>
        
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <input
            type={mostrarContraseña ? "text" : "password"}
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
            style={{
              width: "81%",
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              paddingRight: "60px"   // espacio para ojito + X
              }}
          />

          {/* Botón para mostrar/ocultar */}
          <button
            type="button"
            onClick={() => setMostrarContraseña(!mostrarContraseña)}
            style={{
              position: "absolute",
              right: "30px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            {mostrarContraseña ? "🙈" : "👁️"}
          </button>

          {/* Botón X para borrar */}
          <button
            type="button"
            onClick={() => setContraseña("")}
            style={{
              position: "absolute",
              right: "5px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#888"
              }}
            >
              ✖
          </button>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#ff7aa2",   // rosado suave
            color: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontWeight: "900",          // equivalente a Arial Black
            fontFamily: "Arial Black, Arial, sans-serif",
            letterSpacing: "1px",
            cursor: "pointer",
            marginTop: "10px"
            }}
          >
            ENTRAR
        </button>      
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
    </div>
  );
}

export default Login;