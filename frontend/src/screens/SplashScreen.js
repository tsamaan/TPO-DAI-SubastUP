import React, { useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

// Paleta de colores y espaciado del proyecto
import { COLORS, SPACING } from '../constants/colors';
import { useAppTheme } from '../context/ThemeContext';

// Imagen del logo ubicada en assets/images/
const LOGO = require('../assets/images/banner_principal.jpeg');

/**
 * SplashScreen
 *
 * Pantalla de bienvenida que se muestra al iniciar la app.
 * Muestra el logo de SubastUp centrado y un spinner de carga en la parte inferior.
 *
 * Props:
 *   onReady — función opcional que se llama cuando la pantalla
 *             termina su animación/espera (útil para navegar al siguiente flow).
 */
export default function SplashScreen({ onReady }) {
  const { theme } = useAppTheme();

  /*
   * Si se pasa la prop onReady, esperamos un breve instante
   * para que el usuario vea el splash antes de continuar.
   * El tiempo puede ajustarse según la duración real de la carga.
   */
  useEffect(() => {
    if (!onReady) return;

    const timer = setTimeout(() => {
      onReady();
    }, 2000); // 2 segundos de splash

    // Limpieza: cancela el timer si el componente se desmonta antes de tiempo
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    /*
     * Contenedor raíz: ocupa toda la pantalla con fondo blanco.
     * Los tres bloques (top / center / bottom) dividen la pantalla
     * en tercios lógicos usando flex para centrar el logo visualmente.
     */
    <View style={[styles.container, { backgroundColor: theme.white }]}>

      {/* Espacio superior — empuja el logo hacia el centro óptico */}
      <View style={styles.spacerTop} />

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <View style={styles.logoWrapper}>
        <Image
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"  // mantiene proporciones sin recortar
          accessibilityLabel="SubastUp logo"
        />
      </View>

      {/* ── Spinner de carga ─────────────────────────────────────────── */}
      {/*
        * El spinner se ubica en la parte inferior de la pantalla,
        * igual a la referencia visual. Usa el color primario del proyecto.
        */}
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator
          size="large"
          color={theme.primary}
          accessibilityLabel="Cargando"
        />
      </View>

    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  /* Pantalla completa, fondo blanco */
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },

  /* Ocupa el tercio superior (empuja el logo al centro visual) */
  spacerTop: {
    flex: 2,
  },

  /* Bloque que contiene la imagen del logo */
  logoWrapper: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Tamaño del logo: ancho 65% de pantalla, altura proporcional */
  logo: {
    width: '100%',
    height: undefined,
    aspectRatio: 2.5, // ajustar si la imagen tiene otra proporción
  },

  /* Bloque inferior con el spinner, separado del logo */
  spinnerWrapper: {
    flex: 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
});
