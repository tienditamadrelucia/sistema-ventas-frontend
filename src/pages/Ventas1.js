import React, { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import carritoImg from "../assets/carrito.png";
import { useNavigate } from "react-router-dom";

const Ventas = () => {

  // -----------------------------
  // ESTADOS PRINCIPALES
  // -----------------------------

  // Modal de tasas del día
  const [mostrarModalTasas, setMostrarModalTasas] = useState(false);

  // Modal agregar cliente rápido
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);

  // Modal editar producto
  const [productoEditar, setProductoEditar] = useState(null);

  // Datos de la factura
  const [numeroFactura, setNumeroFactura] = useState("");
  const [hora, setHora] = useState("");
  const [fecha, setFecha] = useState("");

  // Datos del cliente
  const [identificacion, setIdentificacion] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [listaClientes, setListaClientes] = useState([]);

  // Productos
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [precioVenta, setPrecioVenta] = useState(0);
  const [stockActual, setStockActual] = useState(0);
  const [cantidad, setCantidad] = useState("");
  const [descuento, setDescuento] = useState("");
  const [totalProducto, setTotalProducto] = useState(0);

  // Categoría seleccionada del producto
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

  // Lista de productos agregados a la factura
  const [listaFactura, setListaFactura] = useState([]);

  // Totales
  const [subtotalDolar, setSubtotalDolar] = useState(0);
  const [subtotalPeso, setSubtotalPeso] = useState(0);
  const [subtotalBs, setSubtotalBs] = useState(0);
  const [iva, setIva] = useState("");
  const [totalDolar, setTotalDolar] = useState(0);
  const [totalPeso, setTotalPeso] = useState(0);
  const [totalBs, setTotalBs] = useState(0);

  // Tasas del día
  const [tasaDolar, setTasaDolar] = useState("");
  const [tasaPeso, setTasaPeso] = useState("");
  const [cajaDolar, setCajaDolar] = useState("");
  const [cajaPeso, setCajaPeso] = useState("");

  // Productos disponibles
const [productos, setProductos] = useState([]);

// Selección actual
const [productoSeleccionado, setProductoSeleccionado] = useState("");

// Validaciones
const [errorPrecio, setErrorPrecio] = useState("");
const [errorStock, setErrorStock] = useState("");

// Categorías
const [categorias, setCategorias] = useState([]);

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

  // -----------------------------
  // CARGA INICIAL
  // -----------------------------
  useEffect(() => {
  generarNumeroFactura();
  generarHora();
  cargarClientes();
}, []);

  useEffect(() => {
    const subtotal = cantidad * precioVenta;
    const desc = subtotal * (descuento / 100);
    setTotalProducto(subtotal - desc);
}, [cantidad, precioVenta, descuento]);

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
      // No existe registro → abrir modal
      setMostrarModalTasas(true);
    } else {
      // Sí existe → cargar valores
      setTasaDolar(registro.tasaDolar);
      setTasaPeso(registro.tasaPeso);
      setCajaDolar(registro.cajaDolar);
      setCajaPeso(registro.cajaPeso);
    }
  };

  const cargarClientes = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    setListaClientes(clientes);
  };

  /* -----------------------------------------
   FUNCIONES
------------------------------------------ */

// Buscar producto por código
const buscarPorCodigo = (codigoIngresado: string) => {
  const prod = productos.find(p => p.codigo === codigoIngresado);
  if (!prod) return;

  setProductoSeleccionado(prod.id);
  setCategoriaSeleccionada(prod.categoriaId);
  setStockActual(prod.stock);
  setPrecioVenta(prod.precio);
};

// Cargar datos al seleccionar producto
const cargarProducto = (id: string) => {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  setCodigo(prod.codigo);
  setCategoriaSeleccionada(prod.categoriaId);
  setStockActual(prod.stock);
  setPrecioVenta(prod.precio);
};

// Validaciones
const validarPrecio = (valor: number) => {
  if (valor <= 0) {
    setErrorPrecio("El precio debe ser mayor a 0");
  } else {
    setErrorPrecio("");
  }
  setPrecioVenta(valor);
};

const validarStock = (cant: number) => {
  if (cant > stockActual) {
    setErrorStock("Stock insuficiente");
  } else {
    setErrorStock("");
  }
  setCantidad(cant);
};

