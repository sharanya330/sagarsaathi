// Axios instance with environment-based base URL
import axios from 'axios';

// Prefer CRA env var, fallback to local Docker backend on 5001
const BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: auto-logout on 401/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
    return Promise.reject(err);
  }
);

export default api;
