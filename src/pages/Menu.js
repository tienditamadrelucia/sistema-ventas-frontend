import React, { useState } from "react";
import encabezado from "../assets/encabezado.png";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { obtenerFechaLocalComoDate } from "../utils/fechaLocal";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

function Menu() {

  // 🔹 Navegación
  const navigate = useNavigate();

  // 🔹 Estados de submenús
  const [openInventario, setOpenInventario] = useState(false);
  const [openVentas, setOpenVentas] = useState(false);
  const [openReportes, setOpenReportes] = useState(false);
  const [openUsuarios, setOpenUsuarios] = useState(false);
  const [openProductos, setOpenProductos] = useState(false);
  const [openAdministracion, setOpenAdministracion] = useState(false);

  // 🔹 Usuario y fecha
  // 🔹 Leer usuario desde localStorage
  useEffect(() => {
    const nombre = localStorage.getItem("usuarioNombre") || "Usuario";

    const hoy = new Date().toLocaleDateString("es-VE");          // "2026-04-17"  
    
    // Manejar el evento de zoom
    const handleZoom = (event) => {
      document.body.style.zoom = event.detail; // Establece el zoom según el detalle del evento
    };

    window.addEventListener("setZoom", handleZoom);

    // Cleanup
    return () => {
      window.removeEventListener("setZoom", handleZoom);
    };
  }, []);

  // 🔹 Estilos
  const botonPrincipal = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    marginBottom: "10px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const botonPrincipalSimple = {
    ...botonPrincipal,
    justifyContent: "flex-start"
  };

  const botonSubmenu = {
    width: "90%",
    padding: "9px",
    backgroundColor: "#6699FF",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial",
    fontSize: "16px",
    fontWeight: "bold",
    margin: "5px 0 5px 20px",
    cursor: "pointer",
    textAlign: "left"
  };

  return (  

    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🌟 ENCABEZADO SUPERIOR */}
      <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "white",
          padding: "10px 0 5px 0",
          textAlign: "left",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 10
          }}>
        <img 
            src={encabezado}
            alt="Encabezado"
            style={{ width: "100%", maxWidth: "600px", marginLeft:"10px" }}
        />

        {/* Línea rosada */}
        <div style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#D98897",
            marginTop: "1px"
           }}>           
        </div>

        {/* Usuario + Fecha + Botones de Zoom en la MISMA línea */}
        <div style={{
          marginTop: "8px",
          fontFamily: "Arial",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#444",
          marginLeft: "30px",
          display: "flex", // Usamos flexbox para alinear en una sola línea
          justifyContent: "space-between", // Distribuir espacio entre elementos
          alignItems: "center", // Alinear verticalmente al centro
          }}>
          <div>
            Bienvenida, {nombre}, hoy es — {hoy}
          </div>
  
          {/* Contenedor para los botones de reducción de pantalla */}
          <div style={{
            display: "flex", // Usamos flexbox para los botones también
            alignItems: "center", // Alinear verticalmente al centro
            marginLeft: "auto", // Empujar este contenedor a la derecha
            }}>
            <label style={{ marginRight: "10px" }}>Reducción de pantalla</label>
    
            {/* Botones de Zoom */}
            <button onClick={() => window.dispatchEvent(new CustomEvent("setZoom", { detail: 1 }))} 
              style={{
                padding: "6px 10px", 
                fontSize: "14px", 
                backgroundColor: "#ffffff", 
                border: "1px solid #cccccc", 
                borderRadius: "4px",
                marginRight: "5px" // Espaciado entre botones
                }}>
              100%
            </button>

            <button onClick={() => window.dispatchEvent(new CustomEvent("setZoom", { detail: 0.85 }))} 
              style={{
                padding: "6px 10px", 
                fontSize: "14px", 
                backgroundColor: "#ffffff", 
                border: "1px solid #cccccc", 
                borderRadius: "4px",
                marginRight: "5px" // Espaciado entre botones
              }}>
              85%
            </button>

            <button onClick={() => window.dispatchEvent(new CustomEvent("setZoom", { detail: 0.75 }))} 
              style={{
                padding: "6px 10px", 
                fontSize: "14px", 
                backgroundColor: "#ffffff", 
                border: "1px solid #cccccc", 
                borderRadius: "4px"
              }}>
              75%
            </button>
          </div>
        </div>
      </div>
      {/* ← ESTE CIERRE ERA EL QUE FALTABA */}
      {/* 🌟 BARRA LATERAL */}
      <div style={{
          width: "250px",
          backgroundColor: "white",
          padding: "20px",
          marginTop: "180px",
          height: "calc(100vh - 180px)",
          overflowY: "auto",
          borderRight: "1px solid #ddd"
          }}>

          {/* PRODUCTOS */}
          <button
            style={botonPrincipal}
            onClick={() => setOpenProductos(!openProductos)}
          >
            PRODUCTOS
            <span>{openInventario ? "▲" : "▼"}</span>
          </button>
          
          {openProductos && (
            <>
          <button 
            style={botonSubmenu}
            onClick={async()=> {
            await registrarAccion("Ingresó al módulo Productos");
            navigate("/Productos");}}
          >
            Productos
          </button>
          <button 
            style={botonSubmenu}
            onClick={async()=> {
            await registrarAccion("Ingresó al módulo Categorías");
            navigate("/Categorias");}}
          >
            Categorias
          </button>

            </>
          )}                

          {/* INVENTARIO */}
          <button
            style={botonPrincipal}
            onClick={() => setOpenInventario(!openInventario)}
          >
            INVENTARIO
            <span>{openInventario ? "▲" : "▼"}</span>
          </button>

          {openInventario && (
            <>
              <button
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Entradas");
                  navigate("/entradas")}}
              >
                Entradas
              </button>
            
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Salidas");
                  navigate("/salidas")}}
              >
                Salidas
              </button>
            
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Movimientos");
                  navigate("/movimientos")}}
              >
                Movimientos
              </button>

              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Toma de Inventario");
                  navigate("/Inventario")}}
              >
                Toma de Inventario
              </button>
            </>
          )}

          {/* CONTROL ADMINISTRATIVO */}
          <button
            style={botonPrincipal}
            onClick={() => setOpenAdministracion(!openAdministracion)}
          >
            CONTROL ADMINISTRATIVO
            <span>{openAdministracion ? "▲" : "▼"}</span>
          </button>

          {openAdministracion && (
            <>
          <button
            style={{
            ...botonSubmenu,
            opacity: localStorage.getItem("rolUsuario") === "ADMINISTRADOR" ? 1 : 0.5,
            cursor: localStorage.getItem("rolUsuario") === "ADMINISTRADOR" ? "pointer" : "not-allowed"
            }}
            disabled={localStorage.getItem("rolUsuario") !== "ADMINISTRADOR"}
            onClick={async () => {
            await registrarAccion("Entró al módulo USUARIOS");
            if (localStorage.getItem("rolUsuario") === "ADMINISTRADOR") {
              navigate("/usuarios");
            }
          }}
          >
            Control de Usuarios
          </button>
        
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Tasas");
                  navigate("/tasas")}}
              >
                Tasas
              </button>     
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Tipo de Gastos");
                  navigate("/tipogastos")}}
              >
                Tipo de Gastos
              </button>                     
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Cuadre de Caja Diario");
                  navigate("/caja")}}
              >
                Cuadre de Caja diario
              </button>              
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Cierre de Mes");
                  navigate("/cierreMes")}}
              >
                Cierre de Mes
              </button>              
              <button 
                style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Ingresó al módulo Toma de Cierre de Año");
                  navigate("/cierreAño")}}
              >
                Cierre de Año
              </button>
            </>
          )}        

          {/* CLIENTES */}
          <button 
          style={botonPrincipalSimple}
          onClick={async() => {
            await registrarAccion("Entró al módulo CLIENTES")
            navigate("/Clientes")}}
          >
            CLIENTES
          </button>

          {/* GASTOS */}
          <button 
            style={botonPrincipalSimple}
            onClick={async() => {
              await registrarAccion("Entró al módulo de GASTOS")
              navigate("/Gastos")}}
            >
              GASTOS</button>

          {/* VENTAS */}
          <button
            style={botonPrincipal}
            onClick={() => setOpenVentas(!openVentas)}
          >
            VENTAS
            <span>{openVentas ? "▲" : "▼"}</span>
          </button>

          {openVentas && (
            <>
              <button
               style={botonSubmenu}
               onClick={async() => {
                await registrarAccion("Entró al módulo Registro de Ventas")
                 window.open("/ventas", "_blank")}}
               >
                Registro
              </button>
               
              <button 
              style={botonSubmenu}
              onClick={async() => {
                await registrarAccion("Entró al módulo Consulta de Ventas")
                 window.open("/consulta", "_blank")}}
              >
                Consulta
              </button>
            </>
          )}

          {/* REPORTES */}
          <button
            style={botonPrincipal}
            onClick={() => setOpenReportes(!openReportes)}
          >
            REPORTES
            <span>{openReportes ? "▲" : "▼"}</span>
          </button>

          {openReportes && (
            <> 
              <button 
                style={botonSubmenu}
                onClick={async() => {
                await registrarAccion("Entró al módulo Reporte Diario de Ventas")
                 window.open("/diario", "_blank")}}
                >
                  Diario de Ventas
              </button>

              <button style={botonSubmenu}>Entradas</button>
              <button style={botonSubmenu}>Salidas</button>
              <button style={botonSubmenu}>Gastos</button>
              <button style={botonSubmenu}>Ventas</button>
              <button style={botonSubmenu}>Inventario</button>
              <button style={botonSubmenu}
                onClick={async() => {
                  await registrarAccion("Entró al módulo Reporte de Crédito")
                  window.open("/ReporCredito", "_blank")}}
              >
                Crédito
              </button>

            </>
          )}

          {/* CIERRE */}
          <button style={botonPrincipalSimple}>CIERRE</button>

          {/* SALIR */}
          <button
            style={{ ...botonPrincipalSimple, backgroundColor: "#999" }}
            onClick={async() => {
              await registrarAccion("Salió del Sistema")
              localStorage.clear()
              navigate("/", { replace: true });
            }}
          >
            SALIR
          </button>

        </div>

        {/* 🌟 CONTENIDO PRINCIPAL */}
        <div style={{
          flex: 1,
          marginLeft: "50px",
          marginTop: "180px",
          padding: "20px"
          }}>          
        </div>
      </div>  
  );
}

export default Menu;