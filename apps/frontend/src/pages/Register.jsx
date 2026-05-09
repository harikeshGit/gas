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

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone: phone || undefined,
        password,
        role,
        businessName: role === 'dealer' ? (businessName || undefined) : undefined,
      };
      const data = await register(payload);
      nav(roleHome(data.user.role));
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
      <h2 className="h2">Register</h2>
      <p className="muted">Demo setup: role select allowed for presentation.</p>

      <form onSubmit={onSubmit} className="grid">
        <div className="row row2">
          <div>
            <label className="muted">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="muted">Phone (optional)</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="row row2">
          <div>
            <label className="muted">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="muted">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="muted">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="dealer">Dealer</option>
            <option value="rider">Rider</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {role === 'dealer' ? (
          <div>
            <label className="muted">Business Name (optional)</label>
            <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
        ) : null}

        {error ? <div className="alert alertError">{error}</div> : null}

        <button className="btn btnPrimary" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 10 }}>
        Already have account? <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link>
      </p>
    </div>
  );
}
