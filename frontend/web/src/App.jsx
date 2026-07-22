import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { MessageCircle, LogIn, LogOut, LayoutGrid, User, Search, Eye, X, PackageCheck, CreditCard, Send, Wifi, WifiOff, ImageOff } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { GoogleLogin } from '@react-oauth/google';

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://apiwebav.nickval.dev/web/api');
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3003' : 'https://apiwebav.nickval.dev');
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Auth Context ---
function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const res = await api.post('/auth/signin', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, googleLogin, signup, logout, isAuthenticated: !!user };
}

// --- Protected Route ---
function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// --- Navbar ---
function Navbar({ user, logout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar glass">
      <div className="container">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 style={{ margin: 0, background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ TiendaAV
          </h2>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}><LayoutGrid size={18}/> Catálogo</Link>
          <Link to="/chat" className={`nav-link ${isActive('/chat')}`}><MessageCircle size={18}/> Chat</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.name || 'Usuario'}</span>
            </div>
            <button onClick={logout} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              <LogOut size={14}/> Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- Login Page ---
function LoginPage({ onLogin, onGoogleLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <h1 style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ TiendaAV
          </h1>
          <p>Inicia sesión para continuar</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input id="email" type="email" className="input" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Ingresando...' : <><LogIn size={18}/> Iniciar Sesión</>}
          </button>
        </form>
        <div className="oauth-divider"><span>o continúa con</span></div>
        <div className="google-login-wrap">
          {GOOGLE_ENABLED ? (
            <GoogleLogin
              onSuccess={(response) => {
                if (!response.credential) {
                  setError('Google no devolvió una credencial válida');
                  return;
                }
                onGoogleLogin(response.credential).catch((err) => {
                  setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo iniciar sesión con Google');
                });
              }}
              onError={() => setError('No se pudo iniciar sesión con Google')}
              theme="filled_black"
              shape="pill"
              width="320"
            />
          ) : (
            <div className="alert-error">Google OAuth no está configurado. Falta VITE_GOOGLE_CLIENT_ID en el build.</div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          ¿No tienes cuenta?{' '}
          <button onClick={onSwitchToSignup} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}

// --- Signup Page ---
function SignupPage({ onSignup, onGoogleLogin, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSignup(name, email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <h1 style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ TiendaAV
          </h1>
          <p>Crea tu cuenta para comenzar</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Nombre Completo</label>
            <input id="name" type="text" className="input" placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input id="email" type="email" className="input" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="input" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Creando cuenta...' : <><User size={18}/> Crear Cuenta</>}
          </button>
        </form>
        <div className="oauth-divider"><span>o regístrate con</span></div>
        <div className="google-login-wrap">
          {GOOGLE_ENABLED ? (
            <GoogleLogin
              onSuccess={(response) => {
                if (!response.credential) {
                  setError('Google no devolvió una credencial válida');
                  return;
                }
                onGoogleLogin(response.credential).catch((err) => {
                  setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo registrar con Google');
                });
              }}
              onError={() => setError('No se pudo registrar con Google')}
              theme="filled_black"
              shape="pill"
              text="signup_with"
              width="320"
            />
          ) : (
            <div className="alert-error">Google OAuth no está configurado. Falta VITE_GOOGLE_CLIENT_ID en el build.</div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}

function ProductImage({ product, className = '' }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = product.image_url || product.imageUrl || product.image;

  if (!imageUrl || failed) {
    return <div className={`image-fallback ${className}`}><ImageOff size={44} /><span>Sin imagen</span></div>;
  }

  return <img className={className} src={imageUrl} alt={product.title} loading="lazy" onError={() => setFailed(true)} />;
}

// --- Product Detail Modal ---
function ProductDetailModal({ product, onClose, onBuy, onChat }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const hasStock = Number(product.stock) > 0;

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        className="product-modal glass animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="product-modal-header">
          <div>
            <span className="product-modal-kicker">Detalle del producto</span>
            <h2 id="product-detail-title">{product.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar detalle">
            <X size={22} />
          </button>
        </div>

        <div className="product-modal-content">
          <div className="product-detail-image">
            <ProductImage product={product} />
          </div>

          <div className="product-detail-info">
            <div className="product-detail-price">${Number(product.price).toFixed(2)}</div>
            <div className={`stock-badge ${hasStock ? 'in-stock' : 'out-stock'}`}>
              <PackageCheck size={17} />
              {hasStock ? `${product.stock} unidades disponibles` : 'Producto agotado'}
            </div>

            <div className="detail-section">
              <h3>Descripción</h3>
              <p>{product.description || 'Este producto no tiene una descripción disponible.'}</p>
            </div>

            <div className="product-data-grid">
              <div>
                <span>Código</span>
                <strong>#{product.id}</strong>
              </div>
              <div>
                <span>Precio</span>
                <strong>${Number(product.price).toFixed(2)}</strong>
              </div>
              <div>
                <span>Disponibilidad</span>
                <strong>{hasStock ? 'En stock' : 'Agotado'}</strong>
              </div>
              <div>
                <span>Unidades</span>
                <strong>{Number(product.stock) || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="product-modal-actions">
          <button className="btn btn-primary" onClick={() => onBuy(product)} disabled={!hasStock}>
            <CreditCard size={18} />
            {hasStock ? 'Comprar' : 'Sin stock'}
          </button>
          <button className="btn btn-outline" onClick={() => onChat(product)}>
            <MessageCircle size={18} /> Chatear con el vendedor
          </button>
        </div>
      </section>
    </div>
  );
}

// --- Catalog Page ---
function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    api.get('/inventory').then(res => {
      const data = res.data;
      setProducts(Array.isArray(data) ? data : (data?.items || []));
    }).catch(() => {
      setProducts([
        { id: 1, title: 'Fuente de Poder Samsung 55"', price: 45.00, stock: 5, description: 'Fuente extraída de TV con pantalla rota.' },
        { id: 2, title: 'Mainboard LG 43"', price: 60.00, stock: 3, description: 'Placa main funcionando correctamente.' },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBuy = (product) => {
    alert(`Compra iniciada para: ${product.title}`);
  };

  const handleChat = (product) => {
    setSelectedProduct(null);
    navigate('/chat', { state: { product } });
  };

  return (
    <div className="container animate-fade-in catalog-page">
      <div className="catalog-heading">
        <h1>Catálogo de Repuestos</h1>
        <p>Encuentra placas y repuestos de alta calidad para televisores.</p>
      </div>

      <div className="catalog-search">
        <Search size={20} />
        <input className="input" placeholder="Buscar repuestos..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="catalog-message"><p>Cargando productos...</p></div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => {
            const hasStock = Number(product.stock) > 0;

            return (
              <article
                key={product.id}
                className="product-card glass"
                onClick={() => setSelectedProduct(product)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedProduct(product);
                  }
                }}
              >
                <div className="product-image">
                  <ProductImage product={product} />
                </div>
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="product-summary">
                    <span className="product-price">${Number(product.price).toFixed(2)}</span>
                    <span className={hasStock ? 'stock-text' : 'stock-text out'}>
                      {hasStock ? `${product.stock} disponibles` : 'Agotado'}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary product-detail-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedProduct(product);
                    }}
                  >
                    <Eye size={16} /> Ver detalles
                  </button>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <p className="empty-products">No se encontraron productos.</p>}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuy={handleBuy}
          onChat={handleChat}
        />
      )}
    </div>
  );
}

function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product || null;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = Number(currentUser.id || 0);
  const partnerId = Number(product?.seller_id || location.state?.partnerId || 0);
  const inventoryId = Number(product?.id || location.state?.inventoryId || 0);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const activeProduct = product || productsById[inventoryId] || null;

  const messageKey = (item, index = 0) => {
    const databaseId = item?.id ?? item?.chat_id;
    if (databaseId !== undefined && databaseId !== null) {
      return `msg-${databaseId}-${item?.sender_id ?? 's'}-${item?.receiver_id ?? 'r'}`;
    }
    return `msg-${item?.sender_id ?? 's'}-${item?.receiver_id ?? 'r'}-${item?.inventory_id ?? inventoryId}-${item?.created_at ?? item?.timestamp ?? index}-${index}`;
  };

  const appendMessage = (incoming) => {
    setMessages((previous) => {
      const incomingId = incoming?.id ?? incoming?.chat_id;
      const exists = previous.some((item) => {
        const currentId = item?.id ?? item?.chat_id;
        if (incomingId !== undefined && incomingId !== null && currentId !== undefined && currentId !== null) {
          return String(currentId) === String(incomingId)
            && Number(item.sender_id) === Number(incoming.sender_id)
            && Number(item.receiver_id) === Number(incoming.receiver_id);
        }
        return item.message === incoming.message
          && Number(item.sender_id) === Number(incoming.sender_id)
          && Number(item.receiver_id) === Number(incoming.receiver_id)
          && String(item.created_at || item.timestamp || '') === String(incoming.created_at || incoming.timestamp || '');
      });
      return exists ? previous : [...previous, incoming];
    });
  };

  const loadInbox = async () => {
    setLoadingInbox(true);
    setError('');

    try {
      // La bandeja no debe fallar solo porque el catálogo no esté disponible.
      const inboxResponse = await api.get('/chat/inbox');
      setConversations(Array.isArray(inboxResponse.data?.conversations)
        ? inboxResponse.data.conversations
        : []);
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error;
      setError(detail || 'No fue posible cargar tus conversaciones.');
      setConversations([]);
    }

    try {
      const inventoryResponse = await api.get('/inventory');
      const products = inventoryResponse.data?.products || inventoryResponse.data || [];
      if (Array.isArray(products)) {
        setProductsById(Object.fromEntries(products.map((item) => [Number(item.id), item])));
      }
    } catch (err) {
      // Los chats siguen visibles usando el identificador del producto.
      console.warn('No se pudieron cargar los datos visuales de los productos:', err.response?.data || err.message);
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const connectTimer = window.setTimeout(() => {
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socketRef.current = socket;
      socket.on('connect', () => {
        setConnected(true);
        setError('');
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', (err) => {
        setConnected(false);
        setError(`No se pudo conectar al chat: ${err.message}`);
      });
      socket.on('new_message', (message) => {
        const participants = [Number(message.sender_id), Number(message.receiver_id)];
        if (!participants.includes(currentUserId)) return;

        loadInbox();
        const sameProduct = !inventoryId || Number(message.inventory_id) === inventoryId;
        const samePeople = !partnerId || participants.includes(partnerId);
        if (sameProduct && samePeople && inventoryId && partnerId) appendMessage(message);
      });
    }, 0);

    return () => {
      window.clearTimeout(connectTimer);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [inventoryId, partnerId, currentUserId]);

  useEffect(() => {
    if (!inventoryId || !partnerId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError('');
    api.get(`/chat/conversation/${inventoryId}`, { params: { user: partnerId } })
      .then((res) => setMessages(res.data?.messages || []))
      .catch((err) => setError(err.response?.data?.message || 'No fue posible cargar la conversación.'))
      .finally(() => setLoading(false));
  }, [inventoryId, partnerId]);

  const openConversation = (conversation) => {
    const otherUserId = Number(conversation.sender_id) === currentUserId
      ? Number(conversation.receiver_id)
      : Number(conversation.sender_id);
    const conversationProduct = productsById[Number(conversation.inventory_id)] || null;
    navigate('/chat', {
      state: {
        partnerId: otherUserId,
        inventoryId: Number(conversation.inventory_id),
        product: conversationProduct,
      },
    });
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || !partnerId || !inventoryId) return;
    setText('');
    setError('');
    try {
      const response = await api.post('/chat/messages', { receiverId: partnerId, inventoryId, message });
      const saved = response.data?.message;
      if (saved) appendMessage(saved);
      loadInbox();
    } catch (err) {
      setText(message);
      setError(err.response?.data?.message || 'No se pudo enviar el mensaje.');
    }
  };

  const showInbox = !partnerId || !inventoryId;

  return (
    <div className="container animate-fade-in chat-page">
      <div className="chat-title-row">
        <div>
          <h1>💬 {showInbox ? 'Mis conversaciones' : 'Chat en tiempo real'}</h1>
          <p>{showInbox ? 'Aquí aparecen los mensajes recibidos y enviados.' : `Conversación sobre: ${activeProduct?.title || `Producto #${inventoryId}`}`}</p>
        </div>
        <span className={`connection-state ${connected ? 'online' : ''}`}>
          {connected ? <Wifi size={16}/> : <WifiOff size={16}/>} {connected ? 'Conectado' : 'Reconectando'}
        </span>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showInbox ? (
        <section className="glass inbox-panel">
          <div className="inbox-header">
            <div>
              <h2>Bandeja de chats</h2>
              <p>Selecciona una conversación para responder.</p>
            </div>
            <button className="btn btn-outline inbox-refresh" onClick={loadInbox} disabled={loadingInbox}>
              {loadingInbox ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {loadingInbox && conversations.length === 0 && <p className="chat-empty">Cargando conversaciones...</p>}
          {!loadingInbox && conversations.length === 0 && (
            <div className="chat-placeholder">
              <MessageCircle size={48}/>
              <p>Todavía no tienes conversaciones. Cuando alguien escriba por uno de tus productos, aparecerá aquí.</p>
            </div>
          )}

          <div className="conversation-list">
            {conversations.map((conversation, index) => {
              const otherUserId = Number(conversation.sender_id) === currentUserId
                ? Number(conversation.receiver_id)
                : Number(conversation.sender_id);
              const conversationProduct = productsById[Number(conversation.inventory_id)];
              const isReceived = Number(conversation.receiver_id) === currentUserId;
              return (
                <button
                  type="button"
                  className="conversation-card"
                  key={`conversation-${conversation.id}-${conversation.inventory_id}-${otherUserId}-${index}`}
                  onClick={() => openConversation(conversation)}
                >
                  <div className="conversation-image">
                    {conversationProduct ? <ProductImage product={conversationProduct}/> : <PackageCheck size={28}/>} 
                  </div>
                  <div className="conversation-main">
                    <div className="conversation-topline">
                      <strong>{conversationProduct?.title || `Producto #${conversation.inventory_id || 'sin identificar'}`}</strong>
                      <time>{new Date(conversation.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</time>
                    </div>
                    <span className={`conversation-meta ${isReceived ? 'received' : 'sent'}`}>{isReceived ? `Recibido de Usuario #${otherUserId}` : `Enviado a Usuario #${otherUserId}`}</span>
                    <p className="conversation-preview">{conversation.message}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : partnerId === currentUserId ? (
        <div className="glass chat-placeholder"><p>Este producto te pertenece. No puedes iniciar una conversación contigo mismo.</p></div>
      ) : (
        <section className="glass chat-panel">
          <div className="chat-toolbar">
            <button className="btn btn-outline" onClick={() => navigate('/chat', { replace: true, state: null })}>← Volver a conversaciones</button>
          </div>
          {activeProduct && (
            <header className="chat-product">
              <div className="chat-product-image"><ProductImage product={activeProduct}/></div>
              <div><strong>{activeProduct.title}</strong><span>${Number(activeProduct.price || 0).toFixed(2)}</span></div>
            </header>
          )}
          <div className="message-list">
            {loading && <p className="chat-empty">Cargando mensajes...</p>}
            {!loading && messages.length === 0 && <p className="chat-empty">Todavía no hay mensajes. Inicia la conversación.</p>}
            {messages.map((item, index) => {
              const own = Number(item.sender_id) === currentUserId;
              return (
                <div className={`message-row ${own ? 'own' : ''}`} key={messageKey(item, index)}>
                  <div className="message-bubble">
                    <p>{item.message || item.text}</p>
                    <time>{new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                </div>
              );
            })}
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje..." maxLength={500}/>
            <button className="btn btn-primary" disabled={!text.trim()}><Send size={18}/> Enviar</button>
          </form>
        </section>
      )}
    </div>
  );
}

// --- Main App ---
function App() {
  const { user, login, googleLogin, signup, logout, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState('login');

  if (!isAuthenticated) {
    return authMode === 'login'
      ? <LoginPage onLogin={login} onGoogleLogin={googleLogin} onSwitchToSignup={() => setAuthMode('signup')} />
      : <SignupPage onSignup={signup} onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <>
      <Navbar user={user} logout={logout} />
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
