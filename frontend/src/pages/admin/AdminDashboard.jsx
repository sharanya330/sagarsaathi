import React, { useEffect, useState } from 'react';
import adminApi from '../../utils/adminApi';

export default function AdminDashboard(){
  const [drivers, setDrivers] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [sosTrips, setSosTrips] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try{
      const [d, a, s] = await Promise.all([
        adminApi.get('/api/admin/drivers'),
        adminApi.get('/api/admin/trips/active'),
        adminApi.get('/api/admin/trips/sos'),
      ]);
      setDrivers(d.data?.drivers || []);
      setActiveTrips(a.data?.trips || []);
      setSosTrips(s.data?.trips || []);
    }catch(e){ setMsg(e?.response?.data?.message || 'Failed to load admin data'); }
  };

  useEffect(()=>{ load(); },[]);

  const toggleVerify = async (id, isVerified) => {
    try{ await adminApi.put(`/api/admin/drivers/${id}/verify`, { isVerified }); await load(); }catch(e){ alert('Failed'); }
  };
  const toggleActive = async (id, isActive) => {
    try{ await adminApi.put(`/api/admin/drivers/${id}/verify`, { isActive }); await load(); }catch(e){ alert('Failed'); }
  };
  const resolveSos = async (id) => {
    try{ await adminApi.post(`/api/admin/trips/${id}/resolve_sos`); await load(); }catch(e){ alert('Failed'); }
  };

  return (
    <div style={{maxWidth:1100, margin:'20px auto', padding:20}}>
      <h2>Admin Dashboard</h2>
      {msg && <p style={{color:'#dc3545'}}>{msg}</p>}

      <section style={{marginTop:16}}>
        <h3>Drivers</h3>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr><th align="left">Name</th><th>Email</th><th>Phone</th><th>Verified</th><th>Active</th><th>Strikes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {drivers.map(d=> (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.email}</td>
                <td>{d.phone}</td>
                <td>{String(d.isVerified)}</td>
                <td>{String(d.isActive)}</td>
                <td>{d.strikeCount||0}</td>
                <td style={{display:'flex', gap:6}}>
                  <button onClick={()=>toggleVerify(d._id, !d.isVerified)}>{d.isVerified?'Unverify':'Verify'}</button>
                  <button onClick={()=>toggleActive(d._id, !d.isActive)}>{d.isActive?'Suspend':'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{marginTop:24}}>
        <h3>Active Trips</h3>
        <ul>
          {activeTrips.map(t=> (
            <li key={t._id}>
              <strong>{t.status}</strong> — {t.pickUpLocation?.name} → {t.dropOffLocation?.name} — Last fix: {t.locationHistory?.length ? new Date(t.locationHistory[t.locationHistory.length-1].timestamp).toLocaleString() : 'N/A'}
            </li>
          ))}
        </ul>
      </section>

      <section style={{marginTop:24}}>
        <h3>SOS Alerts</h3>
        <ul>
          {sosTrips.length===0 ? <li>None</li> : sosTrips.map(t=> (
            <li key={t._id}>
              <span>SOS — {t.pickUpLocation?.name} → {t.dropOffLocation?.name}</span>
              <button onClick={()=>resolveSos(t._id)} style={{marginLeft:8}}>Resolve</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
