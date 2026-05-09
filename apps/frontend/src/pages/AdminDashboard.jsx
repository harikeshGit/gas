import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function AdminDashboard() {
  const { api, user } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');

  async function refresh(nextRole = role) {
    const [mRes, uRes] = await Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/users', { params: nextRole ? { role: nextRole } : {} }),
    ]);
    setMetrics(mRes.data.metrics);
    setUsers(uRes.data.users || []);
  }

  useEffect(() => {
    refresh().catch(() => setMessage('Failed to load admin data'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2 className="h2">Admin Dashboard</h2>
        <p className="muted">Hi {user?.name}. Revenue summary + user management (basic).</p>

        {metrics ? (
          <div className="kpi">
            <div className="kpiBox">
              <div className="muted">Total Orders</div>
              <div className="kpiValue">{metrics.totalOrders}</div>
            </div>
            <div className="kpiBox">
              <div className="muted">Paid Orders</div>
              <div className="kpiValue">{metrics.paidOrders}</div>
            </div>
            <div className="kpiBox">
              <div className="muted">Delivered Orders</div>
              <div className="kpiValue">{metrics.deliveredOrders}</div>
            </div>
            <div className="kpiBox">
              <div className="muted">Revenue</div>
              <div className="kpiValue">₹{metrics.revenue}</div>
            </div>
          </div>
        ) : (
          <div className="muted">Loading metrics…</div>
        )}

        {message ? <div className="badge">{message}</div> : null}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <h2 className="h2">Users</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="muted">Role:</span>
            <select
              className="input"
              style={{ width: 200 }}
              value={role}
              onChange={async (e) => {
                const next = e.target.value;
                setRole(next);
                await refresh(next);
              }}
            >
              <option value="">All</option>
              <option value="customer">Customer</option>
              <option value="dealer">Dealer</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan="3" className="muted">
                  No users.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
