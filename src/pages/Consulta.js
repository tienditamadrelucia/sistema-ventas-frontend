import React, { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {buscarVueltoPorFactura, buscarPagoPorFactura, eliminarMoneda} from "../services/ser_moneda"
import { registrarAccion } from "../utils/registrarAccion";
import { obtenerVentaPorFactura, obtenerProductosVendidos } from "../services/ser_ventas";
import { obtenerAbonosPorFactura } from "../services/ser_moneda";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta
import Pago from "../components/Pago/Pago";

const Consulta = () => {
  const navigate = useNavigate();
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";
  const colorPrincipal = esMonasterio ? "#5A2D16" : "#FC9E9B";
  const colorAccion = esMonasterio ? "#B8862D" : "#84B09C";
  const colorTabla = esMonasterio ? "#E8D1A5" : "#F9CEAE";
  const colorSuave = esMonasterio ? "#F5EBDD" : "#EDC5CD";

    // -----------------------------
    // ESTADOS PRINCIPALES USESTATE
    // -----------------------------    
    const [numeroFactura, setNumeroFactura] = useState(0);
    const [hora, setHora] = useState("");    
    const [modoCredito, setModoCredito] = useState(false);
    const [listaFactura, setListaFactura] = useState([]);
    const [iva, setIva] = useState(0);
    const [subtotalDolar, setSubtotalDolar] = useState(0);
    const [totalDolar, setTotalDolar] = useState(0);
    const [totalPeso, setTotalPeso] = useState(0);    
    const [subtotal, setSubtotal] = useState(0);
    const [IVA, setIVA] = useState(0);
    const [total, setTotal] = useState(0);    
    const [pagoData, setPagoData] = useState(null);
    const [idPagoExistente, setIdPagoExistente] = useState(null);
    const [idVueltoExistente, setIdVueltoExistente] = useState(null);
    const [reservaId, setReservaId] = useState(null);    
    const [venta, setVenta] = useState(null); // fecha, hora, usuario, etc.
    const [cliente, setCliente] = useState(null); // nombre + identificación
    const [detalle, setDetalle] = useState(null);
    const  [efectivoP, setEfectivoP] = useState("");
    const  [transferenciaP, setTransferenciaP] = useState("");
    const  [referenciaP, setReferenciaP] = useState("");
    const  [bancoP, setBancoP] = useState("");
    const  [efectivoBs, setEfectivoBs] = useState("");
    const  [transferenciaBs, setTransferenciaBs] = useState("");
    const  [referenciaTBS, setReferenciaTBs] = useState("");
    const  [bancoTBS, setBancoTBs] = useState("");
    const  [puntoBs, setPuntoBs] = useState("");
    const  [refPunto, setRefPunto] = useState("");
    const  [lotePunto, setLotePunto] = useState("");
    const  [efectivoD, setEfectivoD] = useState("");
    const  [zelleD, setZelleD] = useState("");
    const  [referenciaZ, setReferenciaZ] = useState("");
    const  [bancoZ, setBancoZ] = useState("");
    const  [MostrarModalPago, setMostrarModalPago]= useState(false);
    const  [pagosMoneda, setPagosMoneda]= useState([]);
    const [mostrarModalTasas, setMostrarModalTasas] = useState(false);
    const [tasaDolar, setTasaDolar] = useState(0);
    const [tasaPeso, setTasaPeso] = useState(0);
    // CREDITO
    // Para detectar si la factura es crédito
    const [esCredito, setEsCredito] = useState(false);

    // Totales pagados en cada moneda
    const [totalUSD, setTotalUSD] = useState(0);
    const [totalBs, setTotalBs] = useState(0);
    const [totalP, setTotalP] = useState(0);

    // Lo que resta por pagar en cada moneda
    const [restaUSD, setRestaUSD] = useState(0);
    const [restaBs, setRestaBs] = useState(0);
    const [restaP, setRestaP] = useState(0);

    /// PARA EL MODAL PAGO
    const [mostrarPago, setMostrarPago] = useState(false);
    const [pagoExistente, setPagoExistente] = useState(null);
    const [vueltoExistente, setVueltoExistente] = useState(null);
    const [fechaAbono, setFechaAbono] = useState("");
    
    const [Abono, setAbono] = useState(0);
    const [Saldo, setSaldo] = useState(0);
    const [totalBsPagado, setTotalBsPagado] = useState(0);
    const [totalPPagado, setTotalPPagado] = useState(0);
    const hoyLocal = new Date();
    const hoyUTC = new Date(Date.UTC(
        hoyLocal.getFullYear(),
        hoyLocal.getMonth(),
        hoyLocal.getDate(),
        0, 0, 0
        ));
    const hoy = hoyUTC.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const [fecha, setFecha] = useState(hoyUTC.toISOString().slice(0, 10));    
    const [procesando, setProcesando] = useState(false);
    const [mostrarFechaAbono, setMostrarFechaAbono] = useState(false);    


    const API = `${API_URL}/api`;

    const estiloBotonVolver = {
        display:"flex",
        width: "15%",
        padding: "15px",
        backgroundColor: colorPrincipal,
        color: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontWeight: "800",
        fontFamily: "Arial Black",        
        marginTop: "1px",
        justifyContent: "center",
        alignItems:"center",
        cursor:"pointer",
        height:"20px"
    };
    const estiloBoton = {
        display:"flex",
        width: "15%",
        padding: "15px",
        backgroundColor: "colorTabla",
        color: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontWeight: "800",
        fontFamily: "Arial Black",        
        marginTop: "1px",
        justifyContent: "center",
        alignItems:"center",
        cursor:"pointer",
        height:"20px"
    };
    const estiloBotonEliminar = {
        display:"flex",
        width: "15%",
        padding: "15px",
        backgroundColor: "#84868a",
        color: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontWeight: "800",
        fontFamily: "Arial Black",        
        marginTop: "1px",
        justifyContent: "center",
        alignItems:"center",
        cursor:"pointer",
        height:"20px"
    };
    
    const estiloBotonGuardar = {
        display:"flex",
        width: "20%",
        padding: "15px",
        backgroundColor: colorAccion,
        color: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontWeight: "800",
        fontFamily: "Arial Black",        
        marginTop: "1px",
        justifyContent: "center",
        alignItems:"center",
        cursor:"pointer",
        height:"20px"
    };
    const botonVarios = {
      width: "30%",
      display:"flex",
      height:"40px",
      padding: "6px",
      backgroundColor: colorAccion,
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontFamily: "Arial Black",
      cursor: "pointer",
      marginTop: "8px",
      justifyContent:"center",
      alignItems:"center",
      opacity:procesando ? 0.6 :1,
      cursor: procesando ? "not-allowed":"pointer"    
    };

    // -----------------------------
    // USEEFFECT para cargar tasas, clientes, categorías y productos
    // -----------------------------
  
  const cargarTasaDeLaFactura = async (fechaFactura) => {
    try {
      //const fechaFactura = venta.fecha.substring(0, 10);
      const fecha = fechaFactura.substring(0, 10);      
      const res = await fetch(
        `${API_URL}/api/tasas/por-fecha/${fecha}?sede=${encodeURIComponent(sede)}`
      );
      const data = await res.json();
      if (data.ok) {
        setTasaDolar(data.tasa.tasaD);
        setTasaPeso(data.tasa.tasaP);                
      } else {
        alert("No hay tasas registradas para la fecha de esta factura.");
      }
    } catch (error) {
      console.error("Error cargando tasa:", error);
    }
  };  

  const cargarTasasDeHoy = async () => {
  try {
    const res = await fetch(
      `${API_URL}/api/tasas/hoy?sede=${encodeURIComponent(sede)}`
    );

    const data = await res.json();

    if (!data.ok || !data.tasa) {
      console.error("No hay tasas registradas para hoy");
      return null;
    }

    const tasaD = Number(data.tasa.tasaD);
    const tasaP = Number(data.tasa.tasaP);

    setTasaDolar(tasaD);
    setTasaPeso(tasaP);

    // Además de actualizar la pantalla,
    // devolvemos las tasas para poder usarlas inmediatamente.
    return {
      tasaD,
      tasaP
    };

  } catch (error) {
    console.error("Error cargando las tasas de hoy:", error);
    return null;
  }
};

useEffect(() => {
  if (!esCredito) return;
  if (!venta) return;
  if (!pagosMoneda || pagosMoneda.length === 0) return;
  if (!tasaDolar || !tasaPeso) return;
  calcularTotalesCredito(pagosMoneda);
}, [esCredito, venta, pagosMoneda, tasaDolar, tasaPeso]);

    const formatoVE = (valor) => {
      if (!valor) return "0,00";
        return Number(valor).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
        });
    };

    // -----------------------------
    // Funciones de búsqueda y filtros
    // -----------------------------  
    const consultarFactura = async () => {   
      setProcesando(true);       
      if (!numeroFactura) return;
      try {            
        const res = await fetch(
          `${API_URL}/api/ventas/detalle/${numeroFactura}?sede=${encodeURIComponent(sede)}`
        );
        const data = await res.json();
        if (!data.ok) {
          alert("Factura no encontrada");
          return;
        }
        // 1. Guardar datos de la venta
        setVenta(data.venta);        
        const tasasHoy = await cargarTasasDeHoy();
        // 2. Validar si es crédito
        if (data.venta.estado === "CREDITO") {
          setEsCredito(true);
          setAbono(data.venta.abono || 0);
          setSaldo(data.venta.saldo || 0);
        } else {
          setEsCredito(false);
        }        
        // 3. Buscar nombre del cliente
        const cedula = data.venta.cliente;
        const datosCliente = await obtenerDatosCliente(cedula);
        setCliente(datosCliente);
        // 4. Cargar detalle
        await cargarDetalleFactura(numeroFactura);
        // 5. Cargar pagos (incluye abonos posteriores)
        await cargarPagos(
          numeroFactura,
          data.venta.estado === "CREDITO",
          tasasHoy,
          data.venta
        );
      } catch (error) {
        console.error("Error consultando factura:", error);
        alert("Frontend dice: Error consultando factura");
      }
      setProcesando(false);
  };
    
    const obtenerDatosCliente = async (cedula) => {
      try {
        const res = await fetch(`${API_URL}/api/clientes/cedula/${cedula}`);
        if (!res.ok) {
          return {
            identificacion: cedula,
            nombreCompleto: "Cliente no encontrado"
          };
        }
        const data = await res.json();
        const cliente = data.cliente ?? data;
        return {
          identificacion: cliente.identificacion || cedula,
          nombreCompleto: cliente.nombreCompleto || "Sin nombre"
        };
    } catch (error) {
        console.error("Error buscando cliente:", error);
        return {
          identificacion: cedula,
          nombreCompleto: "Error al buscar cliente"
        };
    }
    };

  const cargarDetalleFactura = async (factura) => {
  try {
    // 1. LLAMAR LA RUTA CORRECTA
    const res = await fetch(
      `${API_URL}/api/vendidos/${factura}?sede=${encodeURIComponent(sede)}`
    );
    const data = await res.json();
    // 2. VALIDAR SI HAY DETALLE
    if (!Array.isArray(data) || data.length === 0) {
      alert("Frontend dice: No se encontró el detalle de la factura");
      return;
    }
    const vendidos = data; // ← el backend devuelve directamente un array
    const listaReconstruida = [];
    // 3. RECONSTRUIR DETALLE
    for (const item of vendidos) {
      const resProd = await fetch(`${API_URL}/api/productos/${item.productoId}`);
      const dataProd = await resProd.json();
      const producto = dataProd.producto ?? dataProd;
      listaReconstruida.push({
        codigo: producto.codigo || "",
        descripcion: producto.descripcion || "",
        cantidad: item.cantidad,
        precioActual: producto.venta,
        precioFactura: item.precio,
        descuento: item.dscto,
        total: item.total
      });
    }
    // 4. CARGAR EN LA TABLA
    setListaFactura(listaReconstruida);
  } catch (error) {
    console.error("Frontend dice: Error cargando detalle:", error);
    alert("Frontend dice: Error cargando detalle de la factura");
  }
  };

  const cargarPagos = async (
    factura,
    esCreditoFactura,
    tasasSaldo = null,
    ventaActual = null
  ) => {
  try {
    const res = await fetch(
      `${API_URL}/api/moneda/factura/${factura}?sede=${encodeURIComponent(sede)}`
    );
    const data = await res.json();
    const lista = data.lista || [];
    setPagosMoneda(lista);
    if (esCreditoFactura) {
      await calcularTotalesCredito(
        lista,
        tasasSaldo,
        ventaActual
      );
      }    
    } catch (error) {
      console.error("Error cargando pagos:", error);
      alert("Error al buscar pagos");
    }
  };

  const volverAlMenu = () => {
    window.opener.location.reload();
    window.close();
  };

  const borrarCampos = () => {  
    setNumeroFactura("");        // limpia input de factura
    setVenta(null);              // limpia totales
    setCliente(null);            // limpia datos del cliente
    setListaFactura([]);    // limpia tabla de productos
    setPagosMoneda([]);          // limpia pagos
    setEsCredito(false);
    //setDetalleFactura([]);       // si lo usas    
    alert("Campos borrados.");
  };
  
  const eliminarFactura = async () => {
    if (!numeroFactura) {
      alert("Debe ingresar un número de factura.");
      return;
    }
    const confirmar = window.confirm(
      "¿Está seguro que desea ELIMINAR la factura completa?\n" +
      "Se eliminarán: venta, productos y pagos.\n" +
      "Esta acción no se puede deshacer."
    );
    if (!confirmar) return;
    try {
      const res = await fetch(
        `${API_URL}/api/facturas/eliminar-completa/${numeroFactura}?sede=${encodeURIComponent(sede)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.ok) {
        alert("No se pudo eliminar la factura.");
        return;
      }
      // limpiar estados      
      alert("Factura eliminada correctamente.");
      borrarCampos()
    } catch (error) {
      console.error("Error eliminando factura:", error);
      alert("Hubo un error al eliminar la factura.");
    }
  };

  const obtenerTasasPorFecha = async (fechaMovimiento) => {
  try {
    const fecha = String(fechaMovimiento).substring(0, 10);

    const res = await fetch(
      `${API_URL}/api/tasas/por-fecha/${fecha}?sede=${encodeURIComponent(sede)}`
    );

    const data = await res.json();

    if (!data.ok || !data.tasa) {
      console.error(`No hay tasas registradas para ${fecha}`);
      return null;
    }

    const tasaD = Number(data.tasa.tasaD);
    const tasaP = Number(data.tasa.tasaP);

    if (!tasaD || !tasaP) {
      console.error(`Tasas inválidas para ${fecha}`);
      return null;
    }

    return {
      tasaD,
      tasaP
    };

  } catch (error) {
    console.error(
      "Error obteniendo tasas para el movimiento:",
      fechaMovimiento,
      error
    );

    return null;
  }
};

  const calcularTotalesCredito = async (
    pagos,
    tasasSaldo = null,
    ventaActual = null
  ) => {
  try {
    const ventaCalculo = ventaActual || venta;
      if (!ventaCalculo || !ventaCalculo.total) {
        console.log("Venta incompleta, no se puede calcular el crédito");
        return;
      }

    let totalPagadoUSD = 0;

    let totalDolares = 0;
    let totalBolivares = 0;
    let totalPesos = 0;

    // =====================================================
    // CALCULAR CADA MOVIMIENTO CON LA TASA DE SU PROPIA FECHA
    // =====================================================
    for (const pago of pagos) {

      const usd =
        Number(pago.efectivoD || 0) +
        Number(pago.zelle || 0);

      const bs =
        Number(pago.efectivoBs || 0) +
        Number(pago.transferenciaBs || 0) +
        Number(pago.puntoBs || 0) +
        Number(pago.pagomovilBs || 0);

      const cop =
        Number(pago.efectivoP || 0) +
        Number(pago.transferenciaP || 0);

      // Guardamos también los totales físicos para mostrarlos
      totalDolares += usd;
      totalBolivares += bs;
      totalPesos += cop;

      // Los dólares no necesitan conversión
      let valorMovimientoUSD = usd;

      // Si el movimiento tiene Bs o COP necesitamos
      // las tasas correspondientes a SU fecha
      if (bs !== 0 || cop !== 0) {

        const tasas = await obtenerTasasPorFecha(pago.fecha);

        if (!tasas) {
          console.error(
            "No se pudo calcular el movimiento por falta de tasa:",
            pago
          );
          continue;
        }

        if (bs !== 0) {
          valorMovimientoUSD += bs / tasas.tasaD;
        }

        if (cop !== 0) {
          valorMovimientoUSD += cop / tasas.tasaP;
        }
      }

      // Los VUELTOS ya vienen negativos desde MongoDB,
      // por lo que automáticamente descuentan del pago.
      totalPagadoUSD += valorMovimientoUSD;
    }

    // =====================================================
    // TOTALES DE MONEDA ENTREGADA - VUELTOS
    // =====================================================

    setTotalUSD(totalDolares);
    setTotalBsPagado(totalBolivares);
    setTotalPPagado(totalPesos);

    // =====================================================
    // SALDO REAL EN DÓLARES
    // =====================================================

    const totalFacturaUSD = Number(ventaCalculo.total);

    let saldoUSD = totalFacturaUSD - totalPagadoUSD;

    // Tolerancia que ya usamos en Pago.jsx
    const TOLERANCIA_USD = 0.25;

    // Si queda una diferencia pequeña dentro de la tolerancia,
    // consideramos la factura completamente cancelada.
    if (Math.abs(saldoUSD) <= TOLERANCIA_USD) {
      saldoUSD = 0;
    }

    setRestaUSD(saldoUSD);

    // =====================================================
    // EQUIVALENCIA DEL SALDO
    //
    // tasaDolar y tasaPeso son las tasas que Consulta tenga
    // cargadas en ese momento:
    //
    // - consulta normal -> tasa de hoy
    // - registrar abono -> tasa de la fecha seleccionada
    // =====================================================

    const td = tasasSaldo
      ? Number(tasasSaldo.tasaD)
      : Number(tasaDolar);

    const tpeso = tasasSaldo
      ? Number(tasasSaldo.tasaP)
      : Number(tasaPeso);

    setRestaBs(td ? saldoUSD * td : 0);
    setRestaP(tpeso ? saldoUSD * tpeso : 0);

    // =====================================================
    // CRÉDITO TOTALMENTE CANCELADO
    // =====================================================

    if (
      saldoUSD === 0 &&
      ventaCalculo?.estado === "CREDITO"
    ) {
      alert(
        "✔ La venta ha sido cancelada en su totalidad. Se cambiará a CONTADO."
      );

      try {
        const res = await fetch(
          `${API_URL}/api/ventas/cambiar-estado/${ventaCalculo._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              estado: "CONTADO"
            })
          }
        );

        const data = await res.json();

        if (data.ok) {
          setEsCredito(false);

          // Recargar la factura actualizada
          consultarFactura(numeroFactura);
        } else {
          alert("Error cambiando estado a CONTADO");
        }

      } catch (error) {
        console.error(
          "Error cambiando estado:",
          error
        );

        alert("Error cambiando estado a CONTADO");
      }
    }

  } catch (error) {
    console.error(
      "Error calculando totales del crédito:",
      error
    );
  }
};

  const abonoCredito = () => {
  // Fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().substring(0, 10);
  // Prompt con la fecha por defecto
  const fechaIngresada = prompt("Ingrese la fecha del abono:", hoy);
  if (!fechaIngresada) {
    alert("Debe ingresar una fecha para continuar");
    return;
  }
  // Guardamos la fecha del abono
  setFechaAbono(fechaIngresada);
  // Activamos modo crédito y abrimos el modal
  setModoCredito(true);
  setMostrarPago(true);
};

