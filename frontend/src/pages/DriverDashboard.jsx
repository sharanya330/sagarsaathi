import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function DriverDashboard(){
  const { role, logout } = useAuth();
  const [me, setMe] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get('/api/drivers/me');
        setMe(data);
      }catch(e){
        setError(e?.response?.data?.message || 'Failed to load driver profile');
      }
    })();
  },[]);

  return (
    <div style={{padding:20}}>
      <h2>Driver Dashboard</h2>
      <p>Role: {role}</p>
      {error && <p style={{color:'#dc3545'}}>{error}</p>}
      {me ? (
        <>
          <p>Name: {me.name}</p>
          <p>Email: {me.email}</p>
          <p>Phone: {me.phone}</p>
          <p>Verified: {String(me.isVerified)}</p>
          <p>Active: {String(me.isActive)}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
