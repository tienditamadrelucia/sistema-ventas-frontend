import React, { useEffect, useState } from "react";
import {
  consultarHuevos,
  guardarHuevos,
  crearClaveHuevos
} from "../services/huevos";

export default function ConciliacionHuevos({ sede, alGuardar }) {
  const [datos, setDatos] = useState(null);
  const [cartones, setCartones] = useState("");
  const [sueltos, setSueltos] = useState("0");
  const [grupos, setGrupos] = useState({});
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [pendiente, setPendiente] = useState(null);

  const campo = {
    padding: "8px", border: "1px solid #ccc",
    borderRadius: "5px", width: "100%",
    boxSizing: "border-box", marginBottom: "10px"
  };

  const boton = {
    padding: "10px 18px", margin: "5px",
    border: "none", borderRadius: "6px",
    backgroundColor: "#5A2D16", color: "white",
    fontWeight: "bold", cursor: "pointer"
  };

  const celda = {
    padding: "8px", border: "1px solid #ccc"
  };

  const entero = valor =>
    /^\d+$/.test(String(valor)) &&
    Number.isSafeInteger(Number(valor));

  const fisico = Number(cartones) * 30 + Number(sueltos);
  const totalGrupos = Object.values(grupos)
    .reduce((s, v) => s + Number(v || 0), 0);

  async function cargar() {
    setOcupado(true);
    setError("");
    setDatos(null);
    try {
      const respuesta = await consultarHuevos("/diagnostico", { sede });
      setDatos(respuesta);
      setGrupos(Object.fromEntries(
        respuesta.grupos.map(g => [g.grupoId, ""])
      ));
      setCartones("");
      setSueltos("0");
      setMotivo("");
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [sede]);

  async function guardar(e) {
    e.preventDefault();
    if (ocupado) return;
    setError("");
    setMensaje("");

    let cuerpo = pendiente;

    try {
      if (!cuerpo) {
        if (!datos) throw new Error("Consulte las existencias.");
        if (!entero(cartones) || !entero(sueltos) || Number(sueltos) >= 30)
          throw new Error("Revise las cantidades físicas.");

        if (!Number.isSafeInteger(fisico))
          throw new Error("Existencia física inválida.");

        if (Object.values(grupos).some(v => !entero(v)))
          throw new Error("Confirme la cantidad de cada grupo.");

        if (totalGrupos > fisico)
          throw new Error("Los grupos superan la existencia física.");

        if (!motivo.trim())
          throw new Error("Indique el motivo de la conciliación.");

        if (!window.confirm(
          `¿Conciliar ${sede} con ${fisico} huevos físicos?\n` +
          "Realice esta operación al finalizar la jornada."
        )) return;

        cuerpo = {
          sede,
          cartones: Number(cartones),
          sueltos: Number(sueltos),
          existenciaGeneralEsperada: datos.resumenHuevos.existenciaGeneral,
          existenciaGruposEsperada: datos.resumenHuevos.saldoGrupos,
          grupos: Object.entries(grupos).map(([grupoId, unidades]) => ({
            grupoId, unidades: Number(unidades)
          })),
          motivo: motivo.trim(),
          claveOperacion: crearClaveHuevos()
        };

        setPendiente(cuerpo);
      }

      setOcupado(true);
      const respuesta = await guardarHuevos("/conciliacion", "POST", cuerpo);
      setPendiente(null);
      setMensaje(respuesta.mensaje);
      await cargar();
      alGuardar?.();
    } catch (e) {
      if ([400, 403, 404, 409, 423].includes(e.status))
        setPendiente(null);
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ maxWidth: "850px", margin: "20px auto" }}>
      <h3 style={{ textAlign: "center", color: "#5A2D16" }}>
        CONCILIACIÓN DE INVENTARIO — {sede}
      </h3>

      <p>
        Introduzca la existencia física comprobada.
        No se eliminarán las ventas ni los movimientos anteriores.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}

      <button type="button" style={boton}
        disabled={ocupado || Boolean(pendiente)} onClick={cargar}>
        ACTUALIZAR EXISTENCIAS
      </button>

      {datos && (
        <form onSubmit={guardar}>
          <fieldset disabled={ocupado || Boolean(pendiente)}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{
                backgroundColor: sede === "MONASTERIO"
                  ? "#E8D1A5" : "#F9CEAE"
              }}>
                <tr>
                  <th style={celda}>Registro</th>
                  <th style={celda}>Huevos</th>
                  <th style={celda}>Cartones equivalentes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Inventario general", datos.resumenHuevos.existenciaGeneral],
                  ["Seguimiento por grupos", datos.resumenHuevos.saldoGrupos],
                  ["Diferencia", datos.resumenHuevos.diferenciaGeneralMenosGrupos]
                ].map(([nombre, cantidad]) => (
                  <tr key={nombre} style={{ backgroundColor: "white" }}>
                    <td style={celda}>{nombre}</td>
                    <td style={celda}>{cantidad}</td>
                    <td style={celda}>{(cantidad / 30).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>EXISTENCIA FÍSICA</h4>

            <label>Cartones completos de 30</label>
            <input style={campo} type="number" min="0" step="1"
              value={cartones} onChange={e => setCartones(e.target.value)} />

            <label>Huevos sueltos</label>
            <input style={campo} type="number" min="0" max="29" step="1"
              value={sueltos} onChange={e => setSueltos(e.target.value)} />

            <p><strong>Total físico: {fisico} huevos.</strong></p>

            <h4>EXISTENCIA POR GRUPOS</h4>

            {datos.grupos.map(g => (
              <div key={g.grupoId}>
                <label>{g.nombre} — Saldo registrado: {g.huevos} huevos</label>
                <input style={campo} type="number" min="0" step="1"
                  placeholder="Huevos físicos de este grupo"
                  value={grupos[g.grupoId] ?? ""}
                  onChange={e => setGrupos(actual => ({
                    ...actual, [g.grupoId]: e.target.value
                  }))} />
              </div>
            ))}

            <p>Huevos asignados a grupos: {totalGrupos}</p>
            <p>Huevos sin grupo identificado: {fisico - totalGrupos}</p>

            <h4>DIFERENCIAS A CONCILIAR</h4>

            <p>
              Inventario general:{" "}
              <strong>{fisico - datos.resumenHuevos.existenciaGeneral} huevos</strong>
            </p>
            <p>
              Seguimiento por grupos:{" "}
              <strong>{totalGrupos - datos.resumenHuevos.saldoGrupos} huevos</strong>
            </p>

            <label>Motivo de la conciliación</label>
            <textarea style={campo} rows={4} maxLength={2000}
              value={motivo} onChange={e => setMotivo(e.target.value)} />
          </fieldset>

          <div style={{ textAlign: "center" }}>
            <button type="submit" style={boton} disabled={ocupado}>
              {ocupado ? "PROCESANDO..." : pendiente
                ? "REINTENTAR CONCILIACIÓN"
                : "CONFIRMAR CONCILIACIÓN"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}