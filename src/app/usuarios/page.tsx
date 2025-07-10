"use client";

import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const token = "<PEGÁ TU TOKEN AQUÍ>";

  useEffect(() => {
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
