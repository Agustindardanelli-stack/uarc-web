"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface CobranzaEntry {
  id: string;
  fecha: string;
  division: string;
  cancha: string;
  partido: string;
  arbitro: string;
  cobranza: number;
  cobrador: string;
  recibo: string;
  observaciones: string;
}

export default function PlanillaRecibosPage() {
  const [entries, setEntries] = useState<CobranzaEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<CobranzaEntry>>({
    fecha: new Date().toISOString().split('T')[0],
    division: 'PRIMERA A',
    cobranza: 31000,
    recibo: '',
    observaciones: ''
  });

  const handleInputChange = (field: keyof CobranzaEntry, value: string | number) => {
    setCurrentEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addEntry = () => {
    if (currentEntry.partido && currentEntry.cobrador) {
      const newEntry: CobranzaEntry = {
        id: Date.now().toString(),
        fecha: currentEntry.fecha || new Date().toISOString().split('T')[0],
        division: currentEntry.division || 'PRIMERA A',
        cancha: currentEntry.cancha || '',
        partido: currentEntry.partido || '',
        arbitro: currentEntry.arbitro || '',
        cobranza: currentEntry.cobranza || 31000,
        cobrador: currentEntry.cobrador || '',
        recibo: currentEntry.recibo || '',
        observaciones: currentEntry.observaciones || ''
      };
      
      setEntries(prev => [...prev, newEntry]);
      
      // Reset form but keep date and division
      setCurrentEntry({
        fecha: currentEntry.fecha,
        division: currentEntry.division,
        cobranza: 31000,
        recibo: '',
        observaciones: ''
      });
    }
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const generatePDF = () => {
    // Aquí iría la lógica para generar PDF
    alert('Funcionalidad de generación de PDF pendiente de implementar');
  };

  const totalCobranza = entries.reduce((sum, entry) => sum + entry.cobranza, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50 text-gray-900">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Planilla de Recibos - Cobranza Primera División</h1>
          
          {/* Formulario de entrada */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Agregar Nueva Cobranza</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha:</label>
                <input
                  type="date"
                  value={currentEntry.fecha || ''}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">División:</label>
                <select
                  value={currentEntry.division || ''}
                  onChange={(e) => handleInputChange('division', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PRIMERA A">PRIMERA A</option>
                  <option value="PRIMERA B">PRIMERA B</option>
                  <option value="PRIMERA FEMENINO">PRIMERA FEMENINO</option>
                  <option value="PRIMERA FEMENINO + 1 JUV">PRIMERA FEMENINO + 1 JUV</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Cancha:</label>
                <input
                  type="text"
                  value={currentEntry.cancha || ''}
                  onChange={(e) => handleInputChange('cancha', e.target.value)}
                  placeholder="Ej: San Martín V.M"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Partido: *</label>
                <input
                  type="text"
                  value={currentEntry.partido || ''}
                  onChange={(e) => handleInputChange('partido', e.target.value)}
                  placeholder="Ej: San Martín V.M vs Deportivo Rio IV"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Árbitro:</label>
                <input
                  type="text"
                  value={currentEntry.arbitro || ''}
                  onChange={(e) => handleInputChange('arbitro', e.target.value)}
                  placeholder="Nombre del árbitro"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Cobranza ($):</label>
                <input
                  type="number"
                  value={currentEntry.cobranza || ''}
                  onChange={(e) => handleInputChange('cobranza', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Usuario/Cobrador: *</label>
                <input
                  type="text"
                  value={currentEntry.cobrador || ''}
                  onChange={(e) => handleInputChange('cobrador', e.target.value)}
                  placeholder="Nombre del cobrador"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">N° Recibo:</label>
                <input
                  type="text"
                  value={currentEntry.recibo || ''}
                  onChange={(e) => handleInputChange('recibo', e.target.value)}
                  placeholder="Número de recibo"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Observaciones:</label>
                <textarea
                  value={currentEntry.observaciones || ''}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales"
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={addEntry}
              disabled={!currentEntry.partido || !currentEntry.cobrador}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Agregar Cobranza
            </button>
          </div>

          {/* Tabla de cobranzas */}
          {entries.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h2 className="text-xl font-semibold text-center">COBRANZA PRIMERA DIVISIÓN</h2>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Fecha: {entries[0]?.fecha}</span>
                  <span>Cobranza N° {entries.length}</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">División</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Cancha</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Partido</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Árbitro</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Cobranza</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Recibo</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Cobrador</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-sm font-medium">{entry.division}</td>
                        <td className="px-4 py-2 text-sm">{entry.cancha}</td>
                        <td className="px-4 py-2 text-sm">{entry.partido}</td>
                        <td className="px-4 py-2 text-sm">{entry.arbitro}</td>
                        <td className="px-4 py-2 text-sm text-right">${entry.cobranza.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">{entry.recibo}</td>
                        <td className="px-4 py-2 text-sm font-medium text-yellow-600">{entry.cobrador}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Resumen */}
              <div className="bg-gray-100 p-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm"><strong>Total de partidos:</strong> {entries.length}</p>
                    <p className="text-sm"><strong>Total cobranza:</strong> ${totalCobranza.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={generatePDF}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Descargar PDF
                  </button>
                </div>
              </div>
              
              {/* Información bancaria */}
              <div className="bg-blue-50 p-4 border-t">
                <h3 className="font-medium mb-2">Cuenta para transferencia</h3>
                <p className="text-sm"><strong>Alias:</strong> Uarc.01</p>
                <p className="text-sm"><strong>Banco:</strong> Supervielle</p>
              </div>
            </div>
          )}
          
          {entries.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No hay cobranzas registradas. Agrega la primera cobranza usando el formulario de arriba.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}