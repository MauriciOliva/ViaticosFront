import { useState, useEffect } from 'react'; 
import { useViaticosStore } from '../../hooks/ViaticosHook';
import { SignatureCanvas } from '../atomos/signatureCanvas';
import { DateTimeInput } from '../../services/DateTimeInput';
import { 
  fechaParaInput, 
  inputParaFecha, 
  fechaActualGuatemala,
  validarFechas 
} from '../../services/fechaUtils.js';

export const ViaticosForm = ({ onClose, onSuccess, viaticoExistente }) => { 
  const { createViaticoWithImages, updateViatico, isLoading } = useViaticosStore(); 
  
  const isEditing = Boolean(viaticoExistente);
  
  const [formData, setFormData] = useState({
    NombreTecnico: '',
    Telefono: '',
    FechaEntrada: null,
    FechaSalida: null,
    Cliente: '',
    Movilizacion: [],
    Hospedaje: { monto: '', nombre: '' },
    Comida: { monto: '', tipo: 'Desayuno' },
    Ubicacion: '',
    MontoDado: '', // ✅ Campo presente
    FotoURL: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [signature, setSignature] = useState(null);
  const [errors, setErrors] = useState({});

  const [nuevaMovilizacion, setNuevaMovilizacion] = useState({
    tipo: 'Bus',
    montoIda: '',
    montoVuelta: '',
    descripcion: ''
  });

  useEffect(() => {
    if (viaticoExistente) {
      console.log('📝 Cargando datos del viático para editar:', viaticoExistente);
      
      setFormData({
        NombreTecnico: viaticoExistente.NombreTecnico || '',
        Telefono: viaticoExistente.Telefono || '',
        FechaEntrada: viaticoExistente.FechaEntrada ? new Date(viaticoExistente.FechaEntrada) : null,
        FechaSalida: viaticoExistente.FechaSalida ? new Date(viaticoExistente.FechaSalida) : null,
        Cliente: viaticoExistente.Cliente || '',
        Movilizacion: viaticoExistente.Movilizacion || [],
        Hospedaje: viaticoExistente.Hospedaje || { monto: '', nombre: '' },
        Comida: viaticoExistente.Comida || { monto: '', tipo: 'Desayuno' },
        Ubicacion: viaticoExistente.Ubicacion || '',
        MontoDado: viaticoExistente.MontoDado || '', // ✅ Cargando MontoDado existente
        FotoURL: viaticoExistente.FotoURL || ''
      });

      setExistingFiles(viaticoExistente.Fotos || []);
      setSignature(viaticoExistente.Firma || null);
    }
  }, [viaticoExistente]);

  const handleSignatureSave = (signatureData) => {
    setSignature(signatureData);
  };

  useEffect(() => {
    if (!viaticoExistente && !formData.FechaEntrada) {
      const ahora = fechaActualGuatemala();
      const mañana = new Date(ahora);
      mañana.setDate(mañana.getDate() + 1);
      
      setFormData(prev => ({
        ...prev,
        FechaEntrada: ahora,
        FechaSalida: mañana
      }));
    }
  }, [viaticoExistente, formData.FechaEntrada]);
  
  const manejarCambioFecha = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    if (errors[campo]) {
      setErrors(prev => ({ ...prev, [campo]: '' }));
    }
    
    if (campo === 'FechaEntrada' && formData.FechaSalida) {
      if (!validarFechas(valor, formData.FechaSalida)) {
        setErrors(prev => ({ 
          ...prev, 
          FechaSalida: 'La fecha de salida debe ser posterior a la fecha de entrada' 
        }));
      }
    }
    
    if (campo === 'FechaSalida' && formData.FechaEntrada) {
      if (!validarFechas(formData.FechaEntrada, valor)) {
        setErrors(prev => ({ 
          ...prev, 
          FechaSalida: 'La fecha de salida debe ser posterior a la fecha de entrada' 
        }));
      } else if (errors.FechaSalida) {
        setErrors(prev => ({ ...prev, FechaSalida: '' }));
      }
    }
  };

  const handleSignatureClear = () => {
    setSignature(null);
  };

  const agregarMovilizacion = () => {
    if (!nuevaMovilizacion.tipo || !nuevaMovilizacion.montoIda) {
      alert('Por favor complete el tipo y monto de ida de movilización');
      return;
    }

    const movilizacionCompleta = {
      ...nuevaMovilizacion,
      montoVuelta: nuevaMovilizacion.montoVuelta || '0'
    };

    setFormData(prev => ({
      ...prev,
      Movilizacion: [...prev.Movilizacion, movilizacionCompleta]
    }));

    setNuevaMovilizacion({
      tipo: 'Bus',
      montoIda: '',
      montoVuelta: '',
      descripcion: ''
    });
  };

  const eliminarMovilizacion = (index) => {
    setFormData(prev => ({
      ...prev,
      Movilizacion: prev.Movilizacion.filter((_, i) => i !== index)
    }));
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
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const calcularTotalMovilizacion = () => {
    return formData.Movilizacion.reduce((total, mov) => {
      return total + (parseFloat(mov.montoIda) || 0) + (parseFloat(mov.montoVuelta) || 0);
    }, 0);
  };

  const handleMovilizacionChange = (e) => {
    const { name, value } = e.target;
    setNuevaMovilizacion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // ✅ Validaciones básicas
    if (!formData.NombreTecnico.trim()) newErrors.NombreTecnico = 'Nombre es requerido';
    if (!formData.Telefono) newErrors.Telefono = 'Teléfono es requerido';
    if (!formData.FechaEntrada) newErrors.FechaEntrada = 'Fecha de entrada es requerida';
    if (!formData.FechaSalida) newErrors.FechaSalida = 'Fecha de salida es requerida';
    if (!formData.Cliente.trim()) newErrors.Cliente = 'Cliente es requerido';
    if (!formData.Ubicacion.trim()) newErrors.Ubicacion = 'Ubicación es requerida';
    if (!formData.MontoDado || parseFloat(formData.MontoDado) <= 0) newErrors.MontoDado = 'Monto dado es requerido y mayor a 0';
    
    // ✅ Validar movilización
    if (formData.Movilizacion.length === 0) {
      newErrors['Movilizacion'] = 'Debe agregar al menos un medio de movilización';
    }

    // ✅ Validar hospedaje
    if (!formData.Hospedaje.monto || parseFloat(formData.Hospedaje.monto) < 0) {
      newErrors['Hospedaje.monto'] = 'Monto de hospedaje es requerido';
    }
    if (!formData.Hospedaje.nombre.trim()) {
      newErrors['Hospedaje.nombre'] = 'Nombre de hospedaje es requerido';
    }

    // ✅ Validar comida
    if (!formData.Comida.monto || parseFloat(formData.Comida.monto) < 0) {
      newErrors['Comida.monto'] = 'Monto de comida es requerido';
    }
    
    // ✅ Validar fechas
    if (formData.FechaEntrada && formData.FechaSalida) {
      if (!validarFechas(formData.FechaEntrada, formData.FechaSalida)) {
        newErrors.FechaSalida = 'La fecha de salida debe ser posterior a la fecha de entrada';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('❌ Errores de validación:', errors);
      return;
    }

    if (isLoading) {
      console.log('⏳ Ya se está enviando el formulario...');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // ✅ Información básica
      formDataToSend.append('NombreTecnico', formData.NombreTecnico.trim());
      formDataToSend.append('Telefono', parseInt(formData.Telefono));
      formDataToSend.append('FechaEntrada', formData.FechaEntrada.toISOString());
      formDataToSend.append('FechaSalida', formData.FechaSalida.toISOString());
      formDataToSend.append('Cliente', formData.Cliente.trim());
      formDataToSend.append('Ubicacion', formData.Ubicacion.trim());
      formDataToSend.append('MontoDado', parseFloat(formData.MontoDado)); // ✅ Incluyendo MontoDado

      // ✅ Movilización
      formDataToSend.append('Movilizacion', JSON.stringify(formData.Movilizacion));
      
      // ✅ Hospedaje
      formDataToSend.append('Hospedaje', JSON.stringify({
        monto: parseFloat(formData.Hospedaje.monto),
        nombre: formData.Hospedaje.nombre.trim()
      }));
      
      // ✅ Comida
      formDataToSend.append('Comida', JSON.stringify({
        monto: parseFloat(formData.Comida.monto),
        tipo: formData.Comida.tipo
      }));

      // ✅ Fotos y firma
      formDataToSend.append('fotosExistentes', JSON.stringify(existingFiles));
      
      if (formData.FotoURL) {
        formDataToSend.append('FotoURL', formData.FotoURL);
      }

      if (signature) {
        formDataToSend.append('firma', signature);
      }

      selectedFiles.forEach((file) => {
        formDataToSend.append('foto', file);
      });

      // ✅ Enviar al backend
      if (isEditing) {
        await updateViatico(viaticoExistente._id, formDataToSend);
      } else {
        await createViaticoWithImages(formDataToSend);
      }
      
      onSuccess?.();
      onClose?.();
      
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} viático:`, error);
      alert(`Error: ${error.message}`);
    }
  };

  const calcularTotalGastado = () => {
    const movilizacion = calcularTotalMovilizacion();
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
              <DateTimeInput
                label="Fecha de Entrada *"
                value={formData.FechaEntrada}
                onChange={(valor) => manejarCambioFecha('FechaEntrada', valor)}
                required={true}
                error={errors.FechaEntrada}
              />

              <DateTimeInput
                label="Fecha de Salida *"
                value={formData.FechaSalida}
                onChange={(valor) => manejarCambioFecha('FechaSalida', valor)}
                required={true}
                error={errors.FechaSalida}
                min={formData.FechaEntrada ? fechaParaInput(formData.FechaEntrada) : undefined}
              />
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

            {/* ✅ MONTO DADO - SECCIÓN MEJORADA */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Monto Entregado al Técnico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Monto Dado (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="MontoDado"
                    value={formData.MontoDado}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border-2 rounded-md ${errors.MontoDado ? 'border-red-500' : 'border-green-400'}`}
                    placeholder="0.00"
                    min="0"
                  />
                  {errors.MontoDado && <p className="text-red-500 text-sm mt-1">{errors.MontoDado}</p>}
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-green-700 bg-green-100 p-2 rounded">
                    <strong>Importante:</strong> Este es el monto total que se le entrega al técnico para cubrir todos sus gastos (movilización, hospedaje y comida).
                  </p>
                </div>
              </div>
            </div>

            {/* Movilización */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Movilización - Múltiples Medios
                {errors.Movilizacion && <span className="text-red-500 text-sm ml-2">({errors.Movilizacion})</span>}
              </h3>
              
              {/* Formulario para agregar nueva movilización */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medio de Transporte *
                  </label>
                  <select
                    name="tipo"
                    value={nuevaMovilizacion.tipo}
                    onChange={handleMovilizacionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Bus">Bus</option>
                    <option value="VehiculoPersonal">Vehículo Personal</option>
                    <option value="Tuc-Tuc">Tuc-Tuc</option>
                    <option value="Uber">Uber</option>
                    <option value="Taxi">Taxi</option>
                    <option value="Mototaxi">Mototaxi</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Caminata">Caminata</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Ida (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="montoIda"
                    value={nuevaMovilizacion.montoIda}
                    onChange={handleMovilizacionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Vuelta (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="montoVuelta"
                    value={nuevaMovilizacion.montoVuelta}
                    onChange={handleMovilizacionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00 (opcional)"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarMovilizacion}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                  >
                    + Agregar
                  </button>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Opcional)
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={nuevaMovilizacion.descripcion}
                    onChange={handleMovilizacionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Bus a centro, luego Tuc-Tuc al sitio"
                  />
                </div>
              </div>

              {/* Lista de movilizaciones agregadas */}
              {formData.Movilizacion.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Medios de Movilización Agregados:</h4>
                  <div className="space-y-2">
                    {formData.Movilizacion.map((mov, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                        <div>
                          <span className="font-medium">{mov.tipo}</span>
                          {mov.descripcion && <span className="text-sm text-gray-600 ml-2">- {mov.descripcion}</span>}
                          <div className="text-sm text-gray-500">
                            Ida: Q{parseFloat(mov.montoIda).toFixed(2)} | Vuelta: Q{parseFloat(mov.montoVuelta).toFixed(2)} | Total: Q{(parseFloat(mov.montoIda) + parseFloat(mov.montoVuelta)).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarMovilizacion(index)}
                          className="text-red-600 hover:text-red-800 text-lg font-bold"
                          title="Eliminar movilización"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-700">
                    Total Movilización: Q{calcularTotalMovilizacion().toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Hospedaje y Comida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hospedaje */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Hospedaje</h3>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Monto Hospedaje (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="Hospedaje.monto"
                    value={formData.Hospedaje.monto}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['Hospedaje.monto'] ? 'border-red-500' : 'border-blue-300'}`}
                    placeholder="0.00"
                    min="0"
                  />
                  {errors['Hospedaje.monto'] && <p className="text-red-500 text-sm mt-1">{errors['Hospedaje.monto']}</p>}
                  
                  <label className="block text-sm font-medium text-blue-700 mb-1 mt-2">
                    Nombre del Hotel/Lugar *
                  </label>
                  <input
                    type="text"
                    name="Hospedaje.nombre"
                    value={formData.Hospedaje.nombre}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['Hospedaje.nombre'] ? 'border-red-500' : 'border-blue-300'}`}
                    placeholder="Nombre del hotel"
                  />
                  {errors['Hospedaje.nombre'] && <p className="text-red-500 text-sm mt-1">{errors['Hospedaje.nombre']}</p>}
                </div>
              </div>

              {/* Comida */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">Comida</h3>
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    Monto Comida (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="Comida.monto"
                    value={formData.Comida.monto}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['Comida.monto'] ? 'border-red-500' : 'border-orange-300'}`}
                    placeholder="0.00"
                    min="0"
                  />
                  {errors['Comida.monto'] && <p className="text-red-500 text-sm mt-1">{errors['Comida.monto']}</p>}
                  
                  <label className="block text-sm font-medium text-orange-700 mb-1 mt-2">
                    Tipo de Comida *
                  </label>
                  <select
                    name="Comida.tipo"
                    value={formData.Comida.tipo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-orange-300 rounded-md"
                  >
                    <option value="Desayuno">Desayuno</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Cena">Cena</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resumen Financiero */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Resumen Financiero</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Movilización:</span>
                    <strong>Q{calcularTotalMovilizacion().toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Hospedaje:</span>
                    <strong>Q{(parseFloat(formData.Hospedaje.monto) || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Comida:</span>
                    <strong>Q{(parseFloat(formData.Comida.monto) || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Total Gastado:</span>
                    <strong>Q{calcularTotalGastado().toFixed(2)}</strong>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monto Dado al Técnico:</span>
                    <strong className="text-green-600">Q{(parseFloat(formData.MontoDado) || 0).toFixed(2)}</strong>
                  </div>
                  <div className={`flex justify-between border-t pt-2 font-medium text-lg ${
                    calcularDiferencia() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>Diferencia:</span>
                    <strong>
                      Q{Math.abs(calcularDiferencia()).toFixed(2)} 
                      {calcularDiferencia() >= 0 ? ' (Ahorro)' : ' (Sobregasto)'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Fotos existentes */}
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
                {isEditing ? 'Agregar más fotos' : 'Fotos del viático'}
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
                existingSignature={signature}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 font-medium"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Viático' : 'Crear Viático')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};