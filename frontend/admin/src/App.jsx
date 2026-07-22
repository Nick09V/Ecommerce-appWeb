import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Settings, LogOut, LogIn, Edit, Trash2, Plus, AlertTriangle, X, Save, ImageOff, Activity, Server, ExternalLink, RefreshCw, Terminal, Gauge } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3005/api' : 'https://apiwebav.nickval.dev/admin/api');

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
        <Link to="/observability" style={linkStyle('/observability')}><Activity size={20}/> Monitoreo</Link>
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

  useEffect(() => {
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
function ProductThumb({ product }) {
  const [failed, setFailed] = useState(false);
  if (!product.image_url || failed) return <div className="admin-thumb fallback"><ImageOff size={20}/></div>;
  return <img className="admin-thumb" src={product.image_url} alt={product.title} onError={() => setFailed(true)}/>;
}

const emptyProduct = { title: '', price: '', stock: '', description: '', image_url: '' };

function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const loadProducts = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/inventory');
      setProducts(Array.isArray(res.data) ? res.data : (res.data?.items || []));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo cargar el inventario.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const openCreate = () => { setEditing('new'); setForm(emptyProduct); };
  const openEdit = (product) => {
    setEditing(product.id);
    setForm({ title: product.title || '', price: String(product.price ?? ''), stock: String(product.stock ?? ''), description: product.description || '', image_url: product.image_url || '' });
  };
  const closeModal = () => { setEditing(null); setForm(emptyProduct); setError(''); };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editing === 'new') await api.post('/inventory', payload);
      else await api.put(`/inventory/${editing}`, payload);
      closeModal(); await loadProducts();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || err.response?.data?.error || 'No se pudo guardar el producto.');
    } finally { setSaving(false); }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`¿Eliminar “${product.title}”? Esta acción no se puede deshacer.`)) return;
    setError('');
    try { await api.delete(`/inventory/${product.id}`); await loadProducts(); }
    catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo eliminar el producto.'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-heading"><div><h1>📦 Gestión de Inventario</h1><p>Crear, consultar, editar y eliminar productos.</p></div><button onClick={openCreate} className="btn btn-primary"><Plus size={18}/> Nuevo Producto</button></div>
      {error && <div className="alert-error">{error}</div>}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper"><table><thead><tr><th>Imagen</th><th>ID</th><th>Título</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6">Cargando productos...</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan="6">No hay productos registrados.</td></tr>}
            {products.map((product) => <tr key={product.id}><td><ProductThumb product={product}/></td><td>#{product.id}</td><td><strong>{product.title}</strong><small className="table-description">{product.description}</small></td><td>${Number(product.price).toFixed(2)}</td><td><span className={Number(product.stock) ? 'stock-ok' : 'stock-zero'}>{product.stock}</span></td><td><div className="action-buttons"><button onClick={() => openEdit(product)} className="btn btn-outline icon-btn" title="Editar"><Edit size={15}/></button><button onClick={() => removeProduct(product)} className="btn btn-outline icon-btn danger" title="Eliminar"><Trash2 size={15}/></button></div></td></tr>)}
          </tbody></table></div>
      </div>

      {editing && <div className="admin-modal-backdrop" onMouseDown={closeModal}><section className="glass admin-modal" onMouseDown={(e) => e.stopPropagation()}><header><div><span>{editing === 'new' ? 'Nuevo registro' : `Editando producto #${editing}`}</span><h2>{editing === 'new' ? 'Crear producto' : 'Actualizar producto'}</h2></div><button className="modal-x" onClick={closeModal}><X size={21}/></button></header>
        <form onSubmit={submit}><div className="form-grid"><label>Título<input className="input" value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} required maxLength="255"/></label><label>URL de imagen<input className="input" type="url" value={form.image_url} onChange={(e) => setForm({...form,image_url:e.target.value})} placeholder="https://..."/></label><label>Precio<input className="input" type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm({...form,price:e.target.value})} required/></label><label>Stock<input className="input" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({...form,stock:e.target.value})} required/></label><label className="full">Descripción<textarea className="input textarea" value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} rows="4"/></label></div>
          {form.image_url && <div className="image-preview"><span>Vista previa</span><img src={form.image_url} alt="Vista previa"/></div>}
          <footer><button type="button" onClick={closeModal} className="btn btn-outline">Cancelar</button><button disabled={saving} className="btn btn-primary"><Save size={17}/>{saving ? 'Guardando...' : 'Guardar'}</button></footer></form>
      </section></div>}
    </div>
  );
}



