import React, { useState, useEffect } from 'react';
import '../styles/AvailabilityCalendar.css';

const AvailabilityCalendar = ({ driverId = null, isDriverView = false }) => {
    const [availabilityRanges, setAvailabilityRanges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        isAvailable: true,
        reason: ''
    });

    useEffect(() => {
        if (driverId) {
            fetchAvailability();
        }
    }, [driverId]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/drivers/availability/${driverId}`);
            const data = await response.json();
            setAvailabilityRanges(data.availabilityRanges || []);
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.startDate || !formData.endDate) {
            alert('Please select both start and end dates');
            return;
        }

        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            alert('Start date must be before end date');
            return;
        }

        try {
            const response = await fetch('/api/drivers/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('driverToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                setAvailabilityRanges(data.availabilityRanges);
                setFormData({
                    startDate: '',
                    endDate: '',
                    isAvailable: true,
                    reason: ''
                });
                setShowAddForm(false);
                alert('Availability updated successfully!');
            } else {
                throw new Error('Failed to update availability');
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            alert('Failed to update availability. Please try again.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysDifference = (start, end) => {
        const diffTime = new Date(end) - new Date(start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // Include both start and end day
    };

    return (
        <div className="availability-calendar">
            <div className="calendar-header">
                <h2>Availability Calendar</h2>
                {isDriverView && (
                    <button 
                        className="btn-add-availability"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? 'Cancel' : '+ Add Availability'}
                    </button>
                )}
            </div>

            {showAddForm && isDriverView && (
                <div className="availability-form-card">
                    <h3>Set Availability Period</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleChange}
                                />
                                <span>Available for trips</span>
                            </label>
                            <p className="help-text">
                                Uncheck this if you want to block this period (e.g., for maintenance or personal leave)
                            </p>
                        </div>

                        {!formData.isAvailable && (
                            <div className="form-group">
                                <label>Reason (Optional)</label>
                                <input
                                    type="text"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    placeholder="e.g., Vehicle maintenance, Personal leave"
                                />
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="btn-submit">
                                Save Availability
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="availability-list">
                {loading ? (
                    <p className="loading-text">Loading availability...</p>
                ) : availabilityRanges.length === 0 ? (
                    <p className="empty-state">
                        {isDriverView 
                            ? 'No availability set yet. Add your first availability period above.'
                            : 'No availability information available for this driver.'}
                    </p>
                ) : (
                    <div className="availability-items">
                        {availabilityRanges
                            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                            .map((range, index) => (
                                <div 
                                    key={index} 
                                    className={`availability-item ${range.isAvailable ? 'available' : 'unavailable'}`}
                                >
                                    <div className="availability-dates">
                                        <div className="date-badge">
                                            <span className="date-label">From</span>
                                            <span className="date-value">{formatDate(range.startDate)}</span>
                                        </div>
                                        <div className="date-separator">→</div>
                                        <div className="date-badge">
                                            <span className="date-label">To</span>
                                            <span className="date-value">{formatDate(range.endDate)}</span>
                                        </div>
                                    </div>
                                    <div className="availability-meta">
                                        <span className={`status-pill ${range.isAvailable ? 'available' : 'blocked'}`}>
                                            {range.isAvailable ? '✓ Available' : '✕ Blocked'}
                                        </span>
                                        <span className="duration-badge">
                                            {getDaysDifference(range.startDate, range.endDate)} days
                                        </span>
                                    </div>
                                    {range.reason && (
                                        <div className="availability-reason">
                                            <strong>Reason:</strong> {range.reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
