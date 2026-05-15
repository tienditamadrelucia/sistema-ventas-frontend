import React, { useState, useEffect, useRef } from "react";
import Encabezado from "../components/Encabezado";
import carritoImg from "../assets/carrito.png";
import { useNavigate } from "react-router-dom";
import Pago from "../components/Pago/Pago";
import axios from "axios";
import { cargarCategorias } from "../services/categorias";
import { cargarProductos } from "../services/productos";
import { buscarVueltoPorFactura, buscarPagoPorFactura } from "../services/ser_moneda";
import EditarCliente from "../components/Clientes/EditarCliente";
import ModalCliente from "../components/Clientes/ModalCliente";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";
import ModalTasas from "../components/Tasas/ModalTasas";
import { cargarTasasPorFecha } from "../services/ser_tasas";
import { guardarVta, guardarVendido} from "../services/ser_ventas";

const Ventas = () => {
  const navigate = useNavigate();

  // -----------------------------
  // ESTADOS PRINCIPALES
  // -----------------------------

  // FACTURA
  const [numeroFactura, setNumeroFactura] = useState("");
  const [hora, setHora] = useState("");    
  const [fechaString, setFechaString] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [identificacion, setIdentificacion] = useState("");
  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");

  // PRODUCTOS
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const cantidadRef = useRef(null);
  const carritoRef = useRef(null);
  const codigoRef = useRef(null);
  const [descuento, setDescuento] = useState(0);
  const [codigoProducto, setCodigoProducto] = useState("");
  const codigoProductoRef = useRef(null);
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
  const [venta, setVenta] = useState(null);

  // TASAS
  const [mostrarModalTasas, setMostrarModalTasas] = useState(false);
  const [tasaDolar, setTasaDolar] = useState(0);
  const [tasaPeso, setTasaPeso] = useState(0);
  const [cajaDolar, setCajaDolar] = useState(0);
  const [cajaPeso, setCajaPeso] = useState(0);

  // PAGOS
  const [pagoExistente, setPagoExistente] = useState(null);
  const [vueltoExistente, setVueltoExistente] = useState(null);
  const [pagoRegistrado, setPagoRegistrado] = useState(false);
  const [idPagoExistente, setIdPagoExistente] = useState(null);
  const [idVueltoExistente, setIdVueltoExistente] = useState(null);
  const [modoCredito, setModoCredito] = useState(false);
  const [pagoData, setPagoData] = useState(null);
  const [esCredito, setEsCredito] = useState(false);
  const [abono, setAbono] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [cliente, setCliente] = useState({});

  // CLIENTE
  const [mostrarEditorCliente, setMostrarEditorCliente] = useState(false);

  // OTROS
  const [reservaId, setReservaId] = useState(null); // ya casi obsoleto, pero lo dejamos por compatibilidad
  const [ventaFinalizada, setVentaFinalizada] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [estado, setEstado] = useState("normal");

  const estiloBoton = {
    width: "20%",
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
  const estiloBotonVerde = {
    width: "20%",
    padding: "5px",
    backgroundColor: "#74c769",
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
  backgroundColor:
    estado === "hover" ? "#c97a87" :
    estado === "active" ? "#b86c78" :
    "#D98897",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontFamily: "Arial Black",
  marginTop: "8px",
  opacity: procesando ? 0.6 : 1,
  cursor: procesando ? "not-allowed" : "pointer",
  transition: "0.15s"
};

  const API = `${API_URL}/api`;
  const UsuarioActual = localStorage.getItem("usuarioNombre") || "Usuario";
  const hoyLocal = new Date();
  const hoyUTC = new Date(Date.UTC(
    hoyLocal.getFullYear(),
    hoyLocal.getMonth(),
    hoyLocal.getDate(),
    0, 0, 0
    ));
  const hoy = hoyUTC.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const [fecha, setFecha] = useState(hoyUTC.toISOString().slice(0, 10));

  // -----------------------------
  // VALIDAR TASAS DEL DÍA
  // -----------------------------
  useEffect(() => {
    const validarTasasDeHoy = async () => {
      try {
        const res = await axios.get(`${API}/tasas/por-fecha/${hoy}`);
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

  // -----------------------------
  // CARGAR TASAS POR FECHA
  // -----------------------------
  useEffect(() => {
  const cargarTasas = async () => {
    if (!fecha) return;
    try {
      const res = await axios.get(`${API_URL}/api/tasas/por-fecha/${fecha}`);
      const { tasaD, tasaP, cajachicaD, cajachicaP } = res.data.tasa;
      setTasaDolar(tasaD);
      setTasaPeso(tasaP);
      setCajaDolar(cajachicaD);
      setCajaPeso(cajachicaP);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return;
      }
      console.error("Error REAL cargando tasas:", error);
    }
  };
  cargarTasas();
}, [fecha]);

  // -----------------------------
  // CARGAR CLIENTES / PRODUCTOS / HORA
  // -----------------------------
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
      alert("catch frontend dice: Error cargando clientes");
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
  // CÁLCULO TOTALES
  // -----------------------------
  useEffect(() => {
    const precioNum = parseFloat(precioVenta) || 0;
    const descNum = parseFloat(descuento) || 0;
    const cantNum = parseFloat(cantidad) || 0;
    const total = cantNum * precioNum - cantNum * precioNum * (descNum / 100);
    setTotalProducto(total);
  }, [cantidad, precioVenta, descuento]);

  useEffect(() => {
    const subtotal = listaFactura.reduce(
      (acc, item) => acc + parseFloat(item.total || 0),
      0
    );
    setSubtotalDolar(subtotal);
    const ivaDecimal = (parseFloat(iva) || 0) / 100;
    const total = subtotal + subtotal * ivaDecimal;
    setTotalDolar(total);
    setTotalPeso(total * tasaPeso || 0);
    setTotalBs(total * tasaDolar || 0);
  }, [listaFactura, iva, tasaPeso, tasaDolar]);

  // -----------------------------
  // HORA
  // -----------------------------
  const generarHora = () => {
    const ahora = new Date();
    const h = ahora.toLocaleTimeString("es-VE", { hour12: false });
    setHora(h);
  };

  // -----------------------------
  // UTILIDADES
  // -----------------------------  
  const buscarClientePorIdentificacion = async (cedula) => {
    cedula = cedula.trim().toUpperCase();
    if (!cedula) return;
    try {
      const res = await fetch(`${API_URL}/api/clientes/cedula/${cedula}`);
      if (res.status === 404) {
        console.log("❌ Cliente NO encontrado → abrir modal");
        setIdentificacion(cedula);
        setMostrarModalCliente(true);
        return;
      }
      if (!res.ok) {
        alert("Error buscando cliente");
        return;
      }
      const data = await res.json();
      const cliente = data.cliente ?? data;
      if (!cliente || !cliente._id) {
        alert("Respuesta inválida del servidor");
        return;
      }
      setClienteSeleccionado(cliente);
      setNombreCliente(cliente.nombreCompleto || "");
      setIdentificacion(cliente.identificacion || "");
      setListaClientes((prev) => {
        const existe = prev.some((c) => c._id === cliente._id);
        return existe ? prev : [...prev, cliente];
      });
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
    // ⭐ ENFOCAR AUTOMÁTICAMENTE EN EL CÓDIGO DEL PRODUCTO
    if (codigoProductoRef.current) {
      codigoProductoRef.current.focus();
      codigoProductoRef.current.select();
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
    if (
      clienteSeleccionado.nombreCompleto === "CLIENTE POR ACTUALIZAR" ||
      clienteSeleccionado.direccion === "DIRECCIÓN POR ACTUALIZAR" ||
      clienteSeleccionado.telefono === "TELÉFONO POR ACTUALIZAR"
    ) {
      alert("El cliente tiene datos incompletos.");
      return true;
    }
    return true;
  };

  // -----------------------------
  // PRODUCTOS
  // -----------------------------
  const buscarProductoPorCodigo = async (codigo) => {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const producto = listaProductos.find(
      (p) => String(p.codigo).trim().toUpperCase() === codigoNormalizado
    );
    if (!producto) {
      alert("Producto no encontrado");
      return;
    }
    setCategoriaSeleccionada(producto.categoria);
    setProductoSeleccionado(producto._id);
    setNombreProducto(producto.descripcion);
    setPrecioVenta(producto.venta);

    try {
      const res = await fetch(`${API_URL}/api/inventario/stock-real/${codigoNormalizado}`);
      const data = await res.json();
      if (data.ok) {
        setStockActual(data.stockReal);
      } else {
        setStockActual(producto.stock);
      }
    } catch (error) {
      console.error("Error obteniendo stock real:", error);
      setStockActual(producto.stock);
    }
    // ⭐ ENFOCAR AUTOMÁTICAMENTE EN CANTIDAD
    if (cantidadRef.current) {
      cantidadRef.current.focus();
      cantidadRef.current.select(); // opcional
      }
  };

  const validarPrecio = (valor) => {
    const num = Number(valor);
    setPrecioVenta(num);
    if (num <= 0) {
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

  const limpiarProducto = () => {
    setCodigoProducto("");
    setCategoriaSeleccionada("");
    setProductoSeleccionado("");
    setStockActual(0);
    setCantidad(0);
    setPrecioVenta(0);
    setDescuento(0);
  };

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
    console.log("🟩 listaFactura:", listaFactura);

    limpiarProducto();
    if (codigoProductoRef.current) {
      codigoProductoRef.current.focus();
      codigoProductoRef.current.select(); // opcional
      }
  };

  const actualizarProducto = () => {
    if (indexEditado === null) {
      alert("Ningún producto está siendo editado");
      return;
    }
    const nuevos = [...listaFactura];
    const precioNum = parseFloat(precioVenta);
    const descNum = parseFloat(descuento) || 0;
    const totalCalc =
      cantidad * precioNum - cantidad * precioNum * (descNum / 100);
    nuevos[indexEditado] = {
      ...nuevos[indexEditado],
      cantidad: Number(cantidad),
      precioVenta: precioNum,
      descuento: descNum,
      total: totalCalc
    };
    setTotalProducto(totalCalc);
    setListaFactura(nuevos);
    limpiarProducto();
    setEditando(false);
    setIndexEditado(null);
  };

  const eliminarItem = (index) => {
    const nuevaLista = [...listaFactura];
    nuevaLista.splice(index, 1);
    setListaFactura(nuevaLista);
  };

  const iniciarEdicion = (item, index) => {
    setCantidad(item.cantidad);
    setPrecioVenta(item.precioVenta);
    setDescuento(item.descuento);
    const producto = listaProductos.find((p) => p._id === item.idProducto);
    if (producto) {
      setCodigoProducto(producto.codigo);
      setCategoriaSeleccionada(producto.categoria);
      setProductoSeleccionado(producto._id);
      setNombreProducto(producto.nombre || producto.descripcion);
      setStockActual(producto.stock);
    }
    setIndexEditado(index);
    setEditando(true);
  };

  // -----------------------------
  // OBTENER NÚMERO DE FACTURA (SOLO LECTURA)
  // -----------------------------
  const obtenerFacturaNro = async () => {
  const res = await fetch(`${API_URL}/api/ventas/factura-actual`);
  const data = await res.json();
    return data.numero; // número actual del contador, SIN incrementar
  };

  // -----------------------------
  // PAGOS
  // -----------------------------
  const pagoContado = async () => {      
  if (listaFactura.length === 0) {
    alert("Aún no hay productos ingresados");
    return;
  }
  let facturaNumero = numeroFactura;
  // ⭐ 1) DETERMINAR NÚMERO DE FACTURA
  if (!facturaNumero || facturaNumero === "") {
    // Venta nueva → generar número
    const fact = await obtenerFacturaNro(); 
    facturaNumero = fact + 1;
    setNumeroFactura(facturaNumero);
  }
  // Si ya tiene número → NO generar nada

  // ⭐ 2) VALIDAR PAGO EXISTENTE
  const pago = await buscarPagoPorFactura(facturaNumero);
  const vuelto = await buscarVueltoPorFactura(facturaNumero);
  if (!pago.ok) {
    alert("Error al buscar pagos.");
    return;
  }
  if (pago.pago) {
    const confirmar = window.confirm(
      "Ya existe un pago registrado para esta factura.\n¿Desea modificarlo?"
    );
    if (!confirmar) return;
    setPagoExistente(pago.pago);
  } else {
    setPagoExistente(null);
  }
  if (vuelto.ok && vuelto.vuelto) {
    setVueltoExistente(vuelto.vuelto);
  } else {
    setVueltoExistente(null);
  }
  // ⭐ 3) ABRIR MODAL DE PAGO
  setModoCredito(false);
  setMostrarPago(true);
};

  const pagoCredito = async () => {
    if (listaFactura.length === 0) {
      alert("Debe ingresar productos antes de procesar un crédito");
      return;
    }
    let facturaNumero = numeroFactura;
    // ⭐ 1) DETERMINAR NÚMERO DE FACTURA
    if (!facturaNumero || facturaNumero === "") {
    // Venta nueva → generar número
    const fact = await obtenerFacturaNro(); 
    facturaNumero = fact + 1;
    setNumeroFactura(facturaNumero);
    }
    // Si ya tiene número → NO generar nada
    
    if (!clienteSeleccionado) {
      alert("Debe seleccionar un cliente para crédito");
      return;
    }    
    setNumeroFactura(facturaNumero);
    setModoCredito(true);
    setPagoExistente(null);
    setVueltoExistente(null);
    setMostrarPago(true);
    console.log("Procesando venta a CRÉDITO...");
  };

  const validarPagoAntes = () => {
    if (!validarCliente()) return;
    if (!pagoRegistrado) {
      alert("Debe registrar el pago antes de guardar la venta.");
      return;
    }
    guardarVenta();
  };

  // -----------------------------
  // GUARDAR VENTA
  // -----------------------------
  const guardarVenta = async () => {
  if (procesando) return;
  setProcesando(true);
  try {
    // ============================
    // 1) USAR EL NÚMERO DE FACTURA EXISTENTE
    // ============================
    const facturaNumero = numeroFactura;

    if (!facturaNumero || facturaNumero === 0) {
      alert("Error: No hay número de factura asignado.");
      return;
    }
    // ============================
    // 2) VERIFICAR SI LA FACTURA YA EXISTE
    // ============================
    const respExiste = await fetch(`${API_URL}/api/ventas/${facturaNumero}`);
    const dataExiste = await respExiste.json();

    if (dataExiste.ok && dataExiste.venta) {
      // ⭐ EXISTE → ELIMINAR VENTA
      await fetch(`${API_URL}/api/ventas/${dataExiste.venta._id}`, {
        method: "DELETE"
      });
      // ⭐ ELIMINAR VENDIDOS ASOCIADOS
      await fetch(`${API_URL}/api/vendidos/eliminarPorFactura/${facturaNumero}`, {
        method: "DELETE"
      });
    }
    // ============================
    // 3) PREPARAR DATOS DE LA NUEVA VENTA
    // ============================
    const { idPago, idVuelto, totalAbonado, modoCredito: esCredito } = pagoData || {};
    const estado = esCredito ? "CREDITO" : "CONTADO";
    const abono = esCredito ? totalAbonado : totalDolar;
    const saldo = esCredito ? totalDolar - totalAbonado : 0;
    const ventaData = {
      factura: facturaNumero,
      cliente: identificacion,
      fecha,
      hora,
      subtotal: subtotalDolar,
      IVA: iva,
      total: totalDolar,
      usuario: UsuarioActual,
      estado
    };
    // ============================
    // 4) GUARDAR LA VENTA NUEVA
    // ============================
    const resVenta = await fetch(`${API_URL}/api/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ventaData)
    });
    const dataVenta = await resVenta.json();
    if (!resVenta.ok || !dataVenta.ok) {
      alert("Error guardando la venta");
      return;
    }
    // ============================
    // 5) GUARDAR LOS PRODUCTOS VENDIDOS
    // ============================
    for (const item of listaFactura) {
        const vendidoData = {            
          factura: facturaNumero,
          productoId:item.idProducto, 
          cantidad: item.cantidad,
          precio: item.precioVenta,
          dscto: item.descuento || 0, 
          total: item.total
          };
          console.log("➡️ ENVIANDO VENDIDO:", vendidoData);

    await guardarVendido(vendidoData)      
    }
    alert(`Venta guardada correctamente.\nFactura N° ${facturaNumero}`);
    // ============================
    // 6) LIMPIAR PANTALLA
    // ============================
    setNumeroFactura("")    
    limpiarCliente();
    setPagoData(null);
    setPagoRegistrado(false);
    setIdPagoExistente(null);
    setIdVueltoExistente(null);
    setListaFactura([]);
    setClienteSeleccionado("");
    setModoCredito(false);
    setNumeroFactura(0);
    setIva(0)
    
  } catch (error) {
    console.error("Error guardando venta:", error);
    alert("Error guardando venta");
  } finally {
    setProcesando(false);
  }
};

  // -----------------------------
  // SALIDA / CANCELACIÓN
  // -----------------------------
  const confirmarSalida = async () => {
    // Si no hay pago registrado, no hay nada en backend que limpiar
    if (!pagoRegistrado) {
      window.close();
      return;
    }
    const deseaSalir = window.confirm(
      "Ya se registró un pago para esta factura.\n" +
        "No puede salir sin grabar la factura.\n\n" +
        "¿Desea BORRAR el pago para poder salir?"
    );
    if (!deseaSalir) return;
    if (numeroFactura) {
      await fetch(`${API_URL}/api/facturas/eliminar-completa/${numeroFactura}`, {
        method: "DELETE"
      });
    }
    alert("Pago eliminado con éxito");
    setPagoRegistrado(false);
    setIdPagoExistente(null);
    setIdVueltoExistente(null);
    setNumeroFactura(0);
    window.close();
  };

  const volverAlMenu = () => {
  try {
    if (window.opener) {
      window.opener.location.reload(); // refresca el menú
    }
    window.close(); // cierra esta ventana
  } catch (error) {
    console.error("Error al volver al menú:", error);
    if (window.opener) {
      window.opener.location.reload();
    }
    window.close();
  }
};

  const guardarSinPago = async () => {
  try {
    // ============================
    // VALIDAR QUE HAY PRODUCTOS
    // ============================
    if (listaFactura.length === 0) {
      alert("No hay productos en la factura");
      return;
    }
    // ============================
    // ASIGNAR NÚMERO DE FACTURA
    // ============================
    const numeroActual = await obtenerFacturaNro();
    alert("factura "+numeroActual);
    const facturaNumero = Number(numeroActual) + 1;
    // ============================
    // ARMAR OBJETO DE VENTA
    // ============================
    setProcesando(true);
    const ventaData = {
      fecha: fecha,
      hora: hora,       // ya lo tienes en tu módulo
      factura: facturaNumero,
      cliente: identificacion,       // NO se puede cambiar luego
      subtotal: subtotalDolar,
      IVA: iva,
      total: totalDolar,
      usuario: UsuarioActual, // ya lo tienes
      estado: "CREDITO"       // ⭐ PENDIENTE DE PAGO
    };
    console.log("VENTA QUE SE ENVÍA:", ventaData);
    // ============================
    // GUARDAR VENTA
    // ============================
    const respVenta = await guardarVta(ventaData);    
    if (!respVenta.data || respVenta.data.ok !== true) {
      alert("Error guardando la venta");
      return;
      }

    // ============================
    // GUARDAR PRODUCTOS VENDIDOS
    // ============================
    console.log("LISTA FACTURA COMPLETA:", listaFactura);
    for (const item of listaFactura) {
      const vendidoData = {
        factura: facturaNumero,
        productoId: productoSeleccionado._id,
        cantidad: item.cantidad,
        precio: item.precioVenta,
        dscto: item.descuento || 0,
        total: item.total
      };      
      await guardarVendido(vendidoData);
      
    }
    // ============================
    // ALERTAR AL USUARIO
    // ============================
    setProcesando(false);
    alert(`Factura guardada sin pago. \nNúmero: ${facturaNumero}`);
    // ============================
    // LIMPIAR PANTALLA
    // ============================
    limpiarCliente();
    setPagoData(null);
    setPagoRegistrado(false);
    setIdPagoExistente(null);
    setIdVueltoExistente(null);
    setListaFactura([]);
    setClienteSeleccionado("");
    setModoCredito(false);
    setNumeroFactura(0);
  } catch (error) {
  console.error("ERROR COMPLETO:", error);
  console.error("RESPUESTA DEL SERVIDOR:", error.response?.data);
  alert("Error inesperado al guardar la factura sin pago");
}
};

  const pagarFactura = async () => {
  const numero = prompt("Ingrese el número de factura a pagar:");
  if (!numero) return;
    setProcesando(true);
  try {
    setNumeroFactura(numero)
    // 1. Verificar si ya tiene pago
    const respPago = await fetch(`${API_URL}/api/moneda/factura/${numero}`);
    const dataPago = await respPago.json();
    if (dataPago.ok && Array.isArray(dataPago.lista) && dataPago.lista.length > 0) {
      alert("Esta factura ya tiene pago registrado.");
      return;
    }
    // 2. Buscar venta + detalle (RUTA CORRECTA)
    const res = await fetch(`${API_URL}/api/ventas/detalle/${numero}`);
    const data = await res.json();
    if (!data.ok) {
      alert("Factura no encontrada");
      return;
    }
    // 3. Guardar datos de la venta
    setVenta(data.venta);    
    // 5. Buscar cliente
    const cedula = data.venta.cliente;
    alert("cliente "+cedula);
    const datosCliente = await buscarCliente(cedula);    
    setCliente(datosCliente);
    // 6. Cargar detalle (productos)
    await cargarDetalleFacturaParaPago(data.detalle);
    alert("Factura cargada. Puede registrar el pago.");
  } catch (error) {
    console.error("Error consultando factura:", error);
    alert("Frontend dice: Error consultando factura");
  } finally {
    setProcesando(false);
  }
};

  const buscarCliente = async (cedula) => {
    cedula = cedula.trim().toUpperCase();
    if (!cedula) return;
    try {
      const res = await fetch(`${API_URL}/api/clientes/cedula/${cedula}`);
      if (res.status === 404) {
        console.log("❌ Cliente NO encontrado → abrir modal");
        setIdentificacion(cedula);
        setMostrarModalCliente(true);
        return;
      }
      if (!res.ok) {
        alert("Error buscando cliente");
        return;
      }
      const data = await res.json();
      const cliente = data.cliente ?? data;
      if (!cliente || !cliente._id) {
        alert("Respuesta inválida del servidor");
        return;
      }
      setClienteSeleccionado(cliente);
      setNombreCliente(cliente.nombreCompleto || "");
      setIdentificacion(cliente.identificacion || "");
      setListaClientes((prev) => {
        const existe = prev.some((c) => c._id === cliente._id);
        return existe ? prev : [...prev, cliente];
      });
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

const cargarDetalleFacturaParaPago = async (detalle) => {
  try {
    if (!Array.isArray(detalle) || detalle.length === 0) {
      alert("La factura no tiene productos.");
      setListaFactura([]);
      return;
    }
    const listaReconstruida = [];
    for (const item of detalle) {
      // Buscar producto
      const resProd = await fetch(`${API_URL}/api/productos/${item.productoId}`);
      const dataProd = await resProd.json();
      const producto = dataProd.producto ?? dataProd;
      listaReconstruida.push({
        codigo: producto.codigo || "",
        descripcion: producto.descripcion || "",
        cantidad: item.cantidad ?? 0,
        precioVenta: producto.venta ?? 0,        
        descuento: item.dscto ?? 0,
        total: item.total ?? 0
      });
    }
    setListaFactura(listaReconstruida);
  } catch (error) {
    console.error("Error cargando detalle:", error);
    alert("Frontend dice: Error cargando detalle de la factura");
  }
};

const cargarFacturaParaPago = async (dataVenta) => {
  try {
    const venta = dataVenta.venta;
    const detalle = dataVenta.detalle;
    console.log("VENTA PARA PAGO:", venta);
    console.log("DETALLE PARA PAGO:", detalle);
    if (!venta) {
      alert("No se recibió la venta.");
      return;
    }
    setVenta(venta);
    setClienteSeleccionado(venta.cliente || "");
    if (!Array.isArray(detalle)) {
      alert("La factura no tiene productos en el detalle.");
      setListaFactura([]);
      return;
    }
    const lista = detalle.map(v => ({
      _id: v.productoId?._id || v.productoId || "",
      codigo: v.productoId?.codigo || "",
      descripcion: v.productoId?.descripcion || "",
      cantidad: v.cantidad ?? 0,
      precio: v.precio ?? 0,
      dscto: v.dscto ?? 0,
      total: v.total ?? 0
    }));    
    setListaFactura(lista);
    alert("Factura cargada. Puede modificar productos y luego registrar el pago.");
  } catch (error) {
    console.error("Error cargando factura:", error);
    alert("Error inesperado al cargar la factura.");
  }
};


  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div>
      {procesando && (
      <div style={{
        background: "#6699FF",
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
      <Encabezado />
      <h2 style={{ textAlign: "left", marginTop: "5px", marginLeft: "250px" }}>
        REGISTRO DE VENTAS
      </h2>

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{ width: "1500px", margin: "0 auto", marginLeft: "15px" }}>
        {/* CONTENEDOR HORIZONTAL */}
        <div
          style={{display: "flex", gap: "10px", alignItems: "flex-start", width: "1400px" }}>
          {/* A) DATOS DE LA FACTURA */}
          <div style={{ border:"1px solid #ccc", padding:"1px", borderRadius:"8px", width:"440px", marginBottom:"1px" }}>
            <h3 style={{ marginTop:0, marginLeft:"5px" }}>Datos de la Factura</h3>
            <div style={{ display:"flex", gap:"10px", marginBottom:"10px", marginLeft:"5px" }}>
              {/* FECHA */}
              <div style={{ display:"flex", flexDirection:"column", width:"210px" }}>
                <label>Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={async (e) => {
                  const f = e.target.value;
                  setFecha(f);
                  const tasa = await cargarTasasPorFecha(f);
                  if (!tasa) return setMostrarModalTasas(true);
                    const { tasaD, tasaP, cajachicaD, cajachicaP } = tasa;
                    setTasaDolar(tasaD); setTasaPeso(tasaP);
                    setCajaDolar(cajachicaD); setCajaPeso(cajachicaP);
                  }}
                />
              </div>
              {/* FACTURA */}
              <div style={{ display:"flex", flexDirection:"column", width:"100px" }}>
                <label>N° Factura</label>
                <input type="text" value={numeroFactura || ""} readOnly style={{ background:"#EDC5CD" }} />
              </div>
              {/* HORA */}
              <div style={{ display:"flex", flexDirection:"column", width:"100px" }}>
                <label>Hora</label>
                <input type="text" value={hora} readOnly style={{ background:"#EDC5CD" }} />
              </div>
              {/* BOTÓN */}
              <button onClick={pagarFactura} style={estiloBotonVerde }>Buscar</button>
            </div>
          </div>

          {/* B) DATOS DEL CLIENTE */}
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1px",
              borderRadius: "8px",
              width: "530px",
              marginBottom: "1px"
            }}
          >
            <h3 style={{ marginTop: 0, marginLeft: "5px" }}>Datos del Cliente</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "100px", marginLeft: "5px" }}>
                <label>Identificación</label>
                <input
                  type="text"
                  value={identificacion}
                  onChange={(e) => {
                    const valor = e.target.value.toUpperCase();
                    const regex = /^[VEJG][0-9]*$/;
                    if (valor === "" || regex.test(valor)) setIdentificacion(valor);
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
                    const cliente = listaClientes.find((c) => c._id === id) || null;
                    setClienteSeleccionado(cliente);
                    setNombreCliente(cliente ? cliente.nombreCompleto : "");
                    setIdentificacion(cliente ? cliente.identificacion : "");
                    if (!cliente) return setMostrarEditorCliente(false);
                      const incompleto =
                      cliente.nombreCompleto === "CLIENTE POR ACTUALIZAR" ||
                      cliente.direccion === "DIRECCIÓN POR ACTUALIZAR" ||
                      cliente.telefono === "TELÉFONO POR ACTUALIZAR";
                      setMostrarEditorCliente(incompleto);
                    }}
                >
                  <option value="">Seleccione</option>
                  {listaClientes.map((c) => (
                  <option key={c._id} value={c._id}>{c.nombreCompleto}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setMostrarModalCliente(true)}
                style={{ height: "38px", width: "70px" }}
              >
                Agregar Cliente
              </button>
              <button onClick={limpiarCliente} style={{ height: "38px" }}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
        {/* SECCIÓN PRODUCTOS */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: "1px",
            borderRadius: "8px",
            width: "1125px",
            marginTop: "1px",
            minHeight: "100px"
          }}
        >
          <h3 style={{ marginTop: 0, marginLeft: "5px" }}>Productos</h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-end"
            }}
          >
            {/* CÓDIGO */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "60px",
                marginLeft: "5px"
              }}
            >
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
                ref={codigoProductoRef}
              />
            </div>

            {/* CATEGORÍA */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "150px"
              }}
            >
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "250px"
              }}
            >
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
                  const producto = listaProductos.find(
                    (p) => String(p._id) === String(id)
                  );
                  if (producto) {
                    setCategoriaSeleccionada(producto.categoria);
                    setCodigoProducto(producto.codigo);
                    setNombreProducto(producto.descripcion);
                    setPrecioVenta(producto.venta);
                    try {
                      const res = await fetch(
                        `${API_URL}/api/inventario/stock-real/${producto.codigo}`
                      );
                      const data = await res.json();
                      if (data.ok) {
                        setStockActual(data.stockReal);
                      } else {
                        setStockActual(producto.stock);
                      }
                    } catch (error) {
                      console.error("Error obteniendo stock real:", error);
                      setStockActual(producto.stock);
                    }
                  }
                }}
                disabled={editando}
              >
                <option value="">Seleccione producto</option>
                {listaProductos
                  .filter((p) => p.categoria === categoriaSeleccionada)
                  .map((p) => (
                    <option
                      key={p._id}
                      value={p._id}
                      style={{
                        color: "black",
                        backgroundColor: "white"
                      }}
                    >
                      {p.descripcion}
                    </option>
                  ))}
              </select>
            </div>

            {/* STOCK */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "60px"
              }}
            >
              <label>Stock</label>
              <input
                type="text"
                value={stockActual}
                readOnly
                style={{
                  backgroundColor:
                    stockActual <= 0 ? "#ffb3b3" : "#EDC5CD",
                  height: "16px"
                }}
              />
              {stockActual !== "" && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#3366CC",
                    fontWeight: "bold"
                  }}
                >
                  Real: {stockActual}
                </span>
              )}
              {errorStock && (
                <span
                  style={{ color: "red", fontSize: "12px" }}
                >
                  {errorStock}
                </span>
              )}
            </div>

            {/* CANTIDAD */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "70px"
              }}
            >
              <label>Cantidad</label>
              <input
                type="number"
                step="0.1"
                min="0"
                ref={cantidadRef}
                value={cantidad}
                onChange={(e) =>
                  validarStock(Number(e.target.value))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (carritoRef.current) {
                      carritoRef.current.focus();
                      }
                    }
                }}
              />
            </div>

            {/* PRECIO */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "120px"
              }}
            >
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "60px"
              }}
            >
              <label>Desc %</label>
              <input
                type="number"
                step="0.1"
                value={descuento}
                onChange={(e) =>
                  setDescuento(Number(e.target.value))
                }
              />
            </div>

            {/* TOTAL */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "120px"
              }}
            >
              <label>Total</label>
              <input
                type="text"
                value={formatoVE(totalProducto.toFixed(2))}
                readOnly
                style={{ backgroundColor: "#EDC5CD" }}
              />
            </div>

            {/* BOTÓN BORRAR PRODUCTO */}
            <button
              onClick={limpiarProducto}
              style={{ height: "38px" }}
            >
              Limpiar
            </button>

            {/* BOTÓN CARRITO */}
            <button
              disabled={editando}
              ref={carritoRef}
              onClick={agregarAlCarrito}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarAlCarrito();
                if (codigoRef.current) {
                  codigoRef.current.focus();
                  codigoRef.current.select();
                  }
                }
              }}
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
        <div
          style={{
            marginTop: "15px",
            border: "1px solid #8AB6D6",
            borderRadius: "8px",
            padding: "10px",
            width: "1100px"
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px"
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#6699FF",
                  color: "#FFFFFF"
                }}
              >
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "80px"
                  }}
                >
                  Código
                </th>
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "250px"
                  }}
                >
                  Descripción
                </th>
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "80px"
                  }}
                >
                  Cant
                </th>
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "80px"
                  }}
                >
                  Precio
                </th>
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "80px"
                  }}
                >
                  Desc %
                </th>
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "80px"
                  }}
                >
                  Total
                </th>
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #000000",
                    width: "80px"
                  }}
                >
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {listaFactura.map((item, index) => (
                <tr
                  key={index}
                  style={{ backgroundColor: "#F2F9FD" }}
                >
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #8AB6D6"
                    }}
                  >
                    {item.codigo}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #8AB6D6"
                    }}
                  >
                    {item.descripcion}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #8AB6D6",
                      textAlign: "center"
                    }}
                  >
                    {item.cantidad}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #8AB6D6"
                    }}
                  >
                    {item.precioVenta.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #8AB6D6"
                    }}
                  >
                    {item.descuento}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #8AB6D6"
                    }}
                  >
                    {item.total.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "0px",
                      border: "1px solid #8AB6D6",
                      textAlign: "center"
                    }}
                  >
                    <button
                      onClick={() => eliminarItem(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px"
                      }}
                    >
                      ❌
                    </button>
                    <button
                      onClick={() => iniciarEdicion(item, index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "18px"
                      }}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTONES DEBAJO DE LA TABLA */}
        <div
          style={{
            marginTop: "1px",
            width: "950px",
            display: "flex",
            gap: "10px"
          }}
        >
          <button
            onClick={confirmarSalida}
            style={estiloBoton}
          >
            Volver al Menú PRINCIPAL
          </button>
          <button
            onClick={validarPagoAntes}
            style={botonGuardar}
            disabled={procesando}
            onMouseEnter={() => setEstado("hover")}
            onMouseLeave={() => setEstado("normal")}
            onMouseDown={() => setEstado("active")}
            onMouseUp={() => setEstado("hover")}
          >
            Guardar Venta
          </button>
        </div>

        {/* TOTALES */}
        <div
          style={{
            width: "1065px",
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "1px"
          }}
        >
          <div
            style={{
              width: "220px",
              border: "1px solid #8AB6D6",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#EDC5CD"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <span style={{ fontWeight: "bold" }}>
                Subtotal (USD):
              </span>
              <span>{subtotalDolar.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "80px"
              }}
            >
              <label>IVA %</label>
              <input
                type="number"
                step="0.1"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1px",
                paddingTop: "8px",
                borderTop: "1px solid #8AB6D6",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              <span>Total (USD):</span>
              <span>{totalDolar.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px"
              }}
            >
              <span>Total (COP):</span>
              <span>{formatoVE(totalPeso.toFixed(2))}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px"
              }}
            >
              <span style={{ fontWeight: "bold" }}>
                Total (Bs):
              </span>
              <span>{formatoVE(totalBs.toFixed(2))}</span>
            </div>
          </div>
        </div>

        {/* BOTONES DE PAGO Y MODALES */}
        <div style={{marginLeft: "700px", padding: "1px", gap: "15px"}}>
          <button
            onClick={() => {
              registrarAccion("Abrió modal de pago");
              pagoContado();
            }}
            style={estiloBoton}
          >
            Contado
          </button>
          <button
            onClick={() => {
              registrarAccion("Abrió modal de pago a Crédito");
              pagoCredito();
            }}
            style={{
              ...estiloBoton,
              backgroundColor: "#6699FF"
            }}
          >
            Crédito
          </button>
          <button
              onClick={() => {
                registrarAccion("Guardó factura sin pago");
                guardarSinPago();
                }}
              style={estiloBotonVerde}
            >
              Guardar sin pago
            </button>                 

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

          {mostrarModalCliente && (
            <ModalCliente
              identificacionInicial={identificacion}
              onCerrar={() => setMostrarModalCliente(false)}
              onGuardado={(clienteNuevo) => {
                setClienteSeleccionado(clienteNuevo);
                setNombreCliente(clienteNuevo.nombreCompleto);
                setIdentificacion(clienteNuevo.identificacion);
                setListaClientes((prev) => {
                  const existe = prev.some(
                    (c) => c._id === clienteNuevo._id
                  );
                  return existe ? prev : [...prev, clienteNuevo];
                });
                setMostrarModalCliente(false);
              }}
            />
          )}

          {mostrarModalTasas && (
            <ModalTasas
              fecha={fecha}
              onCerrar={() => setMostrarModalTasas(false)}
              onGuardado={(tasaNueva) => {
                const {
                  tasaD,
                  tasaP,
                  cajachicaD,
                  cajachicaP
                } = tasaNueva;
                setTasaDolar(tasaD);
                setTasaPeso(tasaP);
                setCajaDolar(cajachicaD);
                setCajaPeso(cajachicaP);
                setMostrarModalTasas(false);
              }}
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
