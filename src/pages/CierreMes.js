import React, { useState } from "react";

export default function CierreMes() {
  const [mes, setMes] = useState("");
  const [año, setAño] = useState(new Date().getFullYear());
  const [procesando, setProcesando] = useState(false);

  // === ESTILOS QUE USTED ME ENVIÓ ===
  const estiloBotonVolver = {
    width: "40%",
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

  const botonCierre = {
    width: "30%",
    padding: "6px",
    backgroundColor: "#84B09C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    marginTop: "8px",
    opacity: procesando ? 0.6 : 1,
    cursor: procesando ? "not-allowed" : "pointer"
  };

  const meses = [
    { v: 1, n: "Enero" },
    { v: 2, n: "Febrero" },
    { v: 3, n: "Marzo" },
    { v: 4, n: "Abril" },
    { v: 5, n: "Mayo" },
    { v: 6, n: "Junio" },
    { v: 7, n: "Julio" },
    { v: 8, n: "Agosto" },
    { v: 9, n: "Septiembre" },
    { v: 10, n: "Octubre" },
    { v: 11, n: "Noviembre" },
    { v: 12, n: "Diciembre" }
  ];

  const ejecutarCierre = async () => {
    if (!mes || !año) {
      alert("Debe seleccionar mes y año.");
      return;
    }

    const confirmar = window.confirm(
      `¿Está segura que desea cerrar el mes de ${meses[mes - 1].n} ${año}?\n\n` +
      "⚠️ Después del cierre, estos documentos NO podrán modificarse."
    );

    if (!confirmar) return;

    setProcesando(true);

    try {
      const res = await fetch("/api/cierre-mes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, año })
      });

      const data = await res.json();

      if (data.ok) {
        alert("Cierre de mes completado correctamente.");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    }

    setProcesando(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>🔒 Cierre de Mes</h2>

      <div style={{ marginTop: "20px" }}>
        <label>Seleccione el mes:</label>
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        >
          <option value="">-- Seleccione --</option>
          {meses.map((m) => (
            <option key={m.v} value={m.v}>
              {m.n}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: "20px" }}>
        <label>Año:</label>
        <input
          type="number"
          value={año}
          onChange={(e) => setAño(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      <button
        onClick={ejecutarCierre}
        disabled={procesando}
        style={botonCierre}
      >
        {procesando ? "Procesando..." : "Cerrar Mes"}
      </button>

      {/* BOTÓN VOLVER */}
        <button style={estiloBotonVolver} onClick={() => window.history.back()}>
          Volver al MENÚ
        </button>
      </div>
  );
}
