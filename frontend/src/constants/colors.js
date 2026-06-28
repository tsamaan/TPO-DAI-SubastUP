/*
Intro: colors es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en constants/colors.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/
// Paleta principal clara usada por pantallas, componentes y estados visuales.
export
const COLORS = { primary: '#8B0000', primaryLight: '#E53935', secondary: '#212121', white: '#FFFFFF', background: '#7B7B7B', surface: '#FFFFFF', border: '#7B7B7B',
  placeholder: '#7B7B7B',
  error: '#C62828',
  success: '#2E7D32',
  timerWarning: '#FF6F00'
};

// Escala de espaciado reutilizable para mantener paddings/margins consistentes.
export
const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

// Radios estándar para cards, botones y elementos circulares.
export
const RADIUS = { sm: 4, md: 8, lg: 12, full: 999
};

// Tamaños tipográficos compartidos por las pantallas.
export
const FONTS = { sizes: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24 }
};

// Variante oscura de la paleta, consumida por ThemeContext/configuración.
export
const DARK_COLORS = { primary: '#8B0000',
  primaryLight: '#E53935',
  secondary: '#F5F5F5',
  white: '#121212',
  background: '#1E1E1E',
  surface: '#2C2C2C',
  border: '#3A3A3A',
  placeholder: '#9E9E9E',
  error: '#EF5350',
  success: '#66BB6A'
};
