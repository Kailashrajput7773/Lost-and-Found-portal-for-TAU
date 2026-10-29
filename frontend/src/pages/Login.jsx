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

  // Forgot Password State
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'verify' | 'reset'
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  // Check URL params for admin redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('redirect') === '/admin') {
      setIdentifier(ADMIN_EMAIL);
      setTab('signin');
    }
  }, []);

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
        setSuccessMsg(`A fresh real-time OTP has been dispatched to ${email}`);
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend OTP. Please try again in a few moments.');
    }
  };

  // 5. FORGOT & RESET PASSWORD HANDLERS
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    const idInput = forgotIdentifier.trim();
    if (!idInput) {
      setErrorMsg('Please enter your campus email or roll number.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/forgot-password', { identifier: idInput });
      if (res.data.ok) {
        setForgotEmail(res.data.email);
        setForgotStep('verify');
        setSuccessMsg(res.data.message || `A verification code was dispatched to ${res.data.email}`);
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to dispatch reset code. Please check your identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    const code = forgotOtp.trim();
    if (!code || code.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/verify-reset-otp', {
        email: forgotEmail,
        otp: code
      });
      if (res.data.ok) {
        setForgotStep('reset');
        setSuccessMsg(res.data.message || 'Code verified! Please create your new password.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp.trim(),
        newPassword: newPassword.trim()
      });

      if (res.data.ok) {
        setSuccessMsg(res.data.message || 'Password reset successfully! You can now sign in.');
        setForgotMode(false);
        setForgotStep('request');
        setForgotOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTab('signin');
        setIdentifier(forgotEmail);
        setPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (resendCooldown > 0 || !forgotEmail) return;
    setErrorMsg('');
    setSuccessMsg('Dispatching fresh password reset code...');
    try {
      const res = await api.post('/api/auth/forgot-password', { identifier: forgotEmail });
      if (res.data.ok) {
        setSuccessMsg(`A fresh reset code has been sent to ${forgotEmail}`);
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend reset code.');
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
          ) : forgotMode ? (
            /* FORGOT & RESET PASSWORD WORKFLOW */
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>
                  {forgotStep === 'reset' ? '🛡️' : forgotStep === 'verify' ? '📬' : '🔑'}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>
                  {forgotStep === 'reset'
                    ? 'Set New Password'
                    : forgotStep === 'verify'
                    ? 'Verify Security Code'
                    : 'Reset Your Password'}
                </h1>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {forgotStep === 'reset'
                    ? 'Identity confirmed. Enter and confirm your new secure password.'
                    : forgotStep === 'verify'
                    ? <>A 6-digit verification code was sent to <strong style={{ color: 'var(--text-body)', wordBreak: 'break-all' }}>{forgotEmail}</strong></>
                    : 'Enter your registered campus email or roll number to receive a 6-digit verification code.'}
                </p>
              </div>

              {/* Status Badge during Verify step */}
              {forgotStep === 'verify' && (
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
                    <strong>Check your Email Inbox:</strong> We've dispatched a password reset OTP. Check your Spam folder if not received in 30 seconds.
                  </div>
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

              {/* STEP 1: Enter email or roll number */}
              {forgotStep === 'request' && (
                <form onSubmit={handleForgotRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field">
                    <label htmlFor="forgot-identifier" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Campus Email or Roll Number *
                    </label>
                    <input
                      id="forgot-identifier"
                      type="text"
                      className="input"
                      placeholder="e.g., student@apollo.edu.in or 12231152..."
                      required
                      autoFocus
                      value={forgotIdentifier}
                      onChange={e => setForgotIdentifier(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
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
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(false);
                        setForgotStep('request');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify 6-digit OTP */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleForgotVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field">
                    <label htmlFor="forgot-otp-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Enter 6-Digit Verification Code *
                    </label>
                    <input
                      id="forgot-otp-input"
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
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
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12.5px' }}>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendForgotOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                        fontWeight: 700,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        padding: 0
                      }}
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : '🔄 Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('request');
                        setForgotOtp('');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                    >
                      ← Edit Email
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Enter New Password */}
              {forgotStep === 'reset' && (
                <form onSubmit={handleForgotResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="forgot-new-password" style={{ fontSize: '13px', fontWeight: 600 }}>New Password *</label>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: '4px' }}
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      id="forgot-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Minimum 4 characters"
                      required
                      autoFocus
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="forgot-confirm-password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Confirm New Password *
                    </label>
                    <input
                      id="forgot-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Re-enter your new password"
                      required
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', minHeight: '44px' }}
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
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    {loading ? 'Saving New Password...' : 'Save New Password'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(false);
                        setForgotStep('request');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                    >
                      ← Cancel and Back to Sign In
                    </button>
                  </div>
                </form>
              )}
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

              {/* SIGN IN FORM (DIRECT ADMIN LOGIN FOR lostportalhub@gmail.com) */}
              {tab === 'signin' ? (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      background: identifier.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-muted)',
                      border: identifier.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? '1px solid var(--primary)' : '1px dashed var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>
                      🛡️ Campus Admin Access:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier(ADMIN_EMAIL);
                        setErrorMsg('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '12px'
                      }}
                    >
                      {identifier.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? '✓ lostportalhub@gmail.com selected' : 'Use Admin Email'}
                    </button>
                  </div>

                  <div className="field">
                    <label htmlFor="signin-identifier" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Email, Roll Number, or Admin Email *
                    </label>
                    <input
                      id="signin-identifier"
                      type="text"
                      className="input"
                      placeholder="e.g., student@apollo.edu.in or lostportalhub@gmail.com"
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(true);
                        setForgotStep('request');
                        setForgotIdentifier(identifier || '');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 0'
                      }}
                    >
                      Forgot password?
                    </button>
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
