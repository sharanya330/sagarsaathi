import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

export default function Track(){
  const { id } = useParams();
  const [last, setLast] = useState(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(true);

  const fetchLast = async () => {
    try{
      const { data } = await api.get(`/api/trips/${id}/last_location`);
      setLast(data?.lastLocation || null);
      setError('');
    }catch(e){
      setError(e?.response?.data?.message || 'Failed to fetch location');
    }
  };

  useEffect(()=>{ fetchLast(); },[id]);
  useEffect(()=>{
    if(!polling) return;
    const t = setInterval(fetchLast, 10000);
    return () => clearInterval(t);
  },[polling, id]);

  const shareUrl = `${window.location.origin}/track/${id}`;

  return (
    <div style={{maxWidth:600, margin:'20px auto', padding:20}}>
      <h2>Live Tracking</h2>
      <p>Trip ID: {id}</p>
      <div style={{marginBottom:12}}>
        <input style={{width:'100%'}} readOnly value={shareUrl} onFocus={(e)=>e.target.select()} />
        <small>Share this link with trusted contacts.</small>
      </div>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button onClick={fetchLast}>Refresh</button>
        <button onClick={()=>setPolling(p=>!p)}>{polling?'Pause Auto-Refresh':'Resume Auto-Refresh'}</button>
      </div>
      {error && <p style={{color:'#dc3545'}}>{error}</p>}
      {last ? (
        <div>
          <p><strong>Last seen:</strong> {new Date(last.timestamp || Date.now()).toLocaleString()}</p>
          <p><strong>Coords:</strong> {last.coords?.coordinates?.[1]}, {last.coords?.coordinates?.[0]}</p>
        </div>
      ) : (
        <p>No location recorded yet.</p>
      )}
    </div>
  );
}