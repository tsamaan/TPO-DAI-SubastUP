import React, { useState, useEffect, useCallback } from 'react'

// ── Configuración ──────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'https://tpo-dai-subastup.onrender.com'

// ── Colores SubastUp ───────────────────────────────────────────
const C = {
  rojo:       '#8B0000',
  rojoClaro:  '#A52020',
  bg:         '#0F0F0F',
  sidebar:    '#1A1A1A',
  card:       '#222222',
  cardBorder: '#333333',
  texto:      '#F0F0F0',
  textoGris:  '#999999',
  verde:      '#2E7D32',
  amarillo:   '#F57F17',
  blanco:     '#FFFFFF',
}

// ── Estilos globales ───────────────────────────────────────────
const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: ${C.bg}; color: ${C.texto}; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${C.sidebar}; }
  ::-webkit-scrollbar-thumb { background: ${C.rojo}; border-radius: 3px; }
  button { cursor: pointer; font-family: 'Inter', sans-serif; }
  input, textarea { font-family: 'Inter', sans-serif; }
`

// ── API helper ─────────────────────────────────────────────────
async function api(endpoint, method = 'GET', body = null, token = '') {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

// ── Componentes base ───────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
    }}>
      {children}
    </span>
  )
}

function Btn({ onClick, color = C.rojo, children, small, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#444' : color,
        color: C.blanco,
        border: 'none',
        borderRadius: 6,
        padding: small ? '5px 12px' : '8px 16px',
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: 10,
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: type === 'error' ? C.rojo : C.verde,
      color: C.blanco,
      padding: '12px 20px',
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 14,
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {msg}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 700, color: C.texto, marginBottom: 16, borderLeft: `3px solid ${C.rojo}`, paddingLeft: 12 }}>
      {children}
    </h2>
  )
}

// ── Login ──────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Completá los campos.'); return }
    setLoading(true)
    setError('')
    try {
      const data = await api('/api/auth/login', 'POST', { email, password })
      if (data.ok && (data.usuario.rol === 'admin' || data.usuario.rol === 'revisor')) {
        onLogin(data.token, data.usuario)
      } else if (data.ok) {
        setError('No tenés permisos de administrador.')
      } else {
        setError(data.message || 'Credenciales incorrectas.')
      }
    } catch {
      setError('No se pudo conectar al servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ width: 380, background: C.sidebar, borderRadius: 14, padding: 40, border: `1px solid ${C.cardBorder}` }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: C.rojo, letterSpacing: 1 }}>SubastUp</span>
          <p style={{ color: C.textoGris, marginTop: 4, fontSize: 14 }}>Panel de administración</p>
        </div>
        {error && <p style={{ color: C.rojo, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.texto, borderRadius: 7, padding: '10px 14px', fontSize: 14 }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.texto, borderRadius: 7, padding: '10px 14px', fontSize: 14 }}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ background: C.rojo, color: C.blanco, border: 'none', borderRadius: 7, padding: '11px', fontSize: 15, fontWeight: 700, marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sección: Usuarios ──────────────────────────────────────────
function Usuarios({ token, toast }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [motivo,   setMotivo]   = useState({})

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    const data = await api('/api/auth/pendientes', 'GET', null, token)
    setUsuarios(data.usuarios || [])
    setLoading(false)
  }, [token])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const aprobar = async (registroId) => {
    const data = await api('/api/auth/validate-user', 'POST', { registroId, aprobar: true }, token)
    if (data.ok) { toast('Usuario aprobado', 'ok'); fetchUsuarios() }
    else toast(data.message, 'error')
  }

  const rechazar = async (registroId) => {
    if (!motivo[registroId]?.trim()) { toast('Ingresá un motivo de rechazo', 'error'); return }
    const data = await api('/api/auth/validate-user', 'POST', { registroId, aprobar: false, motivoRechazo: motivo[registroId] }, token)
    if (data.ok) { toast('Usuario rechazado', 'ok'); fetchUsuarios() }
    else toast(data.message, 'error')
  }

  const asignarCategoria = async (registroId, categoria) => {
    const data = await api('/api/auth/asignar-categoria', 'PUT', { registroId, categoria }, token)
    if (data.ok) toast(`Categoría actualizada: ${categoria}`, 'ok')
    else toast(data.message, 'error')
  }

  if (loading) return <p style={{ color: C.textoGris }}>Cargando usuarios...</p>
  if (!usuarios.length) return <p style={{ color: C.textoGris }}>No hay usuarios pendientes.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {usuarios.map(u => (
        <Card key={u.registroId}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{u.nombre}</p>
              <p style={{ color: C.textoGris, fontSize: 13 }}>{u.email} · DNI: {u.documento}</p>
              <p style={{ color: C.textoGris, fontSize: 12, marginTop: 4 }}>Registrado: {new Date(u.fechaRegistro).toLocaleDateString('es-AR')}</p>
              <div style={{ marginTop: 8 }}>
                <Badge color={C.amarillo}>Pendiente</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240 }}>
              <select
                onChange={e => asignarCategoria(u.registroId, e.target.value)}
                defaultValue=""
                style={{ background: C.bg, color: C.texto, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
              >
                <option value="" disabled>Asignar categoría...</option>
                {['comun','especial','plata','oro','platino'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input
                placeholder="Motivo de rechazo (si aplica)"
                value={motivo[u.registroId] || ''}
                onChange={e => setMotivo(m => ({ ...m, [u.registroId]: e.target.value }))}
                style={{ background: C.bg, border: `1px solid ${C.cardBorder}`, color: C.texto, borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={() => aprobar(u.registroId)} color={C.verde}>Aprobar</Btn>
                <Btn small onClick={() => rechazar(u.registroId)} color={C.rojo}>Rechazar</Btn>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── Sección: Mensajes/Chat ─────────────────────────────────────
function Mensajes({ token, toast }) {
  const [convs,    setConvs]    = useState([])
  const [selected, setSelected] = useState(null)
  const [msgs,     setMsgs]     = useState([])
  const [texto,    setTexto]    = useState('')
  const [loading,  setLoading]  = useState(true)

  const fetchConvs = useCallback(async () => {
    setLoading(true)
    const data = await api('/api/chats', 'GET', null, token)
    setConvs(data.conversaciones || [])
    setLoading(false)
  }, [token])

  useEffect(() => { fetchConvs() }, [fetchConvs])

  const fetchMsgs = async (convId) => {
    setSelected(convId)
    const data = await api(`/api/chats/${convId}/messages`, 'GET', null, token)
    setMsgs(data.mensajes || [])
  }

  const enviar = async () => {
    if (!texto.trim() || !selected) return
    const data = await api(`/api/chats/${selected}/messages`, 'POST', { texto }, token)
    if (data.ok) { setTexto(''); fetchMsgs(selected) }
    else toast(data.message, 'error')
  }

  const conv = convs.find(c => c.conversacionId === selected)

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>
      {/* Lista conversaciones */}
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {loading
          ? <p style={{ color: C.textoGris, fontSize: 13 }}>Cargando...</p>
          : convs.length === 0
          ? <p style={{ color: C.textoGris, fontSize: 13 }}>No hay conversaciones.</p>
          : convs.map(c => (
            <div
              key={c.conversacionId}
              onClick={() => fetchMsgs(c.conversacionId)}
              style={{
                background: selected === c.conversacionId ? C.rojo + '33' : C.card,
                border: `1px solid ${selected === c.conversacionId ? C.rojo : C.cardBorder}`,
                borderRadius: 8, padding: 12, cursor: 'pointer',
              }}
            >
              <p style={{ fontWeight: 600, fontSize: 14 }}>{c.nombreProducto}</p>
              <p style={{ color: C.textoGris, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {c.ultimoMensaje || 'Sin mensajes'}
              </p>
              {c.sinLeer > 0 && (
                <span style={{ background: C.rojo, color: C.blanco, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>
                  {c.sinLeer} nuevo{c.sinLeer > 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))
        }
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.card, borderRadius: 10, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
        {!selected
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textoGris }}>Seleccioná una conversación</div>
          : <>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}`, fontWeight: 700, fontSize: 15 }}>
              {conv?.nombreProducto}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map(m => (
                <div key={m.mensajeId} style={{ display: 'flex', justifyContent: m.esMio ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: m.esMio ? C.rojo : C.bg,
                    color: C.blanco,
                    borderRadius: m.esMio ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '8px 14px',
                    maxWidth: '70%',
                    fontSize: 14,
                  }}>
                    <p>{m.texto}</p>
                    <p style={{ fontSize: 11, color: m.esMio ? '#ffaaaa' : C.textoGris, marginTop: 4, textAlign: 'right' }}>
                      {new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: `1px solid ${C.cardBorder}`, display: 'flex', gap: 8 }}>
              <input
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                placeholder="Escribí un mensaje..."
                style={{ flex: 1, background: C.bg, border: `1px solid ${C.cardBorder}`, color: C.texto, borderRadius: 7, padding: '9px 14px', fontSize: 14 }}
              />
              <Btn onClick={enviar}>Enviar</Btn>
            </div>
          </>
        }
      </div>
    </div>
  )
}

