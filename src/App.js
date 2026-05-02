import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Usuarios from "./pages/Usuarios";
import Productos from "./pages/Productos";
import Entradas from "./pages/Entradas";
import Salidas from "./pages/Salidas";
import Movimientos from "./pages/Movimientos";
import Inventario from "./pages/Inventario";
import ImportarExcel from "./pages/ImportarExcel";
import Clientes from "./pages/Clientes";
import Ventas from "./pages/Ventas";
import Categorias from "./pages/Categorias";
import Tasas from "./pages/Tasas";
import Prueba from "./pages/Prueba";
import Consulta from "./pages/Consulta";
import Caja from "./pages/Caja";
import Gastos from "./pages/Gastos";
import Diario from "./pages/Diario";
import Repcredito from "./pages/ReporCredito";
import TipoGastos from "./pages/TipoGastos";

import ProtectedRoute from "./ProtectedRoute";   // ⭐ IMPORTANTE


function App() { 

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* MENU PROTEGIDO */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        /> 

        {/* USUARIOS (solo admin) */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              {localStorage.getItem("rolUsuario") === "ADMINISTRADOR"
                ? <Usuarios />
                : <Navigate to="/menu" replace />}
            </ProtectedRoute>
          }
        />

        {/* TODAS LAS DEMÁS RUTAS PROTEGIDAS */}
        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/entradas" element={<ProtectedRoute><Entradas /></ProtectedRoute>} />
        <Route path="/salidas" element={<ProtectedRoute><Salidas /></ProtectedRoute>} />
        <Route path="/movimientos" element={<ProtectedRoute><Movimientos /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
        <Route path="/importarExcel" element={<ProtectedRoute><ImportarExcel /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
        <Route path="/tasas" element={<ProtectedRoute><Tasas /></ProtectedRoute>} />
        <Route path="/prueba" element={<ProtectedRoute><Prueba /></ProtectedRoute>} />
        <Route path="/consulta" element={<ProtectedRoute><Consulta /></ProtectedRoute>} />
        <Route path="/caja" element={<ProtectedRoute><Caja /></ProtectedRoute>} />
        <Route path="/gastos" element={<ProtectedRoute><Gastos /></ProtectedRoute>} />
        <Route path="/diario" element={<ProtectedRoute><Diario /></ProtectedRoute>} />
        <Route path="/repcredito" element={<ProtectedRoute><Repcredito /></ProtectedRoute>} />
        <Route path="/tipogastos" element={<ProtectedRoute><TipoGastos /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
