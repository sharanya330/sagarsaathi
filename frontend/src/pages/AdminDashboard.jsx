import React, { useState, useEffect } from 'react';
import LiveMap from '../components/LiveMap';
import { adminApi } from '../utils/adminApi';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [activeView, setActiveView] = useState('trips'); // 'trips' or 'drivers'
    const [liveTrips, setLiveTrips] = useState([]);
    const [liveDrivers, setLiveDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLiveData();
        // Refresh every 10 seconds
        const interval = setInterval(fetchLiveData, 10000);
        return () => clearInterval(interval);
    }, [activeView]);

    const fetchLiveData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (activeView === 'trips') {
                const response = await fetch('/api/trips/live', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('driverToken')}`
                    }
                });
                const data = await response.json();
                setLiveTrips(data.trips || []);
            } else {
                const response = await fetch('/api/drivers/live-locations', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('driverToken')}`
                    }
                });
                const data = await response.json();
                setLiveDrivers(data.drivers || []);
            }
        } catch (err) {
            console.error('Error fetching live data:', err);
            setError('Failed to load live tracking data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>SagarSaathi - Live Tracking Dashboard</h1>
                <div className="view-toggle">
                    <button
                        className={activeView === 'trips' ? 'active' : ''}
                        onClick={() => setActiveView('trips')}
                    >
                        Active Trips ({liveTrips.length})
                    </button>
                    <button
                        className={activeView === 'drivers' ? 'active' : ''}
                        onClick={() => setActiveView('drivers')}
                    >
                        Active Drivers ({liveDrivers.length})
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {error && (
                    <div className="error-banner">
                        {error}
                        <button onClick={fetchLiveData}>Retry</button>
                    </div>
                )}

                {loading && <div className="loading-overlay">Loading...</div>}

                <div className="map-section">
                    <LiveMap
                        trips={activeView === 'trips' ? liveTrips : []}
                        drivers={activeView === 'drivers' ? liveDrivers : []}
                    />
                </div>

                <div className="data-section">
                    {activeView === 'trips' ? (
                        <div className="trips-list">
                            <h2>Active Trips</h2>
                            {liveTrips.length === 0 ? (
                                <p className="empty-state">No active trips at the moment</p>
                            ) : (
                                <div className="trips-grid">
                                    {liveTrips.map(trip => (
                                        <div key={trip._id} className="trip-card">
                                            <div className="trip-header">
                                                <span className={`status-badge ${trip.status.toLowerCase()}`}>
                                                    {trip.status}
                                                </span>
                                                <span className="trip-id">#{trip._id.substring(0, 8)}</span>
                                            </div>
                                            <div className="trip-info">
                                                <p><strong>Driver:</strong> {trip.driver?.name || 'N/A'}</p>
                                                <p><strong>Vehicle:</strong> {trip.driver?.vehicleType || 'N/A'}</p>
                                                <p><strong>From:</strong> {trip.pickUpLocation?.name}</p>
                                                <p><strong>To:</strong> {trip.dropOffLocation?.name}</p>
                                                <p><strong>Started:</strong> {trip.startTime ? new Date(trip.startTime).toLocaleString() : 'Not started'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="drivers-list">
                            <h2>Active Drivers</h2>
                            {liveDrivers.length === 0 ? (
                                <p className="empty-state">No active drivers at the moment</p>
                            ) : (
                                <div className="drivers-grid">
                                    {liveDrivers.map(driver => (
                                        <div key={driver._id} className="driver-card">
                                            <div className="driver-header">
                                                <h3>{driver.name}</h3>
                                                <span className="vehicle-badge">{driver.vehicleType}</span>
                                            </div>
                                            <div className="driver-info">
                                                <p><strong>Last Update:</strong></p>
                                                <p className="timestamp">
                                                    {driver.lastUpdated 
                                                        ? new Date(driver.lastUpdated).toLocaleString()
                                                        : 'No recent update'}
                                                </p>
                                                {driver.location?.coordinates && (
                                                    <p className="coordinates">
                                                        📍 {driver.location.coordinates[1].toFixed(4)}, {driver.location.coordinates[0].toFixed(4)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
