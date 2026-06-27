/*
Intro: api es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en constants/api.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // ── URL base del backend ──────────────────────────────────────────────────────
// Por defecto apunta al backend LOCAL de esta PC. Se puede sobreescribir al
// levantar Expo con la variable EXPO_PUBLIC_API_URL. Opciones:
//   Web (en esta PC):       http://localhost:3001
//   Produccion/Render:      https://tpo-dai-subastup.onrender.com
//   Celular (misma WiFi):   http://192.168.210.185:3001   (IP de esta PC)
//   Android emulador:       http://10.0.2.2:3001
//   Celular en otra red:    exponé el backend con ngrok y usá esa URL https
// El default apunta al backend publico en Render, que usa la base Supabase.
export // Explica: define BASE_URL para usarlo en este archivo.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tpo-dai-subastup.onrender.com';export // Explica: define ENDPOINTS para usarlo en este archivo.
const ENDPOINTS = { // ── Auth ────────────────────────────────────────────────
  LOGIN: '/api/auth/login', REGISTER: '/api/auth/register', FORGOT_PASSWORD: '/api/auth/forgot-password', VERIFY_CODE: '/api/auth/verify-code', RESET_PASSWORD: '/api/auth/reset-password', VALIDATE_USER: '/api/auth/validate-user',
  LOGOUT: '/api/auth/logout',

  // ── Usuarios / Perfil ───────────────────────────────────
  ME: '/api/users/me',
  MY_BIDS: '/api/users/me/bids',
  MY_STATS: '/api/users/me/stats',
  MY_STATS_EVOL: '/api/users/me/stats/evolution',
  MY_AUCTIONS: '/api/users/me/auctions',
  MY_AUCTIONS_CONF: '/api/users/me/auctions/confirmed',

  // ── Subastas ─────────────────────────────────────────────
  AUCTIONS: '/api/auctions',
  AUCTION_BY_ID: (id) => `/api/auctions/${id}`,
  AUCTION_STATUS: (id) => `/api/auctions/${id}/status`,
  AUCTION_LINK: (id) => `/api/auctions/${id}/share-link`,
  CALENDAR: '/api/auctions/calendar',
  TODAY: '/api/auctions/today',

  // ── Productos (ciclo de vida del bien) ───────────────────
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id) => `/api/products/${id}`,
  PRODUCTS_PENDING: '/api/products/pending-review',
  PRODUCT_APPROVE: (id) => `/api/products/${id}/approve`,
  PRODUCT_REJECT: (id) => `/api/products/${id}/reject`,
  PRODUCT_RESPOND: (id) => `/api/products/${id}/respond`,

  // ── Pujas ────────────────────────────────────────────────
  BIDS: '/api/bids',
  BID_STATUS: (itemId) => `/api/bids/${itemId}/status`,

  // ── Chats / Soporte ──────────────────────────────────────
  CHATS: '/api/chats',
  CHATS_UNREAD: '/api/chats/unread-count',
  CHAT_MESSAGES: (id) => `/api/chats/${id}/messages`,
  CHAT_CREATE: (productId) => `/api/chats/create/${productId}`,

  // ── Notificaciones ───────────────────────────────────────
  NOTIFICATIONS: '/api/notifications',
  NOTIF_UNREAD: '/api/notifications/unread-count',
  NOTIF_READ: (id) => `/api/notifications/${id}/read`,
  NOTIF_READ_ALL: '/api/notifications/read-all',
  NOTIF_DELETE: (id) => `/api/notifications/${id}`,
  NOTIF_TOKEN: '/api/notifications/push-token',
  NOTIF_SUB: (auctionId) => `/api/notifications/subscribe/${auctionId}`,

  // ── Configuración / Métodos de pago ──────────────────────
  SETTINGS: '/api/settings',
  PAYMENT_METHODS: '/api/settings/payment-methods',
  PAYMENT_CARD: '/api/settings/payment-methods/card',
  PAYMENT_BANK: '/api/settings/payment-methods/bank',
  PAYMENT_CHECK: '/api/settings/payment-methods/check',
  PAYMENT_BY_ID: (id) => `/api/settings/payment-methods/${id}`,
  PAYMENT_VERIFY: (id) => `/api/settings/payment-methods/${id}/verify`,
  PAYMENT_PENDING: '/api/settings/payment-methods/pending-verification',

  // ── Ayuda ────────────────────────────────────────────────
  FAQ: '/api/help/faq'
};
