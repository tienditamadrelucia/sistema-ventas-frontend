import React, { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import carritoImg from "../assets/carrito.png";
import { useNavigate } from "react-router-dom";
import Pago from "../components/Pago/Pago";
import axios from "axios";
import { obtenerClientes, TodosClientes } from "../services/clientes";
import { cargarCategorias } from "../services/categorias";
import { cargarProductos } from "../services/productos";
import {buscarVueltoPorFactura, buscarPagoPorFactura, eliminarMoneda} from "../services/ser_moneda"
import EditarCliente from "../components/Clientes/EditarCliente";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta
import ModalTasas from "../components/Tasas/ModalTasas";
import { cargarTasasPorFecha } from "../services/ser_tasas";


const Ventas = () => {
  const navigate = useNavigate();
 
  // -----------------------------
  // ESTADOS PRINCIPALES USESTATE
  // -----------------------------
  
  // VARIABLES FACTURA
  const [numeroFactura, setNumeroFactura] = useState(0);
  const [hora, setHora] = useState("");
  const [fecha, setFecha] = useState(toYMD(new Date()));  
  const [fechaString, setFechaString] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [identificacion, setIdentificacion] = useState("");
  const [listaClientes, setListaClientes] = useState([]);   // arreglo vacío
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");

  // VARIABLES PRODUCTOS
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [descuento, setDescuento] = useState(0);  
  const [codigoProducto, setCodigoProducto] = useState("");
  const [nombreProducto, setNombreProducto] = useState("");
  const [stockActual, setStockActual] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [totalProducto, setTotalProducto] = useState(0);
  const [listaProductos, setListaProductos] = useState([]);
  const [errorStock, setErrorStock] = useState("");
  const [iva, setIva] = useState(0);  
  const [errorPrecio, setErrorPrecio] = useState("");  
  const [subtotalDolar, setSubtotalDolar] = useState(0);
  const [totalDolar, setTotalDolar] = useState(0);
  const [totalPeso, setTotalPeso] = useState(0);
  const [totalBs, setTotalBs] = useState(0);  
  const [editando, setEditando] = useState(false);
  const [indexEditado, setIndexEditado] = useState(null);
  const [listaFactura, setListaFactura] = useState([]);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  //VARIABLES TASAS
  const [mostrarModalTasas, setMostrarModalTasas] = useState(false);
  const [tasaDolar, setTasaDolar] = useState(0);
  const [tasaPeso, setTasaPeso] = useState(0);
  const [cajaDolar, setCajaDolar] = useState(0);
  const [cajaPeso, setCajaPeso] = useState(0);
  const [tasaBs, setTasaBs] = useState(0);  

  const [pagoExistente, setPagoExistente] = useState(null);
  const [vueltoExistente, setVueltoExistente] = useState(null);  
  // ⭐ Control de flujo después de registrar un pago
  const [pagoRegistrado, setPagoRegistrado] = useState(false);
  // ⭐ IDs que vienen desde Pago.js
  const [idPagoExistente, setIdPagoExistente] = useState(null);
  const [idVueltoExistente, setIdVueltoExistente] = useState(null);
  const [mostrarEditorCliente, setMostrarEditorCliente] = useState(false);
  const [reservaId, setReservaId] = useState(null);
  const [ventaFinalizada, setVentaFinalizada] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [IVA, setIVA] = useState(0);
  const [total, setTotal] = useState(0);
  const [modoCredito, setModoCredito] = useState(false);
  const [pagoData, setPagoData] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const estiloBoton = {
  width: "15%",
  padding: "5px",
  backgroundColor: "#D98897",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontWeight: "800",
  fontFamily: "Arial Black",
  cursor: "pointer",
  marginTop: "5px"
};

const botonGuardar = {
    width: "15%",
    padding: "6px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",    
    marginTop: "8px",
    opacity:procesando ? 0.6 :1,
    cursor: procesando ? "not-allowed":"pointer"
  };

  const API = `${API_URL}/api`;

  // -----------------------------
  // USEEFFECT para cargar tasas, clientes, categorías y productos
  // -----------------------------
  const hoy = toYMD(new Date());
  
  useEffect(() => {
  const validarTasasDeHoy = async () => {
    try {
      const res = await axios.get(`${API}/tasas/hoy`);
      if (!res.data || !res.data.tasa) {
        alert("Debe registrar las tasas del día antes de entrar al módulo de Ventas.");
        navigate("/tasas");
        return;
      }
      const { tasaD, tasaP, cajachicaD, cajachicaP } = res.data.tasa;
      setTasaDolar(tasaD);
      setTasaPeso(tasaP);
      setCajaDolar(cajachicaD);
      setCajaPeso(cajachicaP);
    } catch (error) {
      console.error("Error validando tasas del día:", error);
      alert("Error validando tasas del día.");
      navigate("/tasas");
    }
  };
  validarTasasDeHoy();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const UsuarioActual = localStorage.getItem("usuarioNombre") || "Usuario";
  
  useEffect(() => {
  const reservarFactura = async () => {
    try {
      const res = await fetch(`${API_URL}/api/facturas/reservar`, {
        method: "POST"
      });
      if (!res.ok) {
        alert("No se pudo reservar número de factura");
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        alert(data.msg || "Error reservando factura");
        return;
      }
      setReservaId(data.reservaId);
      setNumeroFactura(data.numeroFactura);
    } catch (error) {
      console.error("Error reservando factura:", error);
      alert("Error reservando factura");
    }
  };
  reservarFactura();
  }, []);

  useEffect(() => {
  const cargarTasas = async () => {
    try {
      const fechaFactura = fecha;
      if (!fechaFactura) {
        alert("Debe seleccionar una fecha para la factura.");
        return;
      }

      const res = await axios.get(`${API_URL}/api/tasas/por-fecha/${fechaFactura}`);
      if (!res.data || !res.data.tasa) {
        alert("No existen tasas registradas para esta fecha.");
        navigate("/tasas");
        return;
      }

      const { tasaD, tasaP, cajachicaD, cajachicaP } = res.data.tasa;

      setTasaDolar(tasaD);
      setTasaPeso(tasaP);
      setCajaDolar(cajachicaD);
      setCajaPeso(cajachicaP);
    } catch (error) {
      console.error("Frontend dice: Error cargando tasas:", error);
      alert("Error cargando tasas.");
      navigate("/tasas");
    }
  };

  cargarTasas();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fecha]);



useEffect(() => {
  generarHora();
  cargarClientes();
  cargarCategoriasYProductos();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API}/clientes/todos`);
      const data = await res.json();
      setListaClientes(Array.isArray(data) ? data : []);
    } catch (err) {      
      alert("catch fontend dice: Error cargando clientes");
      setListaClientes([]);
    }
  };

  const cargarCategoriasYProductos = async () => {
    try {
      const categorias = await cargarCategorias();
      setCategoriasDisponibles(categorias);
      const productos = await cargarProductos();
      setListaProductos(productos);
    } catch (error) {
      console.error("Error cargando categorías o productos", error);
    }
  };

  // -----------------------------
  // Cálculo del total del producto y total de la factura
  // -----------------------------

  useEffect(() => {        
  const subtotalDolar = listaFactura.reduce(
    (acc, item) => acc + parseFloat(item.total || 0), 
    0
  );

  setSubtotalDolar(subtotalDolar);

  const ivaDecimal = (parseFloat(iva) || 0) / 100;
  const totalDolar = subtotalDolar + (subtotalDolar * ivaDecimal);

  setTotalDolar(totalDolar);
  setTotalPeso(totalDolar * tasaPeso || 0);
  setTotalBs(totalDolar * tasaDolar || 0);

}, [listaFactura, iva, tasaPeso, tasaDolar]);


  // Funciones para generación de número de factura y hora  
  const generarHora = () => {
    const ahora = new Date();
    const h = ahora.toLocaleTimeString("es-VE", { hour12: false });
    setHora(h);
  };

  // -----------------------------
  // Funciones de búsqueda y filtros
  // -----------------------------  
  
  const handlePagoCompletado = async (dataPago) => {    
    console.log("Pago registrado:", dataPago);
    const { idPago, idVuelto, totalAbonado, modoCredito } = 
    // ⭐ GUARDAR LOS DATOS DEL PAGO EN EL ESTADO
    setPagoData({
      totalAbonado: dataPago.totalAbonado,
      modoCredito: dataPago.modoCredito
    });
    alert("modo " + modoCredito)
    // 1. Guardar IDs del pago y vuelto
    setPagoRegistrado(true);
    setIdPagoExistente(idPago);
    setIdVueltoExistente(idVuelto);
    // 2. Marcar pago asociado en reserva (igual para contado y crédito)
    try {
      const { idPago, idVuelto, totalAbonado, modoCredito } = pagoData || {};
      await fetch(`${API_URL}/api/facturas/marcar-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroFactura })
      });
    } catch (error) {
      console.error("Error marcando pago asociado:", error);
    }
    // 3. GUARDAR LA VENTA (CONTADO o CREDITO)
    try {
      const estado = modoCredito ? "CREDITO" : "CONTADO";
      await fetch(`${API_URL}/api/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      fecha,
      hora,
      factura: numeroFactura,
      cliente: clienteSeleccionado,
      subtotal,
      iva,
      total,
      usuario: UsuarioActual,
      estado: modoCredito ? "CREDITO" : "CONTADO"      
      })
    });
    // 4. Guardar detalle de productos
    await fetch(`${API_URL}/api/vendidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      factura: numeroFactura,
      productos: listaFactura
    })
    });
  } catch (error) {
    console.error("Error guardando venta:", error);
  }
  };    

  function toYMD(date) {
  if (typeof date === "string") return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

// Buscar cliente por identificación (una sola función async)
// buscarClientePorIdentificacion
const buscarClientePorIdentificacion = async (cedula) => {
  cedula = cedula.trim().toUpperCase();
  if (!cedula) return;
  try {
    const res = await fetch(`${API_URL}/api/clientes/cedula/${cedula}`);
    if (!res.ok) {
      alert("Cliente no encontrado");
      return;
    }
    const data = await res.json(); // si tu backend devuelve { ok: true, cliente: {...} } usa data.cliente
    const cliente = data.cliente ?? data;
    if (!cliente || !cliente._id) {
      alert("Respuesta inválida del servidor");
      return;    }
    // Guardar el objeto cliente (no solo el id)
    setClienteSeleccionado(cliente);
    // Actualizar campos visibles
    setNombreCliente(cliente.nombreCompleto || "");
    setIdentificacion(cliente.identificacion || "");
    // Agregar a la lista si no existe
    setListaClientes(prev => {
      const existe = prev.some(c => c._id === cliente._id);
      return existe ? prev : [...prev, cliente];
    });
    // Abrir editor si está incompleto
    setTimeout(() => {
      const incompleto =
        cliente.nombreCompleto === "CLIENTE POR ACTUALIZAR" ||
        cliente.direccion === "DIRECCIÓN POR ACTUALIZAR" ||
        cliente.telefono === "TELÉFONO POR ACTUALIZAR";
      if (incompleto) setMostrarEditorCliente(true);
    }, 0);
  } catch (error) {
    console.error("Error buscando cliente:", error);
    alert("Error buscando cliente");
  }
};

 const buscarProductoPorCodigo = async (codigo) => {
  const codigoNormalizado = codigo.trim().toUpperCase();
  const producto = listaProductos.find(
    p => String(p.codigo).trim().toUpperCase() === codigoNormalizado
  );

  if (!producto) {
    alert("Producto no encontrado");
    return;
  }

  // 🔹 Mantengo TODO lo tuyo, sin cambiar nada
  setCategoriaSeleccionada(producto.categoria);
  setProductoSeleccionado(producto._id);
  setNombreProducto(producto.descripcion);
  setPrecioVenta(producto.venta);

  // 🔹 YA NO usamos producto.stock (stock inicial)
  // 🔹 Ahora consultamos el stock REAL al backend
  try {
    const res = await fetch(`${API_URL}/api/inventario/stock-real/${codigoNormalizado}`);
    const data = await res.json();

    if (data.ok) {
      setStockActual(data.stockReal); // ⭐ AHORA SÍ ES EL REAL
    } else {
      setStockActual(producto.stock); // fallback
    }
  } catch (error) {
    console.error("Error obteniendo stock real:", error);
    setStockActual(producto.stock); // fallback
  }
};


  // -----------------------------
  // Validaciones
  // -----------------------------

  const validarPrecio = (valor) => {
    setPrecioVenta(valor);
    if (valor <= 0) {
      setErrorPrecio("El precio debe ser mayor a 0");
    } else {
      setErrorPrecio("");
    }
  };

  const validarStock = (cant) => {
    if (cant > stockActual) {
      alert("Stock insuficiente, pero puede continuar.");
    }
    setCantidad(cant);
  };

  // -----------------------------
  // Agregar al carrito
  // -----------------------------
  const agregarAlCarrito = () => {
    if (!codigoProducto || !nombreProducto) {
      alert("Debe seleccionar un producto.");
      return;
    }
    if (!cantidad || cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }
    const nuevoItem = {
      idProducto: productoSeleccionado,
      codigo: codigoProducto,
      descripcion: nombreProducto,
      cantidad: Number(cantidad),
      precioVenta: Number(precioVenta),
      descuento: Number(descuento),
      total: totalProducto
    };
    setListaFactura([...listaFactura, nuevoItem]);
    limpiarProducto();
  };

  const limpiarProducto = () => {
    setCodigoProducto("");
    setCategoriaSeleccionada("");
    setProductoSeleccionado("");
    setStockActual(0);
    setCantidad(0);
    setPrecioVenta(0);
    setDescuento(0);
  };  

  // -----------------------------
  // Guardar Venta
  // -----------------------------

  const guardarVenta = async () => {
  if (procesando) return; //evita doble clic
    setProcesando(true);  
    try {  

  if (!pagoRegistrado) {
    alert("Debe registrar el pago antes de guardar la venta");
    return;
  }
  // Extraer datos del pago
  const { idPago, idVuelto, totalAbonado, modoCredito } = pagoData || {};
  const estado = modoCredito ? "CREDITO" : "CONTADO";
  const abono = modoCredito ? totalAbonado : total;
  const saldo = modoCredito ? total - totalAbonado : 0;
  console.log("modoCredito en guardarVenta:", modoCredito);
  // 1. GUARDAR CABECERA EN dbVentas
  try {
    const resVenta = await fetch(`${API_URL}/api/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        factura: numeroFactura,
        fecha: fecha,
        hora: hora,
        cliente: identificacion,
        subtotal: subtotalDolar,
        iva: IVA,
        total: totalDolar,
        usuario: UsuarioActual,
        estado: estado,     // ← AHORA SÍ        
        })
    });
    if (!resVenta.ok) {
      alert("No se pudo guardar la venta");
      return;
    }
    // 2. GUARDAR DETALLE EN dbVendidos
    for (const item of listaFactura) {      
      const resDetalle = await fetch(`${API_URL}/api/vendidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        factura: numeroFactura,
        productoId: item.idProducto,
        cantidad: item.cantidad,
        precio: item.precioVenta,
        dscto: item.descuento || 0,
        total: item.total
      })
    });
    // ESTE IF SÍ VA
    if (!resDetalle.ok) {
      console.error("Error guardando producto vendido");
      return;
      }
    }
    // 3. MARCAR RESERVA COMO FINALIZADA
    await fetch(`${API_URL}/api/facturas/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroFactura })
    });
    alert(`Venta guardada correctamente. Factura N° ${numeroFactura}`);
    // 4. REINICIAR TODO PARA UNA NUEVA VENTA
    limpiarCliente();    
    setPagoData(null);
    setPagoRegistrado(false);
    setIdPagoExistente(null)
    setIdVueltoExistente(null);
    setListaFactura([]);
    setClienteSeleccionado("")
    setListaFactura([]);  
    setModoCredito(false);
    generarNuevaFactura()
  } catch (error) {
    console.error("Error guardando venta:", error);
    alert("Error guardando venta");
  }
  } finally {
    // ⭐ SIEMPRE se ejecuta, incluso si hubo return arriba
        setProcesando(false);
  } 
};

const generarNuevaFactura = async () => {
  try {
    const res = await fetch(`${API_URL}/api/facturas/reservar`, {
      method: "POST"
    });
    const data = await res.json();
    setReservaId(data.reservaId);          // ✔ NECESARIO
    setNumeroFactura(data.numeroFactura);  // ✔ nombre correcto
  } catch (error) {
    console.error("Error generando nueva factura:", error);
  }
};

  const limpiarCliente = () => {
    setIdentificacion("");
    setNombreCliente("");
    setClienteSeleccionado("");
    };
  
  const validarCliente = () => {
    if (!clienteSeleccionado) {
      alert("Debe seleccionar un cliente antes de guardar la venta.");
      return false;
    }
    // Validar que no tenga datos por actualizar
    if (
      clienteSeleccionado.nombreCompleto === "CLIENTE POR ACTUALIZAR" ||
      clienteSeleccionado.direccion === "DIRECCIÓN POR ACTUALIZAR" ||
      clienteSeleccionado.telefono === "TELÉFONO POR ACTUALIZAR"
    ) {
      alert("El cliente tiene datos incompletos. Debe actualizarlo antes de guardar la venta.");
      return false;
    }
      return true;
    };

    const actualizarProducto = () => {
    // Verifica que el índice de edición sea válido
    if (indexEditado === null) {
        alert("Ningún producto está siendo editado");
        return;
    }
    const nuevos = [...listaFactura]; // Clona la lista actual de productos
    const precioNum = parseFloat(precioVenta);
    const descNum = parseFloat(descuento) || 0;
    const totalCalc = (cantidad * precioNum) - (cantidad * precioNum * (descNum / 100));
    // Actualiza el producto en la lista
    nuevos[indexEditado] = {
        ...nuevos[indexEditado],
        cantidad: Number(cantidad),
        precioVenta: precioNum,
        descuento: descNum,
        total: totalCalc
    };
    // Actualiza la lista de factura y restablece los estados
    setListaFactura(nuevos);
    limpiarProducto(); // Limpia los campos relacionados al producto
    setEditando(false);
    setIndexEditado(null);
    };

    const eliminarItem = (index) => {
        const nuevaLista = [...listaFactura]; // Clona la lista actual de productos
        nuevaLista.splice(index, 1); // Elimina el producto en el índice especificado
        setListaFactura(nuevaLista); // Actualiza la lista de productos en el estado
    };

  const iniciarEdicion = (item, index) => {
    // Cargar los valores del item en los campos de entrada
    setCantidad(item.cantidad);
    setPrecioVenta(item.precioVenta);
    setDescuento(item.descuento);
    // Buscar el producto original en la lista de productos
  const producto = listaProductos.find(p => p._id === item.idProducto);
    if (producto) {
      setCodigoProducto(producto.codigo);
      setCategoriaSeleccionada(producto.categoria);
      setProductoSeleccionado(producto._id);
      setNombreProducto(producto.nombre);
      setStockActual(producto.stock);
    }
    setIndexEditado(index); // Establece el índice del producto que se está editando
    setEditando(true); // Cambia a modo de edición
  };

  const pagoContado = async () => {
    if (listaFactura.length === 0) {
    alert("Aún no hay productos ingresados");
    return;
  }    
    const pago = await buscarPagoPorFactura(numeroFactura);
    const vuelto = await buscarVueltoPorFactura(numeroFactura);    
    if (!pago.ok) {
      alert("Error al buscar pagos.");
      return;
    }
    // Si existe pago → preguntar si desea modificar
    if (pago.pago) {
      const confirmar = window.confirm(
        "Ya existe un pago registrado para esta factura.\n¿Desea modificarlo?"
      );
      if (!confirmar) return;
      setPagoExistente(pago.pago);
    } else {
      setPagoExistente(null);
    }
    // Si existe vuelto → cargarlo
    if (vuelto.ok && vuelto.vuelto) {
      setVueltoExistente(vuelto.vuelto);
    } else {
      setVueltoExistente(null);
    }
    // Abrir modal
    setMostrarPago(true);
  };

  const confirmarSalida = async () => {
    if (!pagoRegistrado) {
      await fetch(`${API_URL}/api/facturas/eliminar-completa/${numeroFactura}`, {
      method: "DELETE"
      });
      return window.close()
    }
    const deseaSalir = window.confirm(
      "Ya se registró un pago para esta factura.\n" +
      "No puede salir sin grabar la factura.\n\n" +
      "¿Desea BORRAR el pago para poder salir?"
    );
    if (!deseaSalir) return;
    if (idPagoExistente) {      
      await fetch(`${API_URL}/api/facturas/eliminar-completa/${numeroFactura}`, {
      method: "DELETE"
      });
    }    
      // ⭐ MENSAJE PROFESIONAL ⭐
      alert("Pago eliminado con éxito");
      setPagoRegistrado(false);
      setIdPagoExistente(null);
      setIdVueltoExistente(null);
      window.close()
    };
    const validarPagoAntes = () => {
      // 1. Validar cliente
      if (!validarCliente()) return;
      if (!pagoRegistrado) {
        alert("Debe registrar el pago antes de guardar la venta.");
        return;
      }
      // Si sí hay pago → guardar normalmente
      guardarVenta();
  };

  const pagoCredito = () => {
  // 1. Validar que haya productos
  if (listaFactura.length === 0) {
    alert("Debe ingresar productos antes de procesar un crédito");
    return;
  }
  // 2. Validar cliente
  if (!clienteSeleccionado) {
    alert("Debe seleccionar un cliente para crédito");
    return;
  }
  // 3. Activar modo crédito
  setModoCredito(true);
  // 4. Abrir el componente de pago
  setMostrarPago(true);
  console.log("Procesando venta a CRÉDITO...");
}; 
 
  const volverAlMenu = async () => {
  try {
    // 1. Borrar la reserva activa
    if (reservaId) {
      await fetch(`${API_URL}/api/facturas/eliminar/${reservaId}`, {
        method: "DELETE"
      });
    }
    // 2. Refrescar la ventana padre (el menú)
    if (window.opener) {
      window.opener.location.reload();
    }
    // 3. Cerrar esta ventana emergente
    window.close();
  } catch (error) {
    console.error("Error eliminando reserva activa:", error);
    // Aun si falla, cerrar la ventana
    if (window.opener) {
      window.opener.location.reload();
    }
    window.close();
  }
};

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div>
      <Encabezado />
      <h2 style={{ textAlign: "left", marginTop: "5px", marginLeft:"250px" }}>
        REGISTRO DE VENTAS
      </h2>

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{ width: "1500px", margin: "0 auto", marginLeft: "15px" }}>    
        {/* CONTENEDOR HORIZONTAL */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", width: "1400px" }}>
          {/* A) DATOS DE LA FACTURA */}
          <div style={{ border: "1px solid #ccc", padding: "1px", borderRadius: "8px", width: "340px", marginBottom: "1px" }}>
            <h3 style={{ marginTop: 0, marginLeft:"5px" }}>Datos de la Factura</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px", marginLeft:"5px" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "110px" }}>
                <label>Fecha</label>                
                <input
                  type="date"
                  value={fecha}
                  onChange={async (e) => {
                  const nuevaFecha = e.target.value;
                  setFecha(nuevaFecha);
                  const tasa = await cargarTasasPorFecha(nuevaFecha);
                  if (!tasa) {
                    setMostrarModalTasas(true);
                    return;
                  }
                  setTasaDolar(tasa.tasaD);
                  setTasaPeso(tasa.tasaP);
                  setCajaDolar(tasa.cajachicaD);
                  setCajaPeso(tasa.cajachicaP);
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
                <label>N° Factura</label>
                <input type="text" value={numeroFactura} readOnly style={{ backgroundColor: "#EDC5CD" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
                <label>Hora</label>
                <input type="text" value={hora} readOnly style={{ backgroundColor: "#EDC5CD" }} />
              </div>
            </div>
          </div>    

          {/* B) DATOS DEL CLIENTE */}
          <div style={{ border: "1px solid #ccc", padding: "1px", borderRadius: "8px", width: "530px", marginBottom: "1px" }}>
            <h3 style={{ marginTop: 0, marginLeft:"5px" }}>Datos del Cliente</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "100px", marginLeft:"5px" }}>
                <label>Identificación</label>
                <input
                  type="text"
                  value={identificacion}
                  onChange={(e) => {
                    const valor = e.target.value.toUpperCase();
                    const regex = /^[VEJG][0-9]*$/;
                    if (valor === "" || regex.test(valor)) {
                      setIdentificacion(valor);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const valor = e.target.value.trim().toUpperCase();
                      buscarClientePorIdentificacion(valor);
                    }
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "250px" }}>
                <label>Nombre</label>
                <select
                  value={clienteSeleccionado ? clienteSeleccionado._id : ""}
                  onChange={(e) => {
                  const id = e.target.value;
                  // Buscar cliente real
                  const cliente = listaClientes.find(c => c._id === id) || null;
                  // Guardar cliente
                  setClienteSeleccionado(cliente);
                  // Actualizar campos visibles
                  setNombreCliente(cliente ? cliente.nombreCompleto : "");
                  setIdentificacion(cliente ? cliente.identificacion : "");
                  // Si no hay cliente, no validar nada
                  if (!cliente) {
                    setMostrarEditorCliente(false);
                    return;
                  }
                  // Validar si está incompleto
                  const incompleto =
                  cliente.nombreCompleto === "CLIENTE POR ACTUALIZAR" ||
                  cliente.direccion === "DIRECCIÓN POR ACTUALIZAR" ||
                  cliente.telefono === "TELÉFONO POR ACTUALIZAR";
                  if (incompleto) {
                    setMostrarEditorCliente(true);
                  } else {
                    setMostrarEditorCliente(false);
                  }
                  }}
                >
                <option value="">Seleccione</option>
                {listaClientes.map((c) => (
                <option key={c._id} value={c._id}>
                {c.nombreCompleto}
                </option>
                ))}
              </select>

              </div>
              <button onClick={() => setMostrarModalCliente(true)} style={{ height: "38px", width: "70px" }}>
                Agregar Cliente
              </button>
              <button onClick={limpiarCliente} style={{ height: "38px" }}>Limpiar</button>       
            </div>
          </div>
        </div>

        {/* SECCIÓN PRODUCTOS */}
        <div style={{ border: "1px solid #ccc", padding: "1px", borderRadius: "8px", width: "1125px", marginTop: "1px", minHeight: "100px" }}>
          <h3 style={{ marginTop: 0, marginLeft:"5px" }}>Productos</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            {/* CÓDIGO */}
            <div style={{ display: "flex", flexDirection: "column", width: "60px", marginLeft:"5px" }}>
              <label>Código</label>
              <input
                type="text"
                value={codigoProducto}
                disabled={editando}
                onChange={(e) => setCodigoProducto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    buscarProductoPorCodigo(codigoProducto);
                  }
                }}
              />
            </div>

            {/* CATEGORÍA */}
            <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
              <label>Categoría</label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}                
                disabled={editando}
              >
                <option value="">Seleccione</option>
                {categoriasDisponibles.map((cat) => (
                  <option key={cat._id} value={cat.codigo}>
                    {cat.descripcion}                     
                  </option>
                ))}
              </select>
            </div>

            {/* PRODUCTO */}
            <div style={{ display: "flex", flexDirection: "column", width: "250px" }}>
              <label>Producto</label>
              <select
                style={{
                    color: "black",
                    backgroundColor: "white",
                    WebkitTextFillColor: "black",
                    appearance: "auto"
                    }}
                value={productoSeleccionado}
                onChange={async (e) => {
                  const id = e.target.value;
                  setProductoSeleccionado(id);
                  const producto = listaProductos.find(p => String(p._id) === String(id));
                  if (producto) {
                    setCategoriaSeleccionada(producto.categoria);
                    setCodigoProducto(producto.codigo);
                    setNombreProducto(producto.descripcion);                    
                    setPrecioVenta(producto.venta);         
                    // ⭐⭐ CONSULTAR STOCK REAL AL BACKEND
                    try {
                    const res = await fetch(`${API_URL}/api/inventario/stock-real/${producto.codigo}`);
                    const data = await res.json();
                    if (data.ok) {
                      setStockActual(data.stockReal);   // ⭐ STOCK REAL
                    } else {
                      setStockActual(producto.stock);   // fallback
                    }
                      } catch (error) {
                        console.error("Error obteniendo stock real:", error);
                        setStockActual(producto.stock);     // fallback
                      }
                    }                  
                }}
                disabled={editando}
              >
                <option value="">Seleccione producto</option>
                {listaProductos
                  .filter(p => p.categoria === categoriaSeleccionada)
                  .map((p) => (
                    //alert("producto " + p);
                    <option key={p._id} value={p._id} style={{ color: "black", backgroundColor: "white" }}>
                      {p.descripcion}                      
                    </option>
                  ))}
              </select>
            </div>

            {/* STOCK */}
            <div style={{ display: "flex", flexDirection: "column", width: "60px" }}>
              <label>Stock</label>
              <input
                type="text"
                value={stockActual}
                readOnly
                style={{
                  backgroundColor: stockActual <= 0 ? "#ffb3b3" : "#EDC5CD",
                  height: "16px"
                }}
              />
              {/* ⭐ MOSTRAR STOCK REAL EN TEXTO (opcional pero útil) */}
              {stockActual !== "" && (
              <span style={{ fontSize: "11px", color: "#3366CC", fontWeight: "bold" }}>
                Real: {stockActual}
              </span>
              )}
              {errorStock && <span style={{ color: "red", fontSize: "12px" }}>{errorStock}</span>}
            </div>

            {/* CANTIDAD */}
            <div style={{ display: "flex", flexDirection: "column", width: "70px" }}>
              <label>Cantidad</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={cantidad}
                onChange={(e) => validarStock(Number(e.target.value))}
              />
            </div>

            {/* PRECIO */}
            <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
              <label>Precio</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"        
                value={precioVenta}
                onChange={(e) => validarPrecio(e.target.value)}                        
              />
            </div>

            {/* DESCUENTO */}
            <div style={{ display: "flex", flexDirection: "column", width: "60px" }}>
              <label>Desc %</label>
              <input
                type="number"
                step="0.1"
                value={descuento}
                onChange={(e) => setDescuento(Number(e.target.value))}
              />
            </div>

            {/* TOTAL */}
            <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
              <label>Total</label>
              <input
                type="text"
                value={formatoVE(totalProducto.toFixed(2))}
                readOnly
                style={{ backgroundColor: "#EDC5CD" }}
              />
            </div>

            {/* BOTÓN BORRAR PRODUCTO */}
            <button onClick={limpiarProducto} style={{ height: "38px" }}>Limpiar</button>

            {/* BOTÓN CARRITO */}
            <button
              disabled={editando}
              onClick={agregarAlCarrito}
              style={{
                opacity: editando ? 0.4 : 1,
                cursor: editando ? "not-allowed" : "pointer",
                background: "none",
                border: "none",                
                marginTop: "18px",
                padding: 0
              }}
            >
              <img
                src={carritoImg}
                alt="carrito"
                style={{
                  width: "28px",
                  height: "28px",
                  objectFit: "contain"
                }}
              />
            </button>
            {editando && (
              <button
                onClick={actualizarProducto}
                style={{
                  fontSize: "22px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginLeft: "1px"
                }}
              >
                ✏️
              </button>
            )}
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div style={{ marginTop: "15px", border: "1px solid #8AB6D6", borderRadius: "8px", padding: "10px", width: "1100px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#6699FF", color: "#FFFFFF" }}>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "80px" }}>Código</th>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "250px" }}>Descripción</th>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "80px" }}>Cant</th>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "80px" }}>Precio</th>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "80px" }}>Desc %</th>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "80px" }}>Total</th>
                <th style={{ padding: "6px", border: "1px solid #000000", width: "80px" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {listaFactura.map((item, index) => (
                <tr key={index} style={{ backgroundColor: "#F2F9FD" }}>
                  <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>{item.codigo}</td>
                  <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>{item.descripcion}</td>
                  <td style={{ padding: "6px", border: "1px solid #8AB6D6", textAlign: "center" }}>{item.cantidad}</td>
                  <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>{item.precioVenta.toFixed(2)}</td>
                  <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>{item.descuento}</td>
                  <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>{item.total.toFixed(2)}</td>
                  <td style={{ padding: "0px", border: "1px solid #8AB6D6", textAlign: "center" }}>
                    <button onClick={() => eliminarItem(index)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>❌</button>
                    <button onClick={() => iniciarEdicion(item, index)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTONES DEBAJO DE LA TABLA */}
        <div style={{ marginTop: "1px", width: "950px", display: "flex", gap: "10px" }}>
          <button onClick={confirmarSalida} style={estiloBoton}>Volver al Menú PRINCIPAL</button>          
          <button 
            onClick={validarPagoAntes} 
            style={botonGuardar}
          >
            Guardar Venta
          </button>
        </div>

        {/* TOTALES */}
        <div style={{ width: "1065px", display: "flex", justifyContent: "flex-end", marginTop: "1px" }}>
          <div style={{ width: "220px", border: "1px solid #8AB6D6", borderRadius: "8px", padding: "10px", backgroundColor: "#EDC5CD" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Subtotal (USD):</span>
              <span>{subtotalDolar.toFixed(2)}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", width: "80px" }}>
              <label>IVA %</label>
              <input type="number" step="0.1" value={iva} onChange={(e) => setIva(e.target.value)} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1px", paddingTop: "8px", borderTop: "1px solid #8AB6D6", fontSize: "16px", fontWeight: "bold" }}>
              <span>Total (USD):</span>
              <span>{totalDolar.toFixed(2)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <span>Total (COP):</span>
              <span>{formatoVE(totalPeso.toFixed(2))}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <span style={{ fontWeight: "bold" }}>Total (Bs):</span>
              <span>{formatoVE(totalBs.toFixed(2))}</span>
            </div>
          </div>
        </div>

        {/* BOTONES DE PAGO */}
        <div style={{ width: "1115px", display: "flex", justifyContent: "flex-end", marginTop: "1px", gap: "5px" }}>
          <button onClick={() => {
            registrarAccion("Abrió modal de pago");
            pagoContado();
          }} 
            style={estiloBoton}>Contado</button>
          {mostrarPago && (
            <Pago
  modoCredito={modoCredito}
  fecha={fecha}
  facturaNumero={numeroFactura}
  totalDolar={totalDolar}
  totalPeso={totalPeso}
  totalBs={totalBs}
  tasaP={tasaPeso}
  tasaD={tasaDolar}
  pagoExistente={pagoExistente}
  vueltoExistente={vueltoExistente}
  idVueltoExistente={idVueltoExistente}
  onCerrar={() => setMostrarPago(false)}

  onPagoCompletado={(dataPago) => { 
    console.log("Pago registrado:", dataPago); 
    setPagoData(dataPago);
    setPagoRegistrado(true);
    setIdPagoExistente(dataPago.idPago);
    setIdVueltoExistente(dataPago.idVuelto);
  }}
/>

          )}          
          {mostrarEditorCliente && clienteSeleccionado && (          
          <EditarCliente
          cliente={clienteSeleccionado}          
          onCerrar={() => setMostrarEditorCliente(false)}
          onGuardado={(clienteActualizado) => {
          setClienteSeleccionado(clienteActualizado);
          setMostrarEditorCliente(false);          
          }}
      />
        )}
          <button onClick={() => {
            registrarAccion("Abrió modal de pago a Crédito");
            pagoCredito();
          }} style={{ ...estiloBoton, backgroundColor: "#6699FF" }}>Crédito</button>

          {mostrarModalTasas && (
            <ModalTasas
              fecha={fecha}
              onCerrar={() => setMostrarModalTasas(false)}
              onGuardado={(tasaNueva) => setTasas(tasaNueva)}
            />
          )}
        </div>
      </div>
    </div>
  );
};


const formatoVE = (valor) => {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default Ventas;