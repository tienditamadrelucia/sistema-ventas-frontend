import React, { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import carritoImg from "../assets/carrito.png";
import { useNavigate } from "react-router-dom";
import Pago from "../components/Pago/Pago";

const Ventas = () => {  

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
  const [tasaDolar, setTasaDolar] = useState(0);
  const [tasaPeso, setTasaPeso] = useState(0);
  const [cajaDolar, setCajaDolar] = useState(0);
  const [cajaPeso, setCajaPeso] = useState(0);  
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
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [editando, setEditando] = useState(false);
  const [indexEditado, setIndexEditado] = useState(null);
  const [listaFactura, setListaFactura] = useState([]);
  const [mostrarPago, setMostrarPago] = useState(false);

  // -----------------------------
  // FUNCIONES
  // -----------------------------

  const formatoVE = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const categoriasDisponibles = [
    "ALBAS", "ALTAR", "BEBIDAS", "BISUTERIA", "CAMISAS", "CASULLAS",
    "CHEMISES Y FRANELAS", "COMIDAS Y PASAPALOS", "DENARIAS",
    "ESCAPULARIOS", "ESTOLAS", "GALLETAS", "GRANJA", "HOSTIAS",
    "IMÁGENES DE YESO", "LIBRERÍA Y PAPELERÍA", "MASA FRANCESA",
    "MISAS", "OTROS", "POSTRES", "RESTAURACIONES", "ROPABEBE",
    "ROSARIOS", "SÍNGULOS", "VELAS"
  ];

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

  const verificarTasasPorFecha = (fechaSeleccionada) => {
    const tasasGuardadas = JSON.parse(localStorage.getItem("tasasDia")) || [];
    const registro = tasasGuardadas.find(t => t.fecha === fechaSeleccionada);

    if (!registro) {
      setMostrarModalTasas(true);
    } else {
      setTasaDolar(registro.tasaDolar);
      setTasaPeso(registro.tasaPeso);
      setCajaDolar(registro.cajaDolar);
      setCajaPeso(registro.cajaPeso);
      alert("Tasas cargadas:\nBs: " + registro.tasaDolar + "\nPesos: " + registro.tasaPeso);

    }
  };

  const cargarClientes = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
      setListaClientes(clientes);
  };
 
  const buscarClientePorIdentificacion = (cedula) => {    
    if (!cedula) {
    alert("Ingrese una identificación válida");
    return;
  }
  const cliente = listaClientes.find(c => c.identificacion === cedula);
    if (cliente) {
      setNombreCliente(cliente.nombreCompleto);
      setIdentificacion(cliente.identificacion);
      setClienteSeleccionado(cliente.id);
    } else {
      alert("Cliente no encontrado");
    }
  };

  const limpiarCliente = () => {
    setIdentificacion("");
    setNombreCliente("");
    setClienteSeleccionado("");
  };

  const limpiarProducto = () => {
    setCodigoProducto("");
    setCategoriaSeleccionada("");
    setProductoSeleccionado("");
    setStockActual("");
    setCantidad("");
    setPrecioVenta("");
    setDescuento("");    
  };

  const normalizarCategoria = (cat) => {
    if (!cat) return "";
    const mayus = cat.toUpperCase();
    const encontrada = categoriasDisponibles.find(c => mayus.includes(c));
    return encontrada || mayus;
  };

  const buscarProductoPorCodigo = (codigo) => {
    const codigoNormalizado = codigo.trim().toUpperCase();

    const producto = listaProductos.find(
      p => String(p.codigo).trim().toUpperCase() === codigoNormalizado
    );

    if (producto) {
      setCategoriaSeleccionada(producto.categoria);
      setProductoSeleccionado(producto.id);
      setNombreProducto(producto.nombre);
      setStockActual(producto.stock);
      setPrecioVenta(producto.venta);
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
    
    const nuevoItem = {
      codigo: codigoProducto,
      descripcion: nombreProducto,
      cantidad: Number(cantidad),
      precioVenta: Number(precioVenta),
      descuento: Number(descuento),
      total: totalProducto
    };
    
    setListaFactura([...listaFactura, nuevoItem]);

    setCodigoProducto("");
    setCategoriaSeleccionada("");
    setProductoSeleccionado("");
    setStockActual("");
    setCantidad("");
    setPrecioVenta("");
    setDescuento("");
  };

  const iniciarEdicion = (item, index) => {
    setCantidad(item.cantidad);
    setPrecioVenta(item.precioVenta);
    setDescuento(item.descuento);

    setIndexEditado(index);
    setEditando(true);
  };

    const actualizarProducto = () => {
    const nuevos = [...listaFactura];

    nuevos[indexEditado] = {
      ...nuevos[indexEditado],
      cantidad,
      precio: parseFloat(precioVenta),
      descuento,
      total: (cantidad * parseFloat(precioVenta)) - descuento
    };

    setListaFactura(nuevos);

    // limpiar
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

const guardarVenta = () => {
  if (!fecha || fecha.trim() === "") {
    alert("Debe seleccionar una fecha antes de guardar la venta");
    return;
  }
  console.log("Guardar venta");
};

const pagoContado = () => {
  setMostrarPago(true);
};

const pagoCredito = () => {
  console.log("Pago a crédito");
};


  // -----------------------------
  // USEEFFECT cálculos
  // -----------------------------

  useEffect(() => {
    generarNumeroFactura();
    generarHora();
    cargarClientes();
  }, []);

  useEffect(() => {
    const productosGuardados = JSON.parse(localStorage.getItem("productos")) || [];

    const productosNormalizados = productosGuardados.map((p) => ({
      id: p.id || p.codigo,
      codigo: String(p.codigo).toUpperCase(),
      nombre: p.descripcion || p.nombre || "",
      categoria: normalizarCategoria(p.categoria),
      stock: p.stock || 0,
      precio: p.venta || p.precio || 0
    }));

    setListaProductos(productosNormalizados);
  }, []);

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

  // -----------------------------
  // RENDER
  // -----------------------------

  return (
    <div>
      <Encabezado />

      <h2 style={{ textAlign: "left", marginTop: "5px", marginLeft:"250px" }}>
        REGISTRO DE VENTAS
      </h2>

      {/* MODAL DE TASAS */}
      {mostrarModalTasas && (
        <div className="modal">
          <div className="modal-contenido">
            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
              Tasas del Día
            </h3>

            {/* CAJA CHICA */}
            <h4 style={{ marginTop: "10px", marginBottom: "5px", color: "#444" }}>
              Caja Chica
            </h4>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label>Dólares</label>
                <input
                  type="number"
                  step="1"
                  value={cajaDolar}
                  onChange={(e) => setCajaDolar(e.target.value)}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label>Pesos</label>
                <input
                  type="number"

                  step="1"
                  value={cajaPeso}
                  onChange={(e) => setCajaPeso(e.target.value)}
                />
              </div>
            </div>

            {/* TASAS */}
            <h4 style={{ marginTop: "15px", marginBottom: "5px", color: "#444" }}>
              Tasas de Cambio
            </h4>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label>Bs.</label>
                <input
                  type="number"
                  step="0.01"
                  value={tasaDolar}
                  onChange={(e) => setTasaDolar(e.target.value)}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label>Pesos</label>
                <input
                  type="number"
                  step="1"
                  value={tasaPeso}
                  onChange={(e) => setTasaPeso(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                style={{
                  flex: 1,
                  backgroundColor: "#EDC5CD",
                  border: "1px solid #b88a92",
                  padding: "8px",
                  borderRadius: "6px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  let tasasGuardadas =
                    JSON.parse(localStorage.getItem("tasasDia")) || [];

                  tasasGuardadas = tasasGuardadas.filter(
                    (t) => t.fecha !== fecha
                  );

                  tasasGuardadas.push({
                    fecha,
                    cajaDolar,
                    cajaPeso,
                    tasaDolar,
                    tasaPeso,
                  });

                  localStorage.setItem(
                    "tasasDia",
                    JSON.stringify(tasasGuardadas)
                  );

                  setMostrarModalTasas(false);
                }}
              >
                Guardar
              </button>

              <button
                style={{
                  flex: 1,
                  backgroundColor: "#EDC5CD",
                  border: "1px solid #b88a92",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={() => setMostrarModalTasas(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
                verificarTasasPorFecha(nuevaFecha);
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

                const cliente = listaClientes.find(c => c.id === id);
                if (cliente) {
                  setNombreCliente(cliente.nombreCompleto);
                  setIdentificacion(cliente.identificacion);
                  }
              }}
            >
              <option value="">Seleccione</option>
              {listaClientes.map((c) => (
                <option key={c.id} value={c.id}>
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
            {categoriasDisponibles.map((cat, index) => (
            <option key={index} value={cat}>
            {cat}
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
                    p => String(p.id) === String(id)
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
                <option key={p.id} value={p.id}>
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
            value={formatoVE.format(totalProducto.toFixed(2))}
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
          <span>{formatoVE.format(totalPeso.toFixed(2))}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontWeight: "bold" }}>Total (Bs):</span>
          <span>{formatoVE.format(totalBs.toFixed(2))}</span>
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
