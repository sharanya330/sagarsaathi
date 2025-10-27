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
  const [useOtp, setUseOtp] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

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
      <div style={{marginBottom:10}}>
        <button onClick={()=>setUseOtp(v=>!v)} style={styles.secondaryButton}>{useOtp ? 'Use Password Instead' : 'Login via OTP'}</button>
      </div>
      {!useOtp ? (
        <form onSubmit={onSubmit} style={styles.form}>
          <input style={styles.input} type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} required />
          <input style={styles.input} type="password" name="password" placeholder="Password" value={formData.password} onChange={onChange} required />
          <button style={styles.button} type="submit" disabled={loading}>{loading ? 'Processing...' : 'Login'}</button>
        </form>
      ) : (
        <div style={styles.form}>
          <input style={styles.input} name="phone" placeholder="Phone" value={otpPhone} onChange={(e)=>setOtpPhone(e.target.value)} />
          <div style={{display:'flex', gap:8}}>
            <button style={styles.button} onClick={async()=>{ try{ await api.post('/api/drivers/otp/send', { phone: otpPhone }); setMessage('OTP sent (check server logs in dev).'); }catch(e){ setMessage(e?.response?.data?.message || 'Failed to send OTP'); } }}>Send OTP</button>
          </div>
          <input style={styles.input} name="otp" placeholder="Enter OTP" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} />
          <button style={styles.button} onClick={async()=>{ try{ const { data } = await api.post('/api/drivers/otp/verify', { phone: otpPhone, otp: otpCode }); if (data?.token) { login(data.token, { _id: data._id, name: data.name, email: data.email, phone: data.phone }, 'driver'); navigate('/driver/dashboard'); } }catch(e){ setMessage(e?.response?.data?.message || 'Failed to verify OTP'); } }}>Verify & Login</button>
        </div>
      )}
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
  message: { marginTop: 12, textAlign: 'center' },
  secondaryButton: { padding: 8, background: '#6c757d', color: '#fff', border: 0, borderRadius: 4 }
};

export default DriverLogin;