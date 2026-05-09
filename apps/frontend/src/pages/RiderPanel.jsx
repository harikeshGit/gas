import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RiderPanel() {
  const { api, user } = useAuth();

  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [otpInputs, setOtpInputs] = useState({});
  const [isAvailable, setIsAvailable] = useState(true);

  async function refresh() {
    const [aRes, mRes] = await Promise.all([api.get('/api/rider/available'), api.get('/api/rider/my-orders')]);
    setAvailable(aRes.data.orders || []);
    setMyOrders(mRes.data.orders || []);
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept(orderId) {
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/api/rider/orders/${orderId}/accept`);
      setMessage('Order accepted. Ab pick karo.');
      await refresh();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Accept failed');
    } finally {
      setLoading(false);
    }
  }

  async function pick(orderId) {
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/api/rider/orders/${orderId}/pick`);
      setMessage('Picked. Ab OTP generate karo delivery ke time.');
      await refresh();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Pick failed');
    } finally {
      setLoading(false);
    }
  }

  async function collectCash(orderId) {
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/api/rider/orders/${orderId}/collect-cash`);
      setMessage('Cash collected. Ab OTP send karke delivery complete karo.');
      await refresh();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Collect cash failed');
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp(orderId) {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.post(`/api/rider/orders/${orderId}/send-delivery-otp`, {});
      if (data.email?.demo) {
        setMessage(`Demo OTP generated (SMTP not set). OTP: ${data.email.demoOtp}`);
      } else {
        setMessage('OTP email sent to customer.');
      }
    } catch (err) {
      setMessage(err?.response?.data?.error || 'OTP send failed');
    } finally {
      setLoading(false);
    }
  }

  async function verify(orderId) {
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/api/rider/orders/${orderId}/verify-delivery-otp`, {
        otp: otpInputs[orderId] || '',
      });
      setMessage('Delivered! OTP verified.');
      setOtpInputs((prev) => ({ ...prev, [orderId]: '' }));
      await refresh();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Verify failed');
    } finally {
      setLoading(false);
    }
  }

  async function updateAvailability(next) {
    setIsAvailable(next);
    try {
      await api.post('/api/rider/availability', { isAvailable: next });
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid grid2">
      <div className="card">
        <h2 className="h2">Rider Panel</h2>
        <p className="muted">Hi {user?.name}. Orders → accept → pick → (COD: collect cash) → OTP deliver.</p>

        <div className="toolbar" style={{ marginBottom: 10 }}>
          <span className="muted">Availability:</span>
          <button className={`btn ${isAvailable ? 'btnPrimary' : ''}`} onClick={() => updateAvailability(true)}>
            Available
          </button>
          <button className={`btn ${!isAvailable ? 'btnPrimary' : ''}`} onClick={() => updateAvailability(false)}>
            Busy
          </button>
        </div>

        {message ? <div className="alert">{message}</div> : null}

        <h3 className="h2" style={{ marginTop: 14 }}>
          Available Orders
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {available.map((o) => (
              <tr key={o._id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{o.status}</div>
                  <div className="muted">₹{o.amount}</div>
                  <div className="muted">Pay: {o.payment?.mode || '—'} / {o.payment?.status || '—'}</div>
                </td>
                <td>
                  <div>{o.customer?.name || '—'}</div>
                  <div className="muted">{o.customer?.email || ''}</div>
                </td>
                <td>
                  <button className="btn btnPrimary" disabled={loading} onClick={() => accept(o._id)}>
                    Accept
                  </button>
                </td>
              </tr>
            ))}
            {!available.length ? (
              <tr>
                <td colSpan="3" className="muted">
                  No available orders. (Tip: Online orders need PAID, COD orders can be CREATED)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="h2">My Assigned Orders</h2>
        <p className="muted">ASSIGNED/PICKED orders yahan show honge.</p>

        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myOrders.map((o) => (
              <tr key={o._id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{o.status}</div>
                  <div className="muted">₹{o.amount}</div>
                  <div className="muted">Pay: {o.payment?.mode || '—'} / {o.payment?.status || '—'}</div>
                </td>
                <td>{o.address}</td>
                <td>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {o.status === 'ASSIGNED' ? (
                      <button className="btn btnPrimary" disabled={loading} onClick={() => pick(o._id)}>
                        Mark Picked
                      </button>
                    ) : null}

                    {o.status === 'PICKED' ? (
                      <>
                        {o.payment?.mode === 'CASH' && o.payment?.status !== 'PAID' ? (
                          <button className="btn btnPrimary" disabled={loading} onClick={() => collectCash(o._id)}>
                            Collect Cash
                          </button>
                        ) : null}
                        <button className="btn" disabled={loading} onClick={() => sendOtp(o._id)}>
                          Send Delivery OTP
                        </button>
                        <input
                          className="input"
                          placeholder="Enter OTP"
                          value={otpInputs[o._id] || ''}
                          onChange={(e) => setOtpInputs((p) => ({ ...p, [o._id]: e.target.value }))}
                        />
                        <button className="btn btnPrimary" disabled={loading} onClick={() => verify(o._id)}>
                          Verify & Deliver
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!myOrders.length ? (
              <tr>
                <td colSpan="3" className="muted">
                  No assigned orders.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
