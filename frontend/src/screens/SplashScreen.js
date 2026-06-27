/*
Intro: SplashScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/SplashScreen.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useEffect } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native'; // Paleta de colores y espaciado del proyecto
// Explica: importa dependencias desde '../constants/colors'.
import { COLORS, SPACING } from '../constants/colors'; // Explica: importa dependencias desde '../context/ThemeContext'.
import { useAppTheme } from '../context/ThemeContext';
// Imagen del logo ubicada en assets/images/
// Explica: define LOGO usando el resultado de require.
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
 */ // Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion SplashScreen que concentra una parte del flujo.
function SplashScreen({ onReady }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme();
  /*
   * Si se pasa la prop onReady, esperamos un breve instante
   * para que el usuario vea el splash antes de continuar.
   * El tiempo puede ajustarse según la duración real de la carga.
   */ // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!onReady) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Explica: define timer usando el resultado de setTimeout.
    const timer = setTimeout(() => {// Explica: ejecuta onReady como parte del flujo.
      onReady();
    }, 2000); // 2 segundos de splash

    // Limpieza: cancela el timer si el componente se desmonta antes de tiempo
    // Render: devuelve el resultado que consume React o la funcion llamadora.
    return () => clearTimeout(timer);}, [onReady]); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (
    /*
     * Contenedor raíz: ocupa toda la pantalla con fondo blanco.
     * Los tres bloques (top / center / bottom) dividen la pantalla
     * en tercios lógicos usando flex para centrar el logo visualmente.
     */ // UI: renderiza el componente View.
    <View style={[styles.container, { backgroundColor: theme.white }]}>

      {/* Espacio superior — empuja el logo hacia el centro óptico */}
      <View style={styles.spacerTop} />

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <View style={styles.logoWrapper}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" // mantiene proporciones sin recortar
          accessibilityLabel="SubastUp logo" />
        
      </View>

      {/* ── Spinner de carga ─────────────────────────────────────────── */}
      {/*
         * El spinner se ubica en la parte inferior de la pantalla,
         * igual a la referencia visual. Usa el color primario del proyecto.
         */}
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size="large" color={theme.primary}
          accessibilityLabel="Cargando" />
        
      </View>

    </View>);

}

// ─── Estilos ────────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({

  /* Pantalla completa, fondo blanco */
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center'
  },

  /* Ocupa el tercio superior (empuja el logo al centro visual) */
  spacerTop: {
    flex: 2
  },

  /* Bloque que contiene la imagen del logo */
  logoWrapper: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },

  /* Tamaño del logo: ancho 65% de pantalla, altura proporcional */
  logo: {
    width: '100%',
    height: undefined,
    aspectRatio: 2.5 // ajustar si la imagen tiene otra proporción
  },

  /* Bloque inferior con el spinner, separado del logo */
  spinnerWrapper: {
    flex: 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: SPACING.xl
  }
});
