import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startConnection, connection } from '../SignalRService';
import '../GuideDashboard.css';

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
        baseRate: '',
        latitude: null, 
        longitude: null
    });

    // 1. DATABASE & SIGNALR SYNC
    useEffect(() => {
        // A. Load existing Pending requests from SQL Database (Persistence)
        const fetchPendingBookings = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Bookings/guide/${userId}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Error fetching persistent bookings:", err);
            }
        };

        // B. FIXED: Listen for new real-time requests (SignalR)
        const initializeSignalR = async () => {
            await startConnection((data) => {
                console.log("🔔 SignalR Data Received in Dashboard:", data);
                
                // Ensure data is for this specific guide
                if (data.guideId && data.guideId.toString() === userId.toString()) {
                    
                    // PREVENT DUPLICATES: Only add if bookingId isn't already in the list
                    setNotifications(prev => {
                        const exists = prev.find(n => n.bookingId === data.bookingId);
                        if (exists) return prev; // Already exists, do nothing
                        return [data, ...prev]; // Add new notification to top
                    });

                    alert(`New Booking Request from ${data.touristName}!`);
                }
            });
        };

        if (userId) {
            fetchPendingBookings();
            initializeSignalR();
        }
    }, [userId]);

    // 2. PERSISTENCE: Load profile and availability status on page load
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
                        baseRate: res.data.baseRate || '',
                        latitude: res.data.latitude,
                        longitude: res.data.longitude
                    });
                }
            } catch (err) {
                console.log("Initial fetch failed.");
            }
        };
        fetchCurrentStatus();
    }, [userId]);

    // 3. PERSISTENT ACTION: Update SQL Status and notify tourist
    const handleResponse = async (booking, accepted) => {
        const statusText = accepted ? "Accepted" : "Declined";
        
        try {
            // STEP A: Update the record in SQL Table (Persistence)
            await axios.patch(`http://localhost:5211/api/Bookings/respond/${booking.bookingId}`, 
                JSON.stringify(statusText),
                { headers: { 'Content-Type': 'application/json' } }
            );

            // STEP B: Notify the tourist via SignalR (Real-time)
            await connection.invoke("RespondToBooking", booking.touristName, profile.fullName, accepted);
            
            // STEP C: Clear from local dashboard view
            setNotifications(prev => prev.filter(n => n.bookingId !== booking.bookingId));
            
            alert(`You have ${statusText} the request.`);
        } catch (err) {
            console.error("Response error:", err);
            alert("Failed to save your response to the database.");
        }
    };

    // 4. REAL-TIME DISCOVERY: Toggle Visibility and Broadcast
    const toggleAvailability = async () => {
        const processToggle = async (status, lat = null, lon = null) => {
            try {
                await axios({
                    method: 'patch',
                    url: `http://localhost:5211/api/Guides/toggle-availability/${userId}`,
                    data: JSON.stringify(status), 
                    headers: { 'Content-Type': 'application/json' }
                });
                setIsOnline(status);
                // Broadcast to all tourists to update map markers
                await connection.invoke("NotifyStatusChange", parseInt(userId), status, lat, lon);
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
                        await processToggle(true, latitude, longitude);
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
        <div className="guide-container">
            <div className="header-section">
                <h1>Guide Control Center</h1>
                <button className="logout-btn" onClick={handleLogout} style={{ padding: '8px 15px', cursor: 'pointer' }}>Logout</button>
            </div>

            <div className={`status-card ${isOnline ? 'status-online' : 'status-offline'}`}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>Visibility Status</p>
                    <h3 style={{ margin: 0 }}>{isOnline ? "🟢 You are currently Online" : "🔴 You are currently Offline"}</h3>
                </div>
                <button onClick={toggleAvailability} className="toggle-btn" style={{ padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isOnline ? "Go Offline" : "Go Online (Share Location)"}
                </button>
            </div>

            <div className="booking-section">
                <h4>🔔 Pending Booking Requests ({notifications.length})</h4>
                {notifications.length === 0 ? (
                    <p style={{ color: '#a0aec0' }}>No active requests in your queue.</p>
                ) : (
                    notifications.map((note, index) => (
                        <div key={note.bookingId || index} className="booking-item" style={{ padding: '15px', backgroundColor: '#fff', marginBottom: '10px', borderRadius: '8px', border: '1px solid #fbd38d' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong>{note.touristName}</strong> wants to book you!
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#4a5568' }}>
                                        Received: {note.bookingDate ? new Date(note.bookingDate).toLocaleString() : "Just now"}
                                    </p>
                                </div>
                                <div>
                                    <button 
                                        onClick={() => handleResponse(note, true)} 
                                        style={{ backgroundColor: '#48bb78', color: 'white', border: 'none', marginRight: '8px', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleResponse(note, false)} 
                                        style={{ backgroundColor: '#f56565', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="profile-card">
                <h3 style={{ marginBottom: '20px' }}>Update Professional Profile</h3>
                <div className="form-grid">
                    <div className="input-group">
                        <label>Full Professional Name</label>
                        <input value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>SLTDA License Number</label>
                        <input value={profile.licenseNumber} onChange={e => setProfile({...profile, licenseNumber: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Specialization</label>
                        <input value={profile.specialization} onChange={e => setProfile({...profile, specialization: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Base Rate (LKR)</label>
                        <input type="number" value={profile.baseRate} onChange={e => setProfile({...profile, baseRate: e.target.value})} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Service Category</label>
                        <select value={profile.category} onChange={e => setProfile({...profile, category: e.target.value})} style={{ width: '100%' }}>
                            <option value="National">National Guide</option>
                            <option value="Chauffeur">Chauffeur Guide</option>
                            <option value="Site">Site Guide</option>
                        </select>
                    </div>
                    <button onClick={handleUpdateProfile} className="save-btn">Save Profile Details</button>
                </div>
            </div>
        </div>
    );
};

export default GuideDashboard;