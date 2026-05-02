import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Categorias = () => {
  const navigate = useNavigate();

  // -------------------------
  // ESTILOS
  // -------------------------

    const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black, Arial, sans-serif",
    letterSpacing: "1px",
    cursor: "pointer",
    marginTop: "10px"
  };

  const iconoEditar = {
    fontSize: "22px",
    cursor: "pointer",
    marginRight: "10px"
  };

  const iconoEliminar = {
    fontSize: "22px",
    cursor: "pointer",
    color: "#B84A4A"
  };

  // -------------------------
  // ESTADOS
  // -------------------------

  const [categorias, setCategorias] = useState([]);
  const [modo, setModo] = useState("crear");
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const formularioRef = useRef(null);

  const [formData, setFormData] = useState({
    codigo: "",
    descripcion: ""
  });
  const [procesando, setProcesando] = useState(false);
  const codigoRef = useRef(null);  

  // -------------------------
  // CARGAR DESDE DB
  // -------------------------

  useEffect(() => {
    const cargarCategorias = async () => {
      const res = await fetch(`${API_URL}/api/categorias`);
      const data = await res.json();
      setCategorias(data);
    };

    cargarCategorias();
  }, []);

  useEffect(() => {
    if (codigoRef.current) {
      codigoRef.current.focus();
    }
  }, []);

  // -------------------------
  // MANEJO FORMULARIO
  // -------------------------

  const handleChange = (e) => {  
    const { name, value } = e.target;
    const valorFinal = typeof value === "string" ? value.toUpperCase() : value;

    setFormData({
      ...formData,
      [name]: valorFinal
    });
  };

  // -------------------------
  // GUARDAR EN DB
  // -------------------------

  const guardarCategoria = async () => {
  if (procesando) return;
  setProcesando(true);
  try {
    if (!formData.codigo || !formData.descripcion) {
      alert("Debe ingresar código y descripción");
      return;
    }
    if (modo === "crear") {
      const res = await fetch(`${API_URL}/api/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      // ⭐ SI EL BACKEND DICE ERROR → NO AGREGAR
      if (!res.ok) {
        alert(data.error || "No se pudo crear la categoría");
        return;
      }
      // ⭐ SOLO SI TODO ESTÁ BIEN → AGREGAR
      setCategorias([...categorias, data]);
    } else {
      // ⭐ actualizar
      const res = await fetch(`${API_URL}/api/categorias/${categoriaEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo actualizar la categoría");
        return;
      }
      setCategorias(
        categorias.map((c) =>
          c._id === categoriaEditando ? data : c
        )
      );
    }
    limpiarFormulario();
  } finally {
    setProcesando(false);
  }
};


  // -------------------------
  // EDITAR
  // -------------------------

  const editarCategoria = (cat) => {
    setModo("editar");
    setCategoriaEditando(cat._id);

    setFormData({
      codigo: cat.codigo,
      descripcion: cat.descripcion
    });

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // -------------------------
  // ACTUALIZAR EN DB
  // -------------------------

  const actualizarCategoria = async () => {    
  if (!categoriaEditando) return;
  const res = await fetch(
    `${API_URL}/api/categorias/${categoriaEditando}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    }
  );
  const data = await res.json();
  // ⭐ SI EL BACKEND DICE ERROR → NO ACTUALIZAR
  if (!res.ok) {
    alert(data.error || "No se pudo actualizar la categoría");
    return;
  }
  // ⭐ ACTUALIZAR SIN DUPLICAR
  setCategorias((prev) =>
    prev.map((c) =>
      c._id === categoriaEditando ? data : c
    )
  );
  limpiarFormulario();
};

  // -------------------------
  // ELIMINAR EN DB
  // -------------------------

  const eliminarCategoria = async (id) => {
  if (!window.confirm("¿Eliminar esta categoría?")) return;
  try {
    const res = await fetch(`${API_URL}/api/categorias/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    // ⭐ SI EL BACKEND DICE ERROR → MOSTRAR EL MENSAJE REAL
    if (!res.ok) {
      alert(data.error);   // ← AQUÍ SALE: "No se puede eliminar la categoría porque tiene productos asociados"
      return;
    }
    // ⭐ SOLO SI ELIMINÓ → actualizar lista
    setCategorias(categorias.filter((c) => c._id !== id));
  } catch (error) {
    alert("Error eliminando categoría");
  }
};

  // -------------------------
  // LIMPIAR FORMULARIO
  // -------------------------

  const limpiarFormulario = () => {
    setModo("crear");
    setCategoriaEditando(null);
    setFormData({ codigo: "", descripcion: "" });

    setTimeout(() => {
      codigoRef.current?.focus();
    }, 50);
  };

  // -------------------------
  // RETURN
  // -------------------------

  return (
    <div>
      <Encabezado />

      <div style={{ padding: "1px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "10px", fontWeight: "bold" }}>
          Gestión de Categorías
        </h2>

        {/* FORMULARIO */}
        <div
          ref={formularioRef}
          style={{
            width: "450px",
            margin: "0 auto 10px auto",
            padding: "1px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
            {modo === "crear" ? "Registrar Categoría" : "Editar Categoría"}
          </h3>

          <input
            //ref={codigoRef}
            name="codigo"
            placeholder="Código"
            value={formData.codigo}
            onChange={(e) => {
              let valor = e.target.value.toUpperCase();
              valor = valor.replace(/[^A-Z]/g, "");
              if (valor.length > 3) valor = valor.slice(0, 3);
              setFormData({ ...formData, codigo: valor });
            }}
            style={{
              width: "40%",
              marginLeft: "20px",
              marginBottom: "10px",
              padding: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />

          <input
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            style={{
              width: "87%",
              marginBottom: "10px",
              marginLeft: "20px",
              padding: "5px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
                type="button"                
                disabled={procesando}
              onClick={modo === "crear" ? guardarCategoria : actualizarCategoria}
              style={{
                width: "50%",
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontFamily: "Arial Black",                
                marginBottom: "10px",
                opacity:procesando ? 0.6 :1,
                cursor: procesando ? "not-allowed":"pointer",
                backgroundColor: modo === "crear" ? "#D98897" : "#6699FF"
              }}              
            >
              {modo === "crear" ? "Guardar" : "Actualizar"}              
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <button onClick={() => navigate("/menu")} style={estiloBoton}>
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* TABLA */}
        <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
          Lista de Categorías
        </h3>

        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {categorias.map((c) => (
              <tr key={c._id}>
                <td>{c.codigo}</td>
                <td>{c.descripcion}</td>
                <td>
                  <span onClick={() => editarCategoria(c)} style={iconoEditar}>✏️</span>
                  <span onClick={() => eliminarCategoria(c._id)} style={iconoEliminar}>🗑️</span>
                </td>
              </tr>
            ))}
        </tbody>
        </table>
        
      </div>
    </div>
  );
};

export default Categorias;