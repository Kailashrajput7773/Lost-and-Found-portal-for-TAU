import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  // Tabs: 'signin' | 'register'
  const [tab, setTab] = useState('signin');
  const [isForgotView, setIsForgotView] = useState(false);

  // Sign In state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Helper to get local accounts
  const getStoredAccounts = () => {
    try {
      const accs = localStorage.getItem('apollo_accounts');
      return accs ? JSON.parse(accs) : [];
    } catch {
      return [];
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const input = username.trim();
    const pass = password.trim();

    if (!input || !pass) {
      setErrorMsg('Please enter both your identifier and password.');
      return;
    }

    // Check default admin key
    if (input.toLowerCase() === 'admin' && pass === 'change-me') {
      const adminUser = { username: 'Admin Moderator', role: 'moderator', adminKey: 'change-me' };
      setUser(adminUser);
      navigate('/admin');
      return;
    }

    // Check local accounts
    const accounts = getStoredAccounts();
    const existing = accounts.find(
      a => a.username.toLowerCase() === input.toLowerCase() ||
           a.email.toLowerCase() === input.toLowerCase() ||
           (a.roll && a.roll.toLowerCase() === input.toLowerCase())
    );

    if (existing) {
      if (existing.password === pass) {
        const loggedUser = {
          username: existing.fullName || existing.username,
          roll: existing.roll,
          email: existing.email,
          phone: existing.phone,
          role: existing.role,
          adminKey: existing.role === 'moderator' ? 'change-me' : undefined
        };
        setUser(loggedUser);
        if (existing.role === 'moderator') {
          navigate('/admin');
        } else {
          navigate('/listings');
        }
        return;
      } else {
        setErrorMsg('Incorrect password. Please verify or use Forgot Password.');
        return;
      }
    }

    // If no existing saved account matches, allow login with provided credentials
    const isMod = pass === 'change-me' || input.toLowerCase().includes('admin');
    const newUser = {
      username: input,
      role: isMod ? 'moderator' : 'student',
      adminKey: isMod ? pass : undefined
    };
    setUser(newUser);
    if (isMod) {
      navigate('/admin');
    } else {
      navigate('/listings');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regData.password !== regData.confirmPassword) {
      setErrorMsg('Passwords do not match! Please check and try again.');
      return;
    }

    if (regData.password.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    const accounts = getStoredAccounts();
    const emailExists = accounts.some(a => a.email.toLowerCase() === regData.email.trim().toLowerCase());
    if (emailExists) {
      setErrorMsg('An account with this campus email already exists. Please sign in.');
      return;
    }

    const selectedRole = regData.role === 'staff' ? 'staff' : 'student';

    const newAccount = {
      fullName: regData.fullName.trim(),
      username: regData.fullName.trim(),
      roll: regData.roll.trim(),
      email: regData.email.trim(),
      phone: regData.phone.trim(),
      role: selectedRole,
      password: regData.password,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem('apollo_accounts', JSON.stringify(accounts));

    const loggedUser = {
      username: newAccount.fullName,
      roll: newAccount.roll,
      email: newAccount.email,
      phone: newAccount.phone,
      role: newAccount.role
    };

    setUser(loggedUser);
    setSuccessMsg(`Welcome, ${newAccount.fullName}! Your ${selectedRole === 'staff' ? 'Staff' : 'Student'} account has been created.`);

    setTimeout(() => {
      navigate('/listings');
    }, 900);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (forgotEmail) {
      setForgotSent(true);
    }
  };

  const handleAutoFillDefault = () => {
    setUsername('admin');
    setPassword('change-me');
    setIsForgotView(false);
    setForgotSent(false);
    setTab('signin');
  };

  return (
    <section className="section" style={{ minHeight: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="form-card">
          {/* Top Auth Mode Tabs (Sign In / Create Account) */}
          {!isForgotView && (
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setTab('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="auth-alert-error">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert-success">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {!isForgotView && tab === 'signin' && (
            <>
              <div className="page-header" style={{ marginBottom: '22px' }}>
                <img
                  src="/apollo-university-transparent.png"
                  alt="The Apollo University"
                  className="auth-apollo-logo"
                />
                <h1 className="page-title" style={{ fontSize: '26px' }}>Sign In to Portal</h1>
                <p className="section-desc">Access student reports, listings, or admin moderation desk</p>
              </div>

              <form onSubmit={handleLogin} className="form-grid">
                <div className="field">
                  <label>Username / Roll No. / Campus Email</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., admin, 122311520135, or student@apollo.edu.in"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="field-header">
                    <label>Password / Admin Key</label>
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => {
                        setIsForgotView(true);
                        setForgotSent(false);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="password-input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Default admin key: change-me"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-submit" style={{ marginTop: '8px' }}>
                  Sign In to Portal
                </button>
              </form>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="forgot-link"
                  style={{ display: 'inline', fontSize: '13.5px' }}
                  onClick={() => {
                    setTab('register');
                    setErrorMsg('');
                  }}
                >
                  Create an account
                </button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                🔑 Default staff key: <code style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>change-me</code>
              </div>
            </>
          )}

          {/* VIEW 2: CREATE ACCOUNT */}
          {!isForgotView && tab === 'register' && (
            <>
              <div className="page-header" style={{ marginBottom: '22px' }}>
                <img
                  src="/apollo-university-transparent.png"
                  alt="The Apollo University"
                  className="auth-apollo-logo"
                />
                <h1 className="page-title" style={{ fontSize: '26px' }}>Create Campus Account</h1>
                <p className="section-desc">Join Apollo University's safe return & recovery community</p>
              </div>

              <form onSubmit={handleRegister} className="form-grid">
                <div className="field">
                  <label>I am a</label>
                  <div className="role-selector">
                    <button
                      type="button"
                      className={`role-pill ${regData.role === 'student' ? 'active' : ''}`}
                      onClick={() => setRegData({ ...regData, role: 'student' })}
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      className={`role-pill ${regData.role === 'staff' ? 'active' : ''}`}
                      onClick={() => setRegData({ ...regData, role: 'staff' })}
                    >
                      👔 Campus Staff
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Kailash Rajput"
                    required
                    value={regData.fullName}
                    onChange={e => setRegData({ ...regData, fullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="field">
                    <label>{regData.role === 'student' ? 'Student Roll Number *' : 'Employee / Staff ID *'}</label>
                    <input
                      type="text"
                      className="input"
                      placeholder={regData.role === 'student' ? 'e.g., 122311520135' : 'e.g., TAU-EMP-4091'}
                      required
                      value={regData.roll}
                      onChange={e => setRegData({ ...regData, roll: e.target.value })}
                    />
                    {regData.role === 'student' && regData.roll && /^\d{10,12}$/.test(regData.roll.trim()) && (
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-emerald)', marginTop: '4px', fontWeight: 600 }}>
                        ✓ Valid Apollo University Roll Number
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="e.g., 9876543210"
                      required
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>{regData.role === 'student' ? 'Student Email (@apollo.edu.in) *' : 'Staff Email (@apollo.edu.in) *'}</label>
                  <input
                    type="email"
                    className="input"
                    placeholder={regData.role === 'student' ? 'e.g., student@apollo.edu.in' : 'e.g., staff@apollo.edu.in'}
                    required
                    value={regData.email}
                    onChange={e => setRegData({ ...regData, email: e.target.value })}
                  />
                  {(regData.email.toLowerCase().includes('@apollo.edu.in') || regData.email.toLowerCase().includes('@tau.edu.in')) && (
                    <div style={{ fontSize: '12px', color: 'var(--brand-emerald)', marginTop: '5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🎓</span> Verified The Apollo University Institutional Domain
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="field">
                    <label>Password *</label>
                    <div className="password-input-group">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Min 4 chars"
                        required
                        value={regData.password}
                        onChange={e => setRegData({ ...regData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                      >
                        {showRegPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label>Confirm Password *</label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Confirm"
                      required
                      value={regData.confirmPassword}
                      onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" style={{ marginTop: '8px' }}>
                  Create Account & Sign In
                </button>
              </form>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Already registered?{' '}
                <button
                  type="button"
                  className="forgot-link"
                  style={{ display: 'inline', fontSize: '13.5px' }}
                  onClick={() => {
                    setTab('signin');
                    setErrorMsg('');
                  }}
                >
                  Sign in here
                </button>
              </div>
            </>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {isForgotView && (
            <>
              <div className="page-header" style={{ marginBottom: '24px' }}>
                <img
                  src="/apollo-university-transparent.png"
                  alt="The Apollo University"
                  className="auth-apollo-logo"
                />
                <h1 className="page-title" style={{ fontSize: '26px' }}>Forgot Password</h1>
                <p className="section-desc">
                  Reset your credentials or retrieve campus access keys
                </p>
              </div>

              {!forgotSent ? (
                <form onSubmit={handleForgotSubmit} className="form-grid">
                  <div className="field">
                    <label>Registered Staff / Student Email or Username</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., welfare@apollo.edu.in or roll number"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                    />
                  </div>

                  <div className="forgot-info-box">
                    <strong>💡 Quick Campus Access Note:</strong>
                    <p style={{ margin: '6px 0 0 0' }}>
                      For testing or moderator access, the system default admin key is <code>change-me</code>.
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                      Campus Helpline: +91 877 228 8888 • support@apollo.edu.in
                    </p>
                  </div>

                  <button type="submit" className="btn-submit" style={{ marginTop: '6px' }}>
                    Send Recovery Request
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={handleAutoFillDefault}
                  >
                    Auto-Fill Default Key & Sign In
                  </button>

                  <button
                    type="button"
                    className="forgot-link"
                    style={{ textAlign: 'center', marginTop: '8px' }}
                    onClick={() => {
                      setIsForgotView(false);
                      setTab('signin');
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '42px' }}>📨</div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-heading)' }}>
                    Recovery Instructions Sent!
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    If an account matches <strong>{forgotEmail}</strong>, password reset instructions have been dispatched.
                  </p>
                  <div className="forgot-info-box" style={{ textAlign: 'left' }}>
                    <strong>Default Campus Key:</strong>
                    <div style={{ marginTop: '4px' }}>
                      You can log in right away using key: <code>change-me</code>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-submit"
                    onClick={handleAutoFillDefault}
                  >
                    Log In with Default Key
                  </button>

                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setIsForgotView(false);
                      setForgotSent(false);
                      setTab('signin');
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;
