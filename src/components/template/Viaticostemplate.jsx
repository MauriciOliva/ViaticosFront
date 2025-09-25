import { useState, useEffect, useCallback } from 'react';
import { useViaticosStore } from '../../hooks/ViaticosHook';
import { ViaticosForm } from '../Forms/ViaticoForm';
import { FiltrosViaticos } from '../atomos/filtroViaticos';
import { formatearFechaParaMostrar } from '../../services/fechaUtils';

export const ViaticosList = () => {
  const { 
    viaticos, 
    isLoading, 
    error, 
    getViaticos, 
    calcularEstadisticas,
    clearError,
    deleteViatico // ✅ NUEVO: Importar deleteViatico
  } = useViaticosStore();
  
  const [estadisticas, setEstadisticas] = useState({
    totalDado: 0,
    totalGastado: 0,
    diferencia: 0,
    porcentajeGastado: 0
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedViatico, setSelectedViatico] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingViatico, setEditingViatico] = useState(null); // ✅ NUEVO: Estado para edición
  const [deletingViatico, setDeletingViatico] = useState(null); // ✅ NUEVO: Estado para eliminación

  const loadViaticos = useCallback(async () => {
    try {
      await getViaticos();
    } catch (error) {
      console.error('Error loading viaticos:', error);
    }
  }, [getViaticos]);

  useEffect(() => {
    getViaticos();
  }, [loadViaticos]);

  useEffect(() => {
    if (viaticos.length > 0) {
      console.log('📊 Calculando estadísticas para', viaticos.length, 'viáticos');
      setEstadisticas(calcularEstadisticas());
    } else {
      setEstadisticas({
        totalDado: 0,
        totalGastado: 0,
        diferencia: 0,
        porcentajeGastado: 0
      });
    }
  }, [viaticos]);

  const formatFecha = (fecha) => {
  if (!fecha) return 'Fecha no especificada';
    return formatearFechaParaMostrar(fecha);
  };
  
  const getColorDiferencia = (diferencia) => {
    return diferencia >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleSuccess = () => {
    console.log('✅ Viático creado/actualizado exitosamente, recargando...');
    setShowForm(false);
    setEditingViatico(null);
  };

  const handleViewDetails = (viatico) => {
    setSelectedViatico(viatico);
    setShowDetails(true);
  };

  // ✅ NUEVO: Función para editar viático
  const handleEditViatico = (viatico) => {
    setEditingViatico(viatico);
    setShowForm(true);
  };

  // ✅ NUEVO: Función para confirmar eliminación
  const handleDeleteViatico = (viatico) => {
    setDeletingViatico(viatico);
  };

  // ✅ NUEVO: Función para ejecutar eliminación
  const confirmDelete = async () => {
    if (!deletingViatico) return;

    try {
      await deleteViatico(deletingViatico._id);
      setDeletingViatico(null);
      console.log('✅ Viático eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando viático:', error);
    }
  };

  // ✅ NUEVO: Modal de confirmación de eliminación
  const DeleteConfirmationModal = useCallback(({ viatico, onConfirm, onCancel }) => {
    if (!viatico) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Confirmar Eliminación</h2>
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar el viático de <strong>{viatico.NombreTecnico}</strong>?
            </p>
            
            <div className="bg-red-50 p-3 rounded border border-red-200 mb-4">
              <p className="text-sm text-red-700">
                <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. Se eliminarán todas las fotos y la firma asociadas.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  useEffect(() => {
    if (viaticos.length > 0) {
      console.log('📸 Viáticos cargados:', viaticos.length);
      console.log('📸 Primer viático:', {
        tecnico: viaticos[0]?.NombreTecnico,
        fotos: viaticos[0]?.Fotos
      });
    }
  }, [viaticos]);

  const ViaticoDetailsModal = useCallback(({ viatico, onClose, onEdit, onDelete }) => {
    if (!viatico) return null;

    const diferencia = (viatico.MontoDado || 0) - (viatico.Montogastado || 0);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Detalles del Viático - {viatico.NombreTecnico}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* ✅ NUEVO: Botones de acción en el modal */}
            <div className="flex justify-end space-x-2 mb-4">
              <button
                onClick={() => onEdit(viatico)}
                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => onDelete(viatico)}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                🗑️ Eliminar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Información General
                </h3>
                
                <div>
                  <label className="font-medium text-gray-700">Técnico:</label>
                  <p className="text-gray-900">{viatico.NombreTecnico}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Teléfono:</label>
                  <p className="text-gray-900">{viatico.Telefono}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Cliente:</label>
                  <p className="text-gray-900">{viatico.Cliente}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Ubicación:</label>
                  <p className="text-gray-900">{viatico.Ubicacion}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Fecha de Entrada:</label>
                  <p className="text-gray-900">{formatFecha(viatico.FechaEntrada)}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Fecha de Salida:</label>
                  <p className="text-gray-900">{formatFecha(viatico.FechaSalida)}</p>
                </div>
              </div>

              {/* Gastos Detallados */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Gastos Detallados
                </h3>
                
                <div className="bg-gray-50 p-3 rounded">
                  <label className="font-medium text-gray-700">Movilización:</label>
                  {viatico.Movilizacion && viatico.Movilizacion.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {viatico.Movilizacion.map((mov, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{mov.tipo}:</span>
                          {mov.descripcion && <span> - {mov.descripcion}</span>}
                          <div className="text-gray-600">
                            Ida: Q{mov.montoIda?.toFixed(2)} | Vuelta: Q{mov.montoVuelta?.toFixed(2)} | 
                            Total: Q{((mov.montoIda || 0) + (mov.montoVuelta || 0)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="font-medium mt-2">
                        Total Movilización: Q{viatico.Movilizacion.reduce((total, mov) => 
                          total + (mov.montoIda || 0) + (mov.montoVuelta || 0), 0).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900">No especificado</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <label className="font-medium text-gray-700">Hospedaje:</label>
                  <p className="text-gray-900">Q{viatico.Hospedaje?.monto?.toFixed(2)} - {viatico.Hospedaje?.nombre}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <label className="font-medium text-gray-700">Comida:</label>
                  <p className="text-gray-900">Q{viatico.Comida?.monto?.toFixed(2)} - {viatico.Comida?.tipo}</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <label className="font-medium text-blue-700">Monto Dado:</label>
                  <p className="text-blue-900 font-bold">Q{viatico.MontoDado?.toFixed(2)}</p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <label className="font-medium text-orange-700">Monto Gastado:</label>
                  <p className="text-orange-900 font-bold">Q{viatico.Montogastado?.toFixed(2)}</p>
                </div>
                
                <div className={`p-3 rounded border ${
                  diferencia >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <label className={`font-medium ${diferencia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Diferencia:
                  </label>
                  <p className={`font-bold ${diferencia >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    Q{Math.abs(diferencia).toFixed(2)} {diferencia >= 0 ? '(Ahorro)' : '(Sobregasto)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Galería de Imágenes */}
            {(viatico.Fotos && viatico.Fotos.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                  Fotos ({viatico.Fotos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {viatico.Fotos.map((foto, index) => {
                    const imageUrl = foto;
                    
                    const handleImageClick = () => {
                      window.open(imageUrl, '_blank', 'noopener,noreferrer');
                    };
                    
                    return (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={`Foto ${index + 1} del viático de ${viatico.NombreTecnico}`}
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                          onClick={handleImageClick}
                          onError={(e) => {
                            console.error(`❌ Error cargando imagen: ${imageUrl}`);      
                            if (imageUrl.includes(':\\') || imageUrl.includes('C:')) {
                              const fileName = imageUrl.split('\\').pop() || imageUrl.split('/').pop();
                              const fallbackUrl = `http://localhost:2600/uploads/${fileName}`;
                              console.log('🔄 Intentando con URL corregida:', fallbackUrl);
                              e.target.src = fallbackUrl;
                            } else {
                              e.target.src = '/placeholder-image.jpg'; 
                            }
                          }}
                          onLoad={() => console.log(`✅ Imagen cargada correctamente: ${imageUrl}`)}
                          loading="lazy"
                        />
                        <div className="p-2 bg-gray-50 text-center">
                          <span className="text-sm text-gray-600">Foto {index + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viatico.Firma && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                  Firma del Técnico
                </h3>
                <div className="bg-white p-4 rounded border">
                  <img 
                    src={viatico.Firma} 
                    alt={`Firma de ${viatico.NombreTecnico}`}
                    className="max-w-xs mx-auto border rounded"
                  />
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Firma de {viatico.NombreTecnico}
                  </p>
                </div>
              </div>
            )}

            {/* Botón de cierre */}
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  console.log('🔄 Renderizando ViaticosList, viaticos:', viaticos.length);

  return (
    <div className="m-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <button onClick={clearError} className="float-right font-bold">×</button>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-lg">Cargando viáticos...</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Viáticos</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Nuevo Viático
            </button>
          </div>

          <FiltrosViaticos/>

          {/* Panel de Estadísticas */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen General de Viáticos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800">Total Dado</h3>
                <p className="text-2xl font-bold text-blue-600">Q{estadisticas.totalDado.toFixed(2)}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800">Total Gastado</h3>
                <p className="text-2xl font-bold text-orange-600">Q{estadisticas.totalGastado.toFixed(2)}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Diferencia</h3>
                <p className={`text-2xl font-bold ${getColorDiferencia(estadisticas.diferencia)}`}>
                  Q{Math.abs(estadisticas.diferencia).toFixed(2)}
                  {estadisticas.diferencia >= 0 ? ' 🟢' : ' 🔴'}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800">% Gastado</h3>
                <p className="text-2xl font-bold text-purple-600">{estadisticas.porcentajeGastado}%</p>
              </div>
            </div>
          </div>

          {/* Listado de Viáticos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Listado de Viáticos ({viaticos.length})
            </h2>
            
            {viaticos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay viáticos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Técnico</th>
                      <th className="px-4 py-2 text-left">Cliente</th>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-right">Monto Dado</th>
                      <th className="px-4 py-2 text-right">Monto Gastado</th>
                      <th className="px-4 py-2 text-right">Diferencia</th>
                      <th className="px-4 py-2 text-center">Fotos</th>
                      <th className="px-4 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viaticos.map((viatico, index) => {
                      const diferencia = (viatico.MontoDado || 0) - (viatico.Montogastado || 0);
                      const tieneFotos = viatico.Fotos && viatico.Fotos.length > 0;
                      
                      return (
                        <tr key={viatico._id || index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{viatico.NombreTecnico}</td>
                          <td className="px-4 py-2 text-sm">{viatico.Cliente}</td>
                          <td className="px-4 py-2 text-sm">{formatFecha(viatico.FechaEntrada)}</td>
                          <td className="px-4 py-2 text-right font-semibold">
                            Q{(viatico.MontoDado || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            Q{(viatico.Montogastado || 0).toFixed(2)}
                          </td>
                          <td className={`px-4 py-2 text-right font-bold ${getColorDiferencia(diferencia)}`}>
                            Q{Math.abs(diferencia).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {tieneFotos ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {viatico.Fotos.length} 📷
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                                Sin fotos
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(viatico)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                              >
                                👁️ Ver
                              </button>
                              {/* ✅ NUEVO: Botones de editar y eliminar */}
                              <button
                                onClick={() => handleEditViatico(viatico)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteViatico(viatico)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <ViaticosForm
          onClose={() => {
            setShowForm(false);
            setEditingViatico(null);
          }}
          onSuccess={handleSuccess}
          viaticoExistente={editingViatico} // ✅ NUEVO: Pasar viático a editar
        />
      )}

      {/* Modal de Detalles */}
      {showDetails && selectedViatico && (
        <ViaticoDetailsModal
          viatico={selectedViatico}
          onClose={() => setShowDetails(false)}
          onEdit={handleEditViatico} 
          onDelete={handleDeleteViatico} 
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deletingViatico && (
        <DeleteConfirmationModal
          viatico={deletingViatico}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingViatico(null)}
        />
      )}
    </div>
  );
};