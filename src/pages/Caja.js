import React, { useState, useEffect, useRef } from "react";
import { obtenerCuadre, guardarCuadre } from "../services/ser_caja";
import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Caja = () => {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState("");  
  const [fechaFormateada, setfechaFormateada] = useState("");  
  const [data, setData] = useState(null);
  const [modo, setModo] = useState("lectura");    
  // "nuevo", "lectura", "modificar"
  const formularioRef = useRef(null);  
  const [billetes, setBilletes] = useState({ D: {}, P: {}, Bs: {} });
  const [totalesContados, setTotalesContados] = useState({ D: 0, P: 0, Bs: 0 });
  const [billetesP, setBilletesP] = useState({});
  const [billetesD, setBilletesD] = useState({});
  const [billetesBs, setBilletesBs] = useState({});
  const [denominaciones, setDenominaciones] = useState({});
  const [idCuadre, setIdCuadre] = useState(null);

  // DIFERENCIAS ORIGINALES
    const [diferenciaBs, setDiferenciaBs] = useState(0);
    const [diferenciaD, setDiferenciaD] = useState(0);
    const [diferenciaP, setDiferenciaP] = useState(0);
    // DIFERENCIAS COMPENSADAS
    const [difD, setDifD] = useState(0);
    const [difP, setDifP] = useState(0);
    // MOSTRAR O NO LA COMPENSACIÓN
    const [mostrarCompensacion, setMostrarCompensacion] = useState(false);

  const [cuadre, setCuadre] = useState({
    CajaChicaP: 0,
    VentasP: 0,
    GastosP: 0,
    totalEsperadoP: 0,
  
    CajaChicaD: 0,
    VentasD: 0,
    GastosD: 0,
    totalEsperadoD: 0,
  
    CajaChicaBs: 0,
    VentasBs: 0,
    GastosBs: 0,
    totalEsperadoBs: 0
  });

    const [pesos, setPesos] = useState({
    cajaChica: "",
    ventas: "",
    gastos: "",
    b100k: "",
    b50k: "",
    b20k: "",
    b10k: "",
    b5k: "",
    b2k: "",
    b1k: "",
    b500: "",
    b200: "",
    b100: ""
    });
  
  const estiloBoton = {
    width: "25%",
    padding: "1px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    height:"40px",
    marginTop: "10px"
  };

  const botonGuardar = {
    width: "30%",
    display:"flex",
    height:"40px",
    padding: "6px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px",
    justifyContent:"center",
    alignItems:"center",    
  };

  const botonP = {
    width: "20%",
    display:"flex",
    height:"30px",
    padding: "6px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "0px",
    justifyContent:"center",
    alignItems:"center",
  };

  // Campos editables → fondo blanco
  const inputEstilo = {
    width: "40%",
    padding: "5px",
    marginBottom: "0px",
    paddingTop: "1px",
    paddingBottom: "1px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  const inputP = {
    width: "10%",
    padding: "5px",
    paddingTop: "1px",
    paddingBottom: "1px",
    marginBottom: "1px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    fontFamily: "Arial",
    fontSize: "14px",
    gap:"10ps"    
  };

  const iconoEditar = {
    fontSize: "22px",
    cursor: "pointer",
    marginRight: "10px"
  };

  const iconoEliminar = {
    fontSize: "22px",
    cursor: "pointer",
    color: "#B84A4A"
  };

  const formatoVE = (valor) => {
    return Number(valor).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    };    

  const verificarFecha = async () => {
    if (!fecha) {
        alert("Debe seleccionar una fecha");
        return;
    }
    const fechaFormateada = new Date(fecha).toISOString().split("T")[0];
    registrarAccion("Consultó datos del Cuadre de Caja del día");
    const res = await fetch(`${API_URL}/api/caja/${fechaFormateada}`);
    const data = await res.json();
    const existe = data.existe === true;
    // NO EXISTE → CREAR
    if (!existe) {
        alert("No existe un cuadre para esta fecha. Se creará uno nuevo.");
        setModo("crear");
        // cargar datos del día
        cargarDatosDelDia(fechaFormateada);
        // billetes vacíos
        setBilletesP({});
        setBilletesD({});
        setBilletesBs({});
        return;
    }
    // EXISTE → PREGUNTAR
    const confirmar = window.confirm(
    "Ya existe un cuadre para esta fecha.\n¿Desea modificarlo?"
    );
    // NO MODIFICAR → LECTURA
    if (!confirmar) {
  setModo("lectura");

  const c = data.cuadre;

  // Cargar caja, ventas, gastos, esperado
  setCuadre({
    CajaChicaP: c.cajaChica.P,
    CajaChicaD: c.cajaChica.D,
    CajaChicaBs: c.cajaChica.Bs,

    VentasP: c.ventas.P,
    VentasD: c.ventas.D,
    VentasBs: c.ventas.Bs,

    GastosP: c.gastos.P,
    GastosD: c.gastos.D,
    GastosBs: c.gastos.Bs,

    totalEsperadoP: c.esperado.P,
    totalEsperadoD: c.esperado.D,
    totalEsperadoBs: c.esperado.Bs,
    tasaP: c.tasaP,
    tasaD: c.tasaD
  });

  // ⭐ DIFERENCIAS GUARDADAS
  setDiferenciaP(c.diferencia.P);
  setDiferenciaD(c.diferencia.D);
  setDiferenciaBs(c.diferencia.Bs);

  // ⭐ COMPENSACIÓN GUARDADA
  setDifP(c.compensacion.P);
  setDifD(c.compensacion.D);

  // ⭐ Mostrar compensación si existe
  setMostrarCompensacion(
    c.compensacion.P !== 0 || c.compensacion.D !== 0
  );

  // Billetes guardados
  setBilletesP(c.billetes.P || {});
  setBilletesD(c.billetes.D || {});
  setBilletesBs(c.billetes.Bs || {});

  return;
}
    // SÍ MODIFICAR
    setModo("modificar");
    const c = data.cuadre;
    setIdCuadre(c._id);
    setCuadre(c)
    setBilletesP(c.billetes.P || {});
    setBilletesD(c.billetes.D || {});
    setBilletesBs(c.billetes.Bs || {});
    // recalcular ventas/gastos/caja chica
    cargarDatosDelDia(fechaFormateada);
    };  

  const cargarDatosDelDia = async (fechaFormateada) => {
  try {
    if (modo === "lectura") {
      console.log("Modo lectura: no se recalculan ventas ni gastos.");
      return;
    }

    console.log("Cargando datos del día…", fechaFormateada);

    // 1. Caja chica y tasas
    await cargarCajaChica(fechaFormateada);

    // 2. Ventas
    await cargarVentas(fechaFormateada);

    // 3. Gastos
    await cargarGastos(fechaFormateada);

  } catch (error) {
    console.error("ERROR EN FRONTEND:", error);
    alert("Error consultando datos del día.");
  }
};

  const cargarCajaChica = async (fechaFormateada) => {
  try {
    // 1. Si estamos en modo lectura → NO tocar nada
    if (modo === "lectura") {
      console.log("Modo lectura: no se carga caja chica.");
      return;
    }
    const res = await fetch(`${API_URL}/api/tasas/por-fecha/${fechaFormateada}`);
    const data = await res.json();
    console.log("CAJA CHICA:", data);
    if (!data || data.ok !== true) {
      console.log("DATA RECIBIDA:", data);
      alert("F: No hay caja chica registrada para esa fecha.");
      return;
    }
    const { cajachicaP, cajachicaD } = data.tasa;
    // 2. En modo crear o modificar → cargar caja chica
    setCuadre(prev => ({
      ...prev,
      CajaChicaP: cajachicaP,
      CajaChicaD: cajachicaD,
      tasaP: data.tasa.tasaP,
      tasaD: data.tasa.tasaD
    }));
    // 3. En modo crear o modificar → cargar ventas
    if (modo === "crear" || modo === "modificar") {
      cargarVentas(fechaFormateada);
    }
  } catch (error) {
    console.error("ERROR FRONTEND CAJA CHICA:", error);
    alert("F: Error consultando caja chica.");
  }
  };

  const cargarVentas = async (fechaFormateada) => {
  if (!fechaFormateada) return;
  try {
    // 1. Si estamos en modo lectura → NO recalcular nada
    if (modo === "lectura") {
      console.log("Modo lectura: no se recalculan ventas.");
      return;
    }
    const res = await fetch(`${API_URL}/api/moneda/fecha/${fechaFormateada}`);
    const data = await res.json();
    console.log("DATA VENTAS:", data);
    // 2. Validación
    if (!data || !data.ok || !data.lista || data.lista.length === 0) {
      alert("No hay ventas para esta fecha");
      setCuadre(prev => ({
        ...prev,
        VentasP: 0,
        VentasD: 0,
        VentasBs: 0
      }));
      // En crear o modificar → igual seguimos con gastos
      if (modo === "crear" || modo === "modificar") {
        cargarGastos(fechaFormateada);
      }
      return;
    }
    // 3. Calcular ventas
    const lista = data.lista;
    const VentasP = lista.reduce((acc, v) => acc + (v.efectivoP || 0), 0);
    const VentasD = lista.reduce((acc, v) => acc + (v.efectivoD || 0), 0);
    const VentasBs = lista.reduce((acc, v) => acc + (v.efectivoBs || 0), 0);
    // 4. En crear o modificar → actualizar ventas
    if (modo === "crear" || modo === "modificar") {
      setCuadre(prev => ({
        ...prev,
        VentasP,
        VentasD,
        VentasBs
      }));
      // 5. En crear o modificar → cargar gastos
      cargarGastos(fechaFormateada);
    }
  } catch (error) {
    console.error("ERROR FRONTEND VENTAS:", error);
  }
  };

  const cargarGastos = async (fechaFormateada) => {
  if (!fechaFormateada) return;
  try {
    // 1. Si estamos en modo lectura → NO recalcular nada
    if (modo === "lectura") {
      console.log("Modo lectura: no se recalculan gastos.");
      return;
    }
    const res = await fetch(`${API_URL}/api/gastos/`);
    const data = await res.json();
    if (!data || !data.ok || !data.lista) {
      alert("No se pudieron obtener los gastos");
      return;
    }
    const lista = data.lista;
    // 2. Filtrar por fecha (ISODate → YYYY-MM-DD)
    const gastosDelDia = lista.filter(g => {
      const f = g.fecha.slice(0, 10);
      return f === fechaFormateada;
    });
    // 3. Solo caja chica
    const gastosCajaChica = gastosDelDia.filter(g => g.cajaChica === true);
    // 4. Sumar por moneda
    const GastosP = gastosCajaChica
      .filter(g => g.moneda === "P")
      .reduce((acc, g) => acc + (g.monto || 0), 0);
    const GastosD = gastosCajaChica
      .filter(g => g.moneda === "D")
      .reduce((acc, g) => acc + (g.monto || 0), 0);
    const GastosBs = gastosCajaChica
      .filter(g => g.moneda === "Bs")
      .reduce((acc, g) => acc + (g.monto || 0), 0);
    if (gastosCajaChica.length === 0) {
      alert("No hay gastos de caja chica para esta fecha");
    }
    // 5. En modo crear o modificar → actualizar gastos
    if (modo === "crear" || modo === "modificar") {
      setCuadre(prev => ({
        ...prev,
        GastosP,
        GastosD,
        GastosBs,
        listaGastos: gastosCajaChica
      }));
    }
  } catch (error) {
    console.error("ERROR FRONTEND GASTOS:", error);
  }
  };

    useEffect(() => {
  if (modo === "lectura") return;
  const totalEsperadoP = (cuadre.CajaChicaP || 0) + (cuadre.VentasP || 0) - (cuadre.GastosP || 0);
  setCuadre(prev => ({ ...prev, totalEsperadoP }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cuadre.CajaChicaP, cuadre.VentasP, cuadre.GastosP]);

useEffect(() => {
  if (modo === "lectura") return;
  const totalEsperadoD = (cuadre.CajaChicaD || 0) + (cuadre.VentasD || 0) - (cuadre.GastosD || 0);
  setCuadre(prev => ({ ...prev, totalEsperadoD }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cuadre.CajaChicaD, cuadre.VentasD, cuadre.GastosD]);

useEffect(() => {
  if (modo === "lectura") return;
  const totalEsperadoBs = (cuadre.CajaChicaBs || 0) + (cuadre.VentasBs || 0) - (cuadre.GastosBs || 0);
  setCuadre(prev => ({ ...prev, totalEsperadoBs }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cuadre.CajaChicaBs, cuadre.VentasBs, cuadre.GastosBs]);


    useEffect(() => {
  if (modo === "modificar") {
    cargarVentas(fecha);
    cargarGastos(fecha);
    cargarCajaChica(fecha);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [modo]);



    const handleBillete = (moneda, valor, cantidad) => {
        if (modo === "lectura") return; // ← clave
        const nuevo = { ...billetes };
        nuevo[moneda][valor] = Number(cantidad);
        setBilletes(nuevo);
        // Recalcular total contado
        const total = Object.entries(nuevo[moneda]).reduce(
        (s, [den, cant]) => s + Number(den) * cant,
        0
        );
        setTotalesContados({
        ...totalesContados,
        [moneda]: total
        });
    };

  const handlePesos = (campo, valor) => {
    setPesos(prev => ({
        ...prev,
        [campo]: valor
      }));
    };

    // eslint-disable-next-line no-useless-computed-key
const totalPesosContados =
  (billetesP["100000"] || 0) * 100000 +
  (billetesP["50000"]  || 0) * 50000 +
  (billetesP["20000"]  || 0) * 20000 +
  (billetesP["10000"]  || 0) * 10000 +
  (billetesP["5000"]   || 0) * 5000 +
  (billetesP["2000"]   || 0) * 2000 +
  (billetesP["1000"]   || 0) * 1000 +
  (billetesP["500"]    || 0) * 500 +
  (billetesP["200"]    || 0) * 200 +
  (billetesP["100"]    || 0) * 100;

// eslint-disable-next-line no-useless-computed-key
const totalDolaresContados =
  (billetesD["100"] || 0) * 100 +
  (billetesD["50"]  || 0) * 50 +
  (billetesD["20"]  || 0) * 20 +
  (billetesD["10"]  || 0) * 10 +
  (billetesD["5"]   || 0) * 5 +
  (billetesD["1"]   || 0) * 1;

// eslint-disable-next-line no-useless-computed-key
const totalBolivaresContados =
  (billetesBs["100"] || 0) * 100 +
  (billetesBs["50"]  || 0) * 50 +
  (billetesBs["20"]  || 0) * 20 +
  (billetesBs["10"]  || 0) * 10 +
  (billetesBs["5"]   || 0) * 5 +
  (billetesBs["1"]   || 0) * 1;


    const limpiarBilletesP = () => {
    // eslint-disable-next-line no-useless-computed-key
    setBilletesP({
    "100000": "",
    "50000": "",
    "20000": "",
    "10000": "",
    "5000": "",
    "2000": "",
    "1000": "",
    "500": "",
    "200": "",
    "100": ""
    })};

    const limpiarBilletesD = () => {
    // eslint-disable-next-line no-useless-computed-key
    setBilletesD({
    "100": "",
    "50": "",
    "20": "",
    "10": "",
    "5": "",
    "1": ""
    })};

    const limpiarBilletesBs = () => {
    setBilletesBs({
    "100": "",
    "50": "",
    "20": "",
    "10": "",
    "5": "",
    "1": ""
    })};

    const guardarCaja = async () => {
        if (!fecha) {
            alert("Debe seleccionar una fecha antes de guardar");
            return;
        }                
        // DIFERENCIAS ORIGINALES
        const diferenciaBs = totalBolivaresContados - cuadre.totalEsperadoBs;
        const diferenciaD  = totalDolaresContados   - cuadre.totalEsperadoD;
        const diferenciaP  = totalPesosContados     - cuadre.totalEsperadoP;

        // COPIAS PARA COMPENSACIÓN
        let difD = diferenciaD;
        let difP = diferenciaP;

        // COMPENSACIÓN AUTOMÁTICA
        let compensacionDesdeD = 0;
        let compensacionDesdeP = 0;

        // Si sobran dólares → convertir a pesos
        if (diferenciaD > 0 && cuadre.tasaP) {
            compensacionDesdeD = diferenciaD * cuadre.tasaP;
        }

        // Si sobran pesos → convertir a dólares
        if (diferenciaP > 0 && cuadre.tasaP) {
            compensacionDesdeP = diferenciaP / cuadre.tasaP;
        }

        // AHORA sí aplicas la compensación a las diferencias
        difP += compensacionDesdeD;
        difD += compensacionDesdeP;
    
        const payload = {
            fecha: fecha,
            cajaChica: {
            D: cuadre.CajaChicaD,
            P: cuadre.CajaChicaP,
            Bs: cuadre.CajaChicaBs
            },
            ventas: {
            D: cuadre.VentasD,
            P: cuadre.VentasP,
            Bs: cuadre.VentasBs
            },
            gastos: {
            D: cuadre.GastosD,
            P: cuadre.GastosP,
            Bs: cuadre.GastosBs
            },
            esperado: {
            D: cuadre.totalEsperadoD,
            P: cuadre.totalEsperadoP,
            Bs: cuadre.totalEsperadoBs
            },
            contado: {
            D: totalDolaresContados,
            P: totalPesosContados,
            Bs: totalBolivaresContados
            },
            diferencia: {
            D: diferenciaD,
            P: diferenciaP,
            Bs: diferenciaBs
            },
            billetes: {
            D: billetesD,
            P: billetesP,
            Bs: billetesBs
            },
            compensacion: {
            D: compensacionDesdeD,
            P: compensacionDesdeP
            }
        };

    try {
        const res = await guardarCuadre(payload);
        if (res.ok) {
          alert("Cuadre guardado correctamente");
          registrarAccion("Guardó el Cierre de Caja del día");
          setModo("lectura");
        } else {
          alert("Error guardando el cuadre");
        }
    } catch (error) {
        console.error("ERROR GUARDANDO CAJA:", error);
        alert("Error guardando el cuadre");
    }
  };
  
  const actualizarCaja = async () => {
  if (modo !== "modificar") return;
  try {
    const fechaFormateada = new Date(fecha).toISOString().split("T")[0];
    const payload = {
        _id: idCuadre,
      fecha: fechaFormateada,
      cajaChica: {
        P: cuadre.CajaChicaP,
        D: cuadre.CajaChicaD,
        Bs: cuadre.CajaChicaBs
      },
      ventas: {
        P: cuadre.VentasP,
        D: cuadre.VentasD,
        Bs: cuadre.VentasBs
      },
      gastos: {
        P: cuadre.GastosP,
        D: cuadre.GastosD,
        Bs: cuadre.GastosBs
      },
      esperado: {
        P: cuadre.totalEsperadoP,
        D: cuadre.totalEsperadoD,
        Bs: cuadre.totalEsperadoBs
      },
      contado: {
        P: totalPesosContados,
        D: totalDolaresContados,
        Bs: totalBolivaresContados
      },
      diferencia: {
        P: diferenciaP,
        D: diferenciaD,
        Bs: diferenciaBs
      },
      billetes: {
        P: billetesP,
        D: billetesD,
        Bs: billetesBs
      },
      compensacion: {
        D: difD,
        P: difP
      }
    };
    const res = await fetch(`${API_URL}/api/caja`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
        alert("Error actualizando el cuadre");
        return;
        }
        alert("Cuadre actualizado correctamente");
        setModo("lectura"); // ← vuelve a modo lectura después de actualizar
    } catch (error) {
        console.error("ERROR ACTUALIZANDO CAJA:", error);
        alert("Error actualizando el cuadre");
    }
  };

  useEffect(() => {
  if (modo === "lectura") return;

  // DIFERENCIAS ORIGINALES
  const diferenciaBs = totalBolivaresContados - (cuadre.totalEsperadoBs || 0);
  const diferenciaD  = totalDolaresContados   - (cuadre.totalEsperadoD || 0);
  const diferenciaP  = totalPesosContados     - (cuadre.totalEsperadoP || 0);

  // COPIAS PARA COMPENSACIÓN
  let difD = diferenciaD;
  let difP = diferenciaP;

  // Si sobran dólares → convertir a pesos
  if (difD > 0 && cuadre.tasaP) {
    difP += difD * cuadre.tasaP;
  }

  // Si sobran pesos → convertir a dólares
  if (difP > 0 && cuadre.tasaP) {
    difD += difP / cuadre.tasaP;
  }

  const mostrarCompensacion = difD !== 0 || difP !== 0;

  setDiferenciaBs(diferenciaBs);
  setDiferenciaD(diferenciaD);
  setDiferenciaP(diferenciaP);
  setDifD(difD);
  setDifP(difP);
  setMostrarCompensacion(mostrarCompensacion);

}, [
  cuadre,                     // ⭐ ESTA ES LA CLAVE
  totalBolivaresContados,
  totalDolaresContados,
  totalPesosContados,
  modo
]);

  return (
    <div>
      <Encabezado />
      <div style={{ padding: "10px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>
          Cuadre de Caja Diario
        </h2>
        {/* FORMULARIO */}
        <div 
            ref={formularioRef}
            style={{ width: "550px", margin: "0 auto 20px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "white" }}>            
            {/* FECHA */}
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <label>Fecha</label>
                <input
                    type="date"
                    value={fecha}                    
                    onChange={(e) => setFecha(e.target.value)}
                    style={inputEstilo}
                />                
                <button style={botonP} onClick={verificarFecha}>Consultar</button>
                <button
                    style={botonP}
                    onClick={modo === "modificar" ? actualizarCaja : guardarCaja}
                    disabled={modo === "lectura"}
                    className="btn-guardar"
                >
                    {modo === "modificar" ? "Actualizar" : "Guardar"}
                </button>
                <button onClick={() => navigate("/menu")} style={botonP}>
                    MENÚ
                </button>
            </div>            
    </div>

  <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "10px" }}>
  {/* ============================
      PESOS
  ============================ */}
  <div style={{ flex: 1, background: "#f2f2f2", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
    <h3 style={{ textAlign: "center" }}>EFECTIVO - PESOS</h3>

    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "150px" }}>Caja Chica:</label>        
        <input type="text" value={formatoVE(cuadre.CajaChicaP || 0)} readOnly style={inputEstilo} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "150px" }}>Ventas en efectivo:</label>        
        <input type="text" value={formatoVE(cuadre.VentasP || 0)} readOnly style={inputEstilo} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
        <label style={{ width: "150px" }}>Gastos de Caja Chica:</label>        
        <input type="text" value={formatoVE(cuadre.GastosP || 0)} readOnly style={inputEstilo} />
    </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
        <label style={{ width: "150px" }}>TOTAL EN CAJA:</label>        
        <input type="string" value={formatoVE(cuadre.totalEsperadoP)} readOnly style={inputEstilo} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>100.000</label>
        <input
            type="number"
            value={billetesP["100000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["100000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["100000"] || 0) * 100000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>50.000</label>
        <input
            type="number"
            value={billetesP["50000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["50000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["50000"] || 0) * 50000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>20.000</label>
        <input
            type="number"
            value={billetesP["20000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["20000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["20000"] || 0) * 20000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>10.000</label>
        <input
            type="number"
            value={billetesP["10000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["10000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["10000"] || 0) * 10000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>5.000</label>
        <input
            type="number"
            value={billetesP["5000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["5000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["5000"] || 0) * 5000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>2.000</label>
        <input
            type="number"
            value={billetesP["2000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["2000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["2000"] || 0) * 2000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>1.000</label>
        <input
            type="number"
            value={billetesP["1000"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["1000"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["1000"] || 0) * 1000)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>500</label>
        <input
            type="number"
            value={billetesP["500"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["500"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["500"] || 0) * 500)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "90px" }}>200</label>
        <input
            type="number"
            value={billetesP["200"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["200"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["200"] || 0) * 200)}
            style={inputEstilo}
        />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
        <label style={{ width: "90px" }}>100</label>
        <input
            type="number"
            value={billetesP["100"] || ""}
            onChange={(e) =>
            modo !== "lectura" &&
            // eslint-disable-next-line no-useless-computed-key
            setBilletesP({ ...billetesP, ["100"]: e.target.value })
            }
            readOnly={modo === "lectura"}
            style={inputP}
        />
        <input
            type="text"
            readOnly
            value={formatoVE((billetesP["100"] || 0) * 100)}
            style={inputEstilo}
        />
    </div> 
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "150px" }}>TOTAL:</label>        
        <input type="string" value={formatoVE(totalPesosContados)} readOnly style={inputEstilo} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1px" }}>
        <label style={{ width: "150px" }}>DIFERENCIA:</label>        
        <input type="string" value={formatoVE(diferenciaP)} readOnly style={inputEstilo} />
    </div>
    {/* BOTÓN LIMPIAR */}
    <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <button
            onClick={limpiarBilletesP}
            disabled={modo === "lectura"}
            style={{
                padding: "6px 12px",
                backgroundColor: "#6699FF",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: modo === "lectura" ? "not-allowed" : "pointer",
                opacity: modo === "lectura" ? 0.6 : 1
            }}
        >
            LIMPIAR
        </button>
    </div>
  </div>

  {/* ============================
    DÓLARES
  ============================ */}
    <div style={{ flex: 1, background: "#f2f2f2", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
        <h3 style={{ textAlign: "center" }}>EFECTIVO - DÓLARES</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
          <label style={{ width: "150px" }}>Caja Chica:</label>        
          <input type="text" value={formatoVE(cuadre.CajaChicaD || 0)} readOnly style={inputEstilo} />
        </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
        <label style={{ width: "150px" }}>Ventas en efectivo:</label>        
        <input type="text" value={formatoVE(cuadre.VentasD || 0)} readOnly style={inputEstilo} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
        <label style={{ width: "150px" }}>Gastos de Caja Chica:</label>        
        <input type="text" value={formatoVE(cuadre.GastosD || 0)} readOnly style={inputEstilo} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
        <label style={{ width: "150px" }}>TOTAL EN CAJA:</label>        
        <input type="text" value={formatoVE(cuadre.totalEsperadoD)} readOnly style={inputEstilo} />
    </div>
  {/* ============================
      BILLETES USD
  ============================ */}
  {/* 100 */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>100</label>
      <input
          type="number"
          value={billetesD["100"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesD({ ...billetesD, ["100"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesD["100"] || 0) * 100)}
          style={inputEstilo}
      />
  </div>
  {/* 50 */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>50</label>
      <input
          type="number"
          value={billetesD["50"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesD({ ...billetesD, ["50"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesD["50"] || 0) * 50)}
          style={inputEstilo}
      />
  </div>
  {/* 20 */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>20</label>
      <input
          type="number"
          value={billetesD["20"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesD({ ...billetesD, ["20"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesD["20"] || 0) * 20)}
          style={inputEstilo}
      />
  </div>
  {/* 10 */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>10</label>
      <input
          type="number"
          value={billetesD["10"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesD({ ...billetesD, ["10"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesD["10"] || 0) * 10)}
          style={inputEstilo}
      />
  </div>
  {/* 5 */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>5</label>
      <input
          type="number"
          value={billetesD["5"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesD({ ...billetesD, ["5"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesD["5"] || 0) * 5)}
          style={inputEstilo}
      />
  </div>
  {/* 1 */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
      <label style={{ width: "90px" }}>1</label>
      <input
          type="number"
          value={billetesD["1"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesD({ ...billetesD, ["1"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesD["1"] || 0) * 1)}
          style={inputEstilo}
      />
  </div>
  {/* TOTAL */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "150px" }}>TOTAL:</label>        
      <input type="text" value={formatoVE(totalDolaresContados)} readOnly style={inputEstilo} />
  </div>
  {/* DIFERENCIA */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1px" }}>
      <label style={{ width: "150px" }}>DIFERENCIA:</label>        
      <input type="text" value={formatoVE(diferenciaD)} readOnly style={inputEstilo} />
  </div>
  {/* BOTÓN LIMPIAR */}
  <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
      <button
          onClick={limpiarBilletesD}
          disabled={modo === "lectura"}
          style={{
              padding: "6px 12px",
              backgroundColor: "#6699FF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: modo === "lectura" ? "not-allowed" : "pointer",
              opacity: modo === "lectura" ? 0.6 : 1
          }}
      >
          LIMPIAR
      </button>
  </div>
</div>


  {/* ============================
    BOLÍVARES
============================ */}
<div style={{ flex: 1, background: "#f2f2f2", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
  <h3 style={{ textAlign: "center" }}>EFECTIVO - BOLÍVARES</h3>

  {/* CAJA CHICA */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "150px" }}>Caja Chica:</label>        
      <input type="text" value={formatoVE(cuadre.CajaChicaBs || 0)} readOnly style={inputEstilo} />
  </div>

  {/* VENTAS */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "150px" }}>Ventas en efectivo:</label>        
      <input type="text" value={formatoVE(cuadre.VentasBs || 0)} readOnly style={inputEstilo} />
  </div>

  {/* GASTOS */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
      <label style={{ width: "150px" }}>Gastos de Caja Chica:</label>        
      <input type="text" value={formatoVE(cuadre.GastosBs || 0)} readOnly style={inputEstilo} />
  </div>

  {/* TOTAL ESPERADO */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
      <label style={{ width: "150px" }}>TOTAL EN CAJA:</label>        
      <input type="text" value={formatoVE(cuadre.totalEsperadoBs)} readOnly style={inputEstilo} />
  </div>

  {/* ============================
      BILLETES Bs.
  ============================ */}

  {/* 100 Bs */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>100</label>
      <input
          type="number"
          value={billetesBs["100"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesBs({ ...billetesBs, ["100"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesBs["100"] || 0) * 100)}
          style={inputEstilo}
      />
  </div>

  {/* 50 Bs */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>50</label>
      <input
          type="number"
          value={billetesBs["50"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesBs({ ...billetesBs, ["50"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesBs["50"] || 0) * 50)}
          style={inputEstilo}
      />
  </div>

  {/* 20 Bs */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>20</label>
      <input
          type="number"
          value={billetesBs["20"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesBs({ ...billetesBs, ["20"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesBs["20"] || 0) * 20)}
          style={inputEstilo}
      />
  </div>

  {/* 10 Bs */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>10</label>
      <input
          type="number"
          value={billetesBs["10"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesBs({ ...billetesBs, ["10"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesBs["10"] || 0) * 10)}
          style={inputEstilo}
      />
  </div>

  {/* 5 Bs */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "90px" }}>5</label>
      <input
          type="number"
          value={billetesBs["5"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesBs({ ...billetesBs, ["5"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesBs["5"] || 0) * 5)}
          style={inputEstilo}
      />
  </div>

  {/* 1 Bs */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "26px" }}>
      <label style={{ width: "90px" }}>1</label>
      <input
          type="number"
          value={billetesBs["1"] || ""}
          onChange={(e) =>
          modo !== "lectura" &&
          // eslint-disable-next-line no-useless-computed-key
          setBilletesBs({ ...billetesBs, ["1"]: e.target.value })
          }
          readOnly={modo === "lectura"}
          style={inputP}
      />
      <input
          type="text"
          readOnly
          value={formatoVE((billetesBs["1"] || 0) * 1)}
          style={inputEstilo}
      />
  </div>

  {/* TOTAL */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
      <label style={{ width: "150px" }}>TOTAL:</label>        
      <input type="text" value={formatoVE(totalBolivaresContados)} readOnly style={inputEstilo} />
  </div>

  {/* DIFERENCIA */}
  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1px" }}>
      <label style={{ width: "150px" }}>DIFERENCIA:</label>        
      <input type="text" value={formatoVE(diferenciaBs)} readOnly style={inputEstilo} />
  </div>

  {/* BOTÓN LIMPIAR */}
  <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
      <button
          onClick={limpiarBilletesBs}
          disabled={modo === "lectura"}
          style={{
              padding: "6px 12px",
              backgroundColor: "#6699FF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: modo === "lectura" ? "not-allowed" : "pointer",
              opacity: modo === "lectura" ? 0.6 : 1
          }}
      >
          LIMPIAR
      </button>
  </div>
</div>
</div>
    {mostrarCompensacion && (
    <div style={{
        marginTop: "10px",
        padding: "10px",
        backgroundColor: "#FFF3CD",
        border: "1px solid #FFEEBA",
        borderRadius: "6px",
        color: "#856404",
        fontWeight: "bold"
        }}>
        {difD > 0 && (
        <div>
            Se compensaron <b>{formatoVE(diferenciaD)}</b> USD → 
            equivalente a <b>{formatoVE(diferenciaP)}</b> pesos.
        </div>
        )}
        {difP > 0 && (
        <div>
            Se compensaron <b>{formatoVE(diferenciaP)}</b> pesos → 
            equivalente a <b>{formatoVE(diferenciaD)}</b> USD.
        </div>
        )}
    </div>
    )}
</div>
</div>      
  );
};

export default Caja;
