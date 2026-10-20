import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ADMIN_EMAIL = 'lostportalhub@gmail.com';

const Login = ({ setUser }) => {
  // Tabs: 'signin' | 'register'
  const [tab, setTab] = useState('signin');

  // Sign In state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-Time Login 2FA OTP State (For ALL users - Students, Staff, and Admin)
  const [loginOtpStep, setLoginOtpStep] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [dispatchedLoginOtp, setDispatchedLoginOtp] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [isAdminSession, setIsAdminSession] = useState(false);

  // Register state
  const [regData, setRegData] = useState({
    fullName: '',
    roll: '',
    email: '',
    phone: '',
    role: 'student',
    password: '',
    confirmPassword: ''
  });
  const [regOtpStep, setRegOtpStep] = useState(false);
  const [regOtp, setRegOtp] = useState('');
  const [dispatchedRegOtp, setDispatchedRegOtp] = useState('');

  // Resend Cooldown Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Handle countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 1. HANDLE SIGN IN (Step 1: Authenticate credentials & Dispatch Real-Time OTP)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const input = identifier.trim();
    const pass = password.trim();

    if (!input || !pass) {
      setErrorMsg('Please enter both your identifier and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/auth/login', {
        identifier: input,
        password: pass
      });

      // Real-time OTP challenge required
      if (res.data.requiresOtp) {
        setLoginOtpStep(true);
        // If simulated (because EMAIL_PASS is empty), store the simulation code; otherwise empty
        setDispatchedLoginOtp(res.data.simulated ? (res.data.otp || '') : '');
        setTargetEmail(res.data.email || input);
        setIsAdminSession(res.data.purpose === 'admin_login' || input.toLowerCase() === ADMIN_EMAIL.toLowerCase());
        setSuccessMsg(res.data.message || `A verification OTP has been dispatched to ${res.data.email || input}`);
        setResendCooldown(30);
        setLoading(false);
        return;
      }

      if (res.data.ok && res.data.user) {
        setUser(res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/listings');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Unable to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. VERIFY REAL-TIME LOGIN OTP (Step 2: Complete Sign In)
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!loginOtp.trim()) {
      setErrorMsg('Please enter the 6-digit verification OTP.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
        email: targetEmail,
        otp: loginOtp.trim()
      });

      if (res.data.ok && res.data.user) {
        setSuccessMsg('Authentication verified successfully! Signing you in...');
        setUser(res.data.user);
        setTimeout(() => {
          navigate(res.data.user.role === 'admin' ? '/admin' : '/listings');
        }, 500);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Invalid or expired OTP. Please check the code in your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. HANDLE REGISTRATION (Step 1: Request OTP)
  const handleRegisterInitiate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regData.password !== regData.confirmPassword) {
      setErrorMsg('Passwords do not match! Please check and try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        ...regData,
        email: regData.email.trim().toLowerCase()
      });

      if (res.data.requiresOtp) {
        setRegOtpStep(true);
        setDispatchedRegOtp(res.data.simulated ? (res.data.otp || '') : '');
        setSuccessMsg(res.data.message || `Verification OTP dispatched to ${regData.email}`);
        setResendCooldown(30);
      } else if (res.data.ok && res.data.user) {
        setUser(res.data.user);
        navigate('/listings');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // 4. VERIFY USER REGISTRATION OTP (Step 2: Complete Register)
  const handleVerifyRegisterOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!regOtp.trim()) {
      setErrorMsg('Please enter the 6-digit registration OTP.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/auth/register', {
        ...regData,
        email: regData.email.trim().toLowerCase(),
        otp: regOtp.trim()
      });

      if (res.data.ok && res.data.user) {
        setSuccessMsg('Account verified and created successfully! Logging you in...');
        setUser(res.data.user);
        setTimeout(() => navigate('/listings'), 800);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Invalid or expired verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Helper
  const handleResendOtp = async (email, purpose) => {
    if (resendCooldown > 0) return;
    try {
      setErrorMsg('');
      setSuccessMsg('Dispatching fresh verification OTP...');
      const res = await api.post('/api/auth/send-otp', { email, purpose });
      if (res.data.ok) {
        if (res.data.simulated && res.data.otp) {
          if (purpose === 'admin_login' || purpose === 'user_login' || purpose === 'login') {
            setDispatchedLoginOtp(res.data.otp);
          }
          if (purpose === 'user_register') setDispatchedRegOtp(res.data.otp);
        } else {
          setDispatchedLoginOtp('');
          setDispatchedRegOtp('');
        }
        setSuccessMsg(`A fresh real-time OTP has been dispatched to ${email}`);
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend OTP. Please try again in a few moments.');
    }
  };

  return (
    <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        <div
          className="login-card"
          style={{
            padding: '36px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}
        >

          {/* REAL-TIME LOGIN 2FA OTP SCREEN (FOR ALL USERS) */}
          {loginOtpStep ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>
                  {isAdminSession ? '🛡️' : '🔐'}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>
                  {isAdminSession ? 'Admin 2FA Security Check' : 'Real-Time Sign-In Verification'}
                </h1>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  A 6-digit real-time one-time passcode was sent to{' '}
                  <strong style={{ color: 'var(--text-body)', wordBreak: 'break-all' }}>{targetEmail}</strong>
                </p>
              </div>

              {/* REAL-TIME EMAIL STATUS BADGE */}
              {!dispatchedLoginOtp ? (
                <div
                  style={{
                    background: 'var(--primary-subtle)',
                    border: '1px solid rgba(79, 70, 229, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>📬</span>
                  <div style={{ fontSize: '12.5px', color: 'var(--primary)', lineHeight: 1.4 }}>
                    <strong>Check your Email Inbox:</strong> We've dispatched a real-time OTP to your inbox. Check your Spam folder if not received in 30 seconds.
                  </div>
                </div>
              ) : (
                /* Simulation Fallback Badge if EMAIL_PASS is empty in backend/.env */
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                      ⚙️ Dev Notice (EMAIL_PASS not in .env):
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '4px', color: '#b45309' }}>
                      {dispatchedLoginOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginOtp(dispatchedLoginOtp)}
                    style={{
                      background: '#d97706',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Auto-Fill OTP
                  </button>
                </div>
              )}

              {errorMsg && (
                <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  ✅ {successMsg}
                </div>
              )}

              <form onSubmit={handleVerifyLoginOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="field">
                  <label htmlFor="login-otp-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Enter 6-Digit Verification OTP *
                  </label>
                  <input
                    id="login-otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={loginOtp}
                    onChange={e => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '22px',
                      fontWeight: 800,
                      textAlign: 'center',
                      letterSpacing: '8px',
                      borderRadius: '8px',
                      border: '2px solid var(--border-color)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading
                    ? 'Verifying...'
                    : (isAdminSession ? 'Verify OTP & Enter Admin Console' : 'Verify OTP & Sign In')}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12.5px' }}>
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={() => handleResendOtp(targetEmail, isAdminSession ? 'admin_login' : 'user_login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                      fontWeight: 700,
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      padding: 0
                    }}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : '🔄 Resend OTP Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginOtpStep(false); setLoginOtp(''); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : regOtpStep ? (
            /* USER REGISTRATION OTP SCREEN */
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>📬</div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>
                  Verify Campus Email
                </h1>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Enter the 6-digit real-time verification code sent to <strong>{regData.email}</strong>
                </p>
              </div>

              {/* REAL-TIME EMAIL STATUS BADGE */}
              {!dispatchedRegOtp ? (
                <div
                  style={{
                    background: 'var(--primary-subtle)',
                    border: '1px solid rgba(79, 70, 229, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>📬</span>
                  <div style={{ fontSize: '12.5px', color: 'var(--primary)', lineHeight: 1.4 }}>
                    <strong>Real-Time Code Sent:</strong> Please check your email inbox and spam folder for the registration passcode.
                  </div>
                </div>
              ) : (
                /* Simulation Fallback Badge if EMAIL_PASS is empty in backend/.env */
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                      ⚙️ Dev Notice (EMAIL_PASS not in .env):
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '4px', color: '#b45309' }}>
                      {dispatchedRegOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegOtp(dispatchedRegOtp)}
                    style={{
                      background: '#d97706',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Auto-Fill OTP
                  </button>
                </div>
              )}

              {errorMsg && (
                <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  ✅ {successMsg}
                </div>
              )}

              <form onSubmit={handleVerifyRegisterOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="field">
                  <label htmlFor="reg-otp-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    id="reg-otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={regOtp}
                    onChange={e => setRegOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '22px',
                      fontWeight: 800,
                      textAlign: 'center',
                      letterSpacing: '8px',
                      borderRadius: '8px',
                      border: '2px solid var(--border-color)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px',
                    minHeight: '44px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Confirming...' : 'Verify OTP & Complete Registration'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12.5px' }}>
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={() => handleResendOtp(regData.email, 'user_register')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                      fontWeight: 700,
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      padding: 0
                    }}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : '🔄 Resend OTP Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegOtpStep(false); setRegOtp(''); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    ← Edit Details
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* NORMAL LOGIN / REGISTRATION TABS */
            <>
              <div className="page-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <img
                  src="/apollo-university-transparent.png"
                  alt="The Apollo University"
                  className="auth-apollo-logo"
                  style={{ height: '56px', marginBottom: '12px' }}
                />
                <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0' }}>
                  {tab === 'signin' ? 'Portal Sign In' : 'Create Campus Account'}
                </h1>
                <p className="section-desc" style={{ fontSize: '13.5px', margin: 0 }}>
                  {tab === 'signin'
                    ? 'Enter your credentials to access your account or Admin console'
                    : 'Register with your official student or staff details'}
                </p>
              </div>

              {/* Tabs */}
              <div className="auth-tab-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                <button
                  type="button"
                  className={tab === 'signin' ? 'auth-tab-btn active' : 'auth-tab-btn'}
                  onClick={() => { setTab('signin'); setErrorMsg(''); }}
                  style={{
                    padding: '9px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    background: tab === 'signin' ? 'var(--primary)' : 'var(--bg-muted)',
                    color: tab === 'signin' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={tab === 'register' ? 'auth-tab-btn active' : 'auth-tab-btn'}
                  onClick={() => { setTab('register'); setErrorMsg(''); }}
                  style={{
                    padding: '9px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    background: tab === 'register' ? 'var(--primary)' : 'var(--bg-muted)',
                    color: tab === 'register' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Register
                </button>
              </div>

              {errorMsg && (
                <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  ✅ {successMsg}
                </div>
              )}

              {/* SIGN IN FORM (NO OTP FOR REGULAR USERS, OTP TRIGGERED FOR ADMIN) */}
              {tab === 'signin' ? (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field">
                    <label htmlFor="signin-identifier" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Email, Roll Number, or Admin ID *
                    </label>
                    <input
                      id="signin-identifier"
                      type="text"
                      className="input"
                      placeholder="e.g., student@apollo.edu.in or admin email"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                    />
                  </div>

                  <div className="field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="signin-password" style={{ fontSize: '13px', fontWeight: 600 }}>Password *</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: '4px' }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Enter password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      minHeight: '44px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                /* REGISTRATION FORM (TRIGGERS OTP VERIFICATION FOR USERS) */
                <form onSubmit={handleRegisterInitiate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="field">
                    <label htmlFor="reg-fullname" style={{ fontSize: '13px', fontWeight: 600 }}>Full Name *</label>
                    <input
                      id="reg-fullname"
                      type="text"
                      className="input"
                      placeholder="e.g., Kailash Rajput"
                      required
                      value={regData.fullName}
                      onChange={e => setRegData({ ...regData, fullName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
                    <div className="field">
                      <label htmlFor="reg-role" style={{ fontSize: '13px', fontWeight: 600 }}>Role *</label>
                      <select
                        id="reg-role"
                        className="input"
                        value={regData.role}
                        onChange={e => setRegData({ ...regData, role: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff / Faculty</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="reg-roll" style={{ fontSize: '13px', fontWeight: 600 }}>Roll No / ID</label>
                      <input
                        id="reg-roll"
                        type="text"
                        className="input"
                        placeholder="e.g., 220101001"
                        value={regData.roll}
                        onChange={e => setRegData({ ...regData, roll: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="reg-email" style={{ fontSize: '13px', fontWeight: 600 }}>Campus Email * (OTP will be sent here)</label>
                    <input
                      id="reg-email"
                      type="email"
                      className="input"
                      placeholder="e.g., student@apollo.edu.in"
                      required
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="reg-phone" style={{ fontSize: '13px', fontWeight: 600 }}>Phone Number</label>
                    <input
                      id="reg-phone"
                      type="tel"
                      className="input"
                      placeholder="e.g., 9876543210"
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
                    <div className="field">
                      <label htmlFor="reg-password" style={{ fontSize: '13px', fontWeight: 600 }}>Password *</label>
                      <input
                        id="reg-password"
                        type="password"
                        className="input"
                        placeholder="Min 4 chars"
                        required
                        value={regData.password}
                        onChange={e => setRegData({ ...regData, password: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="reg-confirm-password" style={{ fontSize: '13px', fontWeight: 600 }}>Confirm Password *</label>
                      <input
                        id="reg-confirm-password"
                        type="password"
                        className="input"
                        placeholder="Repeat password"
                        required
                        value={regData.confirmPassword}
                        onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      minHeight: '44px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP & Continue'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </section>
  );
};

export default Login;