const agregarAlCarrito = () => {
  if (!codigo || !descripcion) {
    alert("Debe seleccionar un producto.");
    return;
  }

  if (!cantidad || cantidad <= 0) {
    alert("La cantidad debe ser mayor a 0.");
    return;
  }

  if (cantidad > stockActual) {
    alert("La cantidad supera el stock disponible.");
    return;
  }

  const nuevoItem = {
    codigo,
    descripcion,
    cantidad: Number(cantidad),
    precioVenta: Number(precioVenta),
    descuento: Number(descuento),
    total: totalProducto
  };

  setListaFactura([...listaFactura, nuevoItem]);

  // limpiar campos
  setCodigo("");
  setDescripcion("");
  setCantidad("");
  setPrecioVenta(0);
  setDescuento("");
  setStockActual(0);
  setTotalProducto(0);
};

const eliminarItem = (index) => {
  const nuevaLista = [...listaFactura];
  nuevaLista.splice(index, 1);
  setListaFactura(nuevaLista);
};

const volverMenu = () => {
  // navegación o acción que quieras
  console.log("Volver al menú");
};

const guardarVenta = () => {
  console.log("Guardar venta");
};

const pagoContado = () => {
  console.log("Pago al contado");
};

const pagoCredito = () => {
  console.log("Pago a crédito");
};

