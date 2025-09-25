import { useViaticosStore } from './ViaticosHook';
import { ExcelService } from '../services/excelService';
import dayjs from 'dayjs';

export const useExcelExport = () => {
  const { getViaticosFiltrados, viaticos } = useViaticosStore();

  const exportToExcel = async (filters = {}) => {
    try {
      await ExcelService.generateViaticosReport(filters.viaticos || viaticos, filters);
      return { success: true, message: 'Excel generado exitosamente' };
    } catch (error) {
      console.error('Error generando Excel:', error);
      return { success: false, message: 'Error al generar el reporte' };
    }
  };

  const exportFilteredByDate = async (fechaInicio, fechaFin) => {
    const filtered = getViaticosFiltrados().filter(v => {
      const fecha = dayjs(v.FechaEntrada);
      return fecha.isSameOrAfter(dayjs(fechaInicio)) && fecha.isSameOrBefore(dayjs(fechaFin));
    });

    return await exportToExcel({ fechaInicio, fechaFin, viaticos: filtered });
  };

  const exportByTecnico = async (tecnico) => {
    const filtered = getViaticosFiltrados().filter(v =>
      v.NombreTecnico.toLowerCase().includes(tecnico.toLowerCase())
    );

    return await exportToExcel({ tecnico, viaticos: filtered });
  };

  return {
    exportToExcel,
    exportFilteredByDate,
    exportByTecnico,
    totalViaticos: viaticos.length
  };
};
