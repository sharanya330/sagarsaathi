import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Dashboard(){
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(()=>{
    (async()=>{
      try {
        const { data } = await api.get('/api/users/me');
        setMe(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      }
    })();
  },[]);

  if (error) return <div style={{padding:20,color:'#dc3545'}}>{error}</div>;
  if (!me) return <div style={{padding:20}}>Loading...</div>;

return (
    <div style={{padding:20}}>
      <h2>Welcome, {me.name}</h2>
      <p>Email: {me.email}</p>
      <p>Phone: {me.phone}</p>
      <div style={{marginTop:16, display:'flex', gap:12}}>
        <a href="/create-trip">Create Trip</a>
        <a href="/trips/my">My Trips</a>
      </div>
    </div>
  );
}