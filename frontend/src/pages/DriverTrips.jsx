import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function LocationStreamer({ active }){
  useEffect(()=>{
    if(!active) return;
    let watchId = null;
    const send = (lat, lng) => api.put('/api/drivers/location', { latitude: lat, longitude: lng }).catch(()=>{});
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos)=>{
        send(pos.coords.latitude, pos.coords.longitude);
      }, ()=>{}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    }
    const iv = setInterval(()=>{
      // fallback ping in case geolocation fails; no-op if watchPosition is working
    }, 15000);
    return ()=>{ if (watchId) navigator.geolocation.clearWatch(watchId); clearInterval(iv); };
  },[active]);
  return null;
}

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

  // Handle Stripe return
  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    const paid = p.get('paid');
    const tripId = p.get('tripId');
    const sessionId = p.get('session_id');
    if (paid === '1' && tripId && sessionId) {
      (async()=>{
        try { await api.get(`/api/payments/lead_fee/confirm`, { params: { session_id: sessionId, tripId } }); await load(); } catch(e) {}
      })();
    }
  },[]);

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
                {/* Stream driver GPS while ON_TRIP */}
                <LocationStreamer active={t.status === 'ON_TRIP'} />
                <div style={{display:'flex', gap:8, marginTop:6}}>
                  {t.status === 'ACCEPTED' && (
                    <>
                      <button onClick={async()=>{
                        try{
                          // Prefer Stripe if configured; fallback to dev paid
                          const { data } = await api.post(`/api/payments/lead_fee/create_session`, { tripId: t._id });
                          if (data?.url) { window.location.assign(data.url); return; }
                          // Fallback dev
                          await api.post(`/api/trips/${t._id}/lead_fee/dev_paid`);
                          alert('Lead fee paid (dev). You can now reveal contact.');
                        }catch(e){ alert(e?.response?.data?.message || 'Lead fee payment failed'); }
                      }}>Pay Lead Fee</button>
                      <button onClick={async()=>{
                        try{
                          const { data } = await api.get(`/api/trips/${t._id}/contact`);
                          if (data.paid) alert(`Contact: ${data.name} — ${data.phone}`);
                          else alert(data.message + ` Masked: ${data.maskedPhone}`);
                        }catch(e){ alert(e?.response?.data?.message || 'Failed to fetch contact'); }
                      }}>Reveal Contact</button>
                      <button onClick={()=>post(t._id,'start')}>Start</button>
                      <button onClick={()=>post(t._id,'driver_cancel')}>Cancel</button>
                    </>
                  )}
                  {t.status === 'ON_TRIP' && (
                    <>
                      <button onClick={()=>post(t._id,'end')}>End</button>
                      <button onClick={async()=>{
                        try{ await api.post(`/api/trips/${t._id}/sos`, { latitude: null, longitude: null }); alert('SOS triggered.'); }catch(e){ alert(e?.response?.data?.message || 'Failed to trigger SOS'); }
                      }}>SOS</button>
                    </>
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
