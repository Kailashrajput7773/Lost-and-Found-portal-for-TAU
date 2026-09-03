import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      setUser({ username, adminKey: password }); // Simplified login mechanism for this demo
      navigate('/admin');
    }
  };

  return (
    <section className="section">
      <div className="container" style={{maxWidth: '400px'}}>
        <div className="page-header">
          <h1 className="page-title">Admin Login</h1>
        </div>
        <form className="form" onSubmit={handleLogin}>
          <div className="field">
            <label>Username</label>
            <input type="text" className="input" required value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>Password (Admin Key)</label>
            <input type="password" className="input" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn" style={{width: '100%'}}>Login</button>
        </form>
      </div>
    </section>
  );
};

export default Login;
