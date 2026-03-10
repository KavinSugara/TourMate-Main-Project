import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [creds, setCreds] = useState({ email: '', passwordHash: '' });
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5211/api/auth/login', creds);
            localStorage.setItem('userRole', res.data.role);
            localStorage.setItem('userEmail', res.data.email);
            localStorage.setItem('userId', res.data.userId);

            if (res.data.role === 'Guide') {
                navigate('/guide-dashboard');
            } else {
                navigate('/map');
            }
        } catch (err) {
            alert("Login failed! Check your credentials.");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" style={{ width: '100%', marginBottom: '10px' }}
                    onChange={e => setCreds({...creds, email: e.target.value})} required />
                <input type="password" placeholder="Password" style={{ width: '100%', marginBottom: '10px' }}
                    onChange={e => setCreds({...creds, passwordHash: e.target.value})} required />
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
            
            <p style={{ marginTop: '15px' }}>
                Don't have an account? <Link to="/signup">Create Account</Link>
            </p>
        </div>
    );
};

export default Login;