// ── Sección: Bienes ────────────────────────────────────────────
function Bienes({ token, toast }) {
  const [bienes,  setBienes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [motivos, setMotivos] = useState({})

  const fetchBienes = useCallback(async () => {
    setLoading(true)
    const data = await api('/api/products/pending-review', 'GET', null, token)
    setBienes(data.productos || [])
    setLoading(false)
  }, [token])

  useEffect(() => { fetchBienes() }, [fetchBienes])

  const aprobar = async (id) => {
    toast('Para aprobar, completá los datos de la propuesta desde la app móvil.', 'error')
  }

  const rechazar = async (id) => {
    if (!motivos[id]?.trim()) { toast('Ingresá un motivo', 'error'); return }
    const data = await api(`/api/products/${id}/reject`, 'PUT', { motivo: motivos[id], cargo: 0 }, token)
    if (data.ok) { toast('Bien rechazado', 'ok'); fetchBienes() }
    else toast(data.message, 'error')
  }

  const cambiarEstado = async (id, estado) => {
    toast(`Estado cambiado a: ${estado}`, 'ok')
  }

  if (loading) return <p style={{ color: C.textoGris }}>Cargando bienes...</p>
  if (!bienes.length) return <p style={{ color: C.textoGris }}>No hay bienes pendientes.</p>

  const ESTADOS = ['pendiente','en_inspeccion','aprobado','rechazado','esperando_usuario','confirmado','devuelto']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {bienes.map(b => (
        <Card key={b.productoId}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{b.nombre}</p>
              <p style={{ color: C.textoGris, fontSize: 13, marginTop: 2 }}>Dueño: {b.nombreDuenio} · {b.emailDuenio}</p>
              <p style={{ color: C.textoGris, fontSize: 12, marginTop: 2 }}>{b.descripcionCompleta}</p>
              <p style={{ color: C.textoGris, fontSize: 12, marginTop: 4 }}>{b.cantidadFotos} foto{b.cantidadFotos !== 1 ? 's' : ''}</p>
              <div style={{ marginTop: 8 }}>
                <Badge color={C.amarillo}>{b.estado}</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
              <select
                defaultValue={b.estado}
                onChange={e => cambiarEstado(b.productoId, e.target.value)}
                style={{ background: C.bg, color: C.texto, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
              >
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <input
                placeholder="Motivo de rechazo"
                value={motivos[b.productoId] || ''}
                onChange={e => setMotivos(m => ({ ...m, [b.productoId]: e.target.value }))}
                style={{ background: C.bg, border: `1px solid ${C.cardBorder}`, color: C.texto, borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small color={C.rojo} onClick={() => rechazar(b.productoId)}>Rechazar</Btn>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── Sección: Métodos de pago ───────────────────────────────────
function MetodosPago({ token, toast }) {
  const [metodos, setMetodos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMetodos = useCallback(async () => {
    setLoading(true)
    const data = await api('/api/settings/payment-methods/pending-verification', 'GET', null, token)
    setMetodos(data.metodos || [])
    setLoading(false)
  }, [token])

  useEffect(() => { fetchMetodos() }, [fetchMetodos])

  const verificar = async (id) => {
    const data = await api(`/api/settings/payment-methods/${id}/verify`, 'PUT', null, token)
    if (data.ok) { toast('Método verificado', 'ok'); fetchMetodos() }
    else toast(data.message, 'error')
  }

  const TIPO_COLOR = { tarjeta: '#1565C0', banco: C.verde, cheque: C.amarillo }

  if (loading) return <p style={{ color: C.textoGris }}>Cargando métodos de pago...</p>
  if (!metodos.length) return <p style={{ color: C.textoGris }}>No hay métodos pendientes de verificación.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {metodos.map(m => (
        <Card key={m.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge color={TIPO_COLOR[m.tipo] || C.textoGris}>{m.tipo}</Badge>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{m.titular || '—'}</span>
              </div>
              <p style={{ color: C.textoGris, fontSize: 13 }}>Usuario: {m.nombreDuenio} · DNI: {m.documento}</p>
              <p style={{ color: C.textoGris, fontSize: 12, marginTop: 2 }}>
                Registrado: {new Date(m.fechaCreacion).toLocaleDateString('es-AR')}
              </p>
            </div>
            <Btn small color={C.verde} onClick={() => verificar(m.id)}>Verificar</Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── App principal ──────────────────────────────────────────────
const TABS = [
  { id: 'usuarios',  label: '👤 Usuarios' },
  { id: 'mensajes',  label: '💬 Mensajes' },
  { id: 'bienes',    label: '📦 Bienes' },
  { id: 'pagos',     label: '💳 Métodos de Pago' },
]

export default function App() {
  const [token,   setToken]   = useState(localStorage.getItem('adminToken') || '')
  const [usuario, setUsuario] = useState(null)
  const [tab,     setTab]     = useState('usuarios')
  const [toast,   setToast]   = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const handleLogin = (t, u) => {
    setToken(t)
    setUsuario(u)
    localStorage.setItem('adminToken', t)
  }

  const handleLogout = () => {
    setToken('')
    setUsuario(null)
    localStorage.removeItem('adminToken')
  }

  if (!token) return (
    <>
      <style>{globalStyles}</style>
      <Login onLogin={handleLogin} />
    </>
  )

  return (
    <>
      <style>{globalStyles}</style>

      {/* Header */}
      <div style={{ background: C.sidebar, borderBottom: `1px solid ${C.cardBorder}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: C.rojo, letterSpacing: 1 }}>SubastUp Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: C.textoGris, fontSize: 13 }}>{usuario?.email || 'Admin'}</span>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.textoGris, borderRadius: 6, padding: '5px 12px', fontSize: 13 }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.sidebar, borderBottom: `1px solid ${C.cardBorder}`, padding: '0 24px', display: 'flex', gap: 4 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${C.rojo}` : '2px solid transparent',
              color: tab === t.id ? C.blanco : C.textoGris,
              padding: '14px 18px',
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <SectionTitle>
          {TABS.find(t => t.id === tab)?.label}
        </SectionTitle>

        {tab === 'usuarios' && <Usuarios token={token} toast={showToast} />}
        {tab === 'mensajes' && <Mensajes token={token} toast={showToast} />}
        {tab === 'bienes'   && <Bienes   token={token} toast={showToast} />}
        {tab === 'pagos'    && <MetodosPago token={token} toast={showToast} />}
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </>
  )
}
