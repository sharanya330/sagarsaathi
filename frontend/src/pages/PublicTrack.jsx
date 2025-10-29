import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PublicTrack(){
  const { token } = useParams();
  const [last, setLast] = useState(null);
  const [error, setError] = useState('');

  const fetchLast = useCallback(async () => {
    try{
      const { data } = await axios.get(`/api/trips/public/${token}/last_location`);
      setLast(data?.lastLocation || null);
      setError('');
    }catch(e){
      setError(e?.response?.data?.message || 'Failed to fetch location');
    }
  }, [token]);

  useEffect(()=>{ fetchLast(); const t=setInterval(fetchLast,10000); return ()=>clearInterval(t); },[fetchLast]);

  return (
    <div style={{maxWidth:600, margin:'20px auto', padding:20}}>
      <h2>Live Tracking (Public)</h2>
      <p>Share token: {token}</p>
      {error && <p style={{color:'#dc3545'}}>{error}</p>}
      {last ? (
        <div>
          <p><strong>Last seen:</strong> {new Date(last.timestamp || Date.now()).toLocaleString()}</p>
          <p><strong>Coords:</strong> {last.coords?.coordinates?.[1]}, {last.coords?.coordinates?.[0]}</p>
        </div>
      ) : (
        <p>No location recorded yet.</p>
      )}
      <button onClick={fetchLast}>Refresh</button>
    </div>
  );
}