> Nota de normalizacion (2026-06-26): este documento es historico. Para endpoints vigentes usar `Documents/API_ENDPOINTS.md` y `SubastUp_API_Endpoints_v3_FINAL.xlsx`, que coinciden con `backend/server.js` y `backend/routes/*`.

# ESTADO DEL REPOSITORIO (Post-Merge "desarrollo")

Este documento detalla el estado técnico del repositorio tras el reciente merge a la rama `desarrollo`. Se ha realizado un mapeo exhaustivo de los archivos del frontend y backend para identificar deuda técnica, inconsistencias, dependencias rotas y establecer un plan de acción.

## 1. Archivos Fuera de Lugar (Crítico)
Se ha detectado que durante el merge o en commits anteriores, se copiaron accidentalmente archivos de vistas del Frontend (React Native) dentro de la carpeta de controladores del Backend.

*   **Archivos misplaced en `backend/controllers/`:**
    *   `RegisterScreen.js`
    *   `VerifyCodeScreen.js`
    *   `ResetPasswordScreen.js`
    *   `RegisterScreen2.js`
    *   `LoginScreen.js`
*   **Acción requerida:** Eliminar estos archivos del backend. Las versiones correctas ya residen en `frontend/src/screens/auth/`. El único controlador real de autenticación en el backend es `authController.js`.

## 2. Navegación y Flujos (Frontend)
*   **Desconexiones:** Existen flujos de navegación que apuntan a rutas inexistentes o incorrectas. Por ejemplo, en `CalendarScreen.js`, el botón 'Pujar' redirige al stack de 'Auth' en lugar de al flujo autenticado de pujas.
*   **Uso de `getParent()`:** Pantallas como `HomeAuthenticatedScreen.js` utilizan `navigation.getParent()?.navigate(...)` lo cual indica un acoplamiento fuerte y puede romperse fácilmente si cambia la jerarquía de navegadores en `AppNavigator.js` o `TabNavigator.js`.
*   **Flujo de Carga de Producto:** `CargarProductoScreen.js` simula la subida de datos con `setTimeout`. Faltan endpoints reales en el backend para procesar el `multipart/form-data`.

## 3. Integración con el Backend (Mocks vs API Real)
El frontend contiene lógica extensiva para manejar la API (`frontend/src/services/api.js`), pero un gran número de componentes depende de constantes de datos falsos (`MOCK_DATA`) y `setTimeout` para simular asincronía.

*   **Faltantes en Backend:** El frontend espera conectarse a endpoints como `ENDPOINTS.CHATS`, `ENDPOINTS.AUCTIONS`, `ENDPOINTS.AUCTION_CATEGORIES`, y `ENDPOINTS.PAYMENT_METHODS`. Sin embargo, el backend **sólo** tiene implementadas las rutas de autenticación (`/api/auth/...`). Faltan los controladores y rutas para gestionar subastas, pagos, chats y perfil de usuario.
*   **WebSockets:** El frontend cuenta con un hook `useSocket.js` y componentes (`ChatDetailScreen.js`, `AuctionDetailAuthScreen.js`) preparados para tiempo real con Socket.IO, pero el backend (`server.js`) aún no levanta el servidor de WebSockets.

## 4. Consistencia Visual y Estilos (Frontend)
*   **Tema Hardcodeado vs Contexto:** Existe un sistema de temas implementado (`ThemeContext`, `useAppTheme`) con colores base definidos. No obstante, múltiples pantallas (ej. `AuctionListAuthScreen.js`, `CargarProductoScreen.js`, y modales) ignoran el contexto y hardcodean colores como `#8b0000`, `#FFFFFF`, `#1A1A1A`, etc.
*   **Limpieza de UI:** Se debe unificar el uso de Safe Areas (`useSafeAreaInsets`) y la tipografía para asegurar la calidad y evitar fallos de layout en distintos dispositivos.

## 5. Código Muerto y Redundante
*   **`ProfileScreen.js`:** Es un archivo residual casi vacío que fue reemplazado funcionalmente por `MiCuentaScreen.js`.
*   **Duplicidad en Navegadores:** Se definen vistas en `AppNavigator` que ya podrían ser accesibles o redundantes en relación al `TabNavigator`.

---

## 📅 Roadmap y Próximos Pasos Priorizados

1.  **Limpieza Inmediata (Backend):** Borrar los componentes de React Native alojados erróneamente en `backend/controllers/`.
2.  **Refactor de Navegación:** Corregir los links rotos en pantallas principales (ej. Calendar -> Pujar) y eliminar componentes no utilizados (`ProfileScreen.js`).
3.  **Expansión del Backend:** Crear las rutas y controladores para Subastas (CRUD), Chats y Configuración de Perfil/Pagos de acuerdo con los modelos definidos en `schema.prisma`.
4.  **Integración Frontend-Backend:** Reemplazar progresivamente los `MOCK_DATA` y temporizadores en el frontend por llamadas asíncronas con `api.get`/`api.post` utilizando los nuevos endpoints.
5.  **Estandarización de Tema:** Refactorizar los estilos del frontend para consumir unificadamente el `ThemeContext`, removiendo el CSS hardcodeado.
6.  **Integración WebSocket:** Configurar `socket.io` en `server.js` para habilitar el tiempo real en Pujas y Chat.
