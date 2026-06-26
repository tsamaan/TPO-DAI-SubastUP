import { create } from 'zustand';

const useRegisterStore = create((set, get) => ({
  // Datos del Paso 1
  step1Data: {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    password: '',
  },

  // Datos del Paso 2
  step2Data: {
    direccion: '',
    numero: '',
    pais: '',
    ciudad: '',
    codigoPostal: '',
  },

  // Fotos
  fotos: {
    foto1: null,
    foto2: null,
  },

  // Setear datos del Paso 1
  setStep1Data: (data) =>
    set((state) => ({
      step1Data: { ...state.step1Data, ...data },
    })),

  // Setear datos del Paso 2
  setStep2Data: (data) =>
    set((state) => ({
      step2Data: { ...state.step2Data, ...data },
    })),

  // Setear fotos
  setFotos: (fotos) =>
    set(() => ({
      fotos,
    })),

  // Obtener todos los datos del registro
  getRegistroCompleto: () => {
    const state = get();
    return {
      ...state.step1Data,
      ...state.step2Data,
      fotos: state.fotos,
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
        password: '',
      },
      step2Data: {
        direccion: '',
        numero: '',
        pais: '',
        ciudad: '',
        codigoPostal: '',
      },
      fotos: {
        foto1: null,
        foto2: null,
      },
    })),
}));

export default useRegisterStore;
