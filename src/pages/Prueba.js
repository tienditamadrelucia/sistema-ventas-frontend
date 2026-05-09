import React, { useEffect, useState } from 'react';
import { TodosClientes } from '../services/clientes';

const MostrarClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      const result = await TodosClientes();
      setClientes(result);
    };

    fetchClientes();
  }, []);

  const handleChange = (event) => {
    setSelectedCliente(event.target.value);
  };

  return (
    <div>
      <h1>Seleccione un Cliente</h1>
      <select value={selectedCliente} onChange={handleChange}>
        <option value="">-- Seleccione un cliente --</option>
        {clientes.map(cliente => (
          <option key={cliente.identificacion} value={cliente.identificacion}>
            {cliente.nombreCompleto}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MostrarClientes;