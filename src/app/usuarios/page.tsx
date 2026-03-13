"use client";

import { useEffect, useState } from "react";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUsuarios(data));
  }, []);

  return (
    <main>
      <h1>Usuarios</h1>
      <ul>
        {usuarios.map((u) => (
          <li key={u.id}>
            {u.id} - {u.nombre} - {u.email}
          </li>
        ))}
      </ul>
    </main>
  );
}