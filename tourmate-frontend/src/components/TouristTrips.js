import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startConnection, connection } from '../SignalRService';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal'; 
import '../TouristTrips.css';

const TouristTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeBookingId, setActiveBookingId] = useState(null);
    
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
            toast.error("Failed to load your bookings.");
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

    // 2. REAL-TIME SYNC: Listen for Guide Responses
    useEffect(() => {
        const setupSignalR = async () => {
            await startConnection(() => {}); 

            connection.on("ReceiveBookingResponse", (guideName, status) => {
                fetchTrips(); 
                toast(`${guideName} has ${status} your booking request!`, {
                    icon: status === 'Accepted' ? '✅' : '❌',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            });
        };

        if (touristId) setupSignalR();

        return () => {
            if (connection) connection.off("ReceiveBookingResponse");
        };
    }, [touristId]);

    // PHASE 3: SECURE GPS START TRIP HANDSHAKE (Updated with specialized error handling)
    const handleStartTrip = async (bookingId) => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            const startTask = axios.patch(`http://localhost:5211/api/Bookings/start/${bookingId}`, {
                latitude: latitude,
                longitude: longitude
            });

            await toast.promise(startTask, {
                loading: 'Verifying safety handshake with guide location...',
                success: (res) => {
                    fetchTrips();
                    return '✅ Trip Started! Have a safe journey.';
                },
                error: (err) => {
                    // CATCH DISTANCE ERROR FROM BACKEND (Preventing the 400 Runtime Error Screen)
                    if (err.response && err.response.status === 400) {
                        const serverMsg = err.response.data.message;
                        const distance = err.response.data.distanceKm;
                        return `⚠️ ${serverMsg} (${distance} km away)`;
                    }
                    
                    const errorMsg = err.response?.data?.message || "Verification failed.";
                    return `⚠️ Handshake Failed: ${errorMsg}`;
                }
            });

        }, (error) => {
            toast.error("Please enable location services to start your trip.");
        }, { enableHighAccuracy: true });
    };

    // PHASE 4: END TRIP (Trigger Modal)
    const handleEndTrip = (bookingId) => {
        setActiveBookingId(bookingId);
        setIsModalOpen(true);
    };

    // PHASE 5: EMERGENCY SOS LOGIC
    const triggerSOS = async (trip) => {
        const confirmSOS = window.confirm("🚨 EMERGENCY: Do you want to send an SOS alert with your current location to all nearby guides and authorities?");
        if (!confirmSOS) return;

        if (navigator.geolocation) {
            toast.loading("Capturing precise location...");
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                toast.dismiss();

                if (connection && connection.state === "Connected") {
                    try {
                        await connection.invoke("SendSOS", 
                            localStorage.getItem('userEmail'), 
                            latitude, 
                            longitude, 
                            trip.guideName
                        );
                        toast.error("🚨 SOS SENT SUCCESSFULLY!", {
                            duration: 10000,
                            position: "top-center",
                            style: { background: '#e53e3e', color: '#fff', fontWeight: 'bold', border: '2px solid white' }
                        });
                    } catch (err) {
                        toast.error("Failed to send SOS. Call emergency services.");
                    }
                }
            }, (error) => {
                toast.error("Location access denied.");
            }, { enableHighAccuracy: true });
        }
    };

    // MODAL SUBMISSION LOGIC
    const submitReview = async (rating, comment) => {
        setIsModalOpen(false);
        const completeTask = axios.patch(`http://localhost:5211/api/Bookings/complete/${activeBookingId}`, {
            rating: parseInt(rating),
            reviewComment: comment
        });

        await toast.promise(completeTask, {
            loading: 'Closing trip and sharing feedback...',
            success: () => {
                if (connection && connection.state === "Connected") {
                    const currentTrip = trips.find(t => t.bookingId === activeBookingId);
                    connection.invoke("NotifyReviewSubmitted", currentTrip.guideId, localStorage.getItem('userEmail'), parseInt(rating), comment);
                }
                fetchTrips();
                return "Thank you! Your review has been shared.";
            },
            error: "Failed to complete trip record."
        });
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
                                        
                                        <div className="contact-actions" style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
                                            <a href={`tel:${cleanPhone(trip.guidePhone)}`} className="contact-btn call-btn" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#2c3e50', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                📞 Call Guide
                                            </a>
                                            <a href={`https://wa.me/${cleanPhone(trip.guidePhone)}?text=Hi, I'm ${trip.touristName} from TourMate.`} target="_blank" rel="noopener noreferrer" className="contact-btn whatsapp-btn" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                💬 WhatsApp
                                            </a>
                                        </div>

                                        {/* LIVE TRACKING BUTTON */}
                                        <button 
                                            onClick={() => navigate(`/track-guide/${trip.guideId}`, { state: { trip } })}
                                            style={{ 
                                                width: '100%', 
                                                padding: '12px', 
                                                background: '#3498db', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '6px', 
                                                fontWeight: 'bold', 
                                                cursor: 'pointer',
                                                marginBottom: '10px'
                                            }}
                                        >
                                            📍 Track Guide Live
                                        </button>
                                        
                                        {trip.status === 'Accepted' && (
                                            <button onClick={() => handleStartTrip(trip.bookingId)} className="start-trip-btn" style={{ width: '100%', padding: '12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                Start Trip (Verify Meeting)
                                            </button>
                                        )}

                                        {trip.status === 'Active' && (
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <button 
                                                    onClick={() => handleEndTrip(trip.bookingId)} 
                                                    className="end-trip-btn" 
                                                    style={{ width: '100%', padding: '12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    End Trip & Review Guide
                                                </button>

                                                <button 
                                                    onClick={() => triggerSOS(trip)} 
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '12px', 
                                                        background: 'black', 
                                                        color: '#ff4d4d', 
                                                        border: '2px solid #ff4d4d', 
                                                        borderRadius: '6px', 
                                                        fontWeight: 'bold', 
                                                        cursor: 'pointer', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        gap: '8px',
                                                        boxShadow: '0 4px 10px rgba(255, 77, 77, 0.3)'
                                                    }}
                                                >
                                                    🚨 SEND EMERGENCY SOS
                                                </button>
                                            </div>
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

            <ReviewModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={submitReview} 
            />
        </div>
    );
};

export default TouristTrips;