import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startConnection, connection } from '../SignalRService'; // Ensure SignalR is imported
import '../TouristTrips.css';

const TouristTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const touristId = localStorage.getItem('userId');
    const navigate = useNavigate();

    // Helper to clean phone numbers for tel: and wa.me links
    const cleanPhone = (phone) => phone ? phone.replace(/\D/g, '') : '';

    const fetchTrips = async () => {
        try {
            const res = await axios.get(`http://localhost:5211/api/Bookings/tourist/${touristId}`);
            setTrips(res.data);
        } catch (err) {
            console.error("Error fetching trips:", err);
        } finally {
            setLoading(false);
        }
    };

    // 1. Initial Load
    useEffect(() => {
        if (touristId) {
            fetchTrips();
        } else {
            navigate('/login');
        }
    }, [touristId, navigate]);

    // 2. REAL-TIME SYNC: Listen for Guide Responses (Accept/Decline)
    useEffect(() => {
        const setupSignalR = async () => {
            await startConnection(() => {}); 

            // When a guide responds, refresh the list instantly
            connection.on("ReceiveBookingResponse", (guideName, status) => {
                console.log(`🔔 SignalR: Guide ${guideName} set status to ${status}`);
                fetchTrips(); 
                alert(`Update: Guide ${guideName} has ${status} your booking request!`);
            });
        };

        if (touristId) setupSignalR();

        return () => {
            if (connection) connection.off("ReceiveBookingResponse");
        };
    }, [touristId]);

    // PHASE 3: SECURE GPS START TRIP HANDSHAKE
    const handleStartTrip = async (bookingId) => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const res = await axios.patch(`http://localhost:5211/api/Bookings/start/${bookingId}`, {
                    latitude: latitude,
                    longitude: longitude
                });

                alert("✅ Trip Started! Handshake complete.");
                await fetchTrips(); 

            } catch (err) {
                const errorMsg = err.response?.data?.message || "Verification failed.";
                alert(`⚠️ Safety Handshake Failed: ${errorMsg}`);
            }
        }, (error) => {
            alert("Please enable location services.");
        }, { enableHighAccuracy: true });
    };

    // PHASE 4: END TRIP & BROADCAST REVIEW (REAL-TIME)
    const handleEndTrip = async (bookingId) => {
        const isSafe = window.confirm("Have you reached your destination safely?");
        if (!isSafe) return;

        const rating = window.prompt("Rate your guide (1-5 stars):", "5");
        if (rating === null) return; 

        const comment = window.prompt("Any feedback for the guide?");
        if (comment === null) return; 

        try {
            // A. Save to SQL Database
            await axios.patch(`http://localhost:5211/api/Bookings/complete/${bookingId}`, {
                rating: parseInt(rating),
                reviewComment: comment
            });

            // B. NEW: BROADCAST TO GUIDE DASHBOARD INSTANTLY
            if (connection && connection.state === "Connected") {
                const currentTrip = trips.find(t => t.bookingId === bookingId);
                await connection.invoke("NotifyReviewSubmitted", 
                    currentTrip.guideId, 
                    localStorage.getItem('userEmail'), // or tourist name
                    parseInt(rating), 
                    comment
                );
            }

            alert("Thank you! Your trip is complete and your review was sent.");
            await fetchTrips(); 
        } catch (err) {
            console.error("End trip error:", err);
            alert("Failed to complete trip.");
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Accepted': return 'status-accepted';
            case 'Active': return 'status-active';
            case 'Declined': return 'status-declined';
            case 'Completed': return 'status-completed';
            default: return 'status-pending';
        }
    };

    if (loading) return <div className="loading-screen">Loading your adventures...</div>;

    return (
        <div className="my-trips-page">
            <nav className="trips-nav">
                <button onClick={() => navigate('/map')} className="back-btn">← Back to Discovery Map</button>
                <h1>My Tour Bookings</h1>
            </nav>

            <div className="trips-content">
                {trips.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🗺️</div>
                        <h3>No bookings found</h3>
                        <p>Start by finding a guide on the map!</p>
                        <button className="find-guide-btn" onClick={() => navigate('/map')}>Find a Guide</button>
                    </div>
                ) : (
                    <div className="trips-grid">
                        {trips.map((trip) => (
                            <div key={trip.bookingId} className="trip-card">
                                <div className="trip-card-top">
                                    <span className={`status-badge ${getStatusClass(trip.status)}`}>
                                        {trip.status}
                                    </span>
                                    <span className="booking-id">REF: #{trip.bookingId}</span>
                                </div>

                                <div className="trip-card-body">
                                    <h3 className="guide-name">Guide: {trip.guideName}</h3>
                                    
                                    <div style={{ fontSize: '0.85rem', color: '#4a5568', margin: '10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                        <span>🕒 <b>Start:</b> {trip.estimatedStartTime ? new Date(trip.estimatedStartTime).toLocaleString() : "N/A"}</span>
                                        <span>⏳ <b>Duration:</b> {trip.duration || "N/A"}</span>
                                        <span>👥 <b>Group:</b> {trip.groupSize || 1} Person(s)</span>
                                        <span>📅 <b>Sent:</b> {new Date(trip.bookingDate).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="plan-summary">
                                        <strong>Custom Plan:</strong>
                                        <p className="plan-text">"{trip.touristMessage || "No detailed plan provided."}"</p>
                                    </div>
                                </div>

                                {(trip.status === 'Accepted' || trip.status === 'Active') && (
                                    <div className="success-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <div className="check-icon">{trip.status === 'Active' ? '🚀' : '✅'}</div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2d3748', fontWeight: '500' }}>
                                                {trip.status === 'Accepted' ? "Plan Accepted! Contact your guide:" : "Trip is currently Active!"}
                                            </p>
                                        </div>
                                        
                                        <div className="contact-actions" style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '15px' }}>
                                            <a href={`tel:${cleanPhone(trip.guidePhone)}`} className="contact-btn call-btn" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#2c3e50', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                📞 Call Guide
                                            </a>
                                            <a href={`https://wa.me/${cleanPhone(trip.guidePhone)}?text=Hi, I'm ${trip.touristName} from TourMate.`} target="_blank" rel="noopener noreferrer" className="contact-btn whatsapp-btn" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                💬 WhatsApp
                                            </a>
                                        </div>
                                        
                                        {trip.status === 'Accepted' && (
                                            <button onClick={() => handleStartTrip(trip.bookingId)} className="start-trip-btn" style={{ width: '100%', padding: '12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                Start Trip (Verify Meeting)
                                            </button>
                                        )}

                                        {trip.status === 'Active' && (
                                            <button onClick={() => handleEndTrip(trip.bookingId)} className="end-trip-btn" style={{ width: '100%', padding: '12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                End Trip & Review Guide
                                            </button>
                                        )}
                                    </div>
                                )}

                                {trip.status === 'Completed' && (
                                    <div className="completed-footer" style={{ marginTop: '15px', padding: '10px', background: '#f0fff4', borderRadius: '8px', textAlign: 'center', border: '1px solid #c6f6d5' }}>
                                        <p style={{ color: '#38a169', fontWeight: 'bold', margin: 0 }}>🏁 Trip Successfully Completed!</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TouristTrips;