import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

function roleHome(role) {
  if (role === 'customer') return '/customer';
  if (role === 'rider') return '/rider';
  if (role === 'dealer') return '/dealer';
  if (role === 'admin') return '/admin';
  return '/';
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expectedRole, setExpectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email, password, expectedRole: expectedRole || undefined });
      nav(roleHome(data.user.role));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2 className="h2">Login</h2>
      <p className="muted">Simple login — JWT token store hota hai for API calls.</p>

      <form onSubmit={onSubmit} className="grid">
        <div>
          <label className="muted">Login As (Role)</label>
          <select className="input" value={expectedRole} onChange={(e) => setExpectedRole(e.target.value)}>
            <option value="">Auto (account role)</option>
            <option value="customer">Customer</option>
            <option value="dealer">Dealer</option>
            <option value="rider">Rider</option>
            <option value="admin">Admin</option>
          </select>
          <div className="muted" style={{ marginTop: 6 }}>
            Role-based login: agar wrong role select kiya, error show hoga.
          </div>
        </div>
        <div>
          <label className="muted">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="muted">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="muted" style={{ marginTop: 6 }}>
            <Link to="/forgot-password" style={{ color: 'var(--accent)' }}>Forgot password?</Link>
          </div>
        </div>

        {error ? <div className="alert alertError">{error}</div> : null}

        <button className="btn btnPrimary" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 10 }}>
        New user? <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
      </p>
    </div>
  );
}
