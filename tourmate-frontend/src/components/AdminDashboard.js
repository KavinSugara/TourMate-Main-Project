import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startConnection, connection } from '../SignalRService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [guides, setGuides] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const navigate = useNavigate();

    const fetchAllGuides = async () => {
        try {
            const res = await axios.get('http://localhost:5211/api/Guides/admin/all');
            setGuides(res.data);
        } catch (err) {
            console.error("Failed to fetch guides:", err);
        }
    };

    useEffect(() => {
        fetchAllGuides();

        const setupSOS = async () => {
            await startConnection(() => {});
            
            // Real-time SOS monitoring
            connection.on("ReceiveSOSAlert", (data) => {
                setAlerts(prev => [data, ...prev]);
                toast.error(`🚨 CRITICAL: SOS Alert from ${data.touristName}`, { 
                    duration: 10000,
                    position: "top-center"
                });
            });
        };
        setupSOS();

        return () => {
            if (connection) connection.off("ReceiveSOSAlert");
        };
    }, []);

    const handleVerify = async (id, status) => {
        try {
            await axios.patch(`http://localhost:5211/api/Guides/verify/${id}`, status, {
                headers: { 'Content-Type': 'application/json' }
            });
            toast.success(status ? "Guide Approved" : "Verification Revoked");
            fetchAllGuides();
        } catch (err) { 
            toast.error("Update failed"); 
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        toast.success("Logged out from Admin Console");
    };

    return (
        <div style={{ padding: '40px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1a202c' }}>System Administration</h1>
                    <p style={{ color: '#718096', margin: '5px 0 0 0' }}>Security and Verification Oversight</p>
                </div>
                <button 
                    onClick={handleLogout}
                    style={{ padding: '10px 20px', backgroundColor: '#2d3748', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Logout
                </button>
            </div>

            {/* EMERGENCY MONITOR */}
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '2px solid #e53e3e', boxShadow: '0 10px 15px -3px rgba(229, 62, 62, 0.1)' }}>
                <h2 style={{ color: '#e53e3e', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🚨 Active Emergency Monitor ({alerts.length})
                </h2>
                {alerts.length === 0 ? (
                    <p style={{ color: '#718096' }}>All systems normal. No active SOS alerts.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {alerts.map((a, i) => (
                            <div key={i} style={{ padding: '15px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{a.touristName}</span>
                                    <span style={{ margin: '0 10px' }}>assigned to</span>
                                    <span style={{ fontWeight: 'bold' }}>{a.guideName}</span>
                                    <div style={{ fontSize: '0.85rem', color: '#c53030', marginTop: '5px' }}>
                                        📍 GPS Coordinates: {a.latitude.toFixed(6)}, {a.longitude.toFixed(6)}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAlerts(alerts.filter((_, idx) => idx !== i))}
                                    style={{ padding: '8px 15px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Resolve
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* GUIDE VERIFICATION TABLE */}
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h2 style={{ marginTop: 0, color: '#2d3748' }}>Guide Verification Queue</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#718096', borderBottom: '2px solid #edf2f7', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px' }}>Guide Name</th>
                            <th style={{ padding: '12px' }}>License ID</th>
                            <th style={{ padding: '12px' }}>Current Status</th>
                            <th style={{ padding: '12px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guides.map(g => (
                            <tr key={g.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={{ padding: '15px', fontWeight: '600', color: '#2d3748' }}>{g.fullName}</td>
                                <td style={{ padding: '15px', color: '#4a5568', fontFamily: 'monospace' }}>{g.licenseNumber || 'N/A'}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 'bold',
                                        backgroundColor: g.isVerified ? '#f0fff4' : '#fffaf0',
                                        color: g.isVerified ? '#38a169' : '#dd6b20'
                                    }}>
                                        {g.isVerified ? "APPROVED" : "PENDING"}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {!g.isVerified ? (
                                        <button 
                                            onClick={() => handleVerify(g.id, true)} 
                                            style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Verify Guide
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleVerify(g.id, false)} 
                                            style={{ backgroundColor: 'white', color: '#e53e3e', border: '1px solid #e53e3e', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;