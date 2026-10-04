import React from "react";
import { useNavigate } from "react-router-dom";
import encabezado from "../assets/encabezadoMonasterio.png";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import { API_URL } from "../config";

function SeleccionSede() {
  const navigate = useNavigate();
  
  const accesoTiendita =
  localStorage.getItem("accesoTiendita") === "true";
  
  const accesoMonasterio =
  localStorage.getItem("accesoMonasterio") === "true";

  const verificarTasas = async (sede) => {
  try {
    const hoy = obtenerFechaVenezuela();

    const res = await fetch(
      `${API_URL}/api/tasas/por-fecha/${hoy}?sede=${encodeURIComponent(sede)}`
    );

    if (!res.ok) {
      console.error("No se pudo verificar la tasa del día.");
      return;
    }

    const data = await res.json();

    if (!data.tasa) {
      alert(
        `⚠️ No hay tasas registradas para hoy en ${sede}.\n\n` +
        `Por favor regístrelas antes de realizar operaciones.`
      );
    }
  } catch (error) {
    console.error("Error verificando tasas:", error);
  }
};

  const entrarTiendita = async () => {
  if (!accesoTiendita) {
    alert("No tiene autorización para acceder a la Tiendita.");
    return;
  }

  localStorage.setItem("sede", "TIENDITA");

  // Verificar únicamente las tasas de TIENDITA
  await verificarTasas("TIENDITA");

  // Haya o no tasas, continúa al menú
  navigate("/menu", { replace: true });
};

  const entrarMonasterio = async () => {
  if (!accesoMonasterio) {
    alert("No tiene autorización para acceder al Monasterio.");
    return;
  }

  localStorage.setItem("sede", "MONASTERIO");

  // Verificar únicamente las tasas del MONASTERIO
  await verificarTasas("MONASTERIO");

  // Haya o no tasas, continúa al menú
  navigate("/menu-monasterio", { replace: true });
};

  const boton = {
    width: "280px",
    padding: "22px",
    margin: "15px",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontSize: "18px",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px"
      }}
    >
      <img
        src={encabezado}
        alt="Encabezado"
        style={{
          width: "60%",
          maxWidth: "400px",
          marginBottom: "30px"
        }}
      />

      <h2
        style={{
          fontFamily: "Arial Black, Arial, sans-serif",
          color: "#444",
          textAlign: "center"
        }}
      >
        SISTEMA DE INVENTARIO Y ADMINISTRACIÓN
      </h2>

      <p
        style={{
          fontFamily: "Arial",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#666"
        }}
      >
        Seleccione el área donde desea trabajar
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "25px"
        }}
      >
        {accesoTiendita && (
          <button
            onClick={entrarTiendita}
            style={{
            ...boton,
            backgroundColor: "#FC9E9B"
            }}
          >
            TIENDITA
            <div
              style={{
              fontFamily: "Arial",
              fontSize: "14px",
              marginTop: "8px"
              }}
            >
              San Cristóbal
            </div>
          </button>
        )}

        {accesoMonasterio && (
          <button
            onClick={entrarMonasterio}
            style={{
            ...boton,
            backgroundColor: "#75421F"
            }}
          >
            MONASTERIO
          <div
            style={{
            fontFamily: "Arial",
            fontSize: "14px",
            marginTop: "8px"
            }}
          >
            Rubio
          </div>
          </button>
        )}
        {!accesoTiendita && !accesoMonasterio && (
          <div
            style={{
            marginTop: "25px",
            padding: "15px 25px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "8px",
            textAlign: "center"
            }}
          >
            Este usuario no tiene acceso autorizado a ninguna sede.
          </div>
        )}
      </div>
    </div>
  );
}

export default SeleccionSede;