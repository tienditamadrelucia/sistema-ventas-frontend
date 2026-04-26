import React, { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import carritoImg from "../assets/carrito.png";
import { useNavigate } from "react-router-dom";
import Pago from "../components/Pago/Pago";
import axios from "axios";
import { obtenerClientes, TodosClientes } from "../services/clientes";
import { cargarCategorias } from "../services/categorias";
import { cargarProductos } from "../services/productos";

const Ventas = () => {  
    const navigate = useNavigate();

  // -----------------------------
  // ESTADOS PRINCIPALES USESTATE
  // -----------------------------

  const [mostrarModalTasas, setMostrarModalTasas] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState("");  
  const [descuento, setDescuento] = useState("");  
  const [numeroFactura, setNumeroFactura] = useState("");
  const [hora, setHora] = useState("");  
  const [fecha, setFecha] = useState("");
  const [codigoProducto, setCodigoProducto] = useState("");  
  const [nombreProducto, setNombreProducto] = useState("");
  const [stockActual, setStockActual] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);  
  const [totalProducto, setTotalProducto] = useState(0);
  const [listaProductos, setListaProductos] = useState([]);    
  const [errorStock, setErrorStock] = useState("");    
  const [iva, setIva] = useState(0);    
  const [nombreCliente, setNombreCliente] = useState("");
  const [errorPrecio, setErrorPrecio] = useState("");
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [tasaBs, setTasaBs] = useState(0);
  const [subtotalDolar, setsubtotalDolar] = useState(0);
  const [totalDolar, settotalDolar] = useState(0);
  const [totalPeso, settotalPeso] = useState(0);
  const [totalBs, settotalBs] = useState(0);
  const [identificacion, setIdentificacion] = useState("");  
  const [listaClientes, setListaClientes] = useState([]);
  const [Clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [editando, setEditando] = useState(false);
  const [indexEditado, setIndexEditado] = useState(null);
  const [listaFactura, setListaFactura] = useState([]);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [tasaDolar, setTasaDolar] = useState(0);
  const [tasaPeso, setTasaPeso] = useState(0);
  const [cajaDolar, setCajaDolar] = useState(0);
  const [cajaPeso, setCajaPeso] = useState(0);
  const [categorias, setCategorias] = useState(false);  
  const [productos, setProductos] = useState("");  
  const API = "http://localhost:4000/api";

  // 🔹 FORM DATA PARA dbVentas (encabezado)
  const [formVenta, setFormVenta] = useState({    
    fecha: "",
    hora: "",
    Factura: "",
    cliente: "",          // nombreCliente || "CONSUMIDOR FINAL"
    subtotal: 0,          // subtotalDolar
    iva: 0,
    total: 0,             // totalDolar
    usuario: "ADMIN"     // o el usuario logueado
  });

  // 🔹 FORM DATA BASE PARA dbVendidos (detalle)
  const formVendido = {
    idVenta: "",          // se llena después de crear la venta
    codigo: "",
    descripcion: "",
    cantidad: 0,
    precio: 0,
    descuento: 0,
    total: 0
    };

   // -----------------------------
  // FUNCIONES
  // -----------------------------

  const formatoVE = (valor) => {
    return Number(valor).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // -----------------------------
  // USEEFFECT cálculos
  // -----------------------------
  axios.get("http://localhost:4000/api/categorias")
  .then(r => console.log("AXIOS OK:", r.data))
  .catch(e => console.log("AXIOS ERROR:", e));

  useEffect(() => {
  const tD = localStorage.getItem("tasaDolar");
  const tP = localStorage.getItem("tasaPeso");
  const cD = localStorage.getItem("cajaDolar");
  const cP = localStorage.getItem("cajaPeso");
  const fechaTasa = localStorage.getItem("fechaTasa");
  // Validar que existan
  if (!tD || !tP || !cD || !cP || !fechaTasa) {
    alert("Debe registrar las tasas del día antes de entrar al módulo de Ventas.");
    window.close();
    return;
  }
  // Validar que la tasa sea del día
  const hoy = new Date().toLocaleDateString("sv-SE");
alert(hoy);

  if (fechaTasa !== hoy) {
    alert("Las tasas no corresponden al día de hoy. Debe actualizarlas.");
    window.close();
    return;
  }
  // Cargar en estados
  setTasaDolar(Number(tD));
  setTasaPeso(Number(tP));
  setCajaDolar(Number(cD));
  setCajaPeso(Number(cP));
}, []); // ← SIN backendListo

  useEffect(() => {
    generarNumeroFactura();
    generarHora();    
  }, []);

  // CLIENTES
  async function cargarClientes() {
    try {
      const res = await fetch(`${API}/clientes/todos`);
      const data = await res.json();
      if (Array.isArray(data)) setClientes(data);
      else setClientes([]);
    } catch (err) {
      alert("Error cargando clientes");
      setClientes([]);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  // CATEGORÍAS + PRODUCTOS
  useEffect(() => {
    const cargarTodo = async () => {
      const cats = await cargarCategorias();
      setCategorias(cats);

      const prods = await cargarProductos();
      setProductos(prods);
    };
    cargarTodo();
  }, []);

  // FILTRO DE PRODUCTOS POR CATEGORÍA
  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria === categoriaSeleccionada)
    : [];

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    // CATEGORÍA (descripción → código)
    if (name === "categoria") {
      const categoriaObj = categorias.find((c) => c.descripcion === value);
      //setFormData({
      //  ...formData,
      //  categoria: categoriaObj ? categoriaObj.codigo : "",
      //  productoId: "",
      //  codigo: "",
      //  precio: "",
      //  total: ""
      //});
      return;
    }

    // PRODUCTO
    if (name === "productoId") {
      const prod = productos.find((p) => p._id === value);
      //setFormData({
      //  ...formData,
      //  productoId: value,
      //  codigo: prod ? prod.codigo : "",
      //  precio: prod ? prod.venta : "",
      //  total: prod ? (formData.cantidad ? (parseFloat(formData.cantidad) * prod.venta).toFixed(2) : "") : ""
      //});
      return;
    }
  }

  useEffect(() => {    
    const subtotal = cantidad * precioVenta;
    const desc = subtotal * (descuento / 100);
    setTotalProducto(subtotal - desc);
  }, [cantidad, precioVenta, descuento]);
  
  useEffect(() => {        
    const subtotalDolar = listaFactura.reduce(
      (acc, item) => acc + parseFloat(item.total || 0),
      0    
    );
    setsubtotalDolar(subtotalDolar);
    const ivaDecimal = (parseFloat(iva) || 0) / 100;
    const totalDolar = subtotalDolar + (subtotalDolar * ivaDecimal);
    settotalDolar(totalDolar)
    settotalPeso(totalDolar * tasaPeso || 0);
    settotalBs(totalDolar * (parseFloat(tasaDolar) || 0));        
  }, [listaFactura, iva]);      
  
 

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

  // ENCABEZADO DE LAS FACTURAS //
  //---------------------------//
  const generarNumeroFactura = () => {
    let ultimo = localStorage.getItem("ultimoNumeroFactura") || "000000";
    let siguiente = (parseInt(ultimo) + 1).toString().padStart(6, "0");
    setNumeroFactura(siguiente);
  };

  const generarHora = () => {
    const ahora = new Date();
    const h = ahora.toLocaleTimeString("es-VE", { hour12: false });
    setHora(h);
  };  

 
  const buscarClientePorIdentificacion = async (cedula) => {
  if (!cedula) {
    alert("Ingrese una identificación válida");
    return;
  }
  try {
    const res = await axios.get(`http://localhost:4000/api/clientes/cedula/${cedula}`);
    if (res.data) {
      const cliente = res.data;
      setNombreCliente(cliente.nombreCompleto);
      setIdentificacion(cliente.identificacion);
      setClienteSeleccionado(cliente._id);
    } else {
      alert("Cliente no encontrado");
    }
  } catch (error) {
    console.error("Error buscando cliente:", error);
    alert("Cliente no encontrado");
  }
  };

  const limpiarCliente = () => {
    setIdentificacion("");
    setNombreCliente("");
    setClienteSeleccionado("");
  };

  // DETALLE DE LA FACTURA //
  //-----------------------//
  const limpiarProducto = () => {
    setCodigoProducto("");
    setCategoriaSeleccionada("");
    setProductoSeleccionado("");
    setStockActual("");
    setCantidad("");
    setPrecioVenta("");
    setDescuento("");    
  };  

  const buscarProductoPorCodigo = (codigo) => {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const producto = listaProductos.find(
    p => String(p.codigo).trim().toUpperCase() === codigoNormalizado
   );
  if (producto) {
    setCategoriaSeleccionada(producto.categoria);
    setProductoSeleccionado(producto._id);
    setNombreProducto(producto.nombre);
    setStockActual(producto.stock);
    setPrecioVenta(producto.precio);
  } else {
    alert("Producto no encontrado");
  }
  };

  const validarPrecio = (valor) => {
    if (valor <= 0) {
      setErrorPrecio("El precio debe ser mayor a 0");
    } else {
      setErrorPrecio("");
    }
    setPrecioVenta(valor);
  };

  const validarStock = (cant) => {
    if (cant > stockActual) {
      alert("Stock insuficiente, pero puede continuar.");
      setErrorStock(""); // no bloquea, solo avisa
    } else {
      setErrorStock("");
    }

    setCantidad(cant); // siempre se ejecuta
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
  const producto = listaProductos.find(
    p => p.codigo === codigoProducto
  );
  if (!producto) {
    alert("Producto no encontrado en la lista.");
    return;
  }
  const nuevoItem = {
    idProducto: producto._id,        // ← NECESARIO PARA dbVendidos
    codigo: codigoProducto,
    descripcion: nombreProducto,
    cantidad: Number(cantidad),
    precioVenta: Number(precioVenta),
    descuento: Number(descuento),
    total: totalProducto
  };
  setListaFactura([...listaFactura, nuevoItem]);

    // limpiar
    setCodigoProducto("");
    setCategoriaSeleccionada("");
    setProductoSeleccionado("");
    setStockActual("");
    setCantidad("");
    setPrecioVenta("");
    setDescuento("");
    };

  const iniciarEdicion = (item, index) => {
  // Cargar valores del item
  setCantidad(item.cantidad);
  setPrecioVenta(item.precioVenta);
  setDescuento(item.descuento);

  // Buscar el producto original en la lista
  const producto = listaProductos.find(p => p._id === item.idProducto);
  if (producto) {
    setCodigoProducto(producto.codigo);
    setCategoriaSeleccionada(producto.categoria);
    setProductoSeleccionado(producto._id);
    setNombreProducto(producto.nombre);
    setStockActual(producto.stock);
  }
  setIndexEditado(index);
  setEditando(true);
  };

  const actualizarProducto = () => {
    const nuevos = [...listaFactura];
    const precioNum = parseFloat(precioVenta);
    const descNum = parseFloat(descuento) || 0;
    const totalCalc = (cantidad * precioNum) - (cantidad * precioNum * (descNum / 100));

    nuevos[indexEditado] = {
        ...nuevos[indexEditado],
        cantidad: Number(cantidad),
        precioVenta: precioNum,
        descuento: descNum,
        total: totalCalc
        };

        setListaFactura(nuevos);

        // limpiar campos
        setCodigoProducto("");
        setCategoriaSeleccionada("");
        setProductoSeleccionado("");
        setStockActual("");
        setCantidad("");
        setPrecioVenta("");
        setDescuento("");
        setEditando(false);
        setIndexEditado(null);
    };

  const eliminarItem = (index) => {
    const nuevaLista = [...listaFactura];
    nuevaLista.splice(index, 1);
    setListaFactura(nuevaLista);
  };

  const guardarVenta = async () => {
  if (!fecha || fecha.trim() === "") {
    alert("Debe seleccionar una fecha antes de guardar la venta");
    return;
  }
  if (listaFactura.length === 0) {
    alert("Debe agregar al menos un producto a la factura");
    return;
  }
  try {
    // 1) GUARDAR ENCABEZADO
    const ventaData = {
      numeroFactura,
      fecha,
      hora,
      cliente: nombreCliente || "CONSUMIDOR FINAL",
      identificacion,
      subtotal: subtotalDolar,
      iva,
      total: totalDolar,
      usuario: "ADMIN", // o el usuario logueado
      tasaDolar,
      tasaPeso
    };
    const resVenta = await axios.post("http://localhost:4000/api/ventas", ventaData);
    const idVenta = resVenta.data.idVenta;
    // 2) GUARDAR PRODUCTOS VENDIDOS
    for (const item of listaFactura) {
      await axios.post("http://localhost:4000/api/vendidos", {
        idVenta,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio: item.precioVenta,
        descuento: item.descuento,
        total: item.total
      });
    }
    // 3) ACTUALIZAR NÚMERO DE FACTURA
    localStorage.setItem("ultimoNumeroFactura", numeroFactura);
    alert("Venta registrada exitosamente");
    // 4) LIMPIAR PANTALLA
    setListaFactura([]);
    generarNumeroFactura();
    generarHora();
  } catch (error) {
    console.error(error);
    alert("Error al guardar la venta");
  }
  };

  // REGISTRO DEL PAGO DE LA FACTURA //
  // ------------------------------- //
  const pagoContado = () => {
    setMostrarPago(true);
  };

  const pagoCredito = () => {
    console.log("Pago a crédito");
  };  

  // -----------------------------
  // RENDER
  // -----------------------------

  return (
    <div>
      <Encabezado />

      <h2 style={{ textAlign: "left", marginTop: "5px", marginLeft:"250px" }}>
        REGISTRO DE VENTAS
      </h2>
      
    {/* CONTENEDOR PRINCIPAL */}
  <div style={{ width: "1500px", margin: "0 auto", marginLeft:"15px" }}>    
    
    {/* CONTENEDOR HORIZONTAL */}
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        width: "1400px"
      }}
    >
      {/* A) DATOS DE LA FACTURA */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "1px",
          borderRadius: "8px",
          width: "340px",
          marginBottom: "1px"
        }}
      >
        <h3 style={{ marginTop: 0, marginLeft:"5px" }}>Datos de la Factura</h3>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px", marginLeft:"5px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "110px" }}>
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                setFecha(nuevaFecha);                
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
            <label>N° Factura</label>
            <input
              type="text"
              value={numeroFactura}
              readOnly
              style={{ backgroundColor: "#EDC5CD" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
            <label>Hora</label>
            <input
              type="text"
              value={hora}
              readOnly
              style={{ backgroundColor: "#EDC5CD" }}
            />
          </div>
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
        <h3 style={{ marginTop: 0, marginLeft:"5px" }}>Datos del Cliente</h3>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "100px", marginLeft:"5px" }}>
            <label>Identificación</label>
            <input
              type="text"
              value={identificacion}
                onChange={(e) => {
                const valor = e.target.value.toUpperCase();

                // Validar formato: letra + números
                const regex = /^[VEJG][0-9]*$/;

                if (valor === "" || regex.test(valor)) {
                  setIdentificacion(valor);
                }
                }}
                onKeyDown={(e) => {
                if (e.key === "Enter") {
                    buscarClientePorIdentificacion(identificacion);
                }
                }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "250px" }}>
            <label>Nombre</label>
            <select
              value={clienteSeleccionado}
              onChange={(e) => {
                const id = Number(e.target.value);
                setClienteSeleccionado(id);

                const cliente = listaClientes.find(c => c._id === id);
                if (cliente) {
                  setNombreCliente(cliente.nombreCompleto);
                  setIdentificacion(cliente.identificacion);
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

        <button
            onClick={() => setMostrarModalCliente(true)}
            style={{ height: "38px", width: "70px" }}
          >
            Agregar Cliente
          </button>

            {/* BOTÓN BORRAR CLIENTE */}
          <button
            onClick={limpiarCliente}
              style={{ height: "38px" }}
            >
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
            value={categoriaSeleccionada || ""}            
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
                value={productoSeleccionado || ""}
                onChange={(e) => {
                const id = e.target.value; // ← NO convertir a número
                setProductoSeleccionado(id);

                const producto = listaProductos.find(
                    p => String(p._id) === String(id)
                );

                if (producto) {
                  setCodigoProducto(producto.codigo);
                  setNombreProducto(producto.nombre);
                  setStockActual(producto.stock);
                  setPrecioVenta(producto.precio); // ← precio correcto
                }
                }}
                disabled={editando}
            >
                <option value="">Seleccione producto</option>

                {listaProductos
                  .filter(p => p.categoria === categoriaSeleccionada)
                  .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.nombre}
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
              backgroundColor: stockActual <= 0 ? "#ffb3b3" : "#EDC5CD", height: "16px"
            }}
          />
          {errorStock && (
            <span style={{ color: "red", fontSize: "12px" }}>{errorStock}</span>
          )}
        </div>

        {/* CANTIDAD */}
        <div style={{ display: "flex", flexDirection: "column", width: "70px" }}>
          <label>Cantidad</label>
          <input
            type="number"
            step="0.01"
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
            step="0.01"
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
            step="0.01"
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
        <button
          onClick={limpiarProducto}
          style={{ height: "38px" }}
        >
          Limpiar
        </button>

        {/* BOTÓN CARRITO */}
        <button
          disabled={editando}
          onClick={agregarAlCarrito}
          style={{
            opacity: editando ? 0.4:1,
            cursor: editando ? "not-allowed": "pointer",
            background: "none",
            border: "none",
            cursor: "pointer",
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
              <td style={{ padding: "6px", border: "1px solid #8AB6D6", textAlign: "center" }}>
                {item.cantidad}
              </td>
              <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>
                {item.precioVenta.toFixed(2)}
              </td>
              <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>
                {item.descuento}
              </td>
              <td style={{ padding: "6px", border: "1px solid #8AB6D6" }}>
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
      <button onClick={() => window.close()}
        style={estiloBoton}>
        Volver al MENÚ PRINCIPAL
      </button>

      <button onClick={guardarVenta} style={estiloBoton}>
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
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontWeight: "bold" }}>Subtotal (USD):</span>
          <span>{subtotalDolar.toFixed(2)}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "80px" }}>
          <label>IVA %</label>
          <input
            type="number"
            step={"0.1"}
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
    <div
      style={{
        width: "1115px",
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "1px",
        gap: "5px"
      }}
    >
      <button onClick={pagoContado} style={estiloBoton}>
        Contado        
      </button>
      {mostrarPago && (
      <Pago      
        facturaNumero={numeroFactura}
        totalDolar={totalDolar}
        totalPeso={totalPeso}
        totalBs={totalBs}
        tasaPeso={tasaPeso}
        tasaDolar={tasaDolar}
        onCerrar={() => setMostrarPago(false)}
        onPagoCompletado={(dataPago) => {
        console.log("Pago registrado:", dataPago);
        // Aquí guardas en localStorage o en tu backend
        }}
      />
      )}
      <button onClick={pagoCredito} style={{ ...estiloBoton, backgroundColor: "#6699FF" }}>
        Crédito
      </button>    
    </div>
</div>
</div>

);
};
export default Ventas;

