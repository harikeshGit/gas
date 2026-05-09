import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RequireAuth({ children, roles }) {
  const { isAuthed, user } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;

  if (roles?.length && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
