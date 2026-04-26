import React, { useState } from "react";
import * as XLSX from "xlsx";
import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";

const ImportarExcel = () => {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");

  // Normaliza identificación → solo letra + números
  const limpiarIdentificacion = (valor) => {
    if (!valor) return "";
    return String(valor).toUpperCase().replace(/[^A-Z0-9]/g, "");
  };

  // Normaliza teléfono → solo números
  const limpiarTelefono = (valor) => {
    if (!valor) return "";
    return String(valor).replace(/\D/g, "");
  };

  // Convierte fecha Excel a YYYY-MM-DD
  const formatearFecha = (valor) => {
    if (!valor) return "";

    if (typeof valor === "number") {
      const fecha = XLSX.SSF.parse_date_code(valor);
      const yyyy = fecha.y;
      const mm = String(fecha.m).padStart(2, "0");
      const dd = String(fecha.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    if (valor instanceof Date) {
      const yyyy = valor.getFullYear();
      const mm = String(valor.getMonth() + 1).padStart(2, "0");
      const dd = String(valor.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    return valor;
  };

  const handleFileUpload = (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = (e) => {
      const datos = new Uint8Array(e.target.result);
      const libro = XLSX.read(datos, { type: "array" });
      const hoja = libro.Sheets[libro.SheetNames[0]];

      const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });

      const clientesExcel = filas.map((fila, index) => ({
        id: Date.now() + index,
        identificacion: limpiarIdentificacion(fila["CÉDULA"]),
        nombreCompleto: String(fila["NOMBRE"] || "").toUpperCase(),
        direccion: String(fila["DIRECCIÓN"] || "").toUpperCase(),
        telefono: limpiarTelefono(fila["TELÉFONO"]),
        fechaIngreso: formatearFecha(fila["FECHA"])
      }));

      // Cargar clientes existentes
      const existentes = JSON.parse(localStorage.getItem("clientes")) || [];

      // Evitar duplicados por identificación
      const nuevos = clientesExcel.filter(
        (c) => !existentes.some((e) => e.identificacion === c.identificacion)
      );

      const final = [...existentes, ...nuevos];

      localStorage.setItem("clientes", JSON.stringify(final));

      setMensaje(
        `Se importaron ${nuevos.length} clientes nuevos. (${clientesExcel.length} en total en el archivo)`
      );
    };

    lector.readAsArrayBuffer(archivo);
  };

  return (
    <div>
      <Encabezado />

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
          Importar Clientes desde Excel
        </h2>

        <div
          style={{
            width: "450px",
            margin: "0 auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{ marginBottom: "20px" }}
          />

          {mensaje && (
            <p style={{ color: "green", fontWeight: "bold", textAlign: "center" }}>
              {mensaje}
            </p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/menu")}
            style={{
              width: "15%",
              padding: "10px",
              backgroundColor: "#D98897",
              color: "white",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontWeight: "900",
              fontFamily: "Arial Black",
              cursor: "pointer"
            }}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportarExcel;