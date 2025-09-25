export const zonaHorariaGuatemala = 'America/Guatemala';

export const fechaParaInput = (fecha) => {
  if (!fecha) return '';
  
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  if (isNaN(fechaObj.getTime())) return '';
  
  const formatter = new Intl.DateTimeFormat('es-GT', {
    timeZone: zonaHorariaGuatemala,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const partes = formatter.formatToParts(fechaObj);
  
  const year = partes.find(p => p.type === 'year').value;
  const month = partes.find(p => p.type === 'month').value;
  const day = partes.find(p => p.type === 'day').value;
  const hour = partes.find(p => p.type === 'hour').value;
  const minute = partes.find(p => p.type === 'minute').value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const inputParaFecha = (fechaString) => {
  if (!fechaString) return null;
  
  const fechaLocal = new Date(fechaString);
  
  return new Date(fechaLocal.toLocaleString('en-US', { timeZone: zonaHorariaGuatemala }));
};

export const fechaActualGuatemala = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: zonaHorariaGuatemala }));
};

export const formatearFechaParaMostrar = (fecha) => {
  if (!fecha) return '';
  
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  if (isNaN(fechaObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: zonaHorariaGuatemala,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(fechaObj);
};

export const validarFechas = (fechaEntrada, fechaSalida) => {
  if (!fechaEntrada || !fechaSalida) return true;
  
  const entrada = inputParaFecha(fechaEntrada);
  const salida = inputParaFecha(fechaSalida);
  
  return salida > entrada;
};