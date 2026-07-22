import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Settings, LogOut, LogIn, User, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'https://apiwebav.nickval.dev/admin/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Auth ---
function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const res = await api.post('/auth/signin', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  return { user, login, logout, isAuthenticated: !!user };
}

// --- Login Page ---
function LoginPage({ onLogin }) {
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
          <h1 style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🔒 AdminAV
          </h1>
          <p>Panel de Administración</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo del Administrador</label>
            <input id="email" type="email" className="input" placeholder="admin@tienda.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Verificando...' : <><LogIn size={18}/> Ingresar al Panel</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Sidebar ---
function Sidebar({ user, logout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
    color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
    textDecoration: 'none', fontWeight: 500,
    backgroundColor: isActive(path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    transition: 'all var(--transition-fast)'
  });

  return (
    <aside className="sidebar">
      <div>
        <h2 style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' }}>
          🔒 AdminAV
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.name || 'Admin'}</span>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, marginTop: '1.5rem' }}>
        <Link to="/" style={linkStyle('/')}><LayoutDashboard size={20}/> Dashboard</Link>
        <Link to="/inventory" style={linkStyle('/inventory')}><Package size={20}/> Inventario</Link>
        <Link to="/users" style={linkStyle('/users')}><Users size={20}/> Usuarios</Link>
        <Link to="/settings" style={linkStyle('/settings')}><Settings size={20}/> Ajustes</Link>
      </nav>
      <button onClick={logout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
        <LogOut size={18} /> Cerrar Sesión
      </button>
    </aside>
  );
}

// --- Dashboard ---
function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    api.get('/dashboard/summary').then(res => {
      setSummary(res.data);
    }).catch(() => {
      setSummary({ summary: { totalProducts: 2, outOfStockCount: 0 }, outOfStockProducts: [] });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1>📊 Panel de Control</h1>
      <p>Resumen general de la tienda.</p>

      <div className="stats-grid">
        <div className="glass stat-card">
          <Package size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Total Productos</h3>
          <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', margin: 0 }}>
            {loading ? '...' : summary?.summary?.totalProducts || 0}
          </h2>
        </div>
        <div className="glass stat-card">
          <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Sin Stock</h3>
          <h2 style={{ color: 'var(--danger)', fontSize: '2.5rem', margin: 0 }}>
            {loading ? '...' : summary?.summary?.outOfStockCount || 0}
          </h2>
        </div>
        <div className="glass stat-card">
          <Users size={24} style={{ color: 'var(--success)' }} />
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Usuarios Activos</h3>
          <h2 style={{ color: 'var(--success)', fontSize: '2.5rem', margin: 0 }}>—</h2>
        </div>
      </div>

      {summary?.outOfStockProducts?.length > 0 && (
        <div className="glass" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}><AlertTriangle size={18} style={{ verticalAlign: 'middle' }} /> Productos Agotados</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th></tr></thead>
              <tbody>
                {summary.outOfStockProducts.map(p => (
                  <tr key={p.id}><td>#{p.id}</td><td>{p.title}</td><td>${Number(p.price).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Inventory Management ---
function InventoryPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>📦 Gestión de Inventario</h1>
          <p>Administra los productos de la tienda.</p>
        </div>
        <button className="btn btn-primary"><Plus size={18}/> Nuevo Producto</button>
      </div>
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Título</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr>
                <td>#1</td><td>Laptop Pro</td><td>$1,200.50</td><td>10</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}><Edit size={14}/></button>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}><Trash2 size={14}/></button>
                </td>
              </tr>
              <tr>
                <td>#2</td><td>Teclado Mecánico</td><td>$85.00</td><td>25</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}><Edit size={14}/></button>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}><Trash2 size={14}/></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---
function App() {
  const { user, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} logout={logout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/users" element={<div className="animate-fade-in"><h1>👥 Usuarios</h1><p>Gestión de usuarios (próximamente).</p></div>} />
          <Route path="/settings" element={<div className="animate-fade-in"><h1>⚙️ Ajustes</h1><p>Configuración del sistema (próximamente).</p></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
