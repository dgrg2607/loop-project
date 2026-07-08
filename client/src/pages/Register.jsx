import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STEPS = [
  { id: 1, label: 'Account', desc: 'Your details' },
  { id: 2, label: 'Workspace', desc: 'Your team' },
];

function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {STEPS.map((step, i) => (
        <div key={step.id} className="step-indicator-item">
          <div className={`step-circle ${current === step.id ? 'active' : current > step.id ? 'done' : ''}`}>
            {current > step.id ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              step.id
            )}
          </div>
          <div className="step-text">
            <span className="step-label">{step.label}</span>
            <span className="step-desc">{step.desc}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`step-line ${current > step.id ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ characters', pass: password.length >= 6 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  const colors = ['', '#C1432D', '#C98A2C', '#2D6A4F'];
  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {[1, 2, 3].map((i) => (
          <div key={i} className="pw-bar" style={{ background: i <= score ? colors[score] : '#e4e1d8' }} />
        ))}
      </div>
      {password && <span className="pw-label" style={{ color: colors[score] }}>{labels[score]}</span>}
      <div className="pw-checks">
        {checks.map((c) => (
          <span key={c.label} className={`pw-check ${c.pass ? 'pass' : ''}`}>
            {c.pass ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', email: '', password: '', organizationName: '', inviteCode: '',
  });

  const set = (k) => (ev) => {
    setForm((f) => ({ ...f, [k]: ev.target.value }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (mode === 'create' && !form.organizationName.trim()) e.organizationName = 'Workspace name is required';
    if (mode === 'join' && !form.inviteCode.trim()) e.inviteCode = 'Invite code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep1()) setStep(2); };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password };
      if (mode === 'create') payload.organizationName = form.organizationName;
      else payload.inviteCode = form.inviteCode.toUpperCase();
      await register(payload);
      toast.success('Welcome to LOOP! 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* ── Left branding panel ── */}
      <div className="auth-panel-left register-panel">
        <div className="auth-panel-inner">
          <div className="auth-logo">
            <div className="auth-logo-mark" />
            <span>LOOP</span>
          </div>
          <div className="auth-panel-copy">
            <h2>Start turning feedback into decisions.</h2>
            <p>
              Set up your workspace in under two minutes. Invite your team,
              connect your channels, and watch LOOP surface insights automatically.
            </p>
          </div>
          <ul className="auth-feature-list">
            {[
              { icon: '◆', text: 'Multi-channel feedback collection' },
              { icon: '◆', text: 'Automatic sentiment & theme analysis' },
              { icon: '◆', text: 'AI-powered Q&A on your data' },
              { icon: '◆', text: 'Role-based team access control' },
              { icon: '◆', text: 'One-click VoC executive reports' },
            ].map((f) => (
              <li key={f.text}>
                <span className="feature-icon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
          <div className="auth-panel-dots">
            {[...Array(12)].map((_, i) => <span key={i} className="dot-grid" />)}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p className="auth-form-sub">Free forever. No credit card required.</p>
          </div>

          <StepIndicator current={step} />

          {/* ── Step 1: Personal details ── */}
          {step === 1 && (
            <div className="step-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full name</label>
                <div className={`input-wrap ${errors.name ? 'input-error' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Work email</label>
                <div className={`input-wrap ${errors.email ? 'input-error' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className={`input-wrap ${errors.password ? 'input-error' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={set('password')}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPw
                        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                        : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>}
                    </svg>
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
                {form.password && <PasswordStrength password={form.password} />}
              </div>

              <button type="button" className="btn-submit" onClick={nextStep}>
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Workspace ── */}
          {step === 2 && (
            <div className="step-fields">
              <div className="workspace-toggle">
                <button
                  type="button"
                  className={`workspace-tab ${mode === 'create' ? 'active' : ''}`}
                  onClick={() => { setMode('create'); setErrors({}); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  New workspace
                </button>
                <button
                  type="button"
                  className={`workspace-tab ${mode === 'join' ? 'active' : ''}`}
                  onClick={() => { setMode('join'); setErrors({}); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Join existing
                </button>
              </div>

              {mode === 'create' ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="orgName">Workspace name</label>
                  <div className={`input-wrap ${errors.organizationName ? 'input-error' : ''}`}>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <input
                      id="orgName"
                      type="text"
                      placeholder="Acme Corporation"
                      value={form.organizationName}
                      onChange={set('organizationName')}
                    />
                  </div>
                  {errors.organizationName && <span className="field-error">{errors.organizationName}</span>}
                  <p className="form-hint">You'll be the workspace admin and can invite teammates after setup.</p>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="inviteCode">Invite code</label>
                  <div className={`input-wrap ${errors.inviteCode ? 'input-error' : ''}`}>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21 2-1 1"/><path d="M3 22 2 21"/><path d="m9 11 1.5 1.5"/><path d="m14 16 1.5 1.5"/>
                      <path d="M16 10 8 18"/><path d="m22 2-5.5 5.5M2 22l5.5-5.5"/>
                    </svg>
                    <input
                      id="inviteCode"
                      type="text"
                      placeholder="e.g. A3F9"
                      value={form.inviteCode}
                      onChange={(e) => { set('inviteCode')({ target: { value: e.target.value.toUpperCase() } }); }}
                      style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    />
                  </div>
                  {errors.inviteCode && <span className="field-error">{errors.inviteCode}</span>}
                  <p className="form-hint">Ask your workspace admin for the 4-character invite code from the Team page.</p>
                </div>
              )}

              <div className="step2-actions">
                <button type="button" className="btn-back" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="submit" className="btn-submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? (
                    <><span className="btn-spinner" /> Creating account…</>
                  ) : (
                    mode === 'create' ? 'Create workspace →' : 'Join workspace →'
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
