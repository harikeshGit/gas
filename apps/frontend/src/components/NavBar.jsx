import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function NavBar() {
  const { user, isAuthed, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="nav">
      <div className="container navInner">
        <div className="brand">
          <Link to="/">Cylendra-Wala</Link>
          <span className="badge">LPG Logistics</span>
        </div>

        <div className="navActions">
          {isAuthed ? (
            <>
              <span className="badge">{user?.role}</span>
              <button
                className="btn"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
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
      </div>
    </div>
  );
}
