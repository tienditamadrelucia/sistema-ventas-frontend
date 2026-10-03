import Encabezado from "../components/Encabezado";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";

const AjustePrecios = () => {
  const navigate = useNavigate();

  // ============================
  // SEDE
  // ============================
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // ============================
  // ESTILOS
  // ============================
  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black, Arial, sans-serif",
    letterSpacing: "1px",
    cursor: "pointer",
    marginTop: "10px"
  };

  const input25 = {
    width: "25%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginRight: "10px"
  };

  // ============================
  // ESTADOS
  // ============================
  const [productos, setProductos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [tasaAnterior, setTasaAnterior] = useState("");
  const [tasaActual, setTasaActual] = useState("");

  // ============================
  // CARGAR PRODUCTOS
  // ============================
  const cargarProductos = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/productos?sede=${encodeURIComponent(sede)}`
      );

      const data = await res.json();

      setProductos(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Error cargando productos:", error);
      setProductos([]);
    }
  };

  // ============================
  // CARGA INICIAL
  // ============================
  useEffect(() => {
    const iniciar = async () => {
      setProcesando(true);

      try {
        await cargarProductos();

        await registrarAccion(
          `Ingresó al módulo Ajustar Precios Automáticos - ${sede}`
        );
      } catch (error) {
        console.error(error);
      } finally {
        setProcesando(false);
      }
    };

    iniciar();
  }, [sede]);

  // ============================
  // AJUSTAR PRECIOS
  // ============================
  const handleAjustar = async () => {
    if (!tasaAnterior || !tasaActual) {
      alert("Debe ingresar ambas tasas.");
      return;
    }

    const anterior = Number(tasaAnterior);
    const actual = Number(tasaActual);

    if (
      !Number.isFinite(anterior) ||
      !Number.isFinite(actual) ||
      anterior <= 0 ||
      actual <= 0
    ) {
      alert("Las tasas deben ser números mayores que cero.");
      return;
    }

    const confirmar = window.confirm(
      `¿Desea ajustar automáticamente los precios de ${sede}?\n\n` +
      `Tasa anterior: ${anterior}\n` +
      `Tasa actual: ${actual}`
    );

    if (!confirmar) return;

    setProcesando(true);

    try {
      const res = await fetch(
        `${API_URL}/api/productos/ajustar-precios`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            tasaAnterior: anterior,
            tasaActual: actual,
            sede
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.msg ||
          data.error ||
          "Error ajustando precios."
        );
        return;
      }

      alert(
        data.msg ||
        `Precios de ${sede} ajustados correctamente.`
      );

      // Refrescar solamente productos de esta sede
      await cargarProductos();

      // Limpiar campos
      setTasaAnterior("");
      setTasaActual("");

      await registrarAccion(
        `Ajustó los precios de venta automáticamente - ${sede}`
      );

    } catch (error) {
      console.error("Error ajustando precios:", error);
      alert("Error ajustando precios.");

    } finally {
      setProcesando(false);
    }
  };

  // ============================
  // VOLVER
  // ============================
  const volverMenu = () => {
    navigate(
      esMonasterio
        ? "/menu-monasterio"
        : "/menu"
    );
  };

  // ============================
  // PANTALLA
  // ============================
  return (
    <div>
      {procesando && (
        <div
          style={{
            background: "#84868a",
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
            marginBottom: "1px",
            fontWeight: "bold"
          }}
        >
          Ajustar Precios Automáticamente
          {" — "}
          {esMonasterio ? "MONASTERIO" : "TIENDITA"}
        </h2>

        {/* FORMULARIO */}
        <div
          style={{
            width: "550px",
            margin: "0 auto 1px auto",
            padding: "10px",
            border: "1px solid #84868a",
            borderRadius: "8px",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Tasa anterior"
              value={tasaAnterior}
              onChange={(e) =>
                setTasaAnterior(e.target.value)
              }
              style={input25}
            />

            <input
              type="number"
              step="any"
              min="0"
              placeholder="Tasa actual"
              value={tasaActual}
              onChange={(e) =>
                setTasaActual(e.target.value)
              }
              style={input25}
            />

            <button
              style={estiloBoton}
              onClick={handleAjustar}
              disabled={procesando}
            >
              Ajustar
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px"
          }}
        >
          <button
            onClick={volverMenu}
            style={estiloBoton}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>
      </div>

      {/* TABLA */}
      <h3
        style={{
          textAlign: "center",
          marginBottom: "15px",
          fontWeight: "bold"
        }}
      >
        Lista de Productos —{" "}
        {esMonasterio ? "MONASTERIO" : "TIENDITA"}
      </h3>

      <table
        border="1"
        cellPadding="8"
        style={{
          width: "100%",
          textAlign: "center",
          borderCollapse: "collapse"
        }}
      >
        <thead
          style={{
            backgroundColor: esMonasterio
              ? "#E8D1A5"
              : "#F9CEAE"
          }}
        >
          <tr>
            <th>Foto</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Medida</th>
            <th>Stock</th>
            <th>Ingreso</th>
            <th>Costo</th>
            <th>Precio Anterior</th>
            <th>Venta</th>
          </tr>
        </thead>

        <tbody>
          {productos.map((p) => (
            <tr key={p._id}>
              <td>
                {p.foto && (
                  <img
                    src={p.foto}
                    alt="foto"
                    width="60"
                  />
                )}
              </td>

              <td>{p.codigo}</td>
              <td>{p.categoria}</td>
              <td>{p.descripcion}</td>
              <td>{p.medida}</td>
              <td>{p.stock}</td>

              <td>
                {p.fechaIngreso
                  ? p.fechaIngreso
                      .slice(0, 10)
                      .split("-")
                      .reverse()
                      .join("/")
                  : ""}
              </td>

              <td>{p.costo}</td>
              <td>{p.precioanterior}</td>
              <td>{p.venta}</td>
            </tr>
          ))}

          {productos.length === 0 && (
            <tr>
              <td
                colSpan="10"
                style={{
                  padding: "20px",
                  fontWeight: "bold"
                }}
              >
                No hay productos registrados en esta sede.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AjustePrecios;