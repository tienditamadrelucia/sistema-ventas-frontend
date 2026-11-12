import React, { useState, useEffect, useRef } from "react";
import Encabezado from "../components/Encabezado";
import { useNavigate } from "react-router-dom";
import Pago from "../components/Pago/Pago";
import axios from "axios";
import { cargarCategorias } from "../services/categorias";
import { cargarProductos } from "../services/productos";
import EditarCliente from "../components/Clientes/EditarCliente";
import ModalCliente from "../components/Clientes/ModalCliente";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";
import ModalTasas from "../components/Tasas/ModalTasas";
import { cargarTasasPorFecha } from "../services/ser_tasas";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import RegistroVentaVista from "../components/Ventas/RegistroVentaVista";

const Ventas = () => {
  const navigate = useNavigate();

  const sedeActual =
    localStorage.getItem("sede") || "TIENDITA";

  const esMonasterio = sedeActual === "MONASTERIO";

  // FACTURA Y CLIENTE
  const [numeroFactura, setNumeroFactura] = useState("");
  const [hora, setHora] = useState("");
  const [, setNombreCliente] = useState("");

  const [
    mostrarModalCliente,
    setMostrarModalCliente
  ] = useState(false);

  const [identificacion, setIdentificacion] = useState("");
  const [listaClientes, setListaClientes] = useState([]);

  const [
    clienteSeleccionado,
    setClienteSeleccionado
  ] = useState("");

  // PRODUCTOS
  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada
  ] = useState("");

  const [
    productoSeleccionado,
    setProductoSeleccionado
  ] = useState("");

  const [cantidad, setCantidad] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [codigoProducto, setCodigoProducto] = useState("");
  const [nombreProducto, setNombreProducto] = useState("");
  const [stockActual, setStockActual] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [totalProducto, setTotalProducto] = useState(0);
  const [listaProductos, setListaProductos] = useState([]);
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

  const [
    categoriasDisponibles,
    setCategoriasDisponibles
  ] = useState([]);

  const [venta, setVenta] = useState(null);

  // REFERENCIAS PARA RECORRER LOS CAMPOS
  const cantidadRef = useRef(null);
  const precioRef = useRef(null);
  const descuentoRef = useRef(null);
  const carritoRef = useRef(null);
  const codigoProductoRef = useRef(null);
  const identificacionRef = useRef(null);
  const fechaRef = useRef(null);
  const nombreClienteRef = useRef(null);
  const categoriaRef = useRef(null);
  const productoRef = useRef(null);
  const pagoContadoRef = useRef(null);

  const busquedaClienteRef = useRef(false);
  const busquedaProductoRef = useRef(false);

  const [
    buscandoCliente,
    setBuscandoCliente
  ] = useState(false);

  const [
    buscandoProducto,
    setBuscandoProducto
  ] = useState(false);

  const enfocarCampo = ref =>
    window.requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select?.();
    });

  // TASAS
  const [
    mostrarModalTasas,
    setMostrarModalTasas
  ] = useState(false);

  const [tasaDolar, setTasaDolar] = useState(0);
  const [tasaPeso, setTasaPeso] = useState(0);
  const [, setCajaDolar] = useState(0);
  const [, setCajaPeso] = useState(0);

  // PAGOS
  const [pagoExistente, setPagoExistente] = useState(null);
  const [vueltoExistente, setVueltoExistente] = useState(null);
  const [, setPagoRegistrado] = useState(false);

  const [
    idPagoExistente,
    setIdPagoExistente
  ] = useState(null);

  const [
    idVueltoExistente,
    setIdVueltoExistente
  ] = useState(null);

  const [modoCredito, setModoCredito] = useState(false);
  const [pagoData, setPagoData] = useState(null);

  const [
    mostrarEditorCliente,
    setMostrarEditorCliente
  ] = useState(false);

  const [procesando, setProcesando] = useState(false);

  const guardandoOperacionRef = useRef(false);
  const operacionPendienteRef = useRef(null);

  const API = `${API_URL}/api`;
  const hoy = obtenerFechaVenezuela();
  const [fecha, setFecha] = useState(hoy);

  const firmaPagoActual = () =>
    JSON.stringify({
      fecha,
      sede: sedeActual,
      identificacion,
      listaFactura,
      iva
    });

  // VALIDAR TASAS DEL DÍA
  useEffect(() => {
    const validarTasasDeHoy = async () => {
      try {
        const res = await axios.get(
          `${API}/tasas/por-fecha/${hoy}`,
          {
            params: {
              sede: sedeActual
            }
          }
        );

        if (!res.data || !res.data.tasa) {
          alert(
            "Debe registrar las tasas del día antes " +
            "de entrar al módulo de Ventas."
          );

          navigate("/tasas");
          return;
        }

        const {
          tasaD,
          tasaP,
          cajachicaD,
          cajachicaP
        } = res.data.tasa;

        setTasaDolar(tasaD);
        setTasaPeso(tasaP);
        setCajaDolar(cajachicaD);
        setCajaPeso(cajachicaP);
      } catch (error) {
        console.error(
          "Error validando tasas del día:",
          error
        );

        alert("Error validando tasas del día.");
        navigate("/tasas");
      }
    };

    validarTasasDeHoy();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CARGAR TASAS POR FECHA
  useEffect(() => {
    const cargarTasas = async () => {
      if (!fecha) return;

      try {
        const res = await axios.get(
          `${API_URL}/api/tasas/por-fecha/${fecha}`,
          {
            params: {
              sede: sedeActual
            }
          }
        );

        const {
          tasaD,
          tasaP,
          cajachicaD,
          cajachicaP
        } = res.data.tasa;

        setTasaDolar(tasaD);
        setTasaPeso(tasaP);
        setCajaDolar(cajachicaD);
        setCajaPeso(cajachicaP);
      } catch (error) {
        if (
          error.response &&
          error.response.status === 404
        ) {
          return;
        }

        console.error(
          "Error REAL cargando tasas:",
          error
        );
      }
    };

    cargarTasas();
  }, [fecha]);

  // CARGAR DATOS INICIALES
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

      setListaClientes(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error("Error cargando clientes:", error);
      alert("Error cargando clientes.");
      setListaClientes([]);
    }
  };

  const cargarCategoriasYProductos = async () => {
    try {
      const categorias = await cargarCategorias();
      setCategoriasDisponibles(categorias);

      const productos = await cargarProductos(sedeActual);
      setListaProductos(productos);
    } catch (error) {
      console.error(
        "Error cargando categorías o productos:",
        error
      );
    }
  };

  // TOTAL DEL PRODUCTO
  useEffect(() => {
    const precioNum = parseFloat(precioVenta) || 0;
    const descNum = parseFloat(descuento) || 0;
    const cantNum = parseFloat(cantidad) || 0;

    const total =
      cantNum * precioNum -
      cantNum * precioNum * (descNum / 100);

    setTotalProducto(total);
  }, [cantidad, precioVenta, descuento]);

  // TOTALES DE LA FACTURA
  useEffect(() => {
    const subtotal = listaFactura.reduce(
      (acc, item) =>
        acc + parseFloat(item.total || 0),
      0
    );

    setSubtotalDolar(subtotal);

    const ivaDecimal = (parseFloat(iva) || 0) / 100;
    const total = subtotal + subtotal * ivaDecimal;

    setTotalDolar(total);
    setTotalPeso(total * tasaPeso || 0);
    setTotalBs(total * tasaDolar || 0);
  }, [listaFactura, iva, tasaPeso, tasaDolar]);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handler
      );
    };
  }, []);

  // HORA DE VENEZUELA
  const generarHora = () => {
    setHora(
      new Intl.DateTimeFormat("es-VE", {
        timeZone: "America/Caracas",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      }).format(new Date())
    );
  };

  // BUSCAR CLIENTE POR CÉDULA O RIF
  const buscarClientePorIdentificacion = async cedula => {
    if (busquedaClienteRef.current) return null;

    cedula = String(cedula || "")
      .trim()
      .toUpperCase()
      .replace(/[\s.\-]/g, "");

    if (/^\d+$/.test(cedula)) {
      cedula = "V" + cedula;
    }

    if (!/^[VEJG]\d+$/.test(cedula)) {
      alert(
        "Ingrese una cédula o RIF válido. " +
        "Ejemplo: V12345678."
      );

      enfocarCampo(identificacionRef);
      return null;
    }

    busquedaClienteRef.current = true;
    setBuscandoCliente(true);
    setIdentificacion(cedula);
    setClienteSeleccionado("");
    setNombreCliente("");

    try {
      const res = await fetch(
        API_URL +
        "/api/clientes/cedula/" +
        encodeURIComponent(cedula),
        {
          credentials: "include"
        }
      );

      if (res.status === 404) {
        setMostrarModalCliente(true);
        return null;
      }

      if (!res.ok) {
        throw new Error(
          "No se pudo buscar el cliente."
        );
      }

      const data = await res.json();
      const encontrado = data.cliente ?? data;

      if (!encontrado?._id) {
        throw new Error(
          "El servidor no devolvió un cliente válido."
        );
      }

      setClienteSeleccionado(encontrado);
      setNombreCliente(
        encontrado.nombreCompleto || ""
      );

      setIdentificacion(
        encontrado.identificacion || cedula
      );

      setListaClientes(prev =>
        prev.some(c => c._id === encontrado._id)
          ? prev
          : [...prev, encontrado]
      );

      const incompleto =
        encontrado.nombreCompleto ===
          "CLIENTE POR ACTUALIZAR" ||
        encontrado.direccion ===
          "DIRECCIÓN POR ACTUALIZAR" ||
        encontrado.telefono ===
          "TELÉFONO POR ACTUALIZAR";

      setMostrarEditorCliente(incompleto);

      if (!incompleto) {
        enfocarCampo(codigoProductoRef);
      }

      return encontrado;
    } catch (error) {
      console.error(
        "Error buscando cliente:",
        error
      );

      alert(
        error.message || "Error buscando cliente."
      );

      enfocarCampo(identificacionRef);
      return null;
    } finally {
      busquedaClienteRef.current = false;
      setBuscandoCliente(false);
    }
  };

  const limpiarCliente = () => {
    setIdentificacion("");
    setNombreCliente("");
    setClienteSeleccionado("");
  };

  const validarCliente = () => {
    if (!clienteSeleccionado) {
      alert(
        "Debe seleccionar un cliente antes " +
        "de guardar la venta."
      );

      return false;
    }

    if (
      clienteSeleccionado.nombreCompleto ===
        "CLIENTE POR ACTUALIZAR" ||
      clienteSeleccionado.direccion ===
        "DIRECCIÓN POR ACTUALIZAR" ||
      clienteSeleccionado.telefono ===
        "TELÉFONO POR ACTUALIZAR"
    ) {
      alert("El cliente tiene datos incompletos.");
      return true;
    }

    return true;
  };

  // EXISTENCIA REAL DEL PRODUCTO
  const consultarStockProducto = async producto => {
    try {
      const res = await fetch(
        API_URL +
        "/api/inventario/stock-real/" +
        encodeURIComponent(producto.codigo) +
        "?sede=" +
        encodeURIComponent(sedeActual),
        {
          credentials: "include"
        }
      );

      const data = await res.json();

      return (
        res.ok &&
        data.ok &&
        typeof data.stockReal === "number" &&
        Number.isFinite(data.stockReal)
      )
        ? data.stockReal
        : null;
    } catch (error) {
      console.error(
        "Existencia pendiente de confirmar:",
        error
      );

      return null;
    }
  };

  // BUSCAR PRODUCTO POR CÓDIGO
  const buscarProductoPorCodigo = async codigo => {
    if (busquedaProductoRef.current || editando) {
      return;
    }

    const buscado = String(codigo || "")
      .trim()
      .toUpperCase();

    const producto = listaProductos.find(
      p =>
        String(p.codigo).trim().toUpperCase() ===
        buscado
    );

    if (!producto) {
      setProductoSeleccionado("");
      setNombreProducto("");
      setStockActual(null);
      setPrecioVenta("");

      alert(
        "Producto no encontrado en esta sede."
      );

      enfocarCampo(codigoProductoRef);
      return;
    }

    busquedaProductoRef.current = true;
    setBuscandoProducto(true);
    setCodigoProducto(String(producto.codigo));
    setCategoriaSeleccionada(
      producto.categoria || ""
    );

    setProductoSeleccionado(producto._id);
    setNombreProducto(
      producto.descripcion || ""
    );

    setPrecioVenta(
      Number.isFinite(Number(producto.venta))
        ? Number(producto.venta)
        : ""
    );

    setCantidad("");
    setDescuento(0);
    setErrorPrecio("");
    setStockActual(null);

    try {
      setStockActual(
        await consultarStockProducto(producto)
      );
    } finally {
      busquedaProductoRef.current = false;
      setBuscandoProducto(false);
      enfocarCampo(cantidadRef);
    }
  };

  const validarPrecio = valor => {
    const num = Number(valor);
    setPrecioVenta(num);

    if (num <= 0) {
      setErrorPrecio(
        "El precio debe ser mayor a 0"
      );
    } else {
      setErrorPrecio("");
    }
  };

  const limpiarProducto = (
    conservarCategoria = true
  ) => {
    setCodigoProducto("");

    if (!conservarCategoria) {
      setCategoriaSeleccionada("");
    }

    setProductoSeleccionado("");
    setNombreProducto("");
    setStockActual(null);
    setCantidad("");
    setPrecioVenta("");
    setDescuento(0);
    setErrorPrecio("");
  };

  const leerArticuloActual = () => {
    if (
      !productoSeleccionado ||
      !codigoProducto ||
      !nombreProducto
    ) {
      alert("Debe seleccionar un producto.");
      return null;
    }

    const unidades = Number(cantidad);
    const precio = Number(precioVenta);
    const rebaja = Number(descuento);

    if (
      !Number.isFinite(unidades) ||
      unidades <= 0
    ) {
      alert(
        "La cantidad debe ser mayor a cero."
      );

      enfocarCampo(cantidadRef);
      return null;
    }

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      alert(
        "El precio debe ser mayor a cero."
      );

      enfocarCampo(precioRef);
      return null;
    }

    if (
      !Number.isFinite(rebaja) ||
      rebaja < 0 ||
      rebaja > 100
    ) {
      alert(
        "El descuento debe estar entre 0 y 100."
      );

      enfocarCampo(descuentoRef);
      return null;
    }

    const importe =
      unidades * precio * (1 - rebaja / 100);

    if (!Number.isFinite(importe)) {
      alert(
        "Revise los importes del producto."
      );

      return null;
    }

    return {
      idProducto: productoSeleccionado,
      codigo: codigoProducto,
      descripcion: nombreProducto,
      cantidad: unidades,
      precioVenta: precio,
      descuento: rebaja,
      total: importe
    };
  };

  const agregarAlCarrito = () => {
    if (
      procesando ||
      busquedaProductoRef.current ||
      editando
    ) {
      return;
    }

    const articulo = leerArticuloActual();
    if (!articulo) return;

    setListaFactura(prev => [
      ...prev,
      articulo
    ]);

    limpiarProducto();
    enfocarCampo(codigoProductoRef);
  };

  const actualizarProducto = () => {
    if (
      procesando ||
      indexEditado === null
    ) {
      return;
    }

    const articulo = leerArticuloActual();
    if (!articulo) return;

    setListaFactura(prev =>
      prev.map((item, index) =>
        index === indexEditado
          ? { ...item, ...articulo }
          : item
      )
    );

    limpiarProducto();
    setEditando(false);
    setIndexEditado(null);
    enfocarCampo(codigoProductoRef);
  };

  const eliminarItem = index => {
    if (procesando || editando) return;

    setListaFactura(prev =>
      prev.filter((_, i) => i !== index)
    );
  };

  const iniciarEdicion = async (item, index) => {
    if (
      procesando ||
      editando ||
      busquedaProductoRef.current
    ) {
      return;
    }

    const producto = listaProductos.find(
      p =>
        String(p._id) === String(item.idProducto)
    );

    if (!producto) {
      alert(
        "El producto no está disponible " +
        "en el catálogo de esta sede."
      );

      return;
    }

    setCantidad(item.cantidad);
    setPrecioVenta(item.precioVenta);
    setDescuento(item.descuento);
    setCodigoProducto(String(producto.codigo));
    setCategoriaSeleccionada(
      producto.categoria || ""
    );

    setProductoSeleccionado(producto._id);
    setNombreProducto(
      producto.descripcion || item.descripcion
    );

    setStockActual(null);
    setIndexEditado(index);
    setEditando(true);
    setBuscandoProducto(true);
    busquedaProductoRef.current = true;

    try {
      setStockActual(
        await consultarStockProducto(producto)
      );
    } finally {
      setBuscandoProducto(false);
      busquedaProductoRef.current = false;
      enfocarCampo(cantidadRef);
    }
  };
    // OBTENER NÚMERO DE FACTURA: SÓLO LECTURA
  const obtenerFacturaNro = async () => {
    const res = await fetch(
      `${API_URL}/api/ventas/factura-actual?sede=${encodeURIComponent(sedeActual)}`
    );

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(
        "No se pudo obtener el número de factura"
      );
    }

    return data.numero;
  };

  // PREPARAR EL PAGO
  const abrirPagoPreparado = async credito => {
    if (
      procesando ||
      guardandoOperacionRef.current
    ) {
      return;
    }

    if (!listaFactura.length) {
      alert("Aún no hay productos ingresados");
      return;
    }

    if (!validarCliente()) return;

    setProcesando(true);

    try {
      const res = await fetch(
        `${API_URL}/api/caja/verificacion/${fecha}?sede=${encodeURIComponent(sedeActual)}`,
        {
          credentials: "include"
        }
      );

      const estadoCaja = await res.json();

      if (!res.ok || !estadoCaja.ok) {
        throw new Error(
          estadoCaja.mensaje ||
          "No se pudo comprobar el día"
        );
      }

      if (estadoCaja.verificado) {
        throw new Error(
          "El dinero de ese día ya fue verificado. " +
          "El administrador debe reabrirlo " +
          "para registrar cambios."
        );
      }

      // El servidor asignará el número definitivo.
      const numero = venta?._id
        ? venta.factura
        : Number(await obtenerFacturaNro()) + 1;

      setNumeroFactura(numero);

      const borrador =
        pagoData?.preparado &&
        pagoData.firma === firmaPagoActual() &&
        pagoData.modoCredito === credito
          ? pagoData
          : null;

      if (borrador) {
        setPagoExistente({
          ...borrador.pagoPreparado,
          _id: borrador.idPago || undefined
        });

        setVueltoExistente({
          ...(
            borrador.vueltoPreparado || {
              efectivoP: 0,
              efectivoBs: 0,
              efectivoD: 0
            }
          ),
          _id: borrador.idVuelto || undefined
        });
      } else if (venta?._id) {
        const respuesta = await fetch(
          `${API_URL}/api/moneda/factura/${numero}?sede=${encodeURIComponent(sedeActual)}`,
          {
            credentials: "include"
          }
        );

        const movimientos = await respuesta.json();

        if (
          !respuesta.ok ||
          !movimientos.ok ||
          !Array.isArray(movimientos.lista)
        ) {
          throw new Error(
            movimientos.mensaje ||
            "No se pudieron consultar los pagos"
          );
        }

        const pagos = movimientos.lista.filter(
          movimiento =>
            ["VENTA", "ABONO DE CREDITO"].includes(
              movimiento.operacion
            )
        );

        const vueltos = movimientos.lista.filter(
          movimiento =>
            movimiento.operacion === "VUELTOS"
        );

        if (
          pagos.length > 1 ||
          vueltos.length > 1
        ) {
          throw new Error(
            "Esta factura tiene varios movimientos. " +
            "Revísela desde el módulo de créditos."
          );
        }

        setPagoExistente(pagos[0] || null);
        setVueltoExistente(vueltos[0] || null);
      } else {
        setPagoExistente(null);
        setVueltoExistente(null);
      }

      setModoCredito(credito);
      setMostrarPago(true);
    } catch (error) {
      alert(
        error.message ||
        "No se pudo preparar el pago"
      );
    } finally {
      setProcesando(false);
    }
  };

  const pagoContado = () =>
    abrirPagoPreparado(false);

  const pagoCredito = () =>
    abrirPagoPreparado(true);

  const validarPagoAntes = () => {
    if (!validarCliente()) return;

    if (!pagoData?.preparado) {
      alert(
        "Confirme el pago antes de guardar la venta"
      );

      return;
    }

    guardarVenta();
  };

  // GUARDAR LA OPERACIÓN COMPLETA
  const guardarOperacion = async sinPago => {
    if (
      procesando ||
      guardandoOperacionRef.current
    ) {
      return;
    }

    if (!listaFactura.length) {
      alert("No hay productos en la factura");
      return;
    }

    if (!validarCliente()) return;

    if (
      !sinPago &&
      (
        !pagoData?.preparado ||
        pagoData.firma !== firmaPagoActual()
      )
    ) {
      alert(
        "La factura cambió o falta el pago. " +
        "Confírmelo nuevamente antes de guardar."
      );

      return;
    }

    if (sinPago && pagoData?.preparado) {
      alert(
        "Ya preparó un pago. Use Guardar Venta " +
        "o descarte el pago antes de guardar sin pago."
      );

      return;
    }

    guardandoOperacionRef.current = true;
    setProcesando(true);

    try {
      const operacion = {
        ventaId: venta?._id || null,

        versionVenta: venta
          ? Number(venta.__v || 0)
          : null,

        sinPago,

        modoCredito:
          sinPago ||
          pagoData?.modoCredito === true,

        venta: {
          fecha,
          hora,
          cliente: identificacion,
          subtotal: subtotalDolar,
          IVA: Number(iva || 0),
          total: totalDolar,
          sede: sedeActual
        },

        items: listaFactura.map(item => ({
          productoId: item.idProducto,
          cantidad: Number(item.cantidad),
          precio: Number(item.precioVenta),
          dscto: Number(item.descuento || 0),
          total: Number(item.total)
        })),

        pago: sinPago
          ? null
          : pagoData.pagoPreparado,

        vuelto: sinPago
          ? null
          : pagoData.vueltoPreparado,

        idPago: sinPago
          ? null
          : pagoData.idPago,

        idVuelto: sinPago
          ? null
          : pagoData.idVuelto
      };

      const firma = JSON.stringify(operacion);

      if (
        operacionPendienteRef.current?.firma !== firma
      ) {
        operacionPendienteRef.current = {
          firma,
          id: window.crypto.randomUUID()
        };
      }

      const res = await fetch(
        `${API_URL}/api/ventas/operacion-completa`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            ...operacion,
            operacionId:
              operacionPendienteRef.current.id
          })
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data.mensaje ||
          data.msg ||
          data.error ||
          "No se pudo guardar la operación"
        );
      }

      limpiarCliente();

      setPagoData(null);
      setPagoRegistrado(false);
      setPagoExistente(null);
      setVueltoExistente(null);
      setIdPagoExistente(null);
      setIdVueltoExistente(null);
      setListaFactura([]);
      setModoCredito(false);
      setNumeroFactura("");
      setIva(0);
      setVenta(null);

      operacionPendienteRef.current = null;

      const avisosInventario =
        Array.isArray(data.advertencias)
          ? data.advertencias
              .map(aviso => aviso.mensaje)
              .filter(Boolean)
          : [];

      alert(
        "Venta guardada correctamente. Factura N° " +
        data.factura +
        (
          avisosInventario.length
            ? "\n\nALERTA DE INVENTARIO:\n" +
              avisosInventario.join("\n\n")
            : ""
        )
      );

      try {
        await registrarAccion(
          `Guardó factura N° ${data.factura} - ${sedeActual}`
        );
      } catch {
        alert(
          "La venta se guardó, pero no se pudo " +
          "registrar la acción en la bitácora."
        );
      }
    } catch (error) {
      alert(
        (
          error.message ||
          "No se pudo guardar la venta"
        ) +
        ". Si perdió la conexión, conserve los datos " +
        "y consulte el estado antes de modificar " +
        "o volver a guardar."
      );
    } finally {
      guardandoOperacionRef.current = false;
      setProcesando(false);
    }
  };

  const guardarVenta = () =>
    guardarOperacion(false);

  const guardarSinPago = () =>
    guardarOperacion(true);
    const confirmarSalida = () => {
    if (
      procesando ||
      guardandoOperacionRef.current
    ) {
      return;
    }

    if (
      (listaFactura.length || pagoData?.preparado) &&
      !window.confirm(
        "Hay cambios sin guardar. " +
        "¿Desea descartarlos y salir?"
      )
    ) {
      return;
    }

    if (window.opener) {
      window.close();

      if (window.closed) return;
    }

    navigate(
      esMonasterio
        ? "/menu-monasterio"
        : "/menu"
    );
  };

  const pagarFactura = async () => {
    const numero = prompt(
      "Ingrese el número de factura a pagar:"
    );

    if (!numero) return;

    setProcesando(true);

    try {
      setNumeroFactura(numero);

      const respPago = await fetch(
        `${API_URL}/api/moneda/factura/${numero}?sede=${encodeURIComponent(sedeActual)}`
      );

      const dataPago = await respPago.json();

      if (
        dataPago.ok &&
        Array.isArray(dataPago.lista) &&
        dataPago.lista.length > 0
      ) {
        alert(
          "Esta factura ya tiene pago registrado."
        );

        return;
      }

      const res = await fetch(
        `${API_URL}/api/ventas/detalle/${numero}?sede=${encodeURIComponent(sedeActual)}`
      );

      const data = await res.json();

      if (!data.ok) {
        alert("Factura no encontrada");
        return;
      }

      setVenta(data.venta);
      setFecha(data.venta.fecha.slice(0, 10));
      setIva(Number(data.venta.IVA || 0));
      setPagoData(null);
      setPagoRegistrado(false);

      const cedula = data.venta.cliente;
      await buscarCliente(cedula);

      await cargarDetalleFacturaParaPago(
        data.detalle
      );

      alert(
        "Factura cargada. Puede registrar el pago."
      );
    } catch (error) {
      console.error(
        "Error consultando factura:",
        error
      );

      alert(
        "Frontend dice: Error consultando factura"
      );
    } finally {
      setProcesando(false);
    }
  };

  const buscarCliente = cedula =>
    buscarClientePorIdentificacion(cedula);

  const cargarDetalleFacturaParaPago = async detalle => {
    try {
      if (
        !Array.isArray(detalle) ||
        detalle.length === 0
      ) {
        alert("La factura no tiene productos.");
        setListaFactura([]);
        return;
      }

      const listaReconstruida = [];

      for (const item of detalle) {
        const resProd = await fetch(
          `${API_URL}/api/productos/${item.productoId}`
        );

        const dataProd = await resProd.json();
        const producto = dataProd.producto ?? dataProd;

        listaReconstruida.push({
          idProducto:
            item.productoId?._id ||
            item.productoId,

          codigo: producto.codigo || "",
          descripcion: producto.descripcion || "",
          cantidad: item.cantidad ?? 0,

          precioVenta:
            item.precio ??
            producto.venta ??
            0,

          descuento: item.dscto ?? 0,
          total: item.total ?? 0
        });
      }

      setListaFactura(listaReconstruida);
    } catch (error) {
      console.error(
        "Error cargando detalle:",
        error
      );

      alert(
        "Frontend dice: Error cargando " +
        "detalle de la factura"
      );
    }
  };

  const cambiarFechaVenta = async valor => {
    setFecha(valor);

    if (!valor) return;

    const tasa = await cargarTasasPorFecha(
      valor,
      sedeActual
    );

    if (!tasa) {
      setMostrarModalTasas(true);
      return;
    }

    setTasaDolar(tasa.tasaD);
    setTasaPeso(tasa.tasaP);
    setCajaDolar(tasa.cajachicaD);
    setCajaPeso(tasa.cajachicaP);
  };

  const seleccionarCliente = clienteId => {
    const elegido = listaClientes.find(
      c => String(c._id) === String(clienteId)
    ) || null;

    setClienteSeleccionado(elegido);
    setNombreCliente(
      elegido?.nombreCompleto || ""
    );

    setIdentificacion(
      elegido?.identificacion || ""
    );

    const incompleto =
      elegido &&
      (
        elegido.nombreCompleto ===
          "CLIENTE POR ACTUALIZAR" ||
        elegido.direccion ===
          "DIRECCIÓN POR ACTUALIZAR" ||
        elegido.telefono ===
          "TELÉFONO POR ACTUALIZAR"
      );

    setMostrarEditorCliente(
      Boolean(incompleto)
    );

    if (elegido && !incompleto) {
      enfocarCampo(codigoProductoRef);
    }
  };

  const cancelarEdicionProducto = () => {
    limpiarProducto();
    setEditando(false);
    setIndexEditado(null);
    enfocarCampo(codigoProductoRef);
  };

  const limpiarVenta = () => {
    if (
      procesando ||
      guardandoOperacionRef.current
    ) {
      return;
    }

    if (operacionPendienteRef.current) {
      alert(
        "Hay una solicitud pendiente de comprobar. " +
        "Consulte el resultado o reintente con los " +
        "mismos datos antes de limpiar la venta."
      );

      return;
    }

    if (
      (
        listaFactura.length ||
        pagoData?.preparado ||
        venta ||
        productoSeleccionado
      ) &&
      !window.confirm(
        "¿Limpiar los datos de esta pantalla? " +
        "No se eliminarán ventas ni pagos guardados."
      )
    ) {
      return;
    }

    limpiarCliente();
    limpiarProducto(false);
    setListaFactura([]);
    setVenta(null);
    setNumeroFactura("");
    setIva(0);
    setEditando(false);
    setIndexEditado(null);
    setPagoData(null);
    setPagoRegistrado(false);
    setModoCredito(false);
    setPagoExistente(null);
    setVueltoExistente(null);
    setIdPagoExistente(null);
    setIdVueltoExistente(null);
    generarHora();
    enfocarCampo(identificacionRef);
  };

  return (
    <div>
      <Encabezado sede={sedeActual} />

      <RegistroVentaVista
        datos={{
          sedeActual,
          esMonasterio,
          fecha,
          numeroFactura,
          hora,
          identificacion,
          clienteSeleccionado,
          listaClientes,
          codigoProducto,
          categoriaSeleccionada,
          categoriasDisponibles,
          productoSeleccionado,
          listaProductos,
          stockActual,
          cantidad,
          precioVenta,
          descuento,
          totalProducto,
          errorPrecio,
          editando,
          listaFactura,
          subtotalDolar,
          iva,
          totalDolar,
          totalPeso,
          totalBs,
          tasaPeso,
          tasaDolar,
          pagoData,
          procesando,
          buscandoCliente,
          buscandoProducto
        }}

        referencias={{
          fecha: fechaRef,
          identificacion: identificacionRef,
          cliente: nombreClienteRef,
          codigo: codigoProductoRef,
          categoria: categoriaRef,
          producto: productoRef,
          cantidad: cantidadRef,
          precio: precioRef,
          descuento: descuentoRef,
          agregar: carritoRef,
          contado: pagoContadoRef
        }}

        acciones={{
          cambiarFecha: cambiarFechaVenta,
          buscarFactura: pagarFactura,

          cambiarIdentificacion: valor => {
            setIdentificacion(
              valor.toUpperCase()
            );

            setClienteSeleccionado("");
            setNombreCliente("");
          },

          buscarCliente: () =>
            buscarClientePorIdentificacion(
              identificacion
            ),

          seleccionarCliente,

          nuevoCliente: () =>
            setMostrarModalCliente(true),

          limpiarCliente: () => {
            limpiarCliente();
            enfocarCampo(identificacionRef);
          },

          cambiarCodigo: valor => {
            setCodigoProducto(valor);
            setProductoSeleccionado("");
            setNombreProducto("");
            setStockActual(null);
            setPrecioVenta("");
          },

          buscarProducto: () =>
            buscarProductoPorCodigo(
              codigoProducto
            ),

          cambiarCategoria: valor => {
            limpiarProducto();
            setCategoriaSeleccionada(valor);
          },

          seleccionarProducto: productoId => {
            const producto = listaProductos.find(
              item =>
                String(item._id) ===
                String(productoId)
            );

            if (producto) {
              buscarProductoPorCodigo(
                String(producto.codigo)
              );
            } else {
              limpiarProducto();
            }
          },

          cambiarCantidad: setCantidad,
          cambiarPrecio: validarPrecio,
          cambiarDescuento: setDescuento,

          limpiarProducto:
            cancelarEdicionProducto,

          agregar: editando
            ? actualizarProducto
            : agregarAlCarrito,

          editar: iniciarEdicion,
          eliminar: eliminarItem,
          cambiarIva: setIva,

          contado: () => {
            registrarAccion(
              "Abrió modal de pago"
            ).catch(console.error);

            pagoContado();
          },

          credito: () => {
            registrarAccion(
              "Abrió modal de pago a Crédito"
            ).catch(console.error);

            pagoCredito();
          },

          guardar: validarPagoAntes,
          sinPago: guardarSinPago,
          limpiarVenta,
          salir: confirmarSalida
        }}
      />

      {mostrarPago && (
        <Pago
          soloPreparar={true}
          modoCredito={modoCredito}
          fecha={fecha}
          sede={sedeActual}
          facturaNumero={numeroFactura}
          totalDolar={totalDolar}
          totalPeso={totalPeso}
          totalBs={totalBs}
          tasaP={tasaPeso}
          tasaD={tasaDolar}
          pagoExistente={pagoExistente}
          vueltoExistente={vueltoExistente}
          idVueltoExistente={idVueltoExistente}

          onCerrar={() =>
            setMostrarPago(false)
          }

          onPagoCompletado={dataPago => {
            setPagoData({
              ...dataPago,
              firma: firmaPagoActual()
            });

            setPagoRegistrado(true);
            setIdPagoExistente(dataPago.idPago);
            setIdVueltoExistente(dataPago.idVuelto);
          }}
        />
      )}

      {mostrarEditorCliente && clienteSeleccionado && (
        <EditarCliente
          cliente={clienteSeleccionado}

          onCerrar={() =>
            setMostrarEditorCliente(false)
          }

          onGuardado={actualizado => {
            setClienteSeleccionado(actualizado);

            setNombreCliente(
              actualizado.nombreCompleto || ""
            );

            setIdentificacion(
              actualizado.identificacion || ""
            );

            setListaClientes(prev =>
              prev.map(c =>
                c._id === actualizado._id
                  ? actualizado
                  : c
              )
            );

            setMostrarEditorCliente(false);
            enfocarCampo(codigoProductoRef);
          }}
        />
      )}

      {mostrarModalCliente && (
        <ModalCliente
          identificacionInicial={identificacion}

          onCerrar={() =>
            setMostrarModalCliente(false)
          }

          onGuardado={nuevo => {
            setClienteSeleccionado(nuevo);
            setNombreCliente(
              nuevo.nombreCompleto
            );

            setIdentificacion(
              nuevo.identificacion
            );

            setListaClientes(prev =>
              prev.some(c => c._id === nuevo._id)
                ? prev
                : [...prev, nuevo]
            );

            setMostrarModalCliente(false);
            enfocarCampo(codigoProductoRef);
          }}
        />
      )}

      {mostrarModalTasas && (
        <ModalTasas
          fecha={fecha}

          onCerrar={() =>
            setMostrarModalTasas(false)
          }

          onGuardado={tasa => {
            setTasaDolar(tasa.tasaD);
            setTasaPeso(tasa.tasaP);
            setCajaDolar(tasa.cajachicaD);
            setCajaPeso(tasa.cajachicaP);
            setMostrarModalTasas(false);
          }}
        />
      )}
    </div>
  );
};

export default Ventas;