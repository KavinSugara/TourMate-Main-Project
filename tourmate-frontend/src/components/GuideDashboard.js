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
    const [reviews, setReviews] = useState([]); // NEW: State for feedback
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
        // A. Load existing Pending requests from SQL Database
        const fetchPendingBookings = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Bookings/guide/${userId}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Error fetching persistent bookings:", err);
            }
        };

        // B. Listen for new real-time events (Requests AND Reviews)
        const initializeSignalR = async () => {
            await startConnection((data) => {
                console.log("🔔 SignalR: Booking Request Received", data);
                
                if (data.guideId && data.guideId.toString() === userId.toString()) {
                    setNotifications(prev => {
                        const bookingId = data.bookingId || data.BookingId;
                        const exists = prev.find(n => (n.bookingId || n.BookingId) === bookingId);
                        if (exists) return prev; 
                        return [data, ...prev]; 
                    });
                    alert(`New Booking Request from ${data.touristName || data.TouristName}!`);
                }
            });

            // NEW: Listen for instant reviews from tourists without needing a reload
            connection.on("ReceiveReviewUpdate", (newReview) => {
                console.log("🔔 SignalR: New Review Received", newReview);
                if (newReview.guideUserId.toString() === userId.toString()) {
                    setReviews(prev => {
                        // Prevent duplicate state updates if SignalR fires twice
                        const exists = prev.find(r => r.bookingId === newReview.bookingId);
                        if (exists) return prev;
                        return [newReview, ...prev];
                    });
                    alert(`⭐ New feedback received from ${newReview.touristName}!`);
                }
            });
        };

        if (userId) {
            fetchPendingBookings();
            initializeSignalR();
        }

        // Cleanup listeners on unmount
        return () => {
            if (connection) {
                connection.off("ReceiveReviewUpdate");
            }
        };
    }, [userId]);

    // 2. PERSISTENCE: Load profile, availability, and existing reviews on page load
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
                console.log("Initial profile fetch failed.");
            }
        };

        const fetchReviews = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Bookings/guide/reviews/${userId}`);
                setReviews(res.data);
            } catch (err) {
                console.error("Error fetching reviews history:", err);
            }
        };

        if (userId) {
            fetchCurrentStatus();
            fetchReviews();
        }
    }, [userId]);

    // 3. PERSISTENT ACTION: Update SQL Status and notify tourist
    const handleResponse = async (booking, accepted) => {
        const statusText = accepted ? "Accepted" : "Declined";
        const bookingId = booking.bookingId || booking.BookingId;
        const touristName = booking.touristName || booking.TouristName;
        
        try {
            await axios.patch(`http://localhost:5211/api/Bookings/respond/${bookingId}`, 
                JSON.stringify(statusText),
                { headers: { 'Content-Type': 'application/json' } }
            );
            await connection.invoke("RespondToBooking", touristName, profile.fullName, accepted);
            setNotifications(prev => prev.filter(n => (n.bookingId || n.BookingId) !== bookingId));
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
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>

            <div className={`status-card ${isOnline ? 'status-online' : 'status-offline'}`}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>Visibility Status</p>
                    <h3 style={{ margin: 0 }}>{isOnline ? "🟢 You are currently Online" : "🔴 You are currently Offline"}</h3>
                </div>
                <button onClick={toggleAvailability} className="toggle-btn">
                    {isOnline ? "Go Offline" : "Go Online (Share Location)"}
                </button>
            </div>

            <div className="booking-section">
                <h4>🔔 Pending Booking Requests ({notifications.length})</h4>
                {notifications.length === 0 ? (
                    <p style={{ color: '#a0aec0' }}>No active requests in your queue.</p>
                ) : (
                    notifications.map((note, index) => (
                        <div key={(note.bookingId || note.BookingId) || index} className="booking-item" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                                    <strong style={{ fontSize: '1.1rem', color: '#2d3748' }}>{note.touristName || note.TouristName}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Ref: #{(note.bookingId || note.BookingId)}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                    <div>🕒 Start Time: <b>{(note.estimatedStartTime || note.EstimatedStartTime) ? new Date(note.estimatedStartTime || note.EstimatedStartTime).toLocaleString() : "Not specified"}</b></div>
                                    <div>⏳ Duration: <b>{note.duration || note.Duration || "N/A"}</b></div>
                                    <div>👥 Group Size: <b>{note.groupSize || note.GroupSize || 1} Person(s)</b></div>
                                    <div>📅 Requested: <b>{new Date(note.bookingDate || note.BookingDate).toLocaleDateString()}</b></div>
                                </div>

                                <div style={{ backgroundColor: '#f7fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3182ce' }}>
                                    <p style={{ margin: 0, fontStyle: 'italic', color: '#2d3748', lineHeight: '1.5' }}>
                                        "{note.touristMessage || note.TouristMessage || note.message || "No additional details provided."}"
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <button onClick={() => handleResponse(note, true)} style={{ flex: 1, backgroundColor: '#48bb78', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Accept Request</button>
                                    <button onClick={() => handleResponse(note, false)} style={{ flex: 1, backgroundColor: '#f56565', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Decline</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* INSTANT FEEDBACK SECTION */}
            <div className="reviews-section" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>⭐ My Performance & Reviews</h3>
                {reviews.length === 0 ? (
                    <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>You haven't received any reviews yet. Complete more tours to build your reputation!</p>
                ) : (
                    <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {reviews.map((rev, index) => (
                            <div key={rev.bookingId || index} style={{ padding: '15px', border: '1px solid #edf2f7', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{rev.touristName}</span>
                                    <span style={{ color: '#f1c40f' }}>
                                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                    </span>
                                </div>
                                <p style={{ margin: '0', fontSize: '0.9rem', fontStyle: 'italic', color: '#4a5568' }}>
                                    "{rev.reviewComment || "No comment left."}"
                                </p>
                                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#a0aec0' }}>
                                    Tour completed: {new Date(rev.completedDate || rev.CompletedDate).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Update Section */}
            <div className="profile-card" style={{ marginTop: '30px' }}>
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