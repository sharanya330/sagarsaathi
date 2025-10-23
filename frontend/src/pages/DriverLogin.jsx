import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DriverLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/drivers/login', formData);
      if (data?.token) {
        login(data.token, { _id: data._id, name: data.name, email: data.email, phone: data.phone }, 'driver');
        navigate('/driver/dashboard');
      }
    } catch (e) {
      setMessage(e?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Driver Login</h2>
      <form onSubmit={onSubmit} style={styles.form}>
        <input style={styles.input} type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} required />
        <input style={styles.input} type="password" name="password" placeholder="Password" value={formData.password} onChange={onChange} required />
        <button style={styles.button} type="submit" disabled={loading}>{loading ? 'Processing...' : 'Login'}</button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: { maxWidth: '400px', margin: '50px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 },
  header: { textAlign: 'center', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column' },
  input: { padding: 10, marginBottom: 12, borderRadius: 4, border: '1px solid #ddd' },
  button: { padding: 12, background: '#0d6efd', color: '#fff', border: 0, borderRadius: 4 },
  message: { marginTop: 12, textAlign: 'center' }
};

export default DriverLogin;