function ObservabilityPage() {
  const [report, setReport] = useState(null);
  const [logs, setLogs] = useState([]);
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [reportRes, logRes] = await Promise.all([
        api.get('/observability/report'),
        api.get('/observability/logs', { params: { service, limit: 120 } }),
      ]);
      setReport(reportRes.data); setLogs(logRes.data.logs || []);
    } catch (err) { setError(err.response?.data?.error || 'No se pudo cargar el reporte de observabilidad.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [service]);
  const upCount = report?.health?.filter(item => item.status === 'UP').length || 0;
  const total = report?.health?.length || 0;
  const memoryByJob = Object.fromEntries((report?.metrics?.memory || []).map(item => [item.metric.job, Number(item.value?.[1] || 0)]));
  const rateByJob = Object.fromEntries((report?.metrics?.requestRate || []).map(item => [item.metric.job, Number(item.value?.[1] || 0)]));
  return <div className="animate-fade-in observability-page">
    <div className="admin-page-heading"><div><h1>📡 Observabilidad</h1><p>Estado, métricas Prometheus y logs centralizados de los microservicios.</p></div><button className="btn btn-primary" onClick={load} disabled={loading}><RefreshCw size={17}/>{loading?'Actualizando...':'Actualizar'}</button></div>
    {error && <div className="alert-error">{error}</div>}
    <div className="stats-grid observability-stats">
      <div className="glass stat-card"><Server size={24}/><h3>Servicios disponibles</h3><h2 className={upCount===total?'metric-ok':'metric-warn'}>{upCount}/{total}</h2></div>
      <div className="glass stat-card"><Gauge size={24}/><h3>Solicitudes por segundo</h3><h2>{Object.values(rateByJob).reduce((a,b)=>a+b,0).toFixed(2)}</h2></div>
      <div className="glass stat-card"><Activity size={24}/><h3>Reporte generado</h3><strong>{report?.generatedAt ? new Date(report.generatedAt).toLocaleTimeString() : '—'}</strong></div>
    </div>
    <div className="glass obs-section"><div className="obs-title"><h2>Salud de microservicios</h2><div className="obs-links"><a href={report?.links?.prometheus} target="_blank" rel="noreferrer">Prometheus <ExternalLink size={14}/></a><a href={report?.links?.grafana} target="_blank" rel="noreferrer">Grafana <ExternalLink size={14}/></a></div></div>
      <div className="service-grid">{(report?.health||[]).map(item=><article className="service-card" key={item.service}><div><span className={`status-dot ${item.status==='UP'?'up':'down'}`}></span><strong>{item.service}</strong></div><span className={`status-pill ${item.status==='UP'?'up':'down'}`}>{item.status}</span><small>Latencia: {item.latencyMs} ms</small><small>Memoria: {memoryByJob[item.service] ? `${(memoryByJob[item.service]/1024/1024).toFixed(1)} MB` : 'sin datos'}</small><small>Req/s: {(rateByJob[item.service]||0).toFixed(3)}</small></article>)}</div>
    </div>
    <div className="glass obs-section"><div className="obs-title"><div><h2><Terminal size={19}/> Logs recientes</h2><p>Última hora, recopilados por Loki y Promtail.</p></div><select className="input log-filter" value={service} onChange={e=>setService(e.target.value)}><option value="">Todos los contenedores</option>{['auth-service','inventory-service','chat-service','bff-web','bff-admin','nginx'].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      <div className="log-console">{logs.length===0?<div className="empty-logs">No hay logs disponibles todavía.</div>:logs.map((log,index)=><div className="log-line" key={`${log.timestamp}-${index}`}><time>{new Date(Number(BigInt(log.timestamp)/1000000n)).toLocaleTimeString()}</time><span className="log-service">{log.labels?.service||log.labels?.container||'container'}</span><code>{log.line}</code></div>)}</div>
    </div>
  </div>;
}

// --- Main App ---
function App() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const isPublicMonitoring = location.pathname === '/observability';

  // La pantalla de observabilidad es pública. El inventario y el resto del panel
  // continúan protegidos y requieren una sesión de administrador.
  if (!isAuthenticated && !isPublicMonitoring) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar user={user || { name: 'Monitor público' }} logout={isAuthenticated ? logout : () => { window.location.href = '/'; }} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/observability" replace />} />
          <Route path="/inventory" element={isAuthenticated ? <InventoryPage /> : <Navigate to="/observability" replace />} />
          <Route path="/observability" element={<ObservabilityPage />} />
          <Route path="/users" element={isAuthenticated ? <div className="animate-fade-in"><h1>👥 Usuarios</h1><p>Gestión de usuarios (próximamente).</p></div> : <Navigate to="/observability" replace />} />
          <Route path="/settings" element={isAuthenticated ? <div className="animate-fade-in"><h1>⚙️ Ajustes</h1><p>Configuración del sistema (próximamente).</p></div> : <Navigate to="/observability" replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/observability'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
