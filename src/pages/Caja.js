
import React, { useState, useEffect, useRef } from "react";
import { guardarCuadre } from "../services/ser_caja";
import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";

const VACIO = { CajaChicaP: 0, VentasP: 0, GastosP: 0, totalEsperadoP: 0, CajaChicaD: 0, VentasD: 0, GastosD: 0, totalEsperadoD: 0, CajaChicaBs: 0, VentasBs: 0, GastosBs: 0, totalEsperadoBs: 0, tasaP: 0, tasaD: 0 };
const numero = v => Number(v || 0);
const normalizarBilletes = obj => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k, Number(v === "" ? 0 : v)]));
const totalBilletes = obj => Object.entries(obj || {}).reduce((s, [den, cant]) => s + Number(den) * numero(cant), 0);
const calcularCompensacion = (d, p, tasa) => {
  const desdeD = tasa > 0 && d > 0 && p < 0 ? Math.min(d, -p / tasa) : 0;
  const desdeP = tasa > 0 && p > 0 && d < 0 ? Math.min(p, -d * tasa) : 0;
  return { desdeD, desdeP, difD: d - desdeD + desdeP / (tasa || 1), difP: p - desdeP + desdeD * tasa };
};
const Caja = () => {
  const navigate = useNavigate();
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";
  const [procesando, setProcesando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [fecha, setFecha] = useState("");
  const [modo, setModo] = useState("lectura");
  const [idCuadre, setIdCuadre] = useState(null);
  const [billetesP, setBilletesP] = useState({});
  const [billetesD, setBilletesD] = useState({});
  const [billetesBs, setBilletesBs] = useState({});
  const [cuadre, setCuadre] = useState({ ...VACIO });
  const [diferenciaP, setDiferenciaP] = useState(0);
  const [diferenciaD, setDiferenciaD] = useState(0);
  const [diferenciaBs, setDiferenciaBs] = useState(0);
  const [difD, setDifD] = useState(0);
  const [difP, setDifP] = useState(0);
  const [mostrarCompensacion, setMostrarCompensacion] = useState(false);
  const [compensacionActual, setCompensacionActual] = useState({ desdeD: 0, desdeP: 0 });
  const formularioRef = useRef(null);
  const consultaRef = useRef(0);
  const bloqueoRef = useRef(false);
  const fechaRef = useRef("");
  const modoRef = useRef("lectura");
  const estiloBotonVolver = { width: "20%", display: "flex", height: "30px", padding: "6px", backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B", color: "white", border: "none", borderRadius: "6px", fontFamily: "Arial Black", cursor: "pointer", marginTop: "0px", justifyContent: "center", alignItems: "center" };
  const botonGuardar = { width: "30%", display: "flex", height: "30px", padding: "6px", backgroundColor: esMonasterio ? "#B8862D" : "#84B09C", color: "white", border: "none", borderRadius: "6px", fontFamily: "Arial Black", cursor: procesando || cargandoDatos ? "not-allowed" : "pointer", marginTop: "0px", justifyContent: "center", alignItems: "center", opacity: procesando || cargandoDatos ? 0.6 : 1 };
  const botonP = { width: "20%", display: "flex", height: "30px", padding: "6px", backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE", color: esMonasterio ? "#33231A" : "white", border: "none", borderRadius: "6px", fontFamily: "Arial Black", cursor: "pointer", marginTop: "0px", justifyContent: "center", alignItems: "center" };
  const inputEstilo = { width: "40%", padding: "5px", marginBottom: "0px", paddingTop: "1px", paddingBottom: "1px", borderRadius: "6px", border: "1px solid #ccc", backgroundColor: "white", fontFamily: "Arial", fontSize: "14px" };
  const inputP = { width: "10%", padding: "5px", paddingTop: "1px", paddingBottom: "1px", marginBottom: "1px", borderRadius: "6px", border: "1px solid #ccc", backgroundColor: "white", fontFamily: "Arial", fontSize: "14px", gap: "10px" };
  const formatoVE = valor => numero(valor).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalPesosContados = totalBilletes(billetesP);
  const totalDolaresContados = totalBilletes(billetesD);
  const totalBolivaresContados = totalBilletes(billetesBs);
  const limpiarBilletesP = () => { if (!procesando && !cargandoDatos) setBilletesP({}); };
  const limpiarBilletesD = () => { if (!procesando && !cargandoDatos) setBilletesD({}); };
  const limpiarBilletesBs = () => { if (!procesando && !cargandoDatos) setBilletesBs({}); };
  const limpiarFormulario = () => {
    setModo("lectura"); modoRef.current = "lectura"; setIdCuadre(null);
    setCuadre({ ...VACIO }); setBilletesP({}); setBilletesD({}); setBilletesBs({});
    setDiferenciaP(0); setDiferenciaD(0); setDiferenciaBs(0); setDifD(0); setDifP(0);
    setMostrarCompensacion(false); setCompensacionActual({ desdeD: 0, desdeP: 0 });
  };
  const cambiarFecha = nueva => {
    if (procesando || cargandoDatos || bloqueoRef.current) return;
    consultaRef.current += 1; fechaRef.current = nueva; setFecha(nueva); limpiarFormulario();
  };

  const cargarDatosNuevoCuadre = async (dia, token) => {
    const [rt, rv, rg] = await Promise.all([
      fetch(`${API_URL}/api/tasas/por-fecha/${dia}?sede=${encodeURIComponent(sede)}`),
      fetch(`${API_URL}/api/moneda/fecha/${dia}?sede=${encodeURIComponent(sede)}`),
      fetch(`${API_URL}/api/gastos/?sede=${encodeURIComponent(sede)}`)
    ]);
    if (![rt, rv, rg].every(r => r.ok)) throw new Error("No se pudieron consultar caja chica, ventas o gastos.");
    const [tasas, ventas, gastos] = await Promise.all([rt.json(), rv.json(), rg.json()]);
    if (!tasas?.ok || !tasas.tasa) throw new Error("No hay datos de caja chica para esta fecha. No se guardará un saldo supuesto.");
    if (!ventas?.ok || !Array.isArray(ventas.lista)) throw new Error("Respuesta inválida al consultar ventas.");
    if (!gastos?.ok || !Array.isArray(gastos.lista)) throw new Error("Respuesta inválida al consultar gastos.");
    const sumar = (lista, campo) => lista.reduce((s, x) => s + numero(x[campo]), 0);
    const gastosDia = gastos.lista.filter(g => g.cajaChica === true && String(g.fecha || "").slice(0, 10) === dia);
    const sumarGasto = moneda => gastosDia.filter(g => g.moneda === moneda).reduce((s, g) => s + numero(g.monto), 0);
    const cP = numero(tasas.tasa.cajachicaP), cD = numero(tasas.tasa.cajachicaD);
    const vP = sumar(ventas.lista, "efectivoP"), vD = sumar(ventas.lista, "efectivoD"), vBs = sumar(ventas.lista, "efectivoBs");
    const gP = sumarGasto("P"), gD = sumarGasto("D"), gBs = sumar(ventas.lista, "efectivoBs") * 0 + sumarGasto("Bs");
    if (token !== consultaRef.current || dia !== fechaRef.current) return false;
    setCuadre({
      CajaChicaP: cP, VentasP: vP, GastosP: gP, totalEsperadoP: cP + vP - gP,
      CajaChicaD: cD, VentasD: vD, GastosD: gD, totalEsperadoD: cD + vD - gD,
      CajaChicaBs: 0, VentasBs: vBs, GastosBs: gBs, totalEsperadoBs: vBs - gBs,
      tasaP: numero(tasas.tasa.tasaP), tasaD: numero(tasas.tasa.tasaD)
    });
    return true;
  };

  const verificarFecha = async () => {
    if (!fecha) return alert("Debe seleccionar una fecha");
    if (bloqueoRef.current || cargandoDatos || procesando) return;
    bloqueoRef.current = true;
    setCargandoDatos(true);
    const dia = fecha, token = ++consultaRef.current;
    limpiarFormulario();
    try {
      const res = await fetch(`${API_URL}/api/caja/${dia}?sede=${encodeURIComponent(sede)}`);
      const respuesta = await res.json();
      if (!res.ok) throw new Error(respuesta.mensaje || respuesta.error || "Error consultando caja");
      const registros = Array.isArray(respuesta) ? respuesta : respuesta.cuadre ? [respuesta.cuadre] : [];
      const existentes = registros.filter(r =>
        r.tipoRegistro !== "CONTROL_DIA" && r.cajaChica &&
        (r.ventas || r.esperado || r.contado || r.billetes)
      );
      if (existentes.length > 1) throw new Error("Se encontraron varios cuadres para este día y sede. Revise los duplicados antes de continuar.");
      const c = existentes[0];
      if (!c) {
        const cargado = await cargarDatosNuevoCuadre(dia, token);
        if (!cargado) return;
        setModo("crear");
        modoRef.current = "crear";
        alert("No existe un cuadre para esta fecha. Puede crear uno nuevo.");
      } else {
        if (token !== consultaRef.current || dia !== fechaRef.current) return;
        setIdCuadre(c._id);
        setCuadre({
          CajaChicaP: numero(c.cajaChica?.P), CajaChicaD: numero(c.cajaChica?.D), CajaChicaBs: numero(c.cajaChica?.Bs),
          VentasP: numero(c.ventas?.P), VentasD: numero(c.ventas?.D), VentasBs: numero(c.ventas?.Bs),
          GastosP: numero(c.gastos?.P), GastosD: numero(c.gastos?.D), GastosBs: numero(c.gastos?.Bs),
          totalEsperadoP: numero(c.esperado?.P), totalEsperadoD: numero(c.esperado?.D), totalEsperadoBs: numero(c.esperado?.Bs),
          tasaP: numero(c.tasaP), tasaD: numero(c.tasaD)
        });
        setBilletesP(c.billetes?.P || {});
        setBilletesD(c.billetes?.D || {});
        setBilletesBs(c.billetes?.Bs || {});
        setDiferenciaP(numero(c.diferencia?.P));
        setDiferenciaD(numero(c.diferencia?.D));
        setDiferenciaBs(numero(c.diferencia?.Bs));
        const compD = numero(c.compensacion?.D), compP = numero(c.compensacion?.P);
        setCompensacionActual({ desdeD: compD, desdeP: compP });
        setDifD(numero(c.diferencia?.D) - compD + compP / (numero(c.tasaP) || 1));
        setDifP(numero(c.diferencia?.P) - compP + compD * numero(c.tasaP));
        setMostrarCompensacion(compD > 0 || compP > 0);
        const nuevoModo = window.confirm("Ya existe un cuadre para esta fecha.\n¿Desea modificarlo?") ? "modificar" : "lectura";
        setModo(nuevoModo);
        modoRef.current = nuevoModo;
      }
      registrarAccion("Consultó datos del Cuadre de Caja del día");
    } catch (error) {
      console.error("ERROR CONSULTANDO CUADRE:", error);
      alert(error.message);
      limpiarFormulario();
    } finally {
      bloqueoRef.current = false;
      setCargandoDatos(false);
    }
  };

  const diferenciasActuales = {
    D: totalDolaresContados - numero(cuadre.totalEsperadoD),
    P: totalPesosContados - numero(cuadre.totalEsperadoP),
    Bs: totalBolivaresContados - numero(cuadre.totalEsperadoBs)
  };
  const compensacionCalculada = calcularCompensacion(
    diferenciasActuales.D, diferenciasActuales.P, numero(cuadre.tasaP)
  );

  useEffect(() => {
    if (modo === "lectura") return;
    const d = totalDolaresContados - numero(cuadre.totalEsperadoD);
    const p = totalPesosContados - numero(cuadre.totalEsperadoP);
    const bs = totalBolivaresContados - numero(cuadre.totalEsperadoBs);
    const comp = calcularCompensacion(d, p, numero(cuadre.tasaP));
    setDiferenciaD(d); setDiferenciaP(p); setDiferenciaBs(bs);
    setDifD(comp.difD); setDifP(comp.difP);
    setCompensacionActual({ desdeD: comp.desdeD, desdeP: comp.desdeP });
    setMostrarCompensacion(comp.desdeD > 0 || comp.desdeP > 0);
  }, [modo, totalDolaresContados, totalPesosContados, totalBolivaresContados,
      cuadre.totalEsperadoD, cuadre.totalEsperadoP, cuadre.totalEsperadoBs, cuadre.tasaP]);

  const prepararPayload = () => {
    const grupos = {
      cajaChica: { D: numero(cuadre.CajaChicaD), P: numero(cuadre.CajaChicaP), Bs: numero(cuadre.CajaChicaBs) },
      ventas: { D: numero(cuadre.VentasD), P: numero(cuadre.VentasP), Bs: numero(cuadre.VentasBs) },
      gastos: { D: numero(cuadre.GastosD), P: numero(cuadre.GastosP), Bs: numero(cuadre.GastosBs) },
      esperado: { D: numero(cuadre.totalEsperadoD), P: numero(cuadre.totalEsperadoP), Bs: numero(cuadre.totalEsperadoBs) },
      contado: { D: totalDolaresContados, P: totalPesosContados, Bs: totalBolivaresContados },
      diferencia: { ...diferenciasActuales },
      billetes: {
        D: normalizarBilletes(billetesD),
        P: normalizarBilletes(billetesP),
        Bs: normalizarBilletes(billetesBs)
      },
      compensacion: {
        D: compensacionCalculada.desdeD,
        P: compensacionCalculada.desdeP
      }
    };
    for (const [moneda, cantidades] of Object.entries(grupos.billetes)) {
      for (const [denominacion, cantidad] of Object.entries(cantidades)) {
        if (!/^\d+(\.\d+)?$/.test(denominacion) || !Number.isInteger(cantidad) || cantidad < 0)
          throw new Error(`Cantidad inválida en billetes ${moneda}, denominación ${denominacion}.`);
      }
    }
    for (const [grupo, valores] of Object.entries(grupos)) {
      if (grupo === "billetes") continue;
      for (const [moneda, valor] of Object.entries(valores)) {
        if (!Number.isFinite(valor)) throw new Error(`Importe inválido en ${grupo}.${moneda}.`);
      }
    }
    return { fecha, sede, ...grupos };
  };

  const guardarCaja = async () => {
    if (modoRef.current !== "crear" || !fecha || procesando || cargandoDatos || bloqueoRef.current) return;
    bloqueoRef.current = true; setProcesando(true);
    try {
      const payload = prepararPayload();
      const resultado = await guardarCuadre(payload);
      if (!resultado?.ok) throw new Error(resultado?.mensaje || "El servidor no confirmó el guardado.");
      alert("Cuadre guardado correctamente");
      registrarAccion("Guardó el Cierre de Caja del día");
      setModo("lectura"); modoRef.current = "lectura";
      setIdCuadre(resultado.id || null);
    } catch (error) {
      console.error("ERROR GUARDANDO CAJA:", error);
      alert(`No se pudo guardar el cuadre:\n${error.message}`);
    } finally {
      bloqueoRef.current = false; setProcesando(false);
    }
  };

  const actualizarCaja = async () => {
    if (modoRef.current !== "modificar" || !fecha || !idCuadre || procesando || cargandoDatos || bloqueoRef.current) return;
    bloqueoRef.current = true; setProcesando(true);
    try {
      const payload = { ...prepararPayload(), _id: idCuadre };
      const res = await fetch(`${API_URL}/api/caja`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || data.error || `Error ${res.status}`);
      alert("Cuadre actualizado correctamente");
      registrarAccion("Actualizó el Cuadre de Caja del día");
      setModo("lectura"); modoRef.current = "lectura";
    } catch (error) {
      console.error("ERROR ACTUALIZANDO CAJA:", error);
      alert(`No se pudo actualizar el cuadre:\n${error.message}`);
    } finally {
      bloqueoRef.current = false; setProcesando(false);
    }
  };

  return (
    <div>
      <Encabezado sede={sede} />
      <div style={{ padding: "10px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>
          Cuadre de Caja Diario
        </h2>
        <div ref={formularioRef} style={{ width: "550px", margin: "0 auto 20px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "white" }}>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => cambiarFecha(e.target.value)}
              disabled={procesando || cargandoDatos} style={inputEstilo} />
            <button style={botonP} onClick={verificarFecha} disabled={procesando || cargandoDatos}>
              Consultar
            </button>
            <button style={botonGuardar}
              onClick={modo === "modificar" ? actualizarCaja : guardarCaja}
              disabled={modo === "lectura" || procesando || cargandoDatos}
              className="btn-guardar">
              {cargandoDatos ? "Cargando..." : procesando ? "Procesando..." : modo === "modificar" ? "Actualizar" : "Guardar"}
            </button>
            <button onClick={() => navigate(esMonasterio ? "/menu-monasterio" : "/menu")}
              style={estiloBotonVolver}>MENÚ</button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "10px" }}>
          {/* PESOS */}
          <div style={{ flex: 1, background: "#f2f2f2", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
            <h3 style={{ textAlign: "center" }}>EFECTIVO - PESOS</h3>
            {[
              ["Caja Chica:", cuadre.CajaChicaP],
              ["Ventas en efectivo:", cuadre.VentasP],
              ["Gastos de Caja Chica:", cuadre.GastosP],
              ["TOTAL EN CAJA:", cuadre.totalEsperadoP]
            ].map(([etiqueta, valor], i) => (
              <div key={etiqueta} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: i > 1 ? "26px" : "6px" }}>
                <label style={{ width: "150px" }}>{etiqueta}</label>
                <input type="text" value={formatoVE(valor)} readOnly style={inputEstilo} />
              </div>
            ))}
            {["100000", "50000", "20000", "10000", "5000", "2000", "1000", "500", "200", "100"].map((den, i) => (
              <div key={den} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: i === 9 ? "26px" : "6px" }}>
                <label style={{ width: "90px" }}>{Number(den).toLocaleString("es-VE")}</label>
                <input type="number" min="0" step="1"
                  value={billetesP[den] ?? ""}
                  onChange={e => {
                    if (modo === "lectura" || procesando || cargandoDatos) return;
                    setBilletesP(prev => ({ ...prev, [den]: e.target.value }));
                  }}
                  readOnly={modo === "lectura" || procesando || cargandoDatos}
                  style={inputP} />
                <input type="text" readOnly
                  value={formatoVE(numero(billetesP[den]) * Number(den))}
                  style={inputEstilo} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
              <label style={{ width: "150px" }}>TOTAL:</label>
              <input type="text" value={formatoVE(totalPesosContados)} readOnly style={inputEstilo} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1px" }}>
              <label style={{ width: "150px" }}>DIFERENCIA:</label>
              <input type="text" value={formatoVE(diferenciaP)} readOnly style={inputEstilo} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
              <button onClick={limpiarBilletesP}
                disabled={modo === "lectura" || procesando || cargandoDatos}
                style={{
                  padding: "6px 12px",
                  backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
                  color: esMonasterio ? "#33231A" : "white",
                  border: "none", borderRadius: "6px",
                  cursor: modo === "lectura" ? "not-allowed" : "pointer",
                  opacity: modo === "lectura" ? 0.6 : 1
                }}>
                LIMPIAR
              </button>
            </div>
          </div>

          {/* DÓLARES */}
          <div style={{ flex: 1, background: "#f2f2f2", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
            <h3 style={{ textAlign: "center" }}>EFECTIVO - DÓLARES</h3>
            {[
              ["Caja Chica:", cuadre.CajaChicaD],
              ["Ventas en efectivo:", cuadre.VentasD],
              ["Gastos de Caja Chica:", cuadre.GastosD],
              ["TOTAL EN CAJA:", cuadre.totalEsperadoD]
            ].map(([etiqueta, valor], i) => (
              <div key={etiqueta} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: i > 1 ? "26px" : "6px" }}>
                <label style={{ width: "150px" }}>{etiqueta}</label>
                <input type="text" value={formatoVE(valor)} readOnly style={inputEstilo} />
              </div>
            ))}
            {["100", "50", "20", "10", "5", "1"].map((den, i) => (
              <div key={den} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: i === 5 ? "26px" : "6px" }}>
                <label style={{ width: "90px" }}>{den}</label>
                <input type="number" min="0" step="1"
                  value={billetesD[den] ?? ""}
                  onChange={e => {
                    if (modo === "lectura" || procesando || cargandoDatos) return;
                    setBilletesD(prev => ({ ...prev, [den]: e.target.value }));
                  }}
                  readOnly={modo === "lectura" || procesando || cargandoDatos}
                  style={inputP} />
                <input type="text" readOnly
                  value={formatoVE(numero(billetesD[den]) * Number(den))}
                  style={inputEstilo} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
              <label style={{ width: "150px" }}>TOTAL:</label>
              <input type="text" value={formatoVE(totalDolaresContados)} readOnly style={inputEstilo} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1px" }}>
              <label style={{ width: "150px" }}>DIFERENCIA:</label>
              <input type="text" value={formatoVE(diferenciaD)} readOnly style={inputEstilo} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
              <button onClick={limpiarBilletesD}
                disabled={modo === "lectura" || procesando || cargandoDatos}
                style={{
                  padding: "6px 12px",
                  backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
                  color: esMonasterio ? "#33231A" : "white",
                  border: "none", borderRadius: "6px",
                  cursor: modo === "lectura" ? "not-allowed" : "pointer",
                  opacity: modo === "lectura" ? 0.6 : 1
                }}>
                LIMPIAR
              </button>
            </div>
          </div>

          {/* BOLÍVARES */}
          <div style={{ flex: 1, background: "#f2f2f2", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
            <h3 style={{ textAlign: "center" }}>EFECTIVO - BOLÍVARES</h3>
            {[
              ["Caja Chica:", cuadre.CajaChicaBs],
              ["Ventas en efectivo:", cuadre.VentasBs],
              ["Gastos de Caja Chica:", cuadre.GastosBs],
              ["TOTAL EN CAJA:", cuadre.totalEsperadoBs]
            ].map(([etiqueta, valor], i) => (
              <div key={etiqueta} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: i > 1 ? "26px" : "6px" }}>
                <label style={{ width: "150px" }}>{etiqueta}</label>
                <input type="text" value={formatoVE(valor)} readOnly style={inputEstilo} />
              </div>
            ))}
            {["100", "50", "20", "10", "5", "1"].map((den, i) => (
              <div key={den} style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: i === 5 ? "26px" : "6px" }}>
                <label style={{ width: "90px" }}>{den}</label>
                <input type="number" min="0" step="1"
                  value={billetesBs[den] ?? ""}
                  onChange={e => {
                    if (modo === "lectura" || procesando || cargandoDatos) return;
                    setBilletesBs(prev => ({ ...prev, [den]: e.target.value }));
                  }}
                  readOnly={modo === "lectura" || procesando || cargandoDatos}
                  style={inputP} />
                <input type="text" readOnly
                  value={formatoVE(numero(billetesBs[den]) * Number(den))}
                  style={inputEstilo} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
              <label style={{ width: "150px" }}>TOTAL:</label>
              <input type="text" value={formatoVE(totalBolivaresContados)} readOnly style={inputEstilo} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1px" }}>
              <label style={{ width: "150px" }}>DIFERENCIA:</label>
              <input type="text" value={formatoVE(diferenciaBs)} readOnly style={inputEstilo} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
              <button onClick={limpiarBilletesBs}
                disabled={modo === "lectura" || procesando || cargandoDatos}
                style={{
                  padding: "6px 12px",
                  backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
                  color: esMonasterio ? "#33231A" : "white",
                  border: "none", borderRadius: "6px",
                  cursor: modo === "lectura" ? "not-allowed" : "pointer",
                  opacity: modo === "lectura" ? 0.6 : 1
                }}>
                LIMPIAR
              </button>
            </div>
          </div>
        </div>
        {/* COMPENSACIONES ENTRE DÓLARES Y PESOS */}
        {mostrarCompensacion && (
          <div style={{
            marginTop: "10px", padding: "10px",
            backgroundColor: "#FFF3CD",
            border: "1px solid #FFEEBA",
            borderRadius: "6px", color: "#856404",
            fontWeight: "bold"
          }}>
            {compensacionActual.desdeD > 0 && (
              <div>
                Se compensaron <b>{formatoVE(compensacionActual.desdeD)}</b> USD,
                equivalentes a <b>{formatoVE(compensacionActual.desdeD * numero(cuadre.tasaP))}</b> pesos.
              </div>
            )}
            {compensacionActual.desdeP > 0 && (
              <div>
                Se compensaron <b>{formatoVE(compensacionActual.desdeP)}</b> pesos,
                equivalentes a <b>{formatoVE(compensacionActual.desdeP / (numero(cuadre.tasaP) || 1))}</b> USD.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Caja;
