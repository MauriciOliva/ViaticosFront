import { useState, useEffect } from 'react';
import { fechaParaInput, inputParaFecha, zonaHorariaGuatemala } from './fechaUtils';

export const DateTimeInput = ({ 
  label, 
  value, 
  onChange, 
  required = false,
  error,
  min,
  max 
}) => {
  const [valorLocal, setValorLocal] = useState('');

  useEffect(() => {
    // Convertir el valor Date o string a formato para input
    if (value) {
      const valorFormateado = fechaParaInput(value);
      setValorLocal(valorFormateado);
    } else {
      setValorLocal('');
    }
  }, [value]);

  const manejarCambio = (e) => {
    const nuevoValor = e.target.value;
    setValorLocal(nuevoValor);
    
    // Convertir de vuelta a Date para el callback
    if (nuevoValor) {
      const fechaConvertida = inputParaFecha(nuevoValor);
      onChange(fechaConvertida);
    } else {
      onChange(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <input
        type="datetime-local"
        value={valorLocal}
        onChange={manejarCambio}
        className={`w-full px-3 py-2 border rounded-md ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        min={min}
        max={max}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <p className="text-xs text-gray-500 mt-1">
        Zona horaria: Guatemala ({zonaHorariaGuatemala})
      </p>
    </div>
  );
};