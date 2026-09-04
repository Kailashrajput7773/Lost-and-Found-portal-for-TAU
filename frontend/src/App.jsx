import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import Listings from './pages/Listings';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apollo_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('apollo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('apollo_user');
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <Navbar theme={theme} toggleTheme={toggleTheme} user={user} setUser={setUser} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report-lost" element={<ReportLost user={user} />} />
          <Route path="/report-found" element={<ReportFound user={user} />} />
          <Route path="/listings" element={<Listings user={user} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/admin" element={<Admin user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
