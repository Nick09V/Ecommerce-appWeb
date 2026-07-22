import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ShoppingCart, MessageCircle, LogIn, LogOut, LayoutGrid, User, Search, Star, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'https://apiwebav.nickval.dev/web/api';

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

  return { user, login, signup, logout, isAuthenticated: !!user };
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
          <Link to="/cart" className={`nav-link ${isActive('/cart')}`}><ShoppingCart size={18}/> Carrito</Link>
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
function LoginPage({ onLogin, onSwitchToSignup }) {
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
function SignupPage({ onSignup, onSwitchToLogin }) {
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

// --- Catalog Page ---
function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useState(() => {
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

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Catálogo de Repuestos</h1>
        <p>Encuentra placas y repuestos de alta calidad para televisores.</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" placeholder="Buscar repuestos..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '3rem' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><p>Cargando productos...</p></div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => (
            <div key={product.id} className="product-card glass">
              <div className="product-image">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  <LayoutGrid size={40} />
                </div>
              </div>
              <div className="product-info">
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{product.title}</h3>
                <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem', minHeight: '2.4rem' }}>{product.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>${Number(product.price).toFixed(2)}</span>
                  <span style={{ fontSize: '0.75rem', color: Number(product.stock) > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {Number(product.stock) > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }}>
                  <ShoppingCart size={16}/> Añadir al carrito
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No se encontraron productos.</p>}
        </div>
      )}
    </div>
  );
}

// --- Main App ---
function App() {
  const { user, login, signup, logout, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState('login');

  if (!isAuthenticated) {
    return authMode === 'login'
      ? <LoginPage onLogin={login} onSwitchToSignup={() => setAuthMode('signup')} />
      : <SignupPage onSignup={signup} onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <>
      <Navbar user={user} logout={logout} />
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/chat" element={
          <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
            <h1>💬 Chat en Tiempo Real</h1>
            <p>Contacta directamente con los vendedores para negociar precios.</p>
            <div className="glass" style={{ padding: '2rem', textAlign: 'center', marginTop: '1rem' }}>
              <MessageCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p>Selecciona un producto del catálogo para iniciar una conversación.</p>
            </div>
          </div>
        } />
        <Route path="/cart" element={
          <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
            <h1>🛒 Tu Carrito</h1>
            <div className="glass" style={{ padding: '2rem', textAlign: 'center', marginTop: '1rem' }}>
              <ShoppingCart size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p>Tu carrito está vacío. Explora el catálogo para añadir productos.</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ir al Catálogo <ChevronRight size={16}/></Link>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