const abrirModalPagoConFecha = async () => {

  if (!fechaAbono) {
    alert("Debe seleccionar la fecha del abono.");
    return;
  }

  try {
    // Buscar las tasas correspondientes AL DÍA DEL ABONO
    const res = await fetch(
      `${API_URL}/api/tasas/por-fecha/${fechaAbono}?sede=${encodeURIComponent(sede)}`
    );
    const data = await res.json();
    if (!data.ok || !data.tasa) {
      alert(
        `No hay tasas registradas para la fecha ${fechaAbono}.`
      );
      return;
    }
    const nuevaTasaDolar = Number(data.tasa.tasaD);
    const nuevaTasaPeso = Number(data.tasa.tasaP);
    if (!nuevaTasaDolar || !nuevaTasaPeso) {
      alert("Las tasas registradas para esta fecha no son válidas.");
      return;
    }
    setTasaDolar(nuevaTasaDolar);
    setTasaPeso(nuevaTasaPeso);
    setModoCredito(true);
    setMostrarPago(true);
  } catch (error) {
    console.error("Error cargando tasas del abono:", error);
    alert(
      "No se pudieron cargar las tasas correspondientes a la fecha del abono."
    );
  }
};

    // -----------------------------
    // Render
    // -----------------------------
    return (
  <div>
    {procesando && (
      <div style={{
        background: "#84868a",
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
    <Encabezado sede={sede} />

    <h2 style={{ textAlign: "left", marginTop: "1px", marginLeft:"400px" }}>
      CONSULTA DE VENTAS
    </h2>

    {/* CONTENEDOR PRINCIPAL */}
    <div style={{ width: "1500px", margin: "0 auto", marginLeft: "15px" }}>

      {/* CONTENEDOR HORIZONTAL */}
      <div style={{ display: "flex", gap: "5px", alignItems: "flex-start", width: "1400px" }}>

        {/* A) DATOS DE LA FACTURA */}        
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", width: "800px" }}>          
          <h3 style={{ marginTop: 1 }}>Datos de la Factura</h3>
          <div style={{ display: "flex", gap: "5px", alignItems:"center" }}>
            <label>Factura:</label>
            <input
              type="number"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              style={{ width:"60px" }}
            />

            <button onClick={() => consultarFactura(numeroFactura)} style={botonVarios}>
              Buscar
            </button>   
          
            <div style={{ display: "flex", gap: "15px", marginTop:"10px" }}>
              <label>Fecha</label>
              <input
                type="date"
                value={venta ? venta.fecha.substring(0,10) : ""}
                readOnly
                style={{ backgroundColor: "#cdced1", width:"95px" }}
              />
              <label>Hora</label>
              <input
                type="text"
                value={venta ? venta.hora : ""}
                readOnly
                style={{ backgroundColor: "#cdced1", width:"80px" }}
              />
              <label>Usuario</label>
              <input
                type="text"
                value={venta ? venta.usuario : ""}
                readOnly
                style={{ backgroundColor: "#cdced1", width:"100px" }}
              />
            </div>
          </div>        
        </div>  {/* FIN DATOS FACTURA */}

          {/* B) DATOS DEL CLIENTE */}    
          <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", width: "325px" }}>         
            <h3 style={{margintop:"0px" }}>Datos del Cliente</h3>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>                
                <input
                    type="text"
                    value={cliente ? cliente.identificacion : ""}
                    readOnly
                    style={{ backgroundColor: "#cdced1", width:"80px" }}
                  />
              
              <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>                
                <input
                    type="text"
                    value={cliente ? cliente.nombreCompleto : ""}
                    readOnly
                    style={{ backgroundColor: "#cdced1", width:"200px" }}
                />
              </div>
            </div>
          </div> {/* FIN DATOS CLIENTE */}
        </div>
      
      {/* TABLA DE PRODUCTOS */}    
      <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", width: "1200px"}}>        
        <div style={{ marginTop: "1px", width: "1180px" }}>
            <h3 style={{ marginBottom: "1px" }}>Detalle de la Factura</h3>
            {venta && (
              <h2>
                Venta #{venta.factura} — 
                {venta.estado === "CREDITO" 
                ? "Venta a CRÉDITO (pendiente de pago)" 
                : "Venta de CONTADO (pagada)"}
              </h2>
            )}
         
            <table
                style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px"
                }}
            >
            <thead>
              <tr style={{ backgroundColor: colorTabla, color: "black" }}>
                <th style={{ border: "1px solid #9b9898", padding: "5px", width:"70px", fontWeight: "50" }}>Código</th>
                <th style={{ border: "1px solid #9b9898", padding: "6px", width:"440px", fontWeight: "50" }}>Descripción</th>
                <th style={{ border: "1px solid #9b9898", padding: "6px", width:"50px", fontWeight: "80" }}>Cant</th>
                <th style={{ border: "1px solid #9b9898", padding: "6px", width:"140px", fontWeight: "80" }}>Precio Sistema</th>
                <th style={{ border: "1px solid #9b9898", padding: "6px", width:"140px", fontWeight: "80" }}>Precio Factura</th>
                <th style={{ border: "1px solid #9b9898", padding: "6px", width:"140px", fontWeight: "50" }}>Dscto</th>
                <th style={{ border: "1px solid #9b9898", padding: "6px", width:"140px", fontWeight: "50" }}>Total</th>
              </tr>
            </thead>
            <tbody>
                {listaFactura.length === 0 ? (
                <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "10px" }}>
                    No hay productos cargados
                </td>
                </tr>
                ) : (
                listaFactura.map((item, index) => (
                <tr key={index}>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.codigo}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.descripcion}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center" }}>{item.cantidad}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.precioActual.toFixed(2)}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.precioFactura.toFixed(2)}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.descuento}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.total.toFixed(2)}</td>            
                </tr>
                ))
                )}
            </tbody>
        </table>
    </div>    
</div>
{venta && (
<div style={{ textAlign: "right", marginTop: "1px", fontSize: "18px", fontWeight: "bold", marginRight:"300px"}}>
  Subtotal: ${venta.subtotal.toFixed(2)} — IVA: ${venta.IVA.toFixed(2)} — Total: ${venta.total.toFixed(2)}
</div>
)}
{pagosMoneda.length === 1 && (
  <div>  
{/* TABLA DE PAGOS */}
<div style={{ display:"flex", border: "1px solid #ccc", padding: "10px", gap: "8px", width: "1200px", marginTop: "1px", alignItems:"flex-start" }}>
    <div style={{ marginTop: "1px" }}>
        <h3 style={{ marginBottom: "1px" }}>Detalle del Pago</h3>           
            
{/* CONTENEDOR HORIZONTAL DE LAS 3 COLUMNAS */}
<div style={{ display: "flex", gap: "40px", marginTop: "10px" }}>

  {/* ===================== COLUMNA PESOS ===================== */}
  <div style={{ display: "flex", flexDirection:"column", gap:"8px" }}>
    <h4 style={{ margin: 0 }}>Pagos en Pesos</h4>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Efectivo P:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.efectivoP)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Transferencia P:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.transferenciaP)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Referencia:</label>
      <input type="text" value={pagosMoneda[0]?.referenciaP} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Banco:</label>
      <input type="text" value={pagosMoneda[0]?.bancoP} readOnly style={{ backgroundColor:"#CCC", width:"140px" }} />
    </div>
  </div>

  {/* ===================== COLUMNA BOLÍVARES ===================== */}
  <div style={{ display: "flex", flexDirection:"column", gap:"8px" }}>
    <h4 style={{ margin: 0 }}>Pagos en Bolívares</h4>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Efectivo Bs:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.efectivoBs)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Transferencia Bs:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.transferenciaBs)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Referencia:</label>
      <input type="text" value={pagosMoneda[0]?.referenciaTBs} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Banco:</label>
      <input type="text" value={pagosMoneda[0]?.bancoTBs} readOnly style={{ backgroundColor:"#CCC", width:"140px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Punto:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.puntoBs)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Ref Punto:</label>
      <input type="text" value={pagosMoneda[0]?.refPunto} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Lote:</label>
      <input type="text" value={pagosMoneda[0]?.lotePunto} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>
  </div>

  {/* ===================== COLUMNA DÓLARES ===================== */}
  <div style={{ display: "flex", flexDirection:"column", gap:"8px" }}>
    <h4 style={{ margin: 0 }}>Pagos en Dólares</h4>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Efectivo $:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.efectivoD)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Zelle:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.zelleD)} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Referencia:</label>
      <input type="text" value={pagosMoneda[0]?.referenciaZ} readOnly style={{ backgroundColor:"#CCC", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Banco:</label>
      <input type="text" value={pagosMoneda[0]?.bancoZ} readOnly style={{ backgroundColor:"#CCC", width:"140px" }} />
    </div>
  </div>

</div>

</div>

</div>
  </div>
  
)}

{pagosMoneda.length > 1 && (
  <div className="bloque-credito">
      <div
      style={{
        fontSize: "12px",
        color: "#444",
        marginBottom: "10px",
        padding: "4px 8px",
        backgroundColor: "#f3f3f3",
        borderRadius: "6px",
        whiteSpace: "nowrap"
        }}
      >
        <strong>Tasas usadas para esta venta -----→ USD/Bs: {tasaDolar} ••••• USD/COP: {tasaPeso} ••••• Fecha: {venta ? venta.fecha.substring(0,10) : ""}</strong>
      </div>      
    <div style={{ border:"1px solid #ccc", padding:"10px", borderRadius:"8px", width:"1200px" }}>
      <h3 style={{ marginBottom:"1px" }}>Pagos de Crédito</h3>

      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
        <thead>
          <tr style={{ background:"#D98897", color:"white" }}>
            <th style={{ border:"1px solid #ccc", padding:"5px", width:"50px", fontFamily:"Arial Black" }}>Fecha</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"200px", fontFamily:"Arial Black" }}>Operación</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>E-Pesos</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>T-Pesos</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>Efectivo Bs</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>Transf Bs</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>Punto</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>Pago Móvil</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>Efectivo $</th>
            <th style={{ border:"1px solid #ccc", padding:"6px", width:"70px", fontFamily:"Arial Black" }}>Zelle</th>
          </tr>
        </thead>

        <tbody>
          {pagosMoneda.map((p, i) => (
            <tr key={i}>
              <td style={{ border:"1px solid #ccc", padding:"4px" }}>
                {p.fecha?.substring(0,10)}
              </td>

              <td style={{ border:"1px solid #ccc", padding:"4px" }}>
                {p.operacion || "ABONO DE CREDITO"}
              </td>

              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.efectivoP)}</td>
              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.transferenciaP)}</td>

              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.efectivoBs)}</td>
              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.transferenciaBs)}</td>
              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.puntoBs)}</td>
              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.pagomovilBs)}</td>

              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.efectivoD)}</td>
              <td style={{ border:"1px solid #ccc", padding:"4px" }}>{formatoVE(p.zelle)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{ textAlign: "left", marginTop: "1px", fontSize: "18px", fontWeight: "bold"}}>
      Total Pagado: USD: {totalUSD.toFixed(2)} ---- Bs.: {formatoVE(totalBsPagado.toFixed(2))} ---- Pesos: {formatoVE(totalPPagado.toFixed(2))}
      ------------------------ Resta por Pagar: USD: {restaUSD.toFixed(2)} ---- Bs.: {formatoVE(restaBs.toFixed(2))} ---- Pesos: {formatoVE(restaP.toFixed(2))}
    </div>
  </div>
)}

