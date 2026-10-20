import { API_URL } from "../config";

const API = `${API_URL}/api/usuarios`;

export async function obtenerUsuarios() {
  const res = await fetch(API, {
    credentials: "include"
  });

  return await res.json();
}

export async function crearUsuario(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(data)
  });

  return await res.json();
}

export async function actualizarUsuario(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(data)
  });

  return await res.json();
}

export async function eliminarUsuario(id) {
  return await fetch(`${API}/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
}

export async function buscarUsuario(usuario, clave) {
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ usuario, clave })
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        mensaje: data.mensaje || "Usuario o contraseña incorrectos"
      };
    }

    return data;

  } catch (error) {
    console.error("Error iniciando sesión:", error);

    return {
      ok: false,
      mensaje: "No se pudo conectar con el servidor"
    };
  }
}