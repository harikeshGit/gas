import React from 'react';
import { Route, Routes } from 'react-router-dom';

import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import RiderPanel from './pages/RiderPanel.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DealerDashboard from './pages/DealerDashboard.jsx';
import RequireAuth from './routes/RequireAuth.jsx';

export default function App() {
  return (
    <>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/customer"
            element={
              <RequireAuth roles={['customer']}>
                <CustomerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/rider"
            element={
              <RequireAuth roles={['rider']}>
                <RiderPanel />
              </RequireAuth>
            }
          />
          <Route
            path="/dealer"
            element={
              <RequireAuth roles={['dealer']}>
                <DealerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth roles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </>
  );
}
