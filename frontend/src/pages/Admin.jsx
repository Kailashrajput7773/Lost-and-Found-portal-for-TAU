import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = ({ user }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    allegationUsers: 0,
    foundUsers: 0,
    bannedUsers: 0,
    totalItems: 0,
    lostItems: 0,
    foundItems: 0
  });

  const [usersList, setUsersList] = useState([]);
  const [allegationsList, setAllegationsList] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  const [currentTab, setCurrentTab] = useState('users');
  const [userFilter, setUserFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const navigate = useNavigate();
  const adminKey = user?.adminKey || "lostportalhub-admin-secret-2026";

  useEffect(() => {
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      navigate('/login');
      return;
    }
    fetchAllAdminData();
    const interval = setInterval(fetchAllAdminData, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAllAdminData = async () => {
    try {
      const config = { headers: { 'x-admin-key': adminKey } };
      const [statsRes, usersRes, allegationsRes, itemsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/analytics', config).catch(() => ({ data: { ok: false } })),
        axios.get('http://localhost:5000/api/admin/users', config).catch(() => ({ data: { ok: false } })),
        axios.get('http://localhost:5000/api/admin/allegations', config).catch(() => ({ data: { ok: false } })),
        axios.get('http://localhost:5000/api/admin/items', config).catch(() => ({ data: { ok: false } }))
      ]);

      if (statsRes.data.ok) setStats(statsRes.data.stats);
      if (usersRes.data.ok) setUsersList(usersRes.data.users);
      if (allegationsRes.data.ok) setAllegationsList(allegationsRes.data.allegations);
      if (itemsRes.data.ok) setItemsList(itemsRes.data.items);
    } catch (err) {
      console.error("Admin fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (targetUser) => {
    const shouldBan = !targetUser.isBanned;
    const confirmText = shouldBan
      ? `Are you sure you want to BAN user "${targetUser.name || targetUser.email}"? They will be blocked from submitting posts or logging in.`
      : `Are you sure you want to UNBAN user "${targetUser.name || targetUser.email}"?`;

    if (!window.confirm(confirmText)) return;

    setActionLoading(targetUser.id);
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/admin/users/${targetUser.id}/ban`,
        { isBanned: shouldBan, banReason: shouldBan ? "Policy violation" : "" },
        { headers: { 'x-admin-key': adminKey } }
      );

      if (res.data.ok) {
        setUsersList(prev =>
          prev.map(u => u.id === targetUser.id ? { ...u, isBanned: shouldBan } : u)
        );
        fetchAllAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error updating ban status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Permanently delete this campus listing?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/delete/${itemId}`, {
        headers: { 'x-admin-key': adminKey }
      });
      fetchAllAdminData();
    } catch (err) {
      alert("Error deleting listing");
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.roll && u.roll.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (userFilter === 'online') return u.isOnline;
    if (userFilter === 'reported') return (u.reportsReceived > 0 || (u.allegations && u.allegations.length > 0));
    if (userFilter === 'banned') return u.isBanned;
    return true;
  });

  return (
    <section className="section" style={{ minHeight: '88vh', background: 'var(--bg-main)' }}>
      <div className="container">

        {/* ADMIN TOP BANNER */}
        <div
          style={{
            background: 'linear-gradient(135deg, #042f2e 0%, #115e59 50%, #0d9488 100%)',
            borderRadius: '16px',
            padding: '24px 30px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Campus Admin Control Center
              </h1>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Live Supervision
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '13.5px' }}>
              Logged in as <strong>lostportalhub@gmail.com</strong> • Full Portal Oversight &amp; User Moderation
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={fetchAllAdminData}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* 4 PRIMARY METRIC CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '28px'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(15, 118, 110, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}
            >
              👥
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Users
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered students &amp; staff</div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid #86efac',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 10px rgba(34, 197, 94, 0.08)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}
            >
              🟢
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>
                Active Online Now
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d' }}>
                {stats.activeUsers}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Browsing or active within 5m</div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid #fca5a5',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.08)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}
            >
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>
                Reported / Allegations
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#b91c1c' }}>
                {stats.allegationUsers}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Flagged accounts under review</div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}
            >
              🤝
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>
                Found Contributors
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#1d4ed8' }}>
                {stats.foundUsers}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Students returned found items</div>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '10px'
          }}
        >
          <button
            onClick={() => setCurrentTab('users')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: currentTab === 'users' ? 'var(--primary-color, #0f766e)' : 'transparent',
              color: currentTab === 'users' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>👥</span> Users &amp; Live Activity ({usersList.length})
          </button>

          <button
            onClick={() => setCurrentTab('allegations')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: currentTab === 'allegations' ? 'var(--primary-color, #0f766e)' : 'transparent',
              color: currentTab === 'allegations' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🚨</span> Allegation Reports ({allegationsList.length})
          </button>

          <button
            onClick={() => setCurrentTab('items')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: currentTab === 'items' ? 'var(--primary-color, #0f766e)' : 'transparent',
              color: currentTab === 'items' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📦</span> All Listings ({itemsList.length})
          </button>
        </div>

        {/* TAB 1: USERS & ACTIVITY */}
        {currentTab === 'users' && (
          <div className="admin-table-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setUserFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)',
                    background: userFilter === 'all' ? '#0f766e' : 'transparent',
                    color: userFilter === 'all' ? '#fff' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  All Users ({usersList.length})
                </button>
                <button
                  onClick={() => setUserFilter('online')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: '1px solid #86efac',
                    background: userFilter === 'online' ? '#16a34a' : 'transparent',
                    color: userFilter === 'online' ? '#fff' : '#15803d',
                    cursor: 'pointer'
                  }}
                >
                  🟢 Online ({usersList.filter(u => u.isOnline).length})
                </button>
                <button
                  onClick={() => setUserFilter('reported')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: '1px solid #fca5a5',
                    background: userFilter === 'reported' ? '#dc2626' : 'transparent',
                    color: userFilter === 'reported' ? '#fff' : '#b91c1c',
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Allegations ({usersList.filter(u => u.reportsReceived > 0 || (u.allegations && u.allegations.length > 0)).length})
                </button>
                <button
                  onClick={() => setUserFilter('banned')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: '1px solid #6b7280',
                    background: userFilter === 'banned' ? '#374151' : 'transparent',
                    color: userFilter === 'banned' ? '#fff' : '#4b5563',
                    cursor: 'pointer'
                  }}
                >
                  ⛔ Banned ({usersList.filter(u => u.isBanned).length})
                </button>
              </div>

              <input
                type="text"
                placeholder="🔍 Search user by name, email, or roll..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  width: '260px'
                }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading user directory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No users found matching current filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>User Details</th>
                      <th style={{ padding: '12px 8px' }}>Role / Roll No</th>
                      <th style={{ padding: '12px 8px' }}>Online Status</th>
                      <th style={{ padding: '12px 8px' }}>Activity (Posts)</th>
                      <th style={{ padding: '12px 8px' }}>Allegations / Reports</th>
                      <th style={{ padding: '12px 8px' }}>Account State</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: u.isBanned ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                              {u.name || 'Unnamed User'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {u.email}
                            </div>
                            {u.phone && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                📱 {u.phone}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                background: u.role === 'staff' ? '#e0e7ff' : '#f1f5f9',
                                color: u.role === 'staff' ? '#3730a3' : '#334155'
                              }}
                            >
                              {u.role === 'staff' ? '👨‍🏫 Staff' : '🎓 Student'}
                            </span>
                            {u.roll && (
                              <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
                                Roll: <strong>{u.roll}</strong>
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 8px' }}>
                            {u.isOnline ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}
                              >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                                Online Now
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                ⚪ Offline
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>
                              Total: {u.totalItems || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              🟢 Found: {u.foundItems || 0} | 🔴 Lost: {u.lostItems || 0}
                            </div>
                          </td>

                          <td style={{ padding: '12px 8px' }}>
                            {u.reportsReceived > 0 ? (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  border: '1px solid #f87171',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                ⚠️ {u.reportsReceived} Report{u.reportsReceived > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#16a34a' }}>
                                ✅ Clear (0)
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 8px' }}>
                            {u.isBanned ? (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: '#7f1d1d',
                                  color: '#fff',
                                  fontSize: '11.5px',
                                  fontWeight: 800
                                }}
                              >
                                ⛔ BANNED
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontSize: '11.5px',
                                  fontWeight: 700
                                }}
                              >
                                Active
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleBan(u)}
                              disabled={actionLoading === u.id}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                border: 'none',
                                background: u.isBanned ? '#16a34a' : '#dc2626',
                                color: '#fff',
                                transition: 'all 0.2s ease',
                                boxShadow: u.isBanned
                                  ? '0 2px 6px rgba(22, 163, 74, 0.3)'
                                  : '0 2px 6px rgba(220, 38, 38, 0.3)'
                              }}
                            >
                              {actionLoading === u.id
                                ? 'Processing...'
                                : u.isBanned
                                ? '🔓 Unban User'
                                : '⛔ Ban User'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALLEGATIONS */}
        {currentTab === 'allegations' && (
          <div className="admin-table-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>
              🚨 User Allegation &amp; Suspicious Activity Reports
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Investigate reports filed by students regarding fake items, harassment, fraud, or false ownership claims.
            </p>

            {allegationsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                🎉 No complaints or allegations filed yet. Campus environment is safe!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {allegationsList.map(al => (
                  <div
                    key={al._id || al.id}
                    style={{
                      border: '1px solid #fca5a5',
                      background: 'rgba(254, 242, 242, 0.5)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '15px' }}>
                          Reason: {al.reason}
                        </span>
                        <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          Status: {al.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-color)' }}>
                        <strong>Reported Account:</strong> {al.reportedUserName} ({al.reportedUserEmail})
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <strong>Reported By:</strong> {al.reportedByName} ({al.reportedByEmail}) • {new Date(al.createdAt).toLocaleString()}
                      </div>
                      {al.details && (
                        <div style={{ fontSize: '12.5px', marginTop: '6px', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fed7d7' }}>
                          💬 "{al.details}"
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        onClick={() => {
                          const target = usersList.find(u => (u.email || '').toLowerCase() === (al.reportedUserEmail || '').toLowerCase());
                          if (target) handleToggleBan(target);
                          else alert('User record not found in registered accounts list.');
                        }}
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ⛔ Ban Target Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LISTINGS */}
        {currentTab === 'items' && (
          <div className="admin-table-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>
              📦 Live Campus Listings Directory
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Items are published automatically upon user submission. Admin can remove inappropriate or spam posts here.
            </p>

            {itemsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No active listings found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Type</th>
                      <th style={{ padding: '10px' }}>Item Title</th>
                      <th style={{ padding: '10px' }}>Category &amp; Location</th>
                      <th style={{ padding: '10px' }}>Submitted By</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map(item => {
                      const itemId = item._id || item.id;
                      return (
                        <tr key={itemId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px' }}>
                            <span className={`pill ${item.type === 'found' ? 'pill-found' : 'pill-lost'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>
                            {item.name}
                            <div style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                              {item.desc}
                            </div>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div>{item.category}</div>
                            <small style={{ color: 'var(--text-muted)' }}>📍 {item.location}</small>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div>{item.contact}</div>
                            {item.roll && <small style={{ color: 'var(--text-muted)' }}>Roll: {item.roll}</small>}
                          </td>
                          <td style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {item.date}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button
                              className="btn-action-sm btn-delete"
                              onClick={() => handleDeleteItem(itemId)}
                              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '5px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              🗑️ Remove Listing
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

export default Admin;
