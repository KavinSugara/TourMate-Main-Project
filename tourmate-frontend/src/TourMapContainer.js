import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TourMap from './TourMap';
import { startConnection, connection } from './SignalRService';
import './TouristDashboard.css';

function TourMapContainer() {
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

    // 2. FIXED: Persistent Booking Logic (Sends Object instead of String)
    const handleBooking = async (guide) => {
        const touristId = localStorage.getItem('userId');
        const touristEmail = localStorage.getItem('userEmail');

        if (!touristId) {
            alert("Please log in to book a guide.");
            return;
        }

        // Object matching your C# Booking model
        const bookingData = {
            touristId: parseInt(touristId),
            guideId: parseInt(guide.userId || guide.id), 
            touristName: touristEmail,
            guideName: guide.fullName,
            status: "Pending"
        };

        try {
            // STEP A: Save to SQL Database (Persistence)
            const dbResponse = await axios.post(
                `http://localhost:5211/api/Bookings/request`, 
                bookingData
            );

            console.log("✅ Saved to SQL Table:", dbResponse.data);

            // STEP B: Notify Guide via SignalR
            // FIXED: We now send the object directly. Axios handles the JSON conversion.
            await axios.post(
                `http://localhost:5211/api/Matching/request/${guide.userId || guide.id}`, 
                {
                    ...bookingData,
                    bookingId: dbResponse.data.bookingId // Attach the ID created by SQL
                }
            );

            alert(`Request sent to ${guide.fullName}!`);
        } catch (err) {
            console.error("Booking error:", err);
            // Check if it's a 400 error specifically
            if (err.response && err.response.status === 400) {
                alert("Server rejected the request format. Please check backend model alignment.");
            } else {
                alert("Failed to process booking. Check if backend is running.");
            }
        }
    };

    // 3. SignalR Integration
    useEffect(() => {
        const setupSignalR = async () => {
            await startConnection((data) => {
                // This listener handles generic discovery if implemented in startConnection
            });

            connection.on("ReceiveBookingResponse", (guideName, status) => {
                alert(`Guide ${guideName} has ${status} your booking request!`);
            });

            connection.on("ReceiveStatusUpdate", (update) => {
                if (update.isOnline) {
                    fetchGuides(); 
                } else {
                    setGuides(prev => prev.filter(g => g.userId !== update.guideUserId));
                }
            });
        };
        setupSignalR();
        return () => {
            connection.off("ReceiveBookingResponse");
            connection.off("ReceiveStatusUpdate");
        };
    }, [fetchGuides]);

    // 4. Geolocation & Lifecycle
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
                (error) => console.error("Location access denied:", error)
            );
        }
    }, []);

    useEffect(() => { 
        fetchGuides(); 
    }, [fetchGuides]);

    return (
        <div className="tourist-dashboard-page">
            <header className="dashboard-header">
                <h1>TourMate Discovery</h1>
            </header>

            <main className="dashboard-main">
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
                            <p className="no-guides">No guides found in this radius.</p>
                        ) : (
                            guides.map(guide => (
                                <div key={guide.id} className="guide-item-card">
                                    <div className="card-top">
                                        <h4 className="guide-name">{guide.fullName}</h4>
                                        <span className="guide-price">
                                            LKR {guide.baseRate?.toLocaleString() || "N/A"}
                                        </span>
                                    </div>
                                    <div className="guide-meta">
                                        {guide.category} • {guide.specialization}
                                    </div>
                                    {guide.isVerified && <span className="badge-verified">Verified Guide</span>}
                                    
                                    <button 
                                        className="book-btn-sidebar" 
                                        onClick={() => handleBooking(guide)}
                                    >
                                        Book Now
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

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