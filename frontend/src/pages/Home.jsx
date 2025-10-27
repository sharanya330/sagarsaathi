import React from 'react';
import { Link } from 'react-router-dom';

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px',
        fontFamily: 'Georgia, serif',
    },
    hero: {
        textAlign: 'center',
        marginBottom: '60px',
    },
    title: {
        fontSize: '48px',
        color: '#2c3e50',
        marginBottom: '20px',
        fontWeight: 'bold',
    },
    tagline: {
        fontSize: '24px',
        color: '#7f8c8d',
        fontStyle: 'italic',
        marginBottom: '40px',
    },
    description: {
        fontSize: '18px',
        lineHeight: '1.8',
        color: '#555',
        maxWidth: '700px',
        margin: '0 auto 40px',
    },
    buttonContainer: {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '40px',
    },
    button: {
        padding: '15px 30px',
        fontSize: '18px',
        fontWeight: '600',
        borderRadius: '8px',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        border: 'none',
        cursor: 'pointer',
    },
    primaryButton: {
        backgroundColor: '#e8a537',
        color: 'white',
    },
    secondaryButton: {
        backgroundColor: '#2c3e50',
        color: 'white',
    },
    features: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        marginTop: '60px',
    },
    featureCard: {
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        textAlign: 'center',
    },
    featureIcon: {
        fontSize: '40px',
        marginBottom: '15px',
    },
    featureTitle: {
        fontSize: '20px',
        color: '#2c3e50',
        marginBottom: '10px',
        fontWeight: 'bold',
    },
    featureText: {
        fontSize: '16px',
        color: '#666',
        lineHeight: '1.6',
    }
};

const Home = () => {
    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <h1 style={styles.title}>SagarSaathi</h1>
                <p style={styles.tagline}>Where every journey feels like home</p>
                <p style={styles.description}>
                    Experience reliable, multi-day, long-distance outstation travel with pre-vetted owner-drivers. 
                    Your safety and comfort are our top priorities.
                </p>
                
                <div style={styles.buttonContainer}>
                    <Link to="/register" style={{...styles.button, ...styles.primaryButton}}>
                        Register as User
                    </Link>
                    <Link to="/login" style={{...styles.button, ...styles.secondaryButton}}>
                        Login
                    </Link>
                    <Link to="/driver/register" style={{...styles.button, ...styles.secondaryButton}}>
                        Register as Driver
                    </Link>
                </div>
            </div>

            <div style={styles.features}>
                <div style={styles.featureCard}>
                    <div style={styles.featureIcon}>🔒</div>
                    <h3 style={styles.featureTitle}>Verified Drivers</h3>
                    <p style={styles.featureText}>
                        All drivers are thoroughly vetted with document verification and background checks.
                    </p>
                </div>
                
                <div style={styles.featureCard}>
                    <div style={styles.featureIcon}>📍</div>
                    <h3 style={styles.featureTitle}>Live Tracking</h3>
                    <p style={styles.featureText}>
                        Track your journey in real-time with shareable links for family peace of mind.
                    </p>
                </div>
                
                <div style={styles.featureCard}>
                    <div style={styles.featureIcon}>🚨</div>
                    <h3 style={styles.featureTitle}>SOS Support</h3>
                    <p style={styles.featureText}>
                        In-app emergency button with immediate alert to our support team.
                    </p>
                </div>
                
                <div style={styles.featureCard}>
                    <div style={styles.featureIcon}>🗺️</div>
                    <h3 style={styles.featureTitle}>Custom Itineraries</h3>
                    <p style={styles.featureText}>
                        Plan multi-stop, multi-day trips tailored to your travel needs.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
