import { useState, useEffect } from 'react'; 
import { useViaticosStore } from '../../hooks/ViaticosHook';
import { SignatureCanvas } from '../atomos/signatureCanvas';

export const ViaticosForm = ({ onClose, onSuccess, viaticoExistente }) => { 
  const { createViaticoWithImages, updateViatico, isLoading } = useViaticosStore(); 
  
  const isEditing = Boolean(viaticoExistente);
  
  const [formData, setFormData] = useState({
    NombreTecnico: '',
    Telefono: '',
    FechaEntrada: '',
    FechaSalida: '',
    Cliente: '',
    Movilizacion: { monto: '', tipo: 'Bus' },
    Hospedaje: { monto: '', nombre: '' },
    Comida: { monto: '', tipo: 'Desayuno' },
    Ubicacion: '',
    MontoDado: '',
    FotoURL: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [signature, setSignature] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (viaticoExistente) {
      console.log('📝 Cargando datos del viático para editar:', viaticoExistente);
      
      setFormData({
        NombreTecnico: viaticoExistente.NombreTecnico || '',
        Telefono: viaticoExistente.Telefono || '',
        FechaEntrada: viaticoExistente.FechaEntrada ? new Date(viaticoExistente.FechaEntrada).toISOString().slice(0, 16) : '',
        FechaSalida: viaticoExistente.FechaSalida ? new Date(viaticoExistente.FechaSalida).toISOString().slice(0, 16) : '',
        Cliente: viaticoExistente.Cliente || '',
        Movilizacion: viaticoExistente.Movilizacion || { monto: '', tipo: 'Bus' },
        Hospedaje: viaticoExistente.Hospedaje || { monto: '', nombre: '' },
        Comida: viaticoExistente.Comida || { monto: '', tipo: 'Desayuno' },
        Ubicacion: viaticoExistente.Ubicacion || '',
        MontoDado: viaticoExistente.MontoDado || '',
        FotoURL: viaticoExistente.FotoURL || ''
      });

      setExistingFiles(viaticoExistente.Fotos || []);
      setSignature(viaticoExistente.Firma || null);
    }
  }, [viaticoExistente]);

  const handleSignatureSave = (signatureData) => {
    setSignature(signatureData);
  };

  const handleSignatureClear = () => {
    setSignature(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleRemoveExistingFile = async (index) => {
    const fotoAEliminar = existingFiles[index];
    
    if (isEditing && viaticoExistente?._id) {
        try {
            console.log('🗑️ Eliminando foto del backend:', index);
        } catch (error) {
            console.error('Error eliminando foto:', error);
        }
    }
    
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.NombreTecnico) newErrors.NombreTecnico = 'Nombre es requerido';
    if (!formData.Telefono) newErrors.Telefono = 'Teléfono es requerido';
    if (!formData.FechaEntrada) newErrors.FechaEntrada = 'Fecha de entrada es requerida';
    if (!formData.FechaSalida) newErrors.FechaSalida = 'Fecha de salida es requerida';
    if (!formData.Cliente) newErrors.Cliente = 'Cliente es requerido';
    if (!formData.Ubicacion) newErrors.Ubicacion = 'Ubicación es requerida';
    if (!formData.MontoDado) newErrors.MontoDado = 'Monto dado es requerido';
    
    if (!formData.Movilizacion.monto) newErrors['Movilizacion.monto'] = 'Monto de movilización es requerido';
    if (!formData.Hospedaje.monto) newErrors['Hospedaje.monto'] = 'Monto de hospedaje es requerido';
    if (!formData.Hospedaje.nombre) newErrors['Hospedaje.nombre'] = 'Nombre de hospedaje es requerido';
    if (!formData.Comida.monto) newErrors['Comida.monto'] = 'Monto de comida es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (isLoading) {
        console.log('⏳ Ya se está enviando el formulario...');
        return;
    }

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('NombreTecnico', formData.NombreTecnico);
      formDataToSend.append('Telefono', parseInt(formData.Telefono));
      formDataToSend.append('FechaEntrada', formData.FechaEntrada);
      formDataToSend.append('FechaSalida', formData.FechaSalida);
      formDataToSend.append('Cliente', formData.Cliente);
      formDataToSend.append('Ubicacion', formData.Ubicacion);
      formDataToSend.append('MontoDado', parseFloat(formData.MontoDado));

      formDataToSend.append('Movilizacion', JSON.stringify({
        monto: parseFloat(formData.Movilizacion.monto),
        tipo: formData.Movilizacion.tipo
      }));
      
      formDataToSend.append('Hospedaje', JSON.stringify({
        monto: parseFloat(formData.Hospedaje.monto),
        nombre: formData.Hospedaje.nombre
      }));
      
      formDataToSend.append('Comida', JSON.stringify({
        monto: parseFloat(formData.Comida.monto),
        tipo: formData.Comida.tipo
      }));

      formDataToSend.append('fotosExistentes', JSON.stringify(existingFiles));
      
      if (formData.FotoURL) {
        formDataToSend.append('FotoURL', formData.FotoURL);
      }

      if (signature) {
        formDataToSend.append('firma', signature);
        console.log('📝 Firma incluida en el formulario');
      }

      selectedFiles.forEach((file, index) => {
        formDataToSend.append('foto', file);
      });

      if (isEditing) {
        console.log('🔄 Actualizando viático existente:', viaticoExistente._id);
        await updateViatico(viaticoExistente._id, formDataToSend);
      } else {
        console.log('🆕 Creando nuevo viático');
        await createViaticoWithImages(formDataToSend);
      }
      
      onSuccess?.();
      onClose?.();
      
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} viático:`, error);
    }
  };

  const calcularTotalGastado = () => {
    const movilizacion = parseFloat(formData.Movilizacion.monto) || 0;
    const hospedaje = parseFloat(formData.Hospedaje.monto) || 0;
    const comida = parseFloat(formData.Comida.monto) || 0;
    return movilizacion + hospedaje + comida;
  };

  const calcularDiferencia = () => {
    const montoDado = parseFloat(formData.MontoDado) || 0;
    return montoDado - calcularTotalGastado();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Editar Viático' : 'Nuevo Viático'} 
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Técnico *
                </label>
                <input
                  type="text"
                  name="NombreTecnico"
                  value={formData.NombreTecnico}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.NombreTecnico ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Carlos Mendoza"
                />
                {errors.NombreTecnico && <p className="text-red-500 text-sm mt-1">{errors.NombreTecnico}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="number"
                  name="Telefono"
                  value={formData.Telefono}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.Telefono ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="50212345678"
                />
                {errors.Telefono && <p className="text-red-500 text-sm mt-1">{errors.Telefono}</p>}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Entrada *
                </label>
                <input
                  type="datetime-local"
                  name="FechaEntrada"
                  value={formData.FechaEntrada}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.FechaEntrada ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.FechaEntrada && <p className="text-red-500 text-sm mt-1">{errors.FechaEntrada}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Salida *
                </label>
                <input
                  type="datetime-local"
                  name="FechaSalida"
                  value={formData.FechaSalida}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.FechaSalida ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.FechaSalida && <p className="text-red-500 text-sm mt-1">{errors.FechaSalida}</p>}
              </div>
            </div>

            {/* Cliente y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  name="Cliente"
                  value={formData.Cliente}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.Cliente ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Claro Guatemala"
                />
                {errors.Cliente && <p className="text-red-500 text-sm mt-1">{errors.Cliente}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación *
                </label>
                <input
                  type="text"
                  name="Ubicacion"
                  value={formData.Ubicacion}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.Ubicacion ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Zona 1, Ciudad de Guatemala"
                />
                {errors.Ubicacion && <p className="text-red-500 text-sm mt-1">{errors.Ubicacion}</p>}
              </div>
            </div>

            {/* Gastos */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos del Viático</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Movilización */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Movilización *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="Movilizacion.monto"
                    value={formData.Movilizacion.monto}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['Movilizacion.monto'] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                  {errors['Movilizacion.monto'] && <p className="text-red-500 text-sm mt-1">{errors['Movilizacion.monto']}</p>}
                  
                  <select
                    name="Movilizacion.tipo"
                    value={formData.Movilizacion.tipo}
                    onChange={handleChange}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Taxi">Taxi</option>
                    <option value="Vehiculo propio">Vehículo propio</option>
                  </select>
                </div>

                {/* Hospedaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospedaje *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="Hospedaje.monto"
                    value={formData.Hospedaje.monto}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['Hospedaje.monto'] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                  {errors['Hospedaje.monto'] && <p className="text-red-500 text-sm mt-1">{errors['Hospedaje.monto']}</p>}
                  
                  <input
                    type="text"
                    name="Hospedaje.nombre"
                    value={formData.Hospedaje.nombre}
                    onChange={handleChange}
                    className={`w-full mt-2 px-3 py-2 border rounded-md ${errors['Hospedaje.nombre'] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Nombre del hotel"
                  />
                  {errors['Hospedaje.nombre'] && <p className="text-red-500 text-sm mt-1">{errors['Hospedaje.nombre']}</p>}
                </div>

                {/* Comida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comida *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="Comida.monto"
                    value={formData.Comida.monto}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['Comida.monto'] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                  {errors['Comida.monto'] && <p className="text-red-500 text-sm mt-1">{errors['Comida.monto']}</p>}
                  
                  <select
                    name="Comida.tipo"
                    value={formData.Comida.tipo}
                    onChange={handleChange}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Desayuno">Desayuno</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Cena">Cena</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Monto Dado y Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Dado *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="MontoDado"
                  value={formData.MontoDado}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.MontoDado ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.MontoDado && <p className="text-red-500 text-sm mt-1">{errors.MontoDado}</p>}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Resumen</h4>
                <div className="space-y-1 text-sm">
                  <p>Total Gastado: <strong>Q{calcularTotalGastado().toFixed(2)}</strong></p>
                  <p>Diferencia: 
                    <strong className={calcularDiferencia() >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Q{Math.abs(calcularDiferencia()).toFixed(2)} {calcularDiferencia() >= 0 ? '(Ahorro)' : '(Sobregasto)'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ NUEVO: Mostrar fotos existentes */}
            {existingFiles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos Existentes ({existingFiles.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {existingFiles.map((foto, index) => (
                    <div key={index} className="relative border rounded overflow-hidden">
                      <img 
                        src={foto} 
                        alt={`Foto existente ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subida de Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditing ? 'Agregar más fotos' : 'Fotos del viático'} {/* ✅ NUEVO: Texto dinámico */}
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {selectedFiles.length} archivo(s) seleccionado(s)
                  </p>
                  <ul className="text-xs text-gray-500 mt-1">
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Firma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma del Técnico
              </label>
              <SignatureCanvas
                onSave={handleSignatureSave}
                onClear={handleSignatureClear}
                existingSignature={signature} // ✅ NUEVO: Pasar firma existente
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Viático' : 'Crear Viático')} {/* ✅ NUEVO: Texto dinámico */}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};