import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startConnection, connection } from '../SignalRService';
import toast from 'react-hot-toast'; 
import '../GuideDashboard.css';

const GuideDashboard = () => {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();

    const [isOnline, setIsOnline] = useState(false);
    const [notifications, setNotifications] = useState([]); 
    const [reviews, setReviews] = useState([]); 
    const [earnings, setEarnings] = useState({ totalEarnings: 0, totalTrips: 0 });
    const [profile, setProfile] = useState({ 
        fullName: '', 
        licenseNumber: '', 
        category: 'National',
        specialization: '',
        baseRate: '',
        latitude: null, 
        longitude: null
    });

    // 1. REAL-TIME SIGNALR SYNC
    useEffect(() => {
        const fetchPendingBookings = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Bookings/guide/${userId}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Error fetching persistent bookings:", err);
            }
        };

        const initializeSignalR = async () => {
            await startConnection((data) => {
                if (data.guideId && data.guideId.toString() === userId.toString()) {
                    setNotifications(prev => {
                        const bookingId = data.bookingId || data.BookingId;
                        const exists = prev.find(n => (n.bookingId || n.BookingId) === bookingId);
                        if (exists) return prev; 
                        return [data, ...prev]; 
                    });

                    toast.success(`New Booking Request from ${data.touristName || data.TouristName}!`, {
                        duration: 6000,
                        icon: '🔔',
                    });
                }
            });

            // EMERGENCY SOS LISTENER
            connection.on("ReceiveSOSAlert", (alertData) => {
                toast.error(
                    (t) => (
                        <span>
                            <b>🚨 EMERGENCY SOS</b>
                            <br />
                            {alertData.touristName} needs help near {alertData.guideName}!
                            <br />
                            <small>Location: {alertData.latitude.toFixed(4)}, {alertData.longitude.toFixed(4)}</small>
                            <br />
                            <button 
                                onClick={() => toast.dismiss(t.id)}
                                style={{ background: 'white', color: 'red', border: 'none', padding: '5px 10px', borderRadius: '4px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Dismiss Alert
                            </button>
                        </span>
                    ),
                    {
                        duration: Infinity, 
                        position: "top-center",
                        style: { border: '2px solid red', padding: '16px', minWidth: '350px' }
                    }
                );
            });

            connection.on("ReceiveReviewUpdate", (newReview) => {
                if (newReview.guideUserId.toString() === userId.toString()) {
                    setReviews(prev => {
                        const exists = prev.find(r => r.bookingId === newReview.bookingId);
                        if (exists) return prev;
                        return [newReview, ...prev];
                    });

                    toast(`⭐ New feedback received from ${newReview.touristName}!`, {
                        style: { background: '#2D3748', color: '#fff' }
                    });
                }
            });
        };

        if (userId) {
            fetchPendingBookings();
            initializeSignalR();
        }

        return () => {
            if (connection) {
                connection.off("ReceiveReviewUpdate");
                connection.off("ReceiveSOSAlert");
            }
        };
    }, [userId]);

    // 2. DATA PERSISTENCE: Initial load only (Dependency Fix)
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
            } catch (err) { console.log("Profile fetch failed."); }
        };

        const fetchReviews = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Bookings/guide/reviews/${userId}`);
                setReviews(res.data);
            } catch (err) { console.error("Reviews fetch failed."); }
        };

        const fetchEarnings = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Guides/earnings/${userId}`);
                setEarnings(res.data);
            } catch (err) { console.error("Earnings fetch failed."); }
        };

        if (userId) {
            fetchCurrentStatus();
            fetchReviews();
            fetchEarnings();
        }
        // Removed 'reviews' from dependencies to stop the typing glitch (character deletion)
    }, [userId]); 

    // 3. HANDLERS
    const handleResponse = async (booking, accepted) => {
        const statusText = accepted ? "Accepted" : "Declined";
        const bookingId = booking.bookingId || booking.BookingId;
        const touristName = booking.touristName || booking.TouristName;
        
        const responseTask = axios.patch(`http://localhost:5211/api/Bookings/respond/${bookingId}`, 
            JSON.stringify(statusText),
            { headers: { 'Content-Type': 'application/json' } }
        );

        toast.promise(responseTask, {
            loading: `Processing ${statusText}...`,
            success: () => {
                connection.invoke("RespondToBooking", touristName, profile.fullName, accepted);
                setNotifications(prev => prev.filter(n => (n.bookingId || n.BookingId) !== bookingId));
                return `Booking ${statusText} successfully!`;
            },
            error: 'Failed to save your response.'
        });
    };

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
                
                toast(status ? "You are now visible to tourists!" : "You are now offline.", {
                    icon: status ? '🟢' : '🔴',
                });
            } catch (err) {
                toast.error("Failed to update visibility status.");
            }
        };

        if (!isOnline) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await axios.put(`http://localhost:5211/api/Guides/update-location/${userId}`, { latitude, longitude });
                        await processToggle(true, latitude, longitude);
                    } catch (err) {
                        toast.error("Could not save your location.");
                    }
                },
                () => toast.error("Please enable location services to go online.")
            );
        } else {
            await processToggle(false);
        }
    };

    const handleUpdateProfile = async () => {
        const updateTask = axios.put(`http://localhost:5211/api/Guides/update/${userId}`, profile);
        toast.promise(updateTask, {
            loading: 'Updating profile...',
            success: 'Professional profile updated!',
            error: 'Update failed.'
        });
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        toast('Logged out successfully');
    };

    return (
        <div className="guide-container">
            <div className="header-section">
                <h1>Guide Control Center</h1>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #48bb78' }}>
                    <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>Total Revenue</p>
                    <h2 style={{ margin: '5px 0', color: '#2d3748' }}>LKR {earnings.totalEarnings?.toLocaleString() || 0}</h2>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #3182ce' }}>
                    <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>Completed Tours</p>
                    <h2 style={{ margin: '5px 0', color: '#2d3748' }}>{earnings.totalTrips || 0} Trips</h2>
                </div>
            </div>

            <div className={`status-card ${isOnline ? 'status-online' : 'status-offline'}`} style={{ marginBottom: '30px' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>Visibility Status</p>
                    <h3 style={{ margin: 0 }}>{isOnline ? "🟢 Online & Visible" : "🔴 Currently Offline"}</h3>
                </div>
                <button onClick={toggleAvailability} className="toggle-btn">
                    {isOnline ? "Go Offline" : "Go Online (GPS)"}
                </button>
            </div>

            <div className="booking-section">
                <h4>🔔 Pending Requests ({notifications.length})</h4>
                {notifications.length === 0 ? (
                    <p style={{ color: '#a0aec0' }}>No active requests.</p>
                ) : (
                    notifications.map((note, index) => (
                        <div key={(note.bookingId || note.BookingId) || index} className="booking-item" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                                    <strong style={{ fontSize: '1.1rem', color: '#2d3748' }}>{note.touristName || note.TouristName}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Ref: #{(note.bookingId || note.BookingId)}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                    <div>🕒 Start: <b>{(note.estimatedStartTime || note.EstimatedStartTime) ? new Date(note.estimatedStartTime || note.EstimatedStartTime).toLocaleString() : "N/A"}</b></div>
                                    <div>⏳ Duration: <b>{note.duration || note.Duration || "N/A"}</b></div>
                                    <div>👥 Group: <b>{note.groupSize || note.GroupSize || 1} Person(s)</b></div>
                                    <div>📅 Date: <b>{new Date(note.bookingDate || note.BookingDate).toLocaleDateString()}</b></div>
                                </div>
                                <div style={{ backgroundColor: '#f7fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3182ce' }}>
                                    <p style={{ margin: 0, fontStyle: 'italic', color: '#2d3748' }}>
                                        "{note.touristMessage || note.TouristMessage || note.message || "No additional details provided."}"
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleResponse(note, true)} style={{ flex: 1, backgroundColor: '#48bb78', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
                                    <button onClick={() => handleResponse(note, false)} style={{ flex: 1, backgroundColor: '#f56565', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Decline</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="reviews-section" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>⭐ Performance & Reviews</h3>
                {reviews.length === 0 ? (
                    <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>No reviews yet.</p>
                ) : (
                    <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {reviews.map((rev, index) => (
                            <div key={rev.bookingId || index} style={{ padding: '15px', border: '1px solid #edf2f7', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{rev.touristName}</span>
                                    <span style={{ color: '#f1c40f' }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                                </div>
                                <p style={{ margin: '0', fontSize: '0.9rem', fontStyle: 'italic', color: '#4a5568' }}>"{rev.reviewComment || "No comment left."}"</p>
                                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#a0aec0' }}>Tour completed: {new Date(rev.completedDate || rev.CompletedDate).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PROFESSIONAL PROFILE SECTION - FIXED WITH ONCHANGE HANDLERS */}
            <div className="profile-card" style={{ marginTop: '30px' }}>
                <h3>Update Professional Profile</h3>
                <div className="form-grid">
                    <div className="input-group">
                        <label>Full Name</label>
                        <input 
                            value={profile.fullName} 
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
                        />
                    </div>
                    <div className="input-group">
                        <label>SLTDA License</label>
                        <input 
                            value={profile.licenseNumber} 
                            onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })} 
                        />
                    </div>
                    <div className="input-group">
                        <label>Specialization</label>
                        <input 
                            value={profile.specialization} 
                            onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} 
                        />
                    </div>
                    <div className="input-group">
                        <label>Base Rate (LKR)</label>
                        <input 
                            type="number" 
                            value={profile.baseRate} 
                            onChange={(e) => setProfile({ ...profile, baseRate: e.target.value })} 
                        />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Service Category</label>
                        <select 
                            value={profile.category} 
                            onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        >
                            <option value="National">National Guide</option>
                            <option value="Chauffeur">Chauffeur Guide</option>
                            <option value="Site">Site Guide</option>
                        </select>
                    </div>
                    <button onClick={handleUpdateProfile} className="save-btn" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                        Save Profile Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuideDashboard;