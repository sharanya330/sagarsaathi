import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterUser = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, phone, password, confirmPassword } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            // Destructure data to send, excluding confirmPassword
            const { confirmPassword, ...dataToSend } = formData;

const response = await api.post('/api/users/register', dataToSend, config);

            // Assuming successful registration returns a token
if (response.data.token) {
                login(response.data.token, { _id: response.data._id, name: response.data.name, email: response.data.email, phone: response.data.phone }, 'user');
                navigate('/dashboard');
                // In a real app, save the token to localStorage/Context and redirect
                console.log('Registration Successful! Token:', response.data.token);
                setMessage('Registration successful! Redirecting to login...');
                
                // Clear form after success
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                });
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            // Handle specific API errors
            const errorMessage = error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : 'Registration failed. Server error.';
            setMessage(errorMessage);
            console.error('Registration API Error:', error);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>User Registration (Trip Requester)</h2>
            <form onSubmit={onSubmit} style={styles.form}>
                <input
                    type="text"
                    placeholder="Full Name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                    style={styles.input}
                />
                <input
                    type="email"
                    placeholder="Email Address"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    style={styles.input}
                />
                <input
                    type="tel"
                    placeholder="Phone Number"
                    name="phone"
                    value={phone}
                    onChange={onChange}
                    required
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    minLength="6"
                    required
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    minLength="6"
                    required
                    style={styles.input}
                />
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Processing...' : 'Register'}
                </button>
            </form>
            {message && <p style={styles.message}>{message}</p>}
        </div>
    );
};

// Basic inline styles for readability
const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
    },
    button: {
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    message: {
        marginTop: '20px',
        textAlign: 'center',
        color: '#28a745',
        fontWeight: 'bold',
    },
};

export default RegisterUser;