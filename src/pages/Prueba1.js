import React, { useEffect, useState } from "react";
import { cargarCategorias } from "../services/categorias";
import { cargarProductos } from "../services/productos";

const API = "http://localhost:4000/api";

function Prueba() {

  const [formData, setFormData] = useState({
      fecha: "",
      categoria: "",
      productoId: "",
      codigo: "",
      cantidad: "",
      observacion: ""
    });

    const selectEstilo = {
    width: "100%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#EDC5CD",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
const [modo, setModo] = useState("crear");
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");

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

  // CATEGORÍAS
  useEffect(() => {
  const cargarTodo = async () => {
    const cats = await cargarCategorias();
    setCategorias(cats);
    const prods = await cargarProductos();
    setProductos(prods);    
  };
  cargarTodo();
  }, []);

  useEffect(() => {
    const cargar = async () => {
    const prods = await cargarProductos();
    console.log("PRODUCTOS:", prods);
    setProductos(prods);
    };
    cargar();
    }, []);

  // PRODUCTOS POR CATEGORÍA
  const productosFiltrados = formData.categoria
    ? productos.filter((p) => p.categoria === formData.categoria)
    : [];

  
  // -----------------------------
  // 2. CATEGORÍA (descripción → código)
  // -----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoria") {
      const categoriaObj = categorias.find((c) => c.descripcion === value);
      setFormData({
        ...formData,
        categoria: categoriaObj ? categoriaObj.codigo : ""
      });
      return;
    }

  // -----------------------------
  // 3. PRODUCTO (Mongo _id)
  // -----------------------------
    if (name === "productoId") {
      const prod = productos.find((p) => p._id === value);
      setFormData({
        ...formData,
        productoId: value,
        codigo: prod ? prod.codigo : ""
      });
      return;
    }
};


  return (
    <div>
      <h2>Ventas</h2>

      <h3>Cliente</h3>
      <select
        value={clienteSeleccionado}
        onChange={(e) => setClienteSeleccionado(e.target.value)}
      >
        <option value="">Seleccione cliente</option>
        {clientes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.nombreCompleto} — {c.identificacion}
          </option>
        ))}
      </select>

      <h3>Categoría</h3>
      <select
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}          
          style={selectEstilo}
        >
<option value="">Seleccione categoría</option>
          {categorias.map((c) => (
            <option key={c._id} value={c.descripcion}>
              {c.descripcion}</option>
          ))}

</select>


      <h3>Producto</h3>
      <select
          name="productoId"
          value={formData.productoId}
          onChange={handleChange}          
          style={selectEstilo}
        >
<option value="">Seleccione producto</option>
          {productosFiltrados.map((p) => (
            <option key={p._id} value={p._id}>
              {p.descripcion}
            </option>
          ))}
      </select>
    </div>
  );
}


export default Prueba;
