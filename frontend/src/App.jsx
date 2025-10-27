import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterUser from './pages/RegisterUser';
import LoginUser from './pages/LoginUser'; // New Import
import DriverRegister from './pages/DriverRegister';
import DriverLogin from './pages/DriverLogin';
import Home from './pages/Home'; 
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import DriverTrips from './pages/DriverTrips';
import Track from './pages/Track';
import PublicTrack from './pages/PublicTrack';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

const styles = {
  header: {
    backgroundColor: '#343a40',
    padding: '15px 20px',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    marginLeft: '20px',
    fontSize: '16px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  }
};

function ProtectedRoute({ children, role: requiredRole }) {
  const { token, role } = useAuth();
  if (!token) return <div style={{padding:20}}>Not authorized. Please <a href="/login">login</a>.</div>;
  if (requiredRole && role !== requiredRole) return <div style={{padding:20}}>Forbidden. Wrong role.</div>;
  return children;
}

function App() {
return (
    <AuthProvider>
    <Router>
      <header style={styles.header}>
        <div style={styles.logo}>SagarSaathi</div>
        <nav>
          <Link to="/" style={styles.navLink}>Home</Link>
          <Link to="/register" style={styles.navLink}>Register</Link>
          <Link to="/login" style={styles.navLink}>Login</Link>
          <Link to="/driver/register" style={styles.navLink}>Driver Register</Link>
          <Link to="/driver/login" style={styles.navLink}>Driver Login</Link>
          <Link to="/driver/trips" style={styles.navLink}>Driver Trips</Link>
        </nav>
      </header>
      
      <main>
        <Routes>
          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/login" element={<LoginUser />} />
          <Route path="/dashboard" element={<ProtectedRoute role="user"><Dashboard /></ProtectedRoute>} />
          <Route path="/create-trip" element={<ProtectedRoute role="user"><CreateTrip /></ProtectedRoute>} />
          <Route path="/trips/my" element={<ProtectedRoute role="user"><MyTrips /></ProtectedRoute>} />
          <Route path="/track/:id" element={<ProtectedRoute role="user"><Track /></ProtectedRoute>} />
          <Route path="/share/:token" element={<PublicTrack />} />
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/dashboard" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
          <Route path="/driver/trips" element={<ProtectedRoute role="driver"><DriverTrips /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
    </AuthProvider>
  );
}

export default App;
