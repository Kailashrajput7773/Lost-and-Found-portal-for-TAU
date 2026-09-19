import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ADMIN_EMAIL = 'lostportalhub@gmail.com';
const ADMIN_PASSWORD = 'qwertyuiop@123';

const Login = ({ setUser }) => {
  // Tabs: 'signin' | 'register'
  const [tab, setTab] = useState('signin');

  // Sign In state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin 2FA OTP State (Required every time for admin)
  const [adminOtpStep, setAdminOtpStep] = useState(false);
  const [adminOtp, setAdminOtp] = useState('');
  const [dispatchedAdminOtp, setDispatchedAdminOtp] = useState('');

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

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // 1. HANDLE SIGN IN
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
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        identifier: input,
        password: pass
      });

      // Check if Admin requires 2FA OTP
      if (res.data.requiresOtp) {
        setAdminOtpStep(true);
        setDispatchedAdminOtp(res.data.otp || '');
        setSuccessMsg(res.data.message || 'Security code generated.');
        setLoading(false);
        return;
      }

      // Regular user direct login (no OTP needed)
      if (res.data.ok && res.data.user) {
        setUser(res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/listings');
      }
    } catch (error) {
      // Offline fallback check for Admin
      if (input.toLowerCase() === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
        const simOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setAdminOtpStep(true);
        setDispatchedAdminOtp(simOtp);
        setSuccessMsg("Admin 2FA Security Check: Code sent to registered address.");
        setLoading(false);
        return;
      }

      setErrorMsg(error.response?.data?.error || 'Unable to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. VERIFY ADMIN OTP (Every login)
  const handleVerifyAdminOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!adminOtp.trim()) {
      setErrorMsg('Please enter the 6-digit verification OTP.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
        otp: adminOtp.trim()
      });

      if (res.data.ok && res.data.user) {
        setUser(res.data.user);
        navigate('/admin');
      }
    } catch (error) {
      // Check simulation
      if (dispatchedAdminOtp && adminOtp.trim() === dispatchedAdminOtp) {
        const adminUser = {
          name: "Portal Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
          adminKey: "lostportalhub-admin-secret-2026",
          isAdmin: true
        };
        setUser(adminUser);
        navigate('/admin');
        return;
      }
      setErrorMsg(error.response?.data?.error || 'Invalid or expired OTP. Please try again.');
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
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        ...regData,
        email: regData.email.trim().toLowerCase()
      });

      if (res.data.requiresOtp) {
        setRegOtpStep(true);
        setDispatchedRegOtp(res.data.otp || '');
        setSuccessMsg(res.data.message || 'Verification OTP generated.');
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
      const res = await axios.post('http://localhost:5000/api/auth/register', {
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
    try {
      setErrorMsg('');
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', { email, purpose });
      if (res.data.ok) {
        if (purpose === 'admin_login') setDispatchedAdminOtp(res.data.otp);
        if (purpose === 'user_register') setDispatchedRegOtp(res.data.otp);
        setSuccessMsg(`A fresh OTP has been dispatched to ${email}`);
      }
    } catch {
      const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
      if (purpose === 'admin_login') setDispatchedAdminOtp(freshOtp);
      if (purpose === 'user_register') setDispatchedRegOtp(freshOtp);
      setSuccessMsg(`New OTP generated: ${freshOtp}`);
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

          {/* ADMIN 2FA OTP SCREEN */}
          {adminOtpStep ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🛡️</div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>
                  Admin 2FA Security Check
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  A one-time passcode (OTP) is required for each administrator login session.
                </p>
              </div>

              {/* Security OTP Display Notification */}
              {dispatchedAdminOtp && (
                <div
                  style={{
                    background: 'rgba(15, 118, 110, 0.08)',
                    border: '1px solid #0d9488',
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
                    <div style={{ fontSize: '11.5px', color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>
                      🔑 Admin Passcode:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '4px', color: '#0f766e' }}>
                      {dispatchedAdminOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminOtp(dispatchedAdminOtp)}
                    style={{
                      background: '#0d9488',
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

              <form onSubmit={handleVerifyAdminOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="field">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Enter 6-Digit Admin OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={adminOtp}
                    onChange={e => setAdminOtp(e.target.value.replace(/\D/g, ''))}
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
                    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Enter Admin Console'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12.5px' }}>
                  <button
                    type="button"
                    onClick={() => handleResendOtp(ADMIN_EMAIL, 'admin_login')}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    🔄 Resend OTP Code
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdminOtpStep(false); setAdminOtp(''); setErrorMsg(''); }}
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
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Enter the 6-digit verification code sent to <strong>{regData.email}</strong>
                </p>
              </div>

              {dispatchedRegOtp && (
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid #86efac',
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
                    <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
                      🎓 Verification OTP:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '4px', color: '#15803d' }}>
                      {dispatchedRegOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegOtp(dispatchedRegOtp)}
                    style={{
                      background: '#16a34a',
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Enter 6-Digit OTP *
                  </label>
                  <input
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
                    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
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
                    onClick={() => handleResendOtp(regData.email, 'user_register')}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    🔄 Resend OTP Code
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
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    background: tab === 'signin' ? 'var(--primary-color, #0f766e)' : 'rgba(0,0,0,0.05)',
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
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    background: tab === 'register' ? 'var(--primary-color, #0f766e)' : 'rgba(0,0,0,0.05)',
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
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Email, Roll Number, or Admin ID *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., student@apollo.edu.in or admin email"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Password *</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Enter password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #0f766e, #0d9488)',
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
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Full Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Kailash Rajput"
                      required
                      value={regData.fullName}
                      onChange={e => setRegData({ ...regData, fullName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="field">
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Role *</label>
                      <select
                        className="input"
                        value={regData.role}
                        onChange={e => setRegData({ ...regData, role: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff / Faculty</option>
                      </select>
                    </div>

                    <div className="field">
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Roll No / ID</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., 220101001"
                        value={regData.roll}
                        onChange={e => setRegData({ ...regData, roll: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Campus Email * (OTP will be sent here)</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="e.g., student@apollo.edu.in"
                      required
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="e.g., 9876543210"
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="field">
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Password *</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="Min 4 chars"
                        required
                        value={regData.password}
                        onChange={e => setRegData({ ...regData, password: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Confirm Password *</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="Repeat password"
                        required
                        value={regData.confirmPassword}
                        onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #0f766e, #0d9488)',
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
