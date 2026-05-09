import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Home() {
  const { user, isAuthed } = useAuth();

  const target =
    user?.role === 'customer'
      ? '/customer'
      : user?.role === 'rider'
        ? '/rider'
        : user?.role === 'dealer'
          ? '/dealer'
          : user?.role === 'admin'
            ? '/admin'
            : '/';

  return (
    <div className="grid grid2">
      <div className="card">
        <h1 className="h1">Cylendra-Wala</h1>
        <p className="muted">
          LPG cylinder delivery logistics platform — Customer, Dealer, Rider, Admin.
        </p>
        <div className="actions">
          {isAuthed ? (
            <Link className="btn btnPrimary" to={target}>
              Open your dashboard
            </Link>
          ) : (
            <>
              <Link className="btn" to="/login">
                Login
              </Link>
              <Link className="btn btnPrimary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          Hinglish note: Yeh demo project interview/college presentation ke liye simple but professional flow dikhata hai.
        </p>
      </div>

      <div className="card">
        <h2 className="h2">Quick Links</h2>
        <div className="grid">
          <Link className="btn" to="/customer">
            Customer Dashboard
          </Link>
          <Link className="btn" to="/rider">
            Rider Panel
          </Link>
          <Link className="btn" to="/dealer">
            Dealer Dashboard
          </Link>
          <Link className="btn" to="/admin">
            Admin Dashboard
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          Access control: dashboard open tab only if your role matches.
        </p>
      </div>
    </div>
  );
}
