import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function CreateTrip(){
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickUpName: '', pickUpLat: '', pickUpLng: '',
    dropOffName: '', dropOffLat: '', dropOffLng: '',
    tripDistanceKm: '', estimatedPrice: ''
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setLoading(true);
    try {
      const payload = {
        pickUpName: form.pickUpName,
        pickUpCoords: { latitude: parseFloat(form.pickUpLat), longitude: parseFloat(form.pickUpLng) },
        dropOffName: form.dropOffName,
        dropOffCoords: { latitude: parseFloat(form.dropOffLat), longitude: parseFloat(form.dropOffLng) },
        tripDistanceKm: Number(form.tripDistanceKm),
        estimatedPrice: Number(form.estimatedPrice),
      };
      const { data } = await api.post('/api/trips', payload);
      setMsg(data?.message || 'Trip requested.');
      navigate('/trips/my');
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:600, margin:'30px auto', padding:20}}>
      <h2>Create Trip</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <input name="pickUpName" placeholder="Pickup Name" value={form.pickUpName} onChange={onChange} required />
        <div style={{display:'flex', gap:8}}>
          <input name="pickUpLat" placeholder="Pickup Lat" value={form.pickUpLat} onChange={onChange} required />
          <input name="pickUpLng" placeholder="Pickup Lng" value={form.pickUpLng} onChange={onChange} required />
        </div>
        <input name="dropOffName" placeholder="Dropoff Name" value={form.dropOffName} onChange={onChange} required />
        <div style={{display:'flex', gap:8}}>
          <input name="dropOffLat" placeholder="Dropoff Lat" value={form.dropOffLat} onChange={onChange} required />
          <input name="dropOffLng" placeholder="Dropoff Lng" value={form.dropOffLng} onChange={onChange} required />
        </div>
        <div style={{display:'flex', gap:8}}>
          <input name="tripDistanceKm" placeholder="Distance (km)" value={form.tripDistanceKm} onChange={onChange} required />
          <input name="estimatedPrice" placeholder="Estimated Price" value={form.estimatedPrice} onChange={onChange} required />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Request Trip'}</button>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
    </div>
  );
}