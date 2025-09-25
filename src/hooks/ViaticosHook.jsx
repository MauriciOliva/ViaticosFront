import { create } from 'zustand';
import axios from 'axios';
import dayjs from 'dayjs';

const getApiBaseUrl = () => {
    if (import.meta.env.MODE === 'development') {
        return import.meta.env.VITE_API_BASE_URL || 'http://localhost:2600';
    }
    
    // En producción, forzar HTTPS
    let productionUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    
    if (productionUrl.startsWith('http://')) {
        productionUrl = productionUrl.replace('http://', 'https://');
    }
    
    return productionUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Base URL:', API_BASE_URL);
console.log('🔧 Modo:', import.meta.env.MODE);

// ✅ FUNCIÓN PARA OBTENER TOKEN CON MANEJO DE ERRORES
const getAuthToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

// ✅ CREAR INSTANCIA DE AXIOS CONFIGURADA
const createApiInstance = (config = {}) => {
  const token = getAuthToken();
  
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...config.headers,
    }
  });

  // ✅ INTERCEPTOR PARA MANEJAR ERRORES DE AUTENTICACIÓN
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('🔐 Sesión expirada, redirigiendo al login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const useViaticosStore = create((set, get) => ({
    isLoading: false,
    isViaticoOpen: false,
    viaticoData: null,
    viaticos: [],
    error: null,

    filtros: {
        fechaInicio: '',
        fechaFin: '',
        tecnico: '',
        cliente: ''
    },

    setFiltros: (nuevosFiltros) => set(state => ({
        filtros: { ...state.filtros, ...nuevosFiltros }
    })),

    setViaticoOpen: (value) => set({ isViaticoOpen: value }),
    setViaticoData: (data) => set({ viaticoData: data }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    getViaticos: async () => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const api = createApiInstance();
            const response = await api.get('/api/v1/viaticos/');
            const viaticosData = response.data.data || response.data;
            const safeViaticos = Array.isArray(viaticosData) ? viaticosData : [];

            set({ viaticos: safeViaticos, isLoading: false });
            return safeViaticos;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al obtener los viáticos';
            set({ error: errorMessage, isLoading: false, viaticos: [] });
            throw new Error(errorMessage);
        }
    },

    getViaticoById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const api = createApiInstance();
            const response = await api.get(`/api/v1/viaticos/${id}`);
            set({ isLoading: false });
            return response.data.data || response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al obtener el viático';
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    createViatico: async (newViatico) => {
        set({ isLoading: true, error: null });
        try {
            const api = createApiInstance();
            const response = await api.post('/api/v1/viaticos/create', newViatico);
            set(state => ({
                viaticos: [...state.viaticos, response.data.data || response.data],
                isLoading: false,
                isViaticoOpen: false
            }));
            return response.data.data || response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al crear el viático';
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    createViaticoWithImages: async (formData) => {
        if (get().isLoading) {
            console.log('⏳ Ya se está enviando un viático...');
            return;
        }

        set({ isLoading: true, error: null });
        
        try {
            console.log('📤 Enviando formulario con imágenes...');
            
            const api = createApiInstance({
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            const response = await api.post('/api/v1/viaticos/create', formData);

            console.log('✅ Viático creado exitosamente:', response.data);

            // Refrescar lista
            setTimeout(() => {
                get().getViaticos();
            }, 500);

            set({ isLoading: false, isViaticoOpen: false });
            return response.data.data || response.data;
        } catch (error) {
            console.error('❌ Error creando viático:', error);
            
            let errorMessage = 'Error al crear el viático con imágenes';
            
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor';
            } else {
                errorMessage = error.message;
            }

            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    updateViatico: async (id, formData) => {
        set({ isLoading: true, error: null });
        try {
            const api = createApiInstance({
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            const response = await api.put(`/api/v1/viaticos/${id}`, formData);

            console.log('✅ Viático actualizado exitosamente:', response.data);

            set(state => ({
                viaticos: state.viaticos.map(v => 
                    v._id === id ? (response.data.data || response.data) : v
                ),
                isLoading: false
            }));

            return response.data.data || response.data;
        } catch (error) {
            console.error('❌ Error actualizando viático:', error);
            
            let errorMessage = 'Error al actualizar el viático';
            
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor';
            } else {
                errorMessage = error.message;
            }

            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    deleteViatico: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const api = createApiInstance();
            const response = await api.delete(`/api/v1/viaticos/${id}`);

            console.log('✅ Viático eliminado exitosamente:', response.data);

            set(state => ({
                viaticos: state.viaticos.filter(v => v._id !== id),
                isLoading: false
            }));

            return response.data;
        } catch (error) {
            console.error('❌ Error eliminando viático:', error);
            
            let errorMessage = 'Error al eliminar el viático';
            
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor';
            } else {
                errorMessage = error.message;
            }

            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    deleteFotoViatico: async (id, fotoIndex) => {
        set({ isLoading: true, error: null });
        try {
            const api = createApiInstance();
            const response = await api.delete(`/api/v1/viaticos/${id}/fotos/${fotoIndex}`);

            console.log('✅ Foto eliminada exitosamente:', response.data);

            set(state => ({
                viaticos: state.viaticos.map(v => 
                    v._id === id ? (response.data.data || v) : v
                ),
                isLoading: false
            }));

            return response.data.data || response.data;
        } catch (error) {
            console.error('❌ Error eliminando foto:', error);
            
            let errorMessage = 'Error al eliminar la foto';
            
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            }

            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    getViaticosFiltrados: () => {
        const { viaticos, filtros } = get();
        return viaticos.filter(v => {
            let cumple = true;

            if (filtros.fechaInicio && filtros.fechaFin) {
                const fecha = dayjs(v.FechaEntrada);
                cumple = cumple && fecha.isSameOrAfter(dayjs(filtros.fechaInicio)) && fecha.isSameOrBefore(dayjs(filtros.fechaFin));
            }

            if (filtros.tecnico) {
                cumple = cumple && v.NombreTecnico.toLowerCase().includes(filtros.tecnico.toLowerCase());
            }

            if (filtros.cliente) {
                cumple = cumple && v.Cliente.toLowerCase().includes(filtros.cliente.toLowerCase());
            }

            return cumple;
        });
    },

    calcularEstadisticas: () => {
        const viaticos = get().viaticos;
        const totalDado = viaticos.reduce((sum, v) => sum + (v.MontoDado || 0), 0);
        const totalGastado = viaticos.reduce((sum, v) => sum + (v.Montogastado || 0), 0);
        const diferencia = totalDado - totalGastado;
        const porcentajeGastado = totalDado > 0 ? ((totalGastado / totalDado) * 100).toFixed(2) : 0;

        return { totalDado, totalGastado, diferencia, porcentajeGastado };
    },

    getViaticosPorTecnico: (nombreTecnico) =>
        get().viaticos.filter(v => v.NombreTecnico.toLowerCase().includes(nombreTecnico.toLowerCase())),

    getViaticosPorFecha: (fechaInicio, fechaFin) =>
        get().viaticos.filter(v => {
            const fecha = new Date(v.FechaEntrada);
            return fecha >= new Date(fechaInicio) && fecha <= new Date(fechaFin);
        })
}));