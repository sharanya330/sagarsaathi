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
    const [useOtp, setUseOtp] = useState(false);
    const [otpPhone, setOtpPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');

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

            if (response.data.token) {
                login(response.data.token, { _id: response.data._id, name: response.data.name, email: response.data.email }, 'user');
                navigate('/dashboard');
                setMessage('Login successful! Welcome back.');
                setFormData({ email: '', password: '' });
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const errorMessage = error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : 'Login failed. Server error.';
            setMessage(errorMessage);
            console.error('Login API Error:', error);
        }
    };

    const sendOtp = async () => {
        setMessage('');
        try{
            await api.post('/api/users/otp/send', { phone: otpPhone });
            setMessage('OTP sent (check server logs in dev).');
        }catch(e){
            setMessage(e?.response?.data?.message || 'Failed to send OTP');
        }
    };

    const verifyOtp = async () => {
        setMessage('');
        try{
            const { data } = await api.post('/api/users/otp/verify', { phone: otpPhone, otp: otpCode });
            if (data?.token) {
                login(data.token, { _id: data._id, name: data.name, email: data.email, phone: data.phone }, 'user');
                navigate('/dashboard');
            }
        }catch(e){
            setMessage(e?.response?.data?.message || 'Failed to verify OTP');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>User Login</h2>
            <div style={{marginBottom:10}}>
              <button onClick={()=>setUseOtp(v=>!v)} style={styles.secondaryButton}>{useOtp ? 'Use Password Instead' : 'Login via OTP'}</button>
            </div>
            {!useOtp ? (
              <form onSubmit={onSubmit} style={styles.form}>
                <input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required style={styles.input} />
                <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} minLength="6" required style={styles.input} />
                <button type="submit" disabled={loading} style={styles.button}>{loading ? 'Processing...' : 'Login'}</button>
              </form>
            ) : (
              <div style={styles.form}>
                <input placeholder="Phone" value={otpPhone} onChange={(e)=>setOtpPhone(e.target.value)} style={styles.input} />
                <div style={{display:'flex', gap:8}}>
                  <button onClick={sendOtp} style={styles.button}>Send OTP</button>
                </div>
                <input placeholder="Enter OTP" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} style={styles.input} />
                <button onClick={verifyOtp} style={styles.button}>Verify & Login</button>
              </div>
            )}
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
    secondaryButton: {
        padding: '8px 10px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    message: {
        marginTop: '20px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
};

export default LoginUser;
