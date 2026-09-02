import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const adminKey = "change-me"; // Note: For a real app, you'd retrieve this securely or use a proper auth token.

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
        alert("Unauthorized! Redirecting to login...");
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
      alert("Error updating item");
    }
  };

  const handleDelete = async (id) => {
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
        <h1 className="page-title">Admin Dashboard</h1>
        {loading ? <p>Loading...</p> : (
          <table className="table" style={{width: '100%', marginTop: '2rem', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--border)'}}>
                <th style={{padding: '1rem', textAlign: 'left'}}>Type</th>
                <th style={{padding: '1rem', textAlign: 'left'}}>Name</th>
                <th style={{padding: '1rem', textAlign: 'left'}}>Status</th>
                <th style={{padding: '1rem', textAlign: 'left'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} style={{borderBottom: '1px solid var(--border)'}}>
                  <td style={{padding: '1rem'}}>{item.type.toUpperCase()}</td>
                  <td style={{padding: '1rem'}}>{item.name}</td>
                  <td style={{padding: '1rem'}}>{item.approved ? 'Approved' : 'Pending'}</td>
                  <td style={{padding: '1rem'}}>
                    <button className="btn" style={{marginRight: '0.5rem', padding: '0.5rem 1rem'}} onClick={() => handleModerate(item._id, !item.approved)}>
                      {item.approved ? 'Revoke' : 'Approve'}
                    </button>
                    <button className="btn secondary" style={{padding: '0.5rem 1rem'}} onClick={() => handleDelete(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default Admin;
