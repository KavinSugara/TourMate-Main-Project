import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import TourMap from './TourMap';
import { startConnection, connection } from './SignalRService';
import toast from 'react-hot-toast';
import './TouristDashboard.css';

function TourMapContainer() {
    const navigate = useNavigate(); 
    const [guides, setGuides] = useState([]);
    const [radius, setRadius] = useState(10);
    const [location, setLocation] = useState({ lat: 7.1550, lon: 80.0550 });

    // Step A: New Filter States
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All");

    // Step B: Update fetchGuides to handle Multi-Criteria Filtering and Busy Status
    const fetchGuides = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:5211/api/Matching/nearby`, {
                params: { 
                    lat: location.lat, 
                    lon: location.lon, 
                    radiusKm: radius,
                    // If "All" is selected, send null so the backend skips that filter
                    category: selectedCategory === "All" ? null : selectedCategory,
                    specialization: selectedSpecialty === "All" ? null : selectedSpecialty 
                }
            });
            setGuides(response.data);
        } catch (error) {
            console.error("Fetch error:", error);
            // We don't toast here to avoid spamming the user during slider movements
        }
    }, [location, radius, selectedCategory, selectedSpecialty]);

    const handleBooking = (guide) => {
        navigate('/booking-form', { 
            state: { 
                guideId: guide.userId || guide.id, 
                guideName: guide.fullName 
            } 
        });
    };

    // Real-time updates: Refresh discovery when guides become Busy or change status
    useEffect(() => {
        const setupSignalR = async () => {
            await startConnection((data) => {});

            // Refresh when a guide accepts (becomes Busy) or declines
            connection.on("ReceiveBookingResponse", (guideName, status) => {
                fetchGuides(); 
                toast(`${guideName} has ${status} your booking request!`, {
                    icon: status === 'Accepted' ? '✅' : '❌'
                });
            });

            // Refresh when guides toggle Online/Offline
            connection.on("ReceiveStatusUpdate", (update) => {
                fetchGuides(); 
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
                        fontWeight: 'bold'
                    }}
                >
                    📋 My Bookings
                </button>
            </header>

            <main className="dashboard-main">
                <div className="guide-sidebar">
                    <div className="sidebar-header" style={{ paddingBottom: '15px', borderBottom: '1px solid #edf2f7' }}>
                        <h3>Discovery Filters</h3>
                        
                        <div className="radius-control" style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem' }}>Search Radius: <b>{radius} km</b></label>
                            <input 
                                type="range" min="1" max="100" value={radius} 
                                onChange={(e) => setRadius(e.target.value)} 
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Step C: Advanced Filter UI */}
                        <div className="filter-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="filter-group">
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>Category</label>
                                <select 
                                    value={selectedCategory} 
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }}
                                >
                                    <option value="All">All Categories</option>
                                    <option value="National">National</option>
                                    <option value="Chauffeur">Chauffeur</option>
                                    <option value="Site">Site</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>Specialization</label>
                                <select 
                                    value={selectedSpecialty} 
                                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }}
                                >
                                    <option value="All">All Specialties</option>
                                    <option value="Hiking">Hiking</option>
                                    <option value="Wildlife">Wildlife</option>
                                    <option value="History">History</option>
                                    <option value="Culture">Culture</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="guide-list-container" style={{ marginTop: '20px' }}>
                        {guides.length === 0 ? (
                            <div className="no-guides-placeholder" style={{ textAlign: 'center', padding: '20px' }}>
                                <p style={{ color: '#718096' }}>No available guides match these filters.</p>
                                <button 
                                    onClick={() => {setSelectedCategory("All"); setSelectedSpecialty("All");}}
                                    style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            guides.map(guide => (
                                <div key={guide.userId || guide.id} className="guide-item-card" style={{ borderLeft: '5px solid #007bff', marginBottom: '15px' }}>
                                    <div className="card-top">
                                        <h4 className="guide-name">{guide.fullName}</h4>
                                        <span className="guide-price">LKR {guide.baseRate?.toLocaleString() || "N/A"}</span>
                                    </div>
                                    
                                    <div style={{ color: '#f1c40f', fontSize: '0.9rem', margin: '5px 0' }}>
                                        {"★".repeat(Math.floor(guide.averageRating || 0))}
                                        {"☆".repeat(5 - Math.floor(guide.averageRating || 0))}
                                        <span style={{ color: '#a0aec0', marginLeft: '5px' }}>
                                            ({guide.averageRating > 0 ? guide.averageRating.toFixed(1) : "New"})
                                        </span>
                                    </div>

                                    <div className="guide-meta" style={{ fontSize: '0.8rem', marginBottom: '10px' }}>
                                        <b>{guide.category}</b> • {guide.specialization || "General"}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className="view-profile-btn"
                                            onClick={() => navigate(`/guide-profile/${guide.userId || guide.id}`)}
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #007bff', background: 'white', color: '#007bff', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                                        >
                                            Profile
                                        </button>
                                        <button 
                                            className="book-btn-sidebar" 
                                            onClick={() => handleBooking(guide)}
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                        >
                                            Book Now
                                        </button>
                                    </div>
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