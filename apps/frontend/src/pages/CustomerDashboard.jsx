import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import LocationPickerMap from '../components/LocationPickerMap.jsx';

export default function CustomerDashboard() {
  const { api, user } = useAuth();

  const [dealers, setDealers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  const [dealerId, setDealerId] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState(900);
  const [quantity, setQuantity] = useState(1);
  const [cylinderType, setCylinderType] = useState('Domestic');
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [geoHint, setGeoHint] = useState('');

  const addressUpdateSourceRef = useRef('user');
  const razorpayScriptPromiseRef = useRef(null);

  const canCreate = useMemo(() => Boolean(dealerId && address && amount), [dealerId, address, amount]);

  async function refresh() {
    setPageError('');
    const [dRes, oRes] = await Promise.all([api.get('/api/public/dealers'), api.get('/api/orders/my')]);
    const nextDealers = dRes.data.dealers || [];
    setDealers(nextDealers);
    setOrders(oRes.data.orders || []);

    if ((!dealerId || dealerId === '') && nextDealers?.[0]?._id) {
      setDealerId(nextDealers[0]._id);
    }
  }

  useEffect(() => {
    refresh()
      .catch((err) => {
        setPageError(err?.response?.data?.error || err?.message || 'Failed to load dashboard data');
      })
      .finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = (address || '').trim();
    setGeoHint('');

    if (addressUpdateSourceRef.current === 'reverse') {
      addressUpdateSourceRef.current = 'user';
      return;
    }

    if (q.length < 6) return;

    const handle = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/public/geocode', { params: { q } });
        if (data?.location?.lat && data?.location?.lng) {
          setLocation(data.location);
          setGeoHint('Address se location update ho gayi (map auto move).');
        }
      } catch {
        // ignore geocode failures for typing experience
      }
    }, 800);

    return () => clearTimeout(handle);
  }, [address, api]);

  async function handleMapPick(loc) {
    setLocation(loc);
    setGeoHint('Map se location pick hui. Address auto-fill ho raha hai…');

    try {
      const { data } = await api.get('/api/public/reverse-geocode', {
        params: { lat: loc.lat, lng: loc.lng },
      });

      if (data?.address) {
        addressUpdateSourceRef.current = 'reverse';
        setAddress(data.address);
        setGeoHint('Map click se address auto-fill ho gaya.');
      }
    } catch {
      setGeoHint('Map location set ho gayi, but address fetch nahi ho paya.');
    }
  }

  async function createOrder() {
    if (!dealerId) {
      setMessage('Dealer select karo (pehle Dealer account register karo).');
      return;
    }
    if (!address?.trim()) {
      setMessage('Address required hai.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await api.post('/api/orders', {
        dealerId,
        address,
        amount: Number(amount),
        quantity: Number(quantity),
        cylinderType,
        location,
      });
      setMessage('Order created! Ab Online ya Cash (COD) select karke proceed karo.');
      await refresh();
    } catch (err) {
      const backendError = err?.response?.data?.error;
      const details = err?.response?.data?.details;
      if (backendError && details?.length) {
        setMessage(`${backendError} (${details[0]?.message || 'invalid input'})`);
      } else {
        setMessage(backendError || err?.message || 'Create failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function setPaymentMode(orderId, mode) {
    await api.post(`/api/orders/${orderId}/payment-mode`, { mode });
  }

  function loadRazorpayScript() {
    if (razorpayScriptPromiseRef.current) return razorpayScriptPromiseRef.current;

    razorpayScriptPromiseRef.current = new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
      document.body.appendChild(script);
    });

    return razorpayScriptPromiseRef.current;
  }

  async function payOnline(orderId) {
    setLoading(true);
    setMessage('');
    try {
      setMessage('Starting online payment…');
      await setPaymentMode(orderId, 'ONLINE');

      const { data } = await api.post(`/api/orders/${orderId}/pay`, { mode: 'razorpay' });

      if (data.demo) {
        setMessage('Payment successful (demo mode). Order PAID.');
        await refresh();
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        throw new Error('Razorpay not available');
      }

      const rzp = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: 'Cylendra-Wala',
        description: `Order ${orderId}`,
        order_id: data.razorpay.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        handler: async (response) => {
          try {
            await api.post(`/api/orders/${orderId}/pay/confirm`, response);
            setMessage('Payment verified. Order PAID.');
            await refresh();
          } catch (err) {
            setMessage(err?.response?.data?.error || err?.message || 'Payment verification failed');
          }
        },
      });

      rzp.open();
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.message || 'Pay failed');
    } finally {
      setLoading(false);
    }
  }

  async function selectCashOnDelivery(orderId) {
    setLoading(true);
    setMessage('');
    try {
      await setPaymentMode(orderId, 'CASH');
      setMessage('Cash on Delivery selected. Rider delivery time cash collect karega.');
      await refresh();
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.message || 'Failed to set Cash on Delivery');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid2">
      <div className="card">
        <h2 className="h2">Customer Dashboard</h2>
        <p className="muted">Welcome {user?.name}. Booking + dealer selection + order history.</p>

        {initialLoading ? <div className="muted">Loading…</div> : null}
        {pageError ? <div className="alert alertError">{pageError}</div> : null}

        <div className="grid">
          <div>
            <label className="muted">Select Dealer</label>
            <select className="input" value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
              {dealers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.businessName}
                </option>
              ))}
            </select>
            {!dealers.length ? (
              <div className="alert alertError" style={{ marginTop: 10 }}>
                Dealers list empty hai. Pehle ek Dealer user register karo (Role: Dealer), phir yahan select karo.
              </div>
            ) : (
              <div className="muted" style={{ marginTop: 6 }}>
                Dealer select karke order create karo.
              </div>
            )}
          </div>

          <div className="row row2">
            <div>
              <label className="muted">Cylinder Type</label>
              <input className="input" value={cylinderType} onChange={(e) => setCylinderType(e.target.value)} />
            </div>
            <div>
              <label className="muted">Quantity</label>
              <input className="input" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="muted">Delivery Address</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, locality, city" />
            {geoHint ? <div className="muted" style={{ marginTop: 6 }}>{geoHint}</div> : null}
          </div>

          <div>
            <label className="muted">Amount (₹)</label>
            <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <LocationPickerMap value={location} onChange={handleMapPick} />

          <button className="btn btnPrimary" disabled={loading || !canCreate} onClick={createOrder}>
            {loading ? 'Please wait…' : 'Create Order'}
          </button>

          {message ? <div className="alert">{message}</div> : null}
        </div>
      </div>

      <div className="card">
        <h2 className="h2">My Orders</h2>
        <p className="muted">Max text nahi — quick status view.</p>

        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Dealer</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{o.status}</div>
                  <div className="muted">Pay: {o.payment?.mode || '—'} / {o.payment?.status || '—'}</div>
                </td>
                <td>{o.dealer?.businessName || '—'}</td>
                <td>₹{o.amount}</td>
                <td>
                  {o.payment?.status === 'PAID' ? (
                    <span className="badge">Paid</span>
                  ) : o.status !== 'CREATED' ? (
                    <span className="muted">Payment locked</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btnPrimary" disabled={loading} onClick={() => payOnline(o._id)}>
                        Pay Online
                      </button>
                      <button className="btn" disabled={loading} onClick={() => selectCashOnDelivery(o._id)}>
                        Cash (COD)
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td colSpan="4" className="muted">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
