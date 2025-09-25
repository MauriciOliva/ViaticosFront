import { useState } from 'react';
import { useViaticosStore } from '../../hooks/ViaticosHook';
import { useExcelExport } from '../../hooks/Excel';

export const FiltrosViaticos = () => {
  const { filtros, setFiltros, getViaticosFiltrados } = useViaticosStore();
  const { exportToExcel, exportFilteredByDate } = useExcelExport();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ [campo]: valor });
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      tecnico: '',
      cliente: ''
    });
  };

  const handleExportar = async () => {
    const viaticosFiltrados = getViaticosFiltrados();
    await exportToExcel({ ...filtros, viaticos: viaticosFiltrados });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filtros y Exportación</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <button
            onClick={handleExportar}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Técnico</label>
            <input
              type="text"
              value={filtros.tecnico}
              onChange={(e) => handleFiltroChange('tecnico', e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Filtrar por técnico..."
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};