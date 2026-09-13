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
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed) return null;

      const uName = (parsed.username || '').toLowerCase();
      if (uName === 'founder' || uName === 'item founder') {
        parsed.username = parsed.username || 'Item Founder';
        parsed.roll = parsed.roll || '122311520136';
        parsed.email = parsed.email || 'founder@apollo.edu.in';
        parsed.phone = parsed.phone || '9078563412';
        parsed.role = parsed.role || 'student';
      } else if (uName === 'claimer' || uName === 'item claimer') {
        parsed.username = parsed.username || 'Item Claimer';
        parsed.roll = parsed.roll || '12223222123';
        parsed.email = parsed.email || 'claimer@apollo.edu.in';
        parsed.phone = parsed.phone || '9898988989';
        parsed.role = parsed.role || 'student';
      }
      return parsed;
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
