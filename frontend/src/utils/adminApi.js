import axios from 'axios';

const adminApi = axios.create({ baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:8000', headers: { 'Content-Type': 'application/json' }});

adminApi.interceptors.request.use((config)=>{
  const t = localStorage.getItem('adminToken');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default adminApi;