<div style={{ marginTop: "10px", width: "950px", display: "flex", justifyContent: "center", gap: "20px" }}>
  <button onClick={volverAlMenu} style={estiloBotonVolver}>
    Volver al Menú
  </button>

  <button onClick={borrarCampos} style={botonVarios}>
    Limpiar
  </button>

  <button onClick={eliminarFactura} style={estiloBotonEliminar}>
    Eliminar
  </button>
  
  {esCredito && (
    <button onClick={setMostrarFechaAbono} style={estiloBotonGuardar}
      className="btn-abono"
    >    
      Registrar abono
    </button>
  )}
  {mostrarFechaAbono && (
  <div className="modal-fondo">
    <div className="modal-fecha">
      <h3>Fecha del abono</h3>

      <div className="fila-fecha">
        <input
          type="date"
          value={fechaAbono}
          onChange={(e) => setFechaAbono(e.target.value)}
          className="input-fecha"
        />

        <button
          className="btn-ok"
          onClick={async () => {
            if (!fechaAbono) {
              alert("Debe seleccionar una fecha");
              return;
              }
            try {
              const res = await fetch(
              `${API_URL}/api/tasas/por-fecha/${fechaAbono}`
              );
              const data = await res.json();
            if (!data.ok) {
              alert(
                `No hay tasas registradas para la fecha ${fechaAbono}.`
            );
            return;
            }
            setTasaDolar(Number(data.tasa.tasaD));
            setTasaPeso(Number(data.tasa.tasaP));
            setMostrarFechaAbono(false);
            setModoCredito(true);
            setMostrarPago(true);
            } catch (error) {
              console.error("Error cargando tasas del abono:", error);
              alert("Error al buscar las tasas de la fecha del abono.");
            }
          }}
        >
          Aceptar
        </button>

        <button
          className="btn-cancel"
          onClick={() => setMostrarFechaAbono(false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}


  {mostrarPago && (            
  <Pago            
    modoCredito={modoCredito}
    fecha={fechaAbono}
    sede={sede}
    facturaNumero={numeroFactura}
    totalDolar={restaUSD}
    totalPeso={restaP}
    totalBs={restaBs}
    tasaP={tasaPeso}
    tasaD={tasaDolar}
    pagoExistente={pagoExistente}
    vueltoExistente={vueltoExistente}
    idVueltoExistente={idVueltoExistente}
    onCerrar={() => setMostrarPago(false)}
    onPagoCompletado={(dataPago) => {
      cargarPagos(numeroFactura, true);      
      setIdPagoExistente(dataPago.idPago);
      setIdVueltoExistente(dataPago.idVuelto);
      }}
  />
  )}  
</div>  
</div>{/* FIN CONTENEDOR HORIZONTAL */}
</div> 
);
};
export default Consulta;