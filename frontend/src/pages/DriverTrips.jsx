import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function DriverTrips(){
  const [assigned, setAssigned] = useState([]);
  const [requested, setRequested] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [a, r] = await Promise.all([
        api.get('/api/trips/assigned'),
        api.get('/api/trips/requested'),
      ]);
      setAssigned(a.data?.trips || []);
      setRequested(r.data?.trips || []);
      setError('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load trips');
    }
  };

  useEffect(()=>{ load(); },[]);

  const post = async (id, action) => {
    try {
      await api.patch(`/api/trips/${id}/${action}`);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || `Failed to ${action} trip`);
    }
  };

  const accept = async (id) => {
    if (!id) return;
    await post(id, 'accept');
  };

  return (
    <div style={{maxWidth:900, margin:'20px auto', padding:20}}>
      <h2>Driver Trips</h2>
      {error && <p style={{color:'#dc3545'}}>{error}</p>}

      <section style={{marginTop:16}}>
        <h3>Requested Trips</h3>
        {requested.length === 0 ? <p>None available.</p> : (
          <ul>
            {requested.map(t => (
              <li key={t._id} style={{marginBottom:10, display:'flex', gap:8, alignItems:'center'}}>
                <span>{t.pickUpLocation?.name} → {t.dropOffLocation?.name} (status {t.status})</span>
                <button onClick={()=>accept(t._id)}>Accept</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{marginTop:24}}>
        <h3>Assigned (Active)</h3>
        {assigned.length === 0 ? <p>No active trips.</p> : (
          <ul>
            {assigned.map(t => (
              <li key={t._id} style={{marginBottom:10}}>
                <div><strong>{t.status}</strong> — {t.pickUpLocation?.name} → {t.dropOffLocation?.name}</div>
                <div style={{display:'flex', gap:8, marginTop:6}}>
                  {t.status === 'ACCEPTED' && (
                    <>
                      <button onClick={()=>post(t._id,'start')}>Start</button>
                      <button onClick={()=>post(t._id,'driver_cancel')}>Cancel</button>
                    </>
                  )}
                  {t.status === 'ON_TRIP' && (
                    <button onClick={()=>post(t._id,'end')}>End</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}