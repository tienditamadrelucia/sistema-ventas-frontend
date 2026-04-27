import React, { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {buscarVueltoPorFactura, buscarPagoPorFactura, eliminarMoneda} from "../services/ser_moneda"
import { registrarAccion } from "../utils/registrarAccion";
import { obtenerVentaPorFactura, obtenerProductosVendidos } from "../services/ser_ventas";
import { obtenerAbonosPorFactura } from "../services/ser_moneda";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Consulta = () => {
  const navigate = useNavigate();

    // -----------------------------
    // ESTADOS PRINCIPALES USESTATE
    // -----------------------------    
    const [numeroFactura, setNumeroFactura] = useState(0);
    const [hora, setHora] = useState("");
    const [fecha, setFecha] = useState(new Date());
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

    const [Abono, setAbono] = useState(0);
    const [Saldo, setSaldo] = useState(0);
    const [totalBsPagado, setTotalBsPagado] = useState(0);
    const [totalPPagado, setTotalPPagado] = useState(0);    

    const API = `${API_URL}/api`;

    const estiloBoton = {
        display:"flex",
        width: "15%",
        padding: "15px",
        backgroundColor: "#D98897",
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
    useEffect(() => {
    if (!detalle) return;
        const cargarTasaDeLaFactura = async () => {
        try {
          const fechaFactura = detalle.venta.fecha.substring(0, 10);
          const res = await fetch(`${API}/tasas/por-fecha/${fechaFactura}`);
          const data = await res.json();
        if (data.ok) {
            setTasaDolar(data.tasa.tasaDolar);
            setTasaPeso(data.tasa.tasaPeso);
          } else {
            alert("No hay tasas registradas para la fecha de esta factura.");
        }
        } catch (error) {
        console.error("Error cargando tasa:", error);
        }
    };
    cargarTasaDeLaFactura();
    }, [detalle]);

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
      if (!numeroFactura) return;
      try {            
        const res = await fetch(`${API_URL}/api/ventas/detalle/${numeroFactura}`);
        const data = await res.json();
        if (!data.ok) {
          alert("Factura no encontrada");
          return;
        }
        // 1. Guardar datos de la venta
        setVenta(data.venta);
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
        await cargarPagos(numeroFactura, data.venta.estado === "CREDITO");
      } catch (error) {
        console.error("Error consultando factura:", error);
        alert("Frontend dice: Error consultando factura");
      }
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
    const res = await fetch(`${API_URL}/api/vendidos/${factura}`);
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

  const cargarPagos = async (factura, esCreditoFactura) => {
  try {
    const res = await fetch(`${API_URL}/api/moneda/factura/${factura}`);
    const data = await res.json();
    setPagosMoneda(data.lista || []);
    if (esCreditoFactura) {
      calcularTotalesCredito(data);
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
      `${API_URL}/api/facturas/eliminar-completa/${numeroFactura}`,
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

  const calcularTotalesCredito = (pagos) => {
  let usd = 0;
  let bs = 0;
  let p = 0;
  pagos.forEach(pago => {
    usd += Number(pago.efectivoD || 0) + Number(pago.zelleD || 0);
    bs += Number(pago.efectivoBs || 0) + Number(pago.transferenciaBs || 0) + Number(pago.puntoBs || 0) + Number(pago.pagomovilBs || 0);
    p  += Number(pago.efectivoP || 0) + Number(pago.transferenciaP || 0);
  });
  setTotalUSD(usd);
  setTotalBsPagado(bs);
  setTotalPPagado(p);
  // Convertir todo a USD para restar
  const totalPagadoUSD =
      usd +
      (bs / tasaDolar) +
      (p / tasaPeso);
  const totalFacturaUSD = total;
  const resta = totalFacturaUSD - totalPagadoUSD;
  setRestaUSD(resta);
  setRestaBs(resta * tasaDolar);
  setRestaP(resta * tasaPeso);
};


    // -----------------------------
    // Render
    // -----------------------------
    return (
  <div>
    <Encabezado />

    <h2 style={{ textAlign: "left", marginTop: "5px", marginLeft:"250px" }}>
      CONSULTA DE VENTAS
    </h2>

    {/* CONTENEDOR PRINCIPAL */}
    <div style={{ width: "1500px", margin: "0 auto", marginLeft: "15px" }}>

      {/* CONTENEDOR HORIZONTAL */}
      <div style={{ display: "flex", gap: "5px", alignItems: "flex-start", width: "1400px" }}>

        {/* A) DATOS DE LA FACTURA */}        
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", width: "850px" }}>
          
          <h3 style={{ marginTop: 28 }}>Datos de la Factura</h3>

          <div style={{ display: "flex", gap: "5px", alignItems:"center" }}>
            <label>Factura:</label>
            <input
              type="number"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              style={{ width:"60px" }}
            />

            <button onClick={() => consultarFactura(numeroFactura)} style={estiloBoton}>
              BUSCAR
            </button>   
          
            <div style={{ display: "flex", gap: "15px", marginTop:"10px" }}>
            <label>Fecha</label>
            <input
              type="date"
              value={venta ? venta.fecha.substring(0,10) : ""}
              readOnly
              style={{ backgroundColor: "#EDC5CD", width:"95px" }}
            />
            <label>Hora</label>
            <input
              type="text"
              value={venta ? venta.hora : ""}
              readOnly
              style={{ backgroundColor: "#EDC5CD", width:"80px" }}
            />
            <label>Usuario</label>
            <input
              type="text"
              value={venta ? venta.usuario : ""}
              readOnly
              style={{ backgroundColor: "#EDC5CD", width:"200px" }}
            />
          </div>
        </div>
    </div> {/* FIN DATOS FACTURA */}

    {/* B) DATOS DEL CLIENTE */}
    <div style={{ border: "1px solid #ccc", padding: "7px", alignItems:"center", borderRadius: "8px", width: "325px", marginTop: "0px" }}>         
        <h3 style={{margintop:"10px" }}>Datos del Cliente</h3>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
                <label>Identificación</label>
                <input
                    type="text"
                    value={cliente ? cliente.identificacion : ""}
                    readOnly
                    style={{ backgroundColor: "#EDC5CD", width:"100px" }}
                />
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>
                <label>Nombre</label>
                <input
                    type="text"
                    value={cliente ? cliente.nombreCompleto : ""}
                    readOnly
                    style={{ backgroundColor: "#EDC5CD", width:"200px" }}
                />
            </div>
        </div>
    </div> {/* FIN DATOS CLIENTE */}
    </div>
    {/* TABLA DE PRODUCTOS */}
    <div style={{ border: "1px solid #ccc", padding: "7px", borderRadius: "8px", width: "1200px"}}>        
        <div style={{ marginTop: "10px", width: "1180px" }}>
            <h3 style={{ marginBottom: "10px" }}>Detalle de la Factura</h3>
            <table
                style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px"
                }}
            >
            <thead>
              <tr style={{ backgroundColor: "#6699FF", color: "white" }}>
                <th style={{ border: "1px solid #ccc", padding: "5px", width:"70px", fontWeight: "50", fontFamily: "Arial Black" }}>Código</th>
                <th style={{ border: "1px solid #ccc", padding: "6px", width:"440px", fontWeight: "50", fontFamily: "Arial Black"  }}>Descripción</th>
                <th style={{ border: "1px solid #ccc", padding: "6px", width:"50px", fontWeight: "80", fontFamily: "Arial Black"  }}>Cant</th>
                <th style={{ border: "1px solid #ccc", padding: "6px", width:"140px", fontWeight: "80", fontFamily: "Arial Black"  }}>Precio Sistema</th>
                <th style={{ border: "1px solid #ccc", padding: "6px", width:"140px", fontWeight: "80", fontFamily: "Arial Black"  }}>Precio Factura</th>
                <th style={{ border: "1px solid #ccc", padding: "6px", width:"140px", fontWeight: "50", fontFamily: "Arial Black"  }}>Dscto</th>
                <th style={{ border: "1px solid #ccc", padding: "6px", width:"140px", fontWeight: "50", fontFamily: "Arial Black"  }}>Total</th>
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
{!esCredito && (
  <div>
{/* TABLA DE PAGOS */}
<div style={{ display:"flex", border: "1px solid #ccc", padding: "7px", gap: "8px", width: "1200px", marginTop: "10px", alignItems:"flex-start" }}>
    <div style={{ marginTop: "1px" }}>
        <h3 style={{ marginBottom: "1px" }}>Detalle del Pago</h3>           
            
{/* CONTENEDOR HORIZONTAL DE LAS 3 COLUMNAS */}
<div style={{ display: "flex", gap: "40px", marginTop: "10px" }}>

  {/* ===================== COLUMNA PESOS ===================== */}
  <div style={{ display: "flex", flexDirection:"column", gap:"8px" }}>
    <h4 style={{ margin: 0 }}>Pagos en Pesos</h4>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Efectivo P:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.efectivoP)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Transferencia P:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.transferenciaP)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Referencia:</label>
      <input type="text" value={pagosMoneda[0]?.referenciaP} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Banco:</label>
      <input type="text" value={pagosMoneda[0]?.bancoP} readOnly style={{ backgroundColor:"#EDC5CD", width:"140px" }} />
    </div>
  </div>

  {/* ===================== COLUMNA BOLÍVARES ===================== */}
  <div style={{ display: "flex", flexDirection:"column", gap:"8px" }}>
    <h4 style={{ margin: 0 }}>Pagos en Bolívares</h4>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Efectivo Bs:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.efectivoBs)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Transferencia Bs:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.transferenciaBs)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Referencia:</label>
      <input type="text" value={pagosMoneda[0]?.referenciaTBs} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Banco:</label>
      <input type="text" value={pagosMoneda[0]?.bancoTBs} readOnly style={{ backgroundColor:"#EDC5CD", width:"140px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Punto:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.puntoBs)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Ref Punto:</label>
      <input type="text" value={pagosMoneda[0]?.refPunto} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Lote:</label>
      <input type="text" value={pagosMoneda[0]?.lotePunto} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>
  </div>

  {/* ===================== COLUMNA DÓLARES ===================== */}
  <div style={{ display: "flex", flexDirection:"column", gap:"8px" }}>
    <h4 style={{ margin: 0 }}>Pagos en Dólares</h4>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Efectivo $:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.efectivoD)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Zelle:</label>
      <input type="text" value={formatoVE(pagosMoneda[0]?.zelleD)} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Referencia:</label>
      <input type="text" value={pagosMoneda[0]?.referenciaZ} readOnly style={{ backgroundColor:"#EDC5CD", width:"100px" }} />
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <label style={{ width:"110px" }}>Banco:</label>
      <input type="text" value={pagosMoneda[0]?.bancoZ} readOnly style={{ backgroundColor:"#EDC5CD", width:"140px" }} />
    </div>
  </div>

</div>

</div>

</div>
  </div>
  
)}

{esCredito && pagosMoneda.length > 0 && (
  <div className="bloque-credito">

    <h3>Pagos de Crédito</h3>

    <table className="tabla-credito">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Operación</th>
          <th>Efectivo P</th>
          <th>Transferencia P</th>
          <th>Efectivo Bs</th>
          <th>Transferencia Bs</th>
          <th>Punto</th>
          <th>Pago Móvil</th>
          <th>Efectivo $</th>
          <th>Zelle</th>
        </tr>
      </thead>

      <tbody>
        {pagosMoneda.map((p, i) => (
          <tr key={i}>
            <td>{p.fecha?.substring(0, 10)}</td>
            <td>{p.operacion || "ABONO DE CREDITO"}</td>

            <td>{formatoVE(p.efectivoP)}</td>
            <td>{formatoVE(p.transferenciaP)}</td>

            <td>{formatoVE(p.efectivoBs)}</td>
            <td>{formatoVE(p.transferenciaBs)}</td>
            <td>{formatoVE(p.puntoBs)}</td>
            <td>{formatoVE(p.pagomovilBs)}</td>

            <td>{formatoVE(p.efectivoD)}</td>
            <td>{formatoVE(p.zelle)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h3>Total Pagado</h3>
    <p>USD: {totalUSD.toFixed(2)}</p>
    <p>Bs: {totalBsPagado.toFixed(2)}</p>
    <p>Pesos: {totalPPagado.toFixed(2)}</p>

    <h3>Resta por Pagar</h3>
    <p>USD: {restaUSD.toFixed(2)}</p>
    <p>Bs: {restaBs.toFixed(2)}</p>
    <p>Pesos: {restaP.toFixed(2)}</p>

  </div>
)}



<div style={{ marginTop: "10px", width: "950px", display: "flex", justifyContent: "center", gap: "20px" }}>
  <button onClick={volverAlMenu} style={estiloBoton}>
    Volver al Menú
  </button>

  <button onClick={borrarCampos} style={estiloBoton}>
    Limpiar
  </button>

  <button onClick={eliminarFactura} style={estiloBoton}>
    Eliminar
  </button>
  
</div>
  
</div>{/* FIN CONTENEDOR HORIZONTAL */}
</div> 
);
};
export default Consulta;