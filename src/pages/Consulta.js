import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {buscarVueltoPorFactura, buscarPagoPorFactura, eliminarMoneda} from "../services/ser_moneda"
import { registrarAccion } from "../utils/registrarAccion";
import { obtenerVentaPorFactura, obtenerProductosVendidos } from "../services/ser_ventas";
import { obtenerAbonosPorFactura } from "../services/ser_moneda";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta
import Pago from "../components/Pago/Pago";
import {obtenerFechaVenezuela} from "../utils/fechaVenezuela";
import React, { useState, useEffect, useRef } from "react";

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
    const hoy = obtenerFechaVenezuela();
    const [fecha, setFecha] = useState(obtenerFechaVenezuela());   
    const [procesando, setProcesando] = useState(false);
    const eliminandoAbonoRef = useRef(false);
    const esAdministrador =
      localStorage
        .getItem("rolUsuario")
        ?.trim()
        .toUpperCase() === "ADMINISTRADOR";
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
        display:"flex",
        width: "15%",
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
      if (!numeroFactura) {
        alert("Debe ingresar un número de factura.");
        return;
      }

      setProcesando(true);

  // ==========================================
  // LIMPIAR DATOS DE LA CONSULTA ANTERIOR
  // ==========================================
      setVenta(null);
      setCliente(null);
      setListaFactura([]);
      setPagosMoneda([]);

      setEsCredito(false);

  // Totales pagados
      setTotalUSD(0);
      setTotalBsPagado(0);
      setTotalPPagado(0);

  // Saldo pendiente
      setRestaUSD(0);
      setRestaBs(0);
      setRestaP(0);

  // Datos de crédito
      setAbono(0);
      setSaldo(0);
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

    const res = await fetch(
      `${API_URL}/api/vendidos/${factura}?sede=${encodeURIComponent(sede)}`
    );

    if (!res.ok) {
      throw new Error(
        `Error ${res.status} consultando productos vendidos`
      );
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      alert("Frontend dice: No se encontró el detalle de la factura");
      setListaFactura([]);
      return;
    }

    const listaReconstruida = data.map((item) => {

      // productoId viene poblado desde el backend
      const producto = item.productoId || {};

      return {
        codigo: producto.codigo ?? "",
        descripcion: producto.descripcion ?? "",
        cantidad: Number(item.cantidad ?? 0),
        precioActual: Number(producto.venta ?? 0),
        precioFactura: Number(item.precio ?? 0),
        descuento: Number(item.dscto ?? 0),
        total: Number(item.total ?? 0)
      };
    });

    console.log(
      "DETALLE RECONSTRUIDO:",
      listaReconstruida
    );

    setListaFactura(listaReconstruida);

  } catch (error) {
    console.error(
      "Frontend dice: Error cargando detalle:",
      error
    );

    setListaFactura([]);

    alert(
      "Frontend dice: Error cargando detalle de la factura"
    );
  }
};

  const cargarPagos = async (
  factura,
  esCreditoFactura,
  tasasSaldo = null,
  ventaActual = null,
  propagarError = false
) => {
  try {
    const res = await fetch(
      `${API_URL}/api/moneda/factura/${encodeURIComponent(factura)}?sede=${encodeURIComponent(sede)}`,
      {
        credentials: "include"
      }
    );

    const data = await res.json();

    if (
      !res.ok ||
      !data.ok ||
      !Array.isArray(data.lista)
    ) {
      throw new Error(
        data.mensaje || "No se pudieron consultar los pagos."
      );
    }

    const lista = [...data.lista].sort((a, b) =>
      String(a.fecha || "").localeCompare(
        String(b.fecha || "")
      )
    );

    setPagosMoneda(lista);

    if (esCreditoFactura) {
      await calcularTotalesCredito(
        lista,
        tasasSaldo,
        ventaActual
      );
    }

    return lista;
  } catch (error) {
    console.error("Error cargando pagos:", error);

    if (propagarError) {
      throw error;
    }

    setPagosMoneda([]);
    alert("No se pudieron consultar los pagos de esta factura.");
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
    // Totales pagados
    setTotalUSD(0);
    setTotalBsPagado(0);
    setTotalPPagado(0);

    // Saldo pendiente
    setRestaUSD(0);
    setRestaBs(0);
    setRestaP(0);

    // Datos de crédito
    setAbono(0);
    setSaldo(0);

    // Tasas
    setTasaDolar(0);
    setTasaPeso(0);
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

    if (!ventaCalculo || ventaCalculo.total == null) {
      console.error("Venta incompleta, no se puede calcular el crédito");
      return;
    }

    let totalPagadoUSD = 0;
    let totalDolares = 0;
    let totalBolivares = 0;
    let totalPesos = 0;
    let movimientosSinTasa = 0;

    // CALCULAR CADA MOVIMIENTO CON LA TASA DE SU FECHA
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

      totalDolares += usd;
      totalBolivares += bs;
      totalPesos += cop;

      let valorMovimientoUSD = usd;

      if (bs !== 0 || cop !== 0) {
        const tasas = await obtenerTasasPorFecha(pago.fecha);

        if (!tasas) {
          movimientosSinTasa++;
          console.error("Abono sin tasa histórica:", {
            id: pago._id,
            factura: pago.factura,
            fecha: pago.fecha,
            bs,
            cop
          });
          totalPagadoUSD += usd;
          continue;
        }

        if (bs !== 0) {
          valorMovimientoUSD += bs / tasas.tasaD;
        }

        if (cop !== 0) {
          valorMovimientoUSD += cop / tasas.tasaP;
        }
      }

      // Los vueltos negativos descuentan del pago.
      totalPagadoUSD += valorMovimientoUSD;
    }

    // TOTALES REGISTRADOS EN CADA MONEDA
    setTotalUSD(totalDolares);
    setTotalBsPagado(totalBolivares);
    setTotalPPagado(totalPesos);

    // NO MOSTRAR UN SALDO DEFINITIVO SI FALTAN TASAS
    if (movimientosSinTasa > 0) {
      console.warn(
        `${movimientosSinTasa} movimientos no pudieron convertirse por falta de tasas.`
      );
      setRestaUSD(NaN);
      setRestaBs(
        Number.isFinite(td) && td > 0 ? saldoUSD * td : NaN
      );
      setRestaP(
        Number.isFinite(tpeso) && tpeso > 0
        ? saldoUSD * tpeso
        : NaN
      );
      return;
    }

    // CALCULAR SALDO EN DÓLARES
    const totalFacturaUSD = Number(ventaCalculo.total);
    let saldoUSD = totalFacturaUSD - totalPagadoUSD;

    const TOLERANCIA_USD = 0.25;

    if (Math.abs(saldoUSD) <= TOLERANCIA_USD) {
      saldoUSD = 0;
    }

    setRestaUSD(saldoUSD);

    // EQUIVALENCIAS DEL SALDO
    const td = tasasSaldo
      ? Number(tasasSaldo.tasaD)
      : Number(tasaDolar);

    const tpeso = tasasSaldo
      ? Number(tasasSaldo.tasaP)
      : Number(tasaPeso);

    setRestaBs(td ? saldoUSD * td : 0);
    setRestaP(tpeso ? saldoUSD * tpeso : 0);

    // IMPORTANTE:
    // Consultar una factura NO cambia su estado.
    // La cancelación definitiva del crédito debe
    // gestionarse mediante un proceso independiente.

  } catch (error) {
    console.error("Error calculando totales del crédito:", error);
  }
};

  const abonoCredito = () => {
  // Fecha de hoy en formato YYYY-MM-DD
  const hoy = obtenerFechaVenezuela();
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

  const eliminarAbono = async (abono) => {
  if (procesando || eliminandoAbonoRef.current) return;

  if (!esAdministrador) {
    alert("Solo el administrador puede eliminar abonos.");
    return;
  }

  if (
    !venta ||
    !abono._id ||
    abono.operacion !== "ABONO DE CREDITO"
  ) {
    return;
  }

  const ventaConsultada = venta;
  const factura = ventaConsultada.factura;

  if (Number(abono.factura) !== Number(factura)) {
    alert("El abono no corresponde a la factura consultada.");
    return;
  }

  const confirmar = window.confirm(
    `¿Eliminar el abono del ${String(abono.fecha).slice(0, 10)} ` +
    `de la factura ${factura}?\n\n` +
    "Se eliminará este movimiento y se recalculará el saldo pendiente."
  );

  if (!confirmar) return;

  eliminandoAbonoRef.current = true;
  setProcesando(true);

  let eliminado = false;

  try {
    const parametros = new URLSearchParams({
      factura: String(factura),
      sede
    });

    const res = await fetch(
      `${API_URL}/api/moneda/${encodeURIComponent(abono._id)}?${parametros}`,
      {
        method: "DELETE",
        credentials: "include"
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.mensaje ||
        data?.error ||
        "No se pudo confirmar la eliminación. Actualice la consulta antes de volver a intentarlo."
      );
    }

    eliminado = true;

    setPagosMoneda((anteriores) =>
      anteriores.filter((p) => p._id !== abono._id)
    );

    // Evitar mostrar el saldo anterior durante la recarga.
    setRestaUSD(NaN);
    setRestaBs(NaN);
    setRestaP(NaN);

    const tasasHoy = await cargarTasasDeHoy();

    await cargarPagos(
      factura,
      true,
      tasasHoy || {
        tasaD: NaN,
        tasaP: NaN
      },
      ventaConsultada,
      true
    );

    try {
      await registrarAccion(
        `Eliminó el abono ${abono._id} de la factura ${factura} en ${sede}`
      );
    } catch (error) {
      console.error("Error registrando la acción:", error);
    }

    alert("Abono eliminado. Los pagos y el saldo se actualizaron.");
  } catch (error) {
    console.error("Error eliminando abono:", error);

    alert(
      eliminado
        ? "El abono fue eliminado, pero no se pudo completar la actualización de pantalla. Vuelva a buscar la factura."
        : error.message || "No se pudo eliminar el abono."
    );
  } finally {
    eliminandoAbonoRef.current = false;
    setProcesando(false);
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
              disabled={procesando}
              onChange={(e) => setNumeroFactura(e.target.value)}
              style={{ width:"60px" }}
            />

            <button 
              disabled={procesando}
              onClick={() => consultarFactura(numeroFactura)} 
              style={botonVarios}
            >
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
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{Number(item.precioActual || 0).toFixed(2)}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{Number(item.precioFactura || 0).toFixed(2)}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{Number(item.descuento || 0)}</td>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>{Number(item.total || 0).toFixed(2)}</td>            
                </tr>
                ))
                )}
            </tbody>
        </table>
    </div>    
