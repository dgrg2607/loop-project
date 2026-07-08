import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k) => (ev) => {
    setForm((f) => ({ ...f, [k]: ev.target.value }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setForm({ email: `${role}@demo.com`, password: 'password123' });
    setErrors({});
  };

  return (
    <div className="auth-root">
      {/* ── Left branding panel ── */}
      <div className="auth-panel-left">
        <div className="auth-panel-inner">
          <div className="auth-logo">
            <div className="auth-logo-mark" />
            <span>LOOP</span>
          </div>
          <div className="auth-panel-copy">
            <h2>Customer intelligence,<br />not customer noise.</h2>
            <p>
              LOOP collects feedback from every channel, automatically classifies
              sentiment, surfaces emerging trends, and answers your team's questions
              in plain English — all in one place.
            </p>
          </div>
          <div className="auth-panel-stats">
            <div className="auth-stat">
              <span className="auth-stat-num">94%</span>
              <span className="auth-stat-label">Faster insight</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-num">8+</span>
              <span className="auth-stat-label">Feedback channels</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-num">AI</span>
              <span className="auth-stat-label">Powered analysis</span>
            </div>
          </div>
          <div className="auth-panel-dots">
            {[...Array(12)].map((_, i) => <span key={i} className="dot-grid" />)}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p className="auth-form-sub">Sign in to your workspace to continue.</p>
          </div>

          {/* Demo shortcuts */}
          <div className="demo-pills">
            <span className="demo-pills-label">Try demo:</span>
            {['admin', 'manager', 'viewer'].map((r) => (
              <button type="button" key={r} className="demo-pill" onClick={() => fillDemo(r)}>
                {r}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <div className={`input-wrap ${errors.email ? 'input-error' : ''}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">Password</label>
            </div>
            <div className={`input-wrap ${errors.password ? 'input-error' : ''}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <><span className="btn-spinner" /> Signing in…</>
            ) : (
              'Sign in to LOOP →'
            )}
          </button>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
