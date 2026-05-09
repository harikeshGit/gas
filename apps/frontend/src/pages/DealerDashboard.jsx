import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function DealerDashboard() {
  const { api, user } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  async function refresh() {
    const [mRes, oRes] = await Promise.all([api.get('/api/dealer/dashboard'), api.get('/api/dealer/orders')]);
    setMetrics(mRes.data.metrics);
    setOrders(oRes.data.orders || []);
  }

  useEffect(() => {
    refresh().catch(() => setMessage('Failed to load dealer data'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2 className="h2">Dealer Dashboard</h2>
        <p className="muted">Hi {user?.name}. Orders + revenue summary.</p>

        {metrics ? (
          <div className="kpi">
            <div className="kpiBox">
              <div className="muted">Total Orders</div>
              <div className="kpiValue">{metrics.totalOrders}</div>
            </div>
            <div className="kpiBox">
              <div className="muted">Delivered</div>
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
        <h2 className="h2">Orders</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Customer</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{o.status}</div>
                  <div className="muted">Pay: {o.payment?.status}</div>
                </td>
                <td>
                  <div>{o.customer?.name || '—'}</div>
                  <div className="muted">{o.customer?.email || ''}</div>
                </td>
                <td>₹{o.amount}</td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td colSpan="3" className="muted">
                  No orders.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
