import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterUser from './pages/RegisterUser';
import LoginUser from './pages/LoginUser'; // New Import
import Home from './pages/Home'; 

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

function App() {
  return (
    <Router>
      <header style={styles.header}>
        <div style={styles.logo}>SagarSaathi</div>
        <nav>
          <Link to="/" style={styles.navLink}>Home</Link>
          <Link to="/register" style={styles.navLink}>Register</Link>
          <Link to="/login" style={styles.navLink}>Login</Link>
        </nav>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/login" element={<LoginUser />} /> {/* Route to LoginUser Component */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;
