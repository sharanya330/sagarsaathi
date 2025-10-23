import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginUser = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        setLoading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

const response = await api.post('/api/users/login', formData, config);

            // Assuming successful login returns a token
if (response.data.token) {
                login(response.data.token, { _id: response.data._id, name: response.data.name, email: response.data.email }, 'user');
                navigate('/dashboard');
                // In a real app, save the token to localStorage or Context
                console.log('Login Successful! Token:', response.data.token);
                setMessage('Login successful! Welcome back.');
                
                // Clear form and redirect to dashboard later
                setFormData({ email: '', password: '' });
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            // Handle specific API errors (Invalid email or password)
            const errorMessage = error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : 'Login failed. Server error.';
            setMessage(errorMessage);
            console.error('Login API Error:', error);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>User Login</h2>
            <form onSubmit={onSubmit} style={styles.form}>
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
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    minLength="6"
                    required
                    style={styles.input}
                />
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Processing...' : 'Login'}
                </button>
            </form>
            {message && <p style={{...styles.message, color: message.includes('successful') ? '#28a745' : '#dc3545'}}>{message}</p>}
        </div>
    );
};

// Reusing styles from the registration form for consistency
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
        fontWeight: 'bold',
    },
};

export default LoginUser;
