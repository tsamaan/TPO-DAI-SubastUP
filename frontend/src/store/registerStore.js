/*
Intro: registerStore es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en store/registerStore.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'zustand'.
import { create } from 'zustand'; // Explica: define useRegisterStore usando el resultado de create.
const useRegisterStore = create((set, get) => ({ // Datos del Paso 1
    step1Data: { nombre: '', apellido: '', dni: '', telefono: '', email: '',
      password: ''
    },

    // Datos del Paso 2
    step2Data: {
      direccion: '',
      numero: '',
      pais: '',
      ciudad: '',
      codigoPostal: ''
    },

    // Fotos
    fotos: {
      foto1: null,
      foto2: null
    },

    // Setear datos del Paso 1
    setStep1Data: (data) =>
    set((state) => ({
      step1Data: { ...state.step1Data, ...data }
    })),

    // Setear datos del Paso 2
    setStep2Data: (data) =>
    set((state) => ({
      step2Data: { ...state.step2Data, ...data }
    })),

    // Setear fotos
    setFotos: (fotos) =>
    set(() => ({
      fotos
    })),

    // Obtener todos los datos del registro
    getRegistroCompleto: () => {// Explica: define state usando el resultado de get.
      const state = get(); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return {
        ...state.step1Data,
        ...state.step2Data,
        fotos: state.fotos
      };
    },

    // Limpiar datos del registro (cuando cierre la app o termine el registro)
    clearRegistration: () =>
    set(() => ({
      step1Data: {
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
        password: ''
      },
      step2Data: {
        direccion: '',
        numero: '',
        pais: '',
        ciudad: '',
        codigoPostal: ''
      },
      fotos: {
        foto1: null,
        foto2: null
      }
    }))
  })); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default useRegisterStore;
