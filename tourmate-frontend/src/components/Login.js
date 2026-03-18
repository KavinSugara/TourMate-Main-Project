import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [creds, setCreds] = useState({ email: '', passwordHash: '' });
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5211/api/auth/login', creds);
            
            // Store user details in localStorage
            localStorage.setItem('userRole', res.data.role);
            localStorage.setItem('userEmail', res.data.email);
            localStorage.setItem('userId', res.data.userId);

            toast.success(`Welcome back, ${res.data.email}!`);

            // ROLE-BASED REDIRECTION LOGIC
            if (res.data.role === 'Admin') {
                // Send system administrators to the Admin Console
                navigate('/admin');
            } else if (res.data.role === 'Guide') {
                // Send professional guides to their Dashboard
                navigate('/guide-dashboard');
            } else {
                // Send tourists to the Discovery Map
                navigate('/map');
            }
            
        } catch (err) {
            console.error("Login error:", err);
            toast.error("Login failed! Please check your email and password.");
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '80vh' 
        }}>
            <div style={{ 
                padding: '30px', 
                maxWidth: '400px', 
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2d3748' }}>Login to TourMate</h2>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Email Address</label>
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                            onChange={e => setCreds({...creds, email: e.target.value})} 
                            required 
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter your password" 
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                            onChange={e => setCreds({...creds, passwordHash: e.target.value})} 
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        Sign In
                    </button>
                </form>
                
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#718096' }}>
                    Don't have an account? <Link to="/signup" style={{ color: '#3182ce', fontWeight: '600', textDecoration: 'none' }}>Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;