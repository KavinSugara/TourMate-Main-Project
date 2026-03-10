import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
    const [user, setUser] = useState({ email: '', passwordHash: '', userRole: 'Tourist' });

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5211/api/auth/register', user);
            alert("Registration successful! You can now log in.");
        } catch (err) {
            alert("Registration failed: " + err.response?.data?.message || err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px' }}>
            <h2>Create Account</h2>
            <form onSubmit={handleSignup}>
                <input type="email" placeholder="Email" style={{ width: '100%', marginBottom: '10px' }}
                    onChange={e => setUser({...user, email: e.target.value})} required />
                <input type="password" placeholder="Password" style={{ width: '100%', marginBottom: '10px' }}
                    onChange={e => setUser({...user, passwordHash: e.target.value})} required />
                <select style={{ width: '100%', marginBottom: '10px' }}
                    onChange={e => setUser({...user, userRole: e.target.value})}>
                    <option value="Tourist">I am a Tourist</option>
                    <option value="Guide">I am a Guide</option>
                </select>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Signup;