import { useRef, useState, useEffect } from 'react';

export const SignatureCanvas = ({ onSave, onClear, existingSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState(null);

  // ✅ INICIALIZAR CANVAS CON CONFIGURACIÓN MEJORADA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    
    // ✅ CONFIGURACIÓN AVANZADA DEL CONTEXTO
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#000000';
    context.fillStyle = '#ffffff';
    
    // ✅ LIMPIAR Y PREPARAR CANVAS
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    setCtx(context);

    // ✅ CARGAR FIRMA EXISTENTE SI HAY
    if (existingSignature) {
      loadExistingSignature(existingSignature);
    }
  }, [existingSignature]);

  // ✅ CARGAR FIRMA EXISTENTE
  const loadExistingSignature = (signatureData) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
    };
    img.src = signatureData;
  };

  // ✅ OBTENER POSICIÓN PRECISA (MEJORADO)
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // ✅ INICIAR DIBUJO (MEJORADO)
  const startDrawing = (e) => {
    e.preventDefault();
    if (!ctx) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setIsDrawing(true);
    setHasSignature(true);
  };

  // ✅ DIBUJAR (MEJORADO CON SUAVIDAD)
  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !ctx) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    // ✅ SUAVIDAD EN EL TRAZO
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // ✅ PUNTOS INTERMEDIOS PARA MAYOR SUAVIDAD
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // ✅ DETENER DIBUJO
  const stopDrawing = () => {
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };

  // ✅ LIMPIAR FIRMA (MEJORADO)
  const clearSignature = () => {
    if (!ctx) return;
    
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    onClear?.();
  };

  // ✅ GUARDAR FIRMA (MEJORADO)
  const saveSignature = () => {
    if (!ctx) return;
    
    const canvas = canvasRef.current;
    
    // ✅ CREAR CANVAS TEMPORAL PARA MEJOR CALIDAD
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // ✅ FONDO BLANCO
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // ✅ COPIAR FIRMA
    tempCtx.drawImage(canvas, 0, 0);
    
    const signatureData = tempCanvas.toDataURL('image/png', 1.0); // ✅ ALTA CALIDAD
    onSave?.(signatureData);
  };

  // ✅ BOTÓN DE DESHACER (NUEVO)
  const undoLastStroke = () => {
    if (!ctx) return;
    
    // Para una implementación más avanzada, podrías guardar el historial de trazos
    clearSignature();
  };

  // ✅ CAMBIAR GROSOR DEL TRAZO (NUEVO)
  const changeBrushSize = (size) => {
    if (!ctx) return;
    ctx.lineWidth = size;
  };

  // ✅ CAMBIAR COLOR (NUEVO)
  const changeBrushColor = (color) => {
    if (!ctx) return;
    ctx.strokeStyle = color;
  };

  return (
    <div className="signature-container bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Firma del Técnico</h3>
      
      {/* ✅ CONTROLES DE HERRAMIENTAS (NUEVO) */}
      <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Grosor:</span>
          <select 
            onChange={(e) => changeBrushSize(parseInt(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="1">Fino</option>
            <option value="2" selected>Normal</option>
            <option value="3">Grueso</option>
            <option value="4">Muy grueso</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Color:</span>
          <select 
            onChange={(e) => changeBrushColor(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="#000000" selected>Negro</option>
            <option value="#1f2937">Gris oscuro</option>
            <option value="#dc2626">Rojo</option>
            <option value="#2563eb">Azul</option>
          </select>
        </div>
      </div>

      {/* ✅ CANVAS CON MEJOR ESTILO */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 bg-white cursor-crosshair touch-none"
          style={{ 
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        />
        
        {/* ✅ INDICADOR DE ESTADO */}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm bg-white/80 px-3 py-1 rounded">
              Firma aquí...
            </span>
          </div>
        )}
      </div>

      {/* ✅ BOTONES MEJORADOS */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={clearSignature}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors flex items-center gap-1"
        >
          <span>🗑️</span> Limpiar
        </button>
        
        <button
          type="button"
          onClick={undoLastStroke}
          disabled={!hasSignature}
          className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span>↶</span> Deshacer
        </button>
        
        <button
          type="button"
          onClick={saveSignature}
          disabled={!hasSignature}
          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
        >
          <span>💾</span> Guardar Firma
        </button>
      </div>

      {/* ✅ INDICADOR DE ESTADO */}
      <div className="mt-2 text-xs text-gray-500">
        {hasSignature ? (
          <span className="text-green-600">✅ Firma lista para guardar</span>
        ) : (
          <span className="text-orange-500">⚠️ Firma requerida</span>
        )}
      </div>
    </div>
  );
};