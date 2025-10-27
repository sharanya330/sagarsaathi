import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function MyTrips(){
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get('/api/trips/my');
        setTrips(data?.trips || []);
      }catch(e){
        setError(e?.response?.data?.message || 'Failed to load trips');
      }finally{
        setLoading(false);
      }
    })();
  },[]);

  if (loading) return <div style={{padding:20}}>Loading...</div>;
  if (error) return <div style={{padding:20, color:'#dc3545'}}>{error}</div>;

  const cancelTrip = async (id) => {
    try {
      await api.put(`/api/trips/${id}/cancel`, { reason: 'User cancelled from app' });
      setTrips((prev) => prev.map(t => t._id === id ? { ...t, status: 'CANCELLED' } : t));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const shareLink = async (id) => {
    try{
      const { data } = await api.post(`/api/trips/${id}/share`);
      const url = `${window.location.origin}/share/${data?.token}`;
      window.prompt('Share this public tracking link:', url);
    }catch(e){
      alert(e?.response?.data?.message || 'Failed to generate link');
    }
  };

  return (
    <div style={{maxWidth:800, margin:'20px auto', padding:20}}>
      <h2>My Trips</h2>
      {trips.length === 0 ? <p>No trips yet.</p> : (
        <ul>
          {trips.map(t => (
            <li key={t._id} style={{marginBottom:10, display:'flex', gap:8, alignItems:'center'}}>
              <span><strong>{t.status}</strong> — {t.pickUpLocation?.name} → {t.dropOffLocation?.name} &nbsp; <small>(id: {t._id})</small></span>
              {t.status === 'REQUESTED' && (
                <button onClick={() => cancelTrip(t._id)} style={{marginLeft:8}}>Cancel</button>
              )}
              {(t.status === 'ON_TRIP' || t.status === 'SOS_ACTIVE' || t.status === 'ACCEPTED') && (
                <>
                  <a href={`/track/${t._id}`} style={{marginLeft:8}}>Track</a>
                  <button onClick={()=>shareLink(t._id)} style={{marginLeft:8}}>Share link</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}