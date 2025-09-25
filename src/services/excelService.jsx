import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

export class ExcelService {
  static async generateViaticosReport(viaticos, filters = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Viáticos';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Viáticos', {
        pageSetup: { 
          paperSize: 9,
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      // ✅ DISEÑO SIMPLE Y FUNCIONAL
      await this.disenoSimpleYFuncional(worksheet, viaticos, filters);
      
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `reporte_viaticos_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
      saveAs(new Blob([buffer]), fileName);
      
      return { success: true, message: 'Excel generado correctamente' };
    } catch (error) {
      console.error('❌ Error generando Excel:', error);
      return { success: false, message: 'Error al generar el reporte' };
    }
  }

  static async disenoSimpleYFuncional(worksheet, viaticos, filters) {
    // ✅ CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
      { width: 20 }, { width: 15 }, { width: 20 }, { width: 20 },
      { width: 16 }, { width: 16 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 18 }, { width: 10 }, { width: 12 },
      { width: 12 }, { width: 14 }, { width: 12 }, { width: 12 },
      { width: 30 }, // Columna para firma (más ancha)
      { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 } // Fotos
    ];

    // ✅ ENCABEZADO SIMPLE
    this.crearEncabezadoSimple(worksheet, viaticos.length, filters);

    let currentRow = 5;

    // ✅ ENCABEZADOS DE COLUMNAS
    const headers = [
      'TÉCNICO', 'TELÉFONO', 'CLIENTE', 'UBICACIÓN', 
      'FECHA ENTRADA', 'FECHA SALIDA', 'MOVILIZACIÓN', 'TIPO MOV.',
      'HOSPEDAJE', 'LUGAR HOSP.', 'COMIDA', 'TIPO COMIDA',
      'MONTO DADO', 'MONTO GASTADO', 'DIFERENCIA', 'ESTADO',
      'FIRMA', 'FOTO 1', 'FOTO 2', 'FOTO 3', 'FOTO 4', 'FOTO 5'
    ];

    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 10 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F75B5' } },
        border: {
          top: { style: 'thin', color: { argb: '1F4E78' } },
          left: { style: 'thin', color: { argb: '1F4E78' } },
          bottom: { style: 'thin', color: { argb: '1F4E78' } },
          right: { style: 'thin', color: { argb: '1F4E78' } }
        },
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
      };
    });
    headerRow.height = 25;
    currentRow++;

    // ✅ DATOS DE VIÁTICOS - UNA FILA POR VIÁTICO
    for (const viatico of viaticos) {
      const row = worksheet.getRow(currentRow);
      row.height = 80; // ✅ Altura suficiente para imágenes

      const montoDado = viatico.MontoDado || 0;
      const montoGastado = viatico.Montogastado || 0;
      const diferencia = montoDado - montoGastado;
      const estado = diferencia >= 0 ? 'AHORRO' : 'SOBREGASTO';

      const datos = [
        viatico.NombreTecnico || '',
        viatico.Telefono ? `'${viatico.Telefono}` : '',
        viatico.Cliente || '',
        viatico.Ubicacion || '',
        viatico.FechaEntrada ? dayjs(viatico.FechaEntrada).format('DD/MM/YYYY HH:mm') : '',
        viatico.FechaSalida ? dayjs(viatico.FechaSalida).format('DD/MM/YYYY HH:mm') : '',
        viatico.Movilizacion?.monto || 0,
        viatico.Movilizacion?.tipo || '',
        viatico.Hospedaje?.monto || 0,
        viatico.Hospedaje?.nombre || '',
        viatico.Comida?.monto || 0,
        viatico.Comida?.tipo || '',
        montoDado,
        montoGastado,
        Math.abs(diferencia),
        estado,
        '', // Firma (se llena con imagen)
        '', '', '', '', '' // Fotos (se llenan con imágenes)
      ];

      // ✅ LLENAR DATOS BÁSICOS
      datos.forEach((dato, index) => {
        const cell = row.getCell(index + 1);
        cell.value = dato;
        cell.style = {
          font: { size: 9 },
          border: {
            top: { style: 'thin', color: { argb: 'D0D0D0' } },
            left: { style: 'thin', color: { argb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
            right: { style: 'thin', color: { argb: 'D0D0D0' } }
          },
          alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
        };

        // Formato numérico para montos
        if ([7, 9, 11, 13, 14, 15].includes(index + 1)) {
          cell.numFmt = '#,##0.00';
        }

        // Estilo para diferencia y estado
        if (index + 1 === 15) {
          cell.style.font = { 
            bold: true, 
            color: { argb: diferencia >= 0 ? '00B050' : 'FF0000' } 
          };
        }

        if (index + 1 === 16) {
          cell.style.font = { bold: true };
          cell.style.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: diferencia >= 0 ? 'E2F0D9' : 'FCE4D6' } 
          };
        }
      });

      // ✅ AGREGAR FIRMA (COLUMNA Q = 17)
      await this.agregarImagenMejorada(worksheet, viatico.Firma, currentRow, 17, 'FIRMA');

      // ✅ AGREGAR FOTOS (COLUMNAS R-V = 18-22)
      const fotos = viatico.Fotos || [];
      console.log(`📸 Procesando ${fotos.length} fotos para viático ${currentRow-4}:`, fotos);
      
      for (let i = 0; i < 5; i++) {
        if (i < fotos.length && fotos[i]) {
          await this.agregarImagenMejorada(worksheet, fotos[i], currentRow, 18 + i, `FOTO ${i + 1}`);
        } else {
          const cell = row.getCell(18 + i);
          cell.value = 'SIN FOTO';
          cell.style.font = { italic: true, color: { argb: '666666' } };
        }
      }

      currentRow++;
    }

    // ✅ TOTALES AL FINAL
    this.agregarTotalesSimple(worksheet, currentRow, viaticos);
  }

  static crearEncabezadoSimple(worksheet, totalRegistros, filters) {
    // Título principal
    worksheet.mergeCells('A1:V1');
    const titulo = worksheet.getCell('A1');
    titulo.value = 'REPORTE DE VIÁTICOS';
    titulo.style = {
      font: { bold: true, size: 16, color: { argb: '1F4E78' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };
    worksheet.getRow(1).height = 25;

    // Información
    worksheet.mergeCells('A2:V2');
    let infoText = `Reporte generado: ${dayjs().format('DD/MM/YYYY HH:mm')} | Registros: ${totalRegistros}`;
    
    if (Object.keys(filters).length > 0) {
      if (filters.fechaInicio && filters.fechaFin) {
        infoText += ` | Período: ${dayjs(filters.fechaInicio).format('DD/MM/YYYY')} - ${dayjs(filters.fechaFin).format('DD/MM/YYYY')}`;
      }
      if (filters.tecnico) infoText += ` | Técnico: ${filters.tecnico}`;
      if (filters.cliente) infoText += ` | Cliente: ${filters.cliente}`;
    }
    
    worksheet.getCell('A2').value = infoText;
    worksheet.getCell('A2').style = {
      font: { italic: true, color: { argb: '666666' } },
      alignment: { horizontal: 'center' }
    };
    worksheet.getRow(2).height = 20;

    // Espacio
    worksheet.getRow(3).height = 5;
    worksheet.getRow(4).height = 5;
  }

  static async agregarImagenMejorada(worksheet, imagenData, rowNumber, colNumber, tipo) {
    try {
      if (!imagenData) {
        console.warn(`⚠️ ${tipo}: Datos de imagen vacíos`);
        return;
      }
      
      // ✅ VERIFICAR SI ES URL DE CLOUDINARY
      if (this.esUrlCloudinary(imagenData)) {
        const cell = worksheet.getCell(rowNumber, colNumber);
        cell.value = { text: 'Ver imagen', hyperlink: imagenData };
        cell.style = {
          font: { color: { argb: '0000FF' }, underline: true, size: 9 },
          alignment: { vertical: 'middle', horizontal: 'center' }
        };
        console.log(`🔗 ${tipo}: Enlace agregado - ${imagenData.substring(0, 50)}...`);
        return;
      }

      // ✅ SI ES BASE64, PROCESAR NORMALMENTE
      let base64Data = imagenData;
      
      // Limpiar el Base64 si tiene prefijo data:image
      if (imagenData.startsWith('data:image')) {
        base64Data = imagenData.split(',')[1];
      } else if (!this.esBase64Valido(imagenData)) {
        console.warn(`⚠️ ${tipo}: Formato Base64 no válido`);
        return;
      }

      // ✅ DETECTAR EXTENSIÓN CORRECTA
      let extension = 'png';
      if (imagenData.startsWith('data:image/jpeg') || 
          imagenData.startsWith('data:image/jpg') ||
          base64Data.length > 1000000) {
        extension = 'jpeg';
      }

      console.log(`🖼️ Agregando ${tipo} - Extensión: ${extension}, Tamaño: ${base64Data.length} chars`);

      // ✅ AGREGAR IMAGEN AL WORKBOOK
      const imageId = worksheet.workbook.addImage({
        base64: base64Data,
        extension: extension
      });

      // ✅ POSICIÓN MEJORADA
      const imageConfig = {
        tl: { 
          col: colNumber - 1, 
          row: rowNumber - 1, 
          offset: 2 
        },
        br: { 
          col: colNumber, 
          row: rowNumber, 
          offset: -2 
        },
        editAs: 'oneCell'
      };

      worksheet.addImage(imageId, imageConfig);

      // ✅ LIMPIAR CELDA Y AJUSTAR ALTURA
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = '';
      
      const row = worksheet.getRow(rowNumber);
      if (row.height < 60) {
        row.height = 60;
      }

      console.log(`✅ ${tipo} agregada correctamente en fila ${rowNumber}, columna ${colNumber}`);

    } catch (error) {
      console.error(`❌ Error crítico agregando ${tipo}:`, error);
      
      // ✅ MOSTRAR MENSAJE DE ERROR EN LA CELDA
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = `ERROR ${tipo}`;
      cell.style = {
        font: { italic: true, color: { argb: 'FF0000' }, size: 8 },
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
      };
    }
  }

  // ✅ NUEVO MÉTODO: DETECTAR SI ES URL DE CLOUDINARY
  static esUrlCloudinary(url) {
    if (!url || typeof url !== 'string') return false;
    
    return url.includes('cloudinary.com') || 
           url.startsWith('http://') || 
           url.startsWith('https://') ||
           url.includes('res.cloudinary.com');
  }

  // ✅ MÉTODO AUXILIAR PARA VALIDAR BASE64
  static esBase64Valido(str) {
    if (!str || typeof str !== 'string') return false;
    
    try {
      // Verificar que sea Base64 válido
      if (str.length % 4 !== 0) return false;
      
      // Intentar decodificar
      const decoded = atob(str);
      // Verificar que la codificación inversa coincida
      return btoa(decoded) === str;
    } catch (err) {
      return false;
    }
  }

  static agregarTotalesSimple(worksheet, rowNumber, viaticos) {
    if (viaticos.length === 0) return;

    // Línea separadora
    const separadorRow = worksheet.getRow(rowNumber);
    separadorRow.height = 2;
    worksheet.mergeCells(`A${rowNumber}:V${rowNumber}`);
    separadorRow.getCell(1).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B9BD5' } }
    };

    // Fila de totales
    const totalsRow = worksheet.getRow(rowNumber + 1);
    totalsRow.height = 25;

    // Calcular totales
    const totalDado = viaticos.reduce((sum, v) => sum + (v.MontoDado || 0), 0);
    const totalGastado = viaticos.reduce((sum, v) => sum + (v.Montogastado || 0), 0);
    const totalDiferencia = totalDado - totalGastado;

    // "TOTALES:"
    worksheet.mergeCells(`A${rowNumber + 1}:M${rowNumber + 1}`);
    const labelCell = totalsRow.getCell(1);
    labelCell.value = 'TOTALES:';
    labelCell.style = {
      font: { bold: true, size: 11, color: { argb: '1F4E78' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } },
      alignment: { horizontal: 'right', vertical: 'middle' }
    };

    // Valores de totales
    totalsRow.getCell(14).value = totalDado;
    totalsRow.getCell(15).value = totalGastado;
    totalsRow.getCell(16).value = Math.abs(totalDiferencia);

    // Estilos para totales
    for (let i = 14; i <= 16; i++) {
      const cell = totalsRow.getCell(i);
      cell.style = {
        font: { bold: true, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } },
        numFmt: '#,##0.00',
        alignment: { vertical: 'middle', horizontal: 'center' }
      };
    }

    // Estado general
    worksheet.mergeCells(`Q${rowNumber + 1}:V${rowNumber + 1}`);
    const estadoCell = totalsRow.getCell(17);
    estadoCell.value = totalDiferencia >= 0 ? 'AHORRO GENERAL' : 'SOBREGASTO GENERAL';
    estadoCell.style = {
      font: { bold: true, color: { argb: totalDiferencia >= 0 ? '00B050' : 'FF0000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: totalDiferencia >= 0 ? 'E2F0D9' : 'FCE4D6' } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
  }
}