import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const usuario = localStorage.getItem("usuarioNombre");

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return children;
}


