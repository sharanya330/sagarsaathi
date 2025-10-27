import React, { useState } from 'react';
import adminApi from '../../utils/adminApi';

export default function AdminLogin(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try{
      const { data } = await adminApi.post('/api/admin/login', { email, password });
      if (data?.token) {
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin';
      }
    }catch(e){ setMsg(e?.response?.data?.message || 'Login failed'); }
  };

  return (
    <div style={{maxWidth:400, margin:'40px auto', padding:20}}>
      <h2>Admin Login</h2>
      <form onSubmit={submit} style={{display:'grid', gap:10}}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      {msg && <p style={{color:'#dc3545'}}>{msg}</p>}
    </div>
  );
}
