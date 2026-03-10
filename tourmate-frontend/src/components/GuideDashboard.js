import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startConnection, connection } from '../SignalRService';
const GuideDashboard = () => {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();

    const [isOnline, setIsOnline] = useState(false);
    const [notifications, setNotifications] = useState([]); 
    const [profile, setProfile] = useState({ 
        fullName: '', 
        licenseNumber: '', 
        category: 'National',
        specialization: '',
        baseRate: '' 
    });

    useEffect(() => {
        const initializeSignalR = async () => {
            await startConnection((data) => {
                console.log("🔔 SignalR Data Received in Dashboard:", data);
                
                if (data.guideId && data.guideId.toString() === userId.toString()) {
                    setNotifications(prev => [data, ...prev]);
                    alert(`New Booking Request from ${data.touristName}!`);
                } else {
                    console.log("ℹ️ Notification skipped: Not for this guide.");
                }
            });
        };
        initializeSignalR();
    }, [userId]);

    const handleResponse = async (touristEmail, accepted) => {
        try {
            await connection.invoke("RespondToBooking", touristEmail, profile.fullName, accepted);
            
            setNotifications(prev => prev.filter(n => n.touristName !== touristEmail));
            
            alert(`You have ${accepted ? "Accepted" : "Declined"} the request.`);
        } catch (err) {
            console.error("Error sending response via SignalR:", err);
            alert("Failed to send response. Check connection.");
        }
    };

    useEffect(() => {
        const fetchCurrentStatus = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Guides/update/${userId}`);
                if (res.data) {
                    setIsOnline(res.data.isAvailable);
                    setProfile({
                        fullName: res.data.fullName || '',
                        licenseNumber: res.data.licenseNumber || '',
                        category: res.data.category || 'National',
                        specialization: res.data.specialization || '',
                        baseRate: res.data.baseRate || ''
                    });
                }
            } catch (err) {
                console.log("Initial fetch failed.");
            }
        };
        fetchCurrentStatus();
    }, [userId]);

    const toggleAvailability = async () => {
        const processToggle = async (status) => {
            try {
                await axios({
                    method: 'patch',
                    url: `http://localhost:5211/api/Guides/toggle-availability/${userId}`,
                    data: JSON.stringify(status), 
                    headers: { 'Content-Type': 'application/json' }
                });
                setIsOnline(status);
                alert(status ? "You are now visible to tourists!" : "You are now offline.");
            } catch (err) {
                alert("Failed to update visibility status.");
            }
        };

        if (!isOnline) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await axios.put(`http://localhost:5211/api/Guides/update-location/${userId}`, {
                            latitude,
                            longitude
                        });
                        await processToggle(true);
                    } catch (err) {
                        alert("Could not save your location.");
                    }
                },
                () => alert("Please enable location services to go online.")
            );
        } else {
            await processToggle(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await axios.put(`http://localhost:5211/api/Guides/update/${userId}`, profile);
            alert("Professional profile updated successfully!");
        } catch (err) {
            alert("Update failed.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <button onClick={handleLogout} style={{ float: 'right', padding: '10px' }}>Logout</button>
            <h1>Guide Control Center</h1>
            
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h3>Welcome, {userEmail}!</h3>
                
                <div style={{ padding: '15px', backgroundColor: isOnline ? '#e6fffa' : '#fff5f5', borderRadius: '8px', marginBottom: '20px', border: '1px solid' }}>
                    <h4>Status: {isOnline ? "🟢 Online" : "🔴 Offline"}</h4>
                    <button onClick={toggleAvailability} style={{ cursor: 'pointer', padding: '8px', fontWeight: 'bold' }}>
                        {isOnline ? "Go Offline" : "Go Online (Share Location)"}
                    </button>
                </div>

                {/* Notifications Section */}
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px' }}>
                    <h4>🔔 Real-Time Booking Requests</h4>
                    {notifications.length === 0 ? (
                        <p style={{ color: '#888' }}>No active requests at the moment.</p>
                    ) : (
                        notifications.map((note, index) => (
                            <div key={index} style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: '#fff', marginBottom: '10px', borderRadius: '5px' }}>
                                <strong>{note.touristName}</strong> wants to book you! <br />
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>{note.message}</p>
                                <div style={{ marginTop: '10px' }}>
                                    <button 
                                        onClick={() => handleResponse(note.touristName, true)} 
                                        style={{ backgroundColor: '#52c41a', color: 'white', border: 'none', marginRight: '5px', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleResponse(note.touristName, false)} 
                                        style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="profile-setup" style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '5px', backgroundColor: '#fff' }}>
                    <h4>Complete Your Professional Profile</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '350px' }}>
                        <input value={profile.fullName} placeholder="Full Name" onChange={e => setProfile({...profile, fullName: e.target.value})} />
                        <input value={profile.licenseNumber} placeholder="License" onChange={e => setProfile({...profile, licenseNumber: e.target.value})} />
                        <input value={profile.specialization} placeholder="Specialization" onChange={e => setProfile({...profile, specialization: e.target.value})} />
                        <input value={profile.baseRate} type="number" placeholder="Rate (LKR)" onChange={e => setProfile({...profile, baseRate: e.target.value})} />
                        <select value={profile.category} onChange={e => setProfile({...profile, category: e.target.value})}>
                            <option value="National">National Guide</option>
                            <option value="Chauffeur">Chauffeur Guide</option>
                            <option value="Site">Site Guide</option>
                        </select>
                        <button onClick={handleUpdateProfile} style={{ backgroundColor: '#007bff', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '4px', border: 'none' }}>Save Details</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideDashboard;