import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import TourMap from './TourMap';
import { startConnection, connection } from './SignalRService';
import './TouristDashboard.css';

function TourMapContainer() {
    const navigate = useNavigate(); 
    const [guides, setGuides] = useState([]);
    const [radius, setRadius] = useState(10);
    const [location, setLocation] = useState({ lat: 7.1550, lon: 80.0550 });

    // 1. Fetch nearby guides from backend
    const fetchGuides = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:5211/api/Matching/nearby`, {
                params: { lat: location.lat, lon: location.lon, radiusKm: radius }
            });
            setGuides(response.data);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }, [location, radius]);

    // 2. Navigation: Redirect to the dedicated Booking Form
    const handleBooking = (guide) => {
        // Passes the specific guide's ID and Name to the form via routing state
        navigate('/booking-form', { 
            state: { 
                guideId: guide.userId || guide.id, 
                guideName: guide.fullName 
            } 
        });
    };

    // 3. SignalR Integration for real-time response alerts
    useEffect(() => {
        const setupSignalR = async () => {
            await startConnection((data) => {});

            // Listen for acceptance/decline from guides
            connection.on("ReceiveBookingResponse", (guideName, status) => {
                alert(`Guide ${guideName} has ${status} your booking request!`);
            });

            // Listen for guides going online/offline to refresh the map
            connection.on("ReceiveStatusUpdate", (update) => {
                if (update.isOnline) {
                    fetchGuides(); 
                } else {
                    setGuides(prev => prev.filter(g => (g.userId || g.id) !== update.guideUserId));
                }
            });
        };
        setupSignalR();
        return () => {
            if (connection) {
                connection.off("ReceiveBookingResponse");
                connection.off("ReceiveStatusUpdate");
            }
        };
    }, [fetchGuides]);

    // 4. Geolocation: Get current position on component mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
                (error) => console.error("Location access denied:", error)
            );
        }
    }, []);

    // 5. Initial fetch and refresh on radius change
    useEffect(() => { 
        fetchGuides(); 
    }, [fetchGuides]);

    return (
        <div className="tourist-dashboard-page">
            <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="brand">
                    <h1>TourMate Discovery</h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e0' }}>Find a verified guide near you</p>
                </div>
                
                <button 
                    onClick={() => navigate('/my-trips')} 
                    style={{ 
                        padding: '10px 20px', 
                        background: '#3498db', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#2980b9'}
                    onMouseOut={(e) => e.target.style.background = '#3498db'}
                >
                    📋 My Bookings
                </button>
            </header>

            <main className="dashboard-main">
                {/* Sidebar: List of Nearby Guides */}
                <div className="guide-sidebar">
                    <div className="sidebar-header">
                        <h3>Available Guides</h3>
                        <div className="radius-control">
                            <label>Search Radius: <b>{radius} km</b></label>
                            <input 
                                type="range" min="1" max="100" value={radius} 
                                onChange={(e) => setRadius(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="guide-list-container">
                        {guides.length === 0 ? (
                            <div className="no-guides-placeholder">
                                <p>No guides found in this radius.</p>
                                <p style={{ fontSize: '0.8rem', color: '#718096' }}>Try increasing the search distance.</p>
                            </div>
                        ) : (
                            guides.map(guide => (
                                <div key={guide.id || guide.userId} className="guide-item-card">
                                    <div className="card-top">
                                        <h4 className="guide-name">{guide.fullName}</h4>
                                        <span className="guide-price">
                                            LKR {guide.baseRate?.toLocaleString() || "N/A"}
                                        </span>
                                    </div>
                                    <div className="guide-meta">
                                        {guide.category} • {guide.specialization}
                                    </div>
                                    
                                    <button 
                                        className="book-btn-sidebar" 
                                        onClick={() => handleBooking(guide)}
                                        style={{ 
                                            width: '100%', 
                                            marginTop: '10px', 
                                            padding: '10px', 
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Book This Guide
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Section: The Map */}
                <div className="map-view-section">
                    <TourMap 
                        guides={guides} 
                        center={[location.lat, location.lon]} 
                        radius={radius} 
                        onBook={handleBooking} 
                    />
                </div>
            </main>
        </div>
    );
}

export default TourMapContainer;