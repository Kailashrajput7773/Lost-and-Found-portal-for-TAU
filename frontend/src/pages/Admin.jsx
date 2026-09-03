import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const adminKey = user?.adminKey || "change-me";

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/items', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.data.ok) setItems(res.data.items);
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Admin key required! Redirecting to login...");
        navigate('/login');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id, approved) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/moderate/${id}`, { approved }, {
        headers: { 'x-admin-key': adminKey }
      });
      fetchItems();
    } catch (error) {
      alert("Error updating item status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/delete/${id}`, {
        headers: { 'x-admin-key': adminKey }
      });
      fetchItems();
    } catch (error) {
      alert("Error deleting item");
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="section-title">Admin Moderation Dashboard</h1>
            <p className="section-desc">Review submitted student listings, approve public catalog entries, or delete reports</p>
          </div>
          <button className="btn-primary-pill" onClick={fetchItems}>
            🔄 Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading dashboard data...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
            No items submitted yet.
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const itemId = item._id || item.id;
                  return (
                    <tr key={itemId}>
                      <td>
                        <span className={`pill ${item.type === 'found' ? 'pill-found' : 'pill-lost'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td>📍 {item.location}</td>
                      <td>
                        <div>{item.name} ({item.contact})</div>
                        {item.roll && <small style={{ color: 'var(--text-muted)' }}>Roll: {item.roll}</small>}
                      </td>
                      <td>
                        <span className="pill" style={{
                          background: item.approved ? 'var(--tag-found-bg)' : 'var(--tag-lost-bg)',
                          color: item.approved ? 'var(--tag-found-text)' : 'var(--tag-lost-text)',
                          border: `1px solid ${item.approved ? 'var(--tag-found-border)' : 'var(--tag-lost-border)'}`
                        }}>
                          {item.approved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-action-sm btn-approve"
                          style={{ marginRight: '8px' }}
                          onClick={() => handleModerate(itemId, !item.approved)}
                        >
                          {item.approved ? 'Revoke' : 'Approve'}
                        </button>
                        <button
                          className="btn-action-sm btn-delete"
                          onClick={() => handleDelete(itemId)}
                        >
                          Delete
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
    </section>
  );
};

export default Admin;