</div>
{venta && (
<div style={{ textAlign: "right", marginTop: "1px", fontSize: "18px", fontWeight: "bold", marginRight:"300px"}}>
  Subtotal: ${Number(venta.subtotal || 0).toFixed(2)} — IVA: ${venta.IVA.toFixed(2)} — Total: ${venta.total.toFixed(2)}
</div>
)}

{venta && (
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
      <h3 style={{ marginBottom:"1px" }}>Registro de Pagos</h3>

      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
        <thead>
          <tr style={{ background:colorTabla, color:"black" }}>
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
            {esAdministrador && (
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  width: "45px",
                  padding: "2px",
                  whiteSpace: "nowrap",
                  fontFamily: "Arial Black"
                }}
              >
                Eliminar
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {pagosMoneda.map((p, i) => (
            <tr key={p._id}>
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
              {esAdministrador && (
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "4px",
                    width: "45px",
                    textAlign: "center"
                  }}
                >
                  {p.operacion === "ABONO DE CREDITO" && (
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => eliminarAbono(p)}
                    title="Eliminar este abono"
                    aria-label="Eliminar este abono"
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "20px",
                      cursor: procesando ? "not-allowed" : "pointer"
                    }}
                  >
                    🗑️
                  </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {esCredito && (
      <>
      <div style={{ textAlign: "left", marginTop: "1px", fontSize: "18px", fontWeight: "bold"}}>
        Total Pagado: USD: {totalUSD.toFixed(2)} ---- Bs.: {formatoVE(totalBsPagado.toFixed(2))} ---- Pesos: {formatoVE(totalPPagado.toFixed(2))}
        ------------------------ Resta por Pagar: USD: {restaUSD.toFixed(2)} ---- Bs.: {formatoVE(restaBs.toFixed(2))} ---- Pesos: {formatoVE(restaP.toFixed(2))}
      </div>
      </>
    )}
  </div>
)}

<div style={{ marginTop: "10px", width: "950px", display: "flex", justifyContent: "center", gap: "20px" }}>
  <button onClick={volverAlMenu} style={estiloBotonVolver}>
    Volver al Menú
  </button>

  <button 
    disabled={procesando}
    onClick={borrarCampos} 
    style={botonVarios}
  >
    Limpiar
  </button>

  <button 
    disabled={procesando}
    onClick={eliminarFactura} 
    style={estiloBotonEliminar}
  >
    Eliminar
  </button>
  
  {esCredito && (
    <button 
      disabled={procesando}
      onClick={() => setMostrarFechaAbono(true)} 
      style={estiloBotonGuardar}
      className="btn-abono"
    >    
      Registrar abono
    </button>
  )}
  {mostrarFechaAbono && (
  <div className="modal-fondo">
    <div
      className="modal-fecha"
      style={{
        backgroundColor: esMonasterio ? "#F5EBDD" : "#FFF5F5",
        border: `3px solid ${colorPrincipal}`,
        borderRadius: "12px"
      }}
    >
      <h3
        style={{
          color: colorPrincipal,
          fontFamily: "Arial Black, Arial, sans-serif"
        }}
      >
  Fecha del abono
</h3>

      <div className="fila-fecha">
        <input
          type="date"
          value={fechaAbono}
          onChange={(e) => setFechaAbono(e.target.value)}
          className="input-fecha"
        />

        <button
          className="btn-ok"
          style={{
            backgroundColor: colorAccion,
            color: "white",
            fontWeight: "bold"
          }}
          onClick={async () => {
            if (!fechaAbono) {
              alert("Debe seleccionar una fecha");
              return;
              }
            try {
              const res = await fetch(
              `${API_URL}/api/tasas/por-fecha/${fechaAbono}?sede=${encodeURIComponent(sede)}`
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
          style={{
            backgroundColor: colorPrincipal,
            color: "white",
            fontWeight: "bold"
          }}
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