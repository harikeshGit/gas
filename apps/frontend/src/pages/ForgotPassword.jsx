import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ForgotPassword() {
  const { api } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState('request'); // request | reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  async function requestOtp(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setDemoOtp('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setMessage(data?.message || 'OTP sent. Check your email.');
      if (data?.demoOtp) setDemoOtp(String(data.demoOtp));
      setStep('reset');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function resetPass(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (!otp.trim()) throw new Error('OTP is required');
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

      const { data } = await api.post('/api/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword,
      });
      setMessage(data?.message || 'Password reset successful. Please login.');
      setTimeout(() => nav('/login'), 800);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2 className="h2">Forgot Password</h2>
      <p className="muted">Email pe OTP aayega, phir new password set kar do.</p>

      {step === 'request' ? (
        <form onSubmit={requestOtp} className="grid">
          <div>
            <label className="muted">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {error ? <div className="alert alertError">{error}</div> : null}
          {message ? <div className="alert">{message}</div> : null}

          <button className="btn btnPrimary" disabled={loading}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>

          <p className="muted" style={{ marginTop: 10 }}>
            Back to <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={resetPass} className="grid">
          <div>
            <label className="muted">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="muted" style={{ marginTop: 6 }}>
              Same email jisme OTP aaya hai.
            </div>
          </div>

          <div>
            <label className="muted">OTP</label>
            <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} />
            {demoOtp ? (
              <div className="muted" style={{ marginTop: 6 }}>
                Demo OTP (SMTP configured nahi hai): <b>{demoOtp}</b>
              </div>
            ) : null}
          </div>

          <div>
            <label className="muted">New Password</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>

          <div>
            <label className="muted">Confirm Password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error ? <div className="alert alertError">{error}</div> : null}
          {message ? <div className="alert">{message}</div> : null}

          <button className="btn btnPrimary" disabled={loading}>
            {loading ? 'Updating…' : 'Reset Password'}
          </button>

          <p className="muted" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setStep('request');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setMessage('');
                setError('');
              }}
              disabled={loading}
            >
              Resend OTP
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