const navigate = useNavigate();

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
  <div>
    <Encabezado />

    <h2 style={{ textAlign: "center", marginTop: "20px" }}>
      REGISTRO DE VENTAS
    </h2>

    {/* -------------------------
        MODAL: TASAS DEL DÍA
    -------------------------- */}
    {mostrarModalTasas && (
    <div className="modal">
      <div className="modal-contenido">

        <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
          Tasas del Día
        </h3>

        {/* SUBTÍTULO CAJA CHICA */}
        <h4 style={{ marginTop: "10px", marginBottom: "5px", color: "#444" }}>
          Caja Chica
        </h4>

        {/* INPUTS DÓLARES Y PESOS */}
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

        {/* SUBTÍTULO TASAS DE CAMBIO */}
        <h4 style={{ marginTop: "15px", marginBottom: "5px", color: "#444" }}>
          Tasas de Cambio
        </h4>

        {/* INPUTS BS Y PESOS */}
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

        {/* BOTONES */}
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

  {/* CONTENEDOR HORIZONTAL */}
<div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
>
  {/* -------------------------
        A) DATOS DE LA FACTURA
  -------------------------- */}
  <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px", width: "520px", marginBottom: "20px" }}
  >
    <h3 style={{ marginTop: 0 }}>Datos de la Factura</h3>

    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
        <label>Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => {
            const nuevaFecha = e.target.value;
            setfecha(nuevaFecha);
            verificarTasasPorFecha(nuevaFecha);
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
        <label>N° Factura</label>
        <input
          type="text"
          value={numeroFactura}
          readOnly
          style={{ backgroundColor: "#EDC5CD" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
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

  {/* -------------------------
        B) DATOS DEL CLIENTE
  -------------------------- */}
  <div
    style={{
      border: "1px solid #ccc",
      padding: "15px",
      borderRadius: "8px",
      width: "630px",
      marginBottom: "20px"
    }}
  >    
    <h3 style={{ marginTop: 0 }}>Datos del Cliente</h3>

    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
        <label>Identificación</label>
        <input
          type="text"
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>
        <label>Nombre</label>
        <select
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
        >
          <option value="">Seleccione</option>
          {listaClientes.map((c) => (
            <option key={c.id} value={c.nombreCompleto}>
              {c.nombreCompleto}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => setMostrarModalCliente(true)}
        style={{ height: "32px" }}
      >
        Agregar Cliente Rápido
      </button>
    </div>
  </div>
</div>

{/* -----------------------------------------
   SECCIÓN PRODUCTOS
------------------------------------------ */}
<div
  style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px", width: "74%", marginTop: "0px" }}
>
  <h3 style={{ marginTop: 0 }}>Productos</h3>

  <div
    style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
  >
    {/* CÓDIGO */}
    <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
      <label>Código</label>
      <input
        type="text"
        value={codigo}
        onChange={(e) => {
          setCodigo(e.target.value);
          buscarPorCodigo(e.target.value);
        }}
      />
    </div>

    {/* CATEGORÍA */}
    <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>
      <label>Categoría</label>
      <select
        value={categoriaSeleccionada}
        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
      >
        <option value="">Seleccione</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
    </div>

    {/* PRODUCTO */}
    <div style={{ display: "flex", flexDirection: "column", width: "400px" }}>
      <label>Producto</label>
      <select
        value={productoSeleccionado}
        onChange={(e) => {
          setProductoSeleccionado(e.target.value);
          cargarProducto(e.target.value);
        }}
      >
        <option value="">Seleccione</option>
        {productos
          .filter(p => !categoriaSeleccionada || p.categoriaId === categoriaSeleccionada)
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
          backgroundColor: stockActual <= 0 ? "#ffb3b3" : "#EDC5CD"
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
    <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
      <label>Precio</label>
      <input
        type="number"
        step="0.01"
        value={precioVenta}
        onChange={(e) => validarPrecio(Number(e.target.value))}
        style={{
          borderColor: errorPrecio ? "red" : "#ccc"
        }}
      />
      {errorPrecio && (
        <span style={{ color: "red", fontSize: "12px" }}>{errorPrecio}</span>
      )}
    </div>

    {/* DESCUENTO */}
    <div style={{ display: "flex", flexDirection: "column", width: "80px" }}>
      <label>Desc %</label>
      <input
        type="number"
        step="0.01"
        value={descuento}
        onChange={(e) => setDescuento(Number(e.target.value))}
      />
    </div>

    {/* TOTAL */}
    <div style={{ display: "flex", flexDirection: "column", width: "150px" }}>
      <label>Total</label>
      <input
        type="text"
        value={totalProducto.toFixed(2)}
        readOnly
        style={{ backgroundColor: "#EDC5CD" }}
      />
    </div>

    {/* BOTÓN CARRITO */}
    <button
      onClick={agregarAlCarrito}
      style={{
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
  </div>  
</div>

    {/* -------------------------
        TABLA DE PRODUCTOS
    -------------------------- */}
<div style={{ marginTop: "15px", border: "1px solid #8AB6D6", borderRadius: "8px", padding: "10px", width: "75%" }}
>
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
  >
    <thead>
      <tr style={{ backgroundColor: "#6699FF", color: "#FFFFFF" }}> {/* azul muy claro */}
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
        <tr key={index} style={{ backgroundColor: "#F2F9FD" }}> {/* azul casi blanco */}
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

          {/* BOTÓN ELIMINAR */}
          <td
            style={{
              padding: "6px",
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
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* BOTONES DEBAJO DE LA TABLA */}
<div style={{ marginTop: "1px", display: "flex", justifyContent: "left", gap: "10px" }}
>
  <button onClick={() => navigate("/menu")} style={estiloBoton}>
    Volver al MENÚ PRINCIPAL
  </button>

  <button onClick={guardarVenta} style={estiloBoton}>
    Guardar Venta
  </button>
</div>

    {/* -------------------------
        D) TOTALES
    -------------------------- */}
  <div
    style={{
      marginTop: "0px",
      width: "220px",
      marginLeft: "1200px",
      border: "1px solid #8AB6D6",
      borderRadius: "8px",
      padding: "10px",
      backgroundColor: "#EDC5CD"
    }}
  >

    {/* SUBTOTAL */}
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontWeight: "bold" }}>Subtotal (USD):</span>
      <span>{subtotalDolar.toFixed(2)}</span>
    </div>

    {/* IVA */}
    <div style={{ display: "flex", flexDirection: "column", width: "80px" }}>
      <label>IVA %</label>
      <input
        type="number"
        value={iva}
        onChange={(e) => setIva(Number(e.target.value))}        
      />
    </div>

    {/* TOTAL USD */}
    <div style={{ 
      display: "flex",
      justifyContent: "space-between",
      marginTop: "10px",
      paddingTop: "8px",
      borderTop: "1px solid #8AB6D6",
      fontSize: "16px",
      fontWeight: "bold"
    }}
  >
      <span>Total (USD):</span>
      <span>{totalDolar.toFixed(2)}</span>
    </div>

    {/* TOTAL PESOS */}
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
      <span style={{ fontWeight: "bold" }}>Total (COP):</span>
      <span>{totalPeso.toFixed(2)}</span>
    </div>

    {/* TOTAL BOLÍVARES */}
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
      <span style={{ fontWeight: "bold" }}>Total (Bs):</span>
      <span>{totalBs.toFixed(2)}</span>
    </div>
  </div>

    {/* SECCIÓN DE BOTONES */}  
  <div
    style={{
      marginTop: "0px",      
      marginLeft: "1200px",      
      padding: "1px",
    }}
  >
    <button onClick={pagoContado} style={estiloBoton}>
      Pago Contado
    </button>

    <button onClick={pagoCredito} style={{... estiloBoton, backgroundColor: "#6699FF"}}>
      Pago Crédito
    </button>
  </div>
</div>
);
}
export default Ventas;