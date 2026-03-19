import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

const guideIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

const TourMap = ({ guides, center, radius, onBook }) => {
    const navigate = useNavigate();

    // Helper function to render stars based on Average Rating
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        const emptyStars = 5 - fullStars;
        return (
            <div style={{ color: '#f1c40f', fontSize: '1.1rem', margin: '5px 0' }}>
                {"★".repeat(fullStars)}
                {"☆".repeat(emptyStars)}
                <span style={{ color: '#718096', fontSize: '0.8rem', marginLeft: '5px' }}>
                    ({rating > 0 ? rating.toFixed(1) : "New"})
                </span>
            </div>
        );
    };

    return (
        <MapContainer 
            center={center} 
            zoom={11} 
            style={{ height: "100%", width: "100%" }} 
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            
            <RecenterMap center={center} />

            <Circle
                center={center}
                pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue', weight: 1 }}
                radius={radius * 1000}
            />

            <Marker position={center} icon={userIcon}>
                <Popup><b>You are here (Live GPS)</b></Popup>
            </Marker>

            {guides.map(guide => (
                <Marker 
                    key={guide.userId || guide.id} 
                    position={[guide.latitude, guide.longitude]} 
                    icon={guideIcon}
                >
                    <Popup>
                        <div style={{ textAlign: 'center', minWidth: '180px' }}>
                            <strong style={{ fontSize: '1.1rem' }}>{guide.fullName}</strong> <br />
                            
                            {/* Visual Reputation Data */}
                            {renderStars(guide.averageRating)}
                            <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '8px' }}>
                                {guide.reviewCount || 0} verified tours
                            </div>

                            <div style={{ 
                                margin: '8px 0', 
                                color: '#2e7d32', 
                                fontWeight: 'bold', 
                                fontSize: '1rem',
                                backgroundColor: '#e8f5e9',
                                padding: '4px',
                                borderRadius: '4px'
                            }}>
                                LKR {guide.baseRate?.toLocaleString() || "Price on Request"}
                            </div>

                            <span style={{ fontSize: '0.85rem', color: '#555' }}>
                                {guide.category} • {guide.specialization}
                            </span> <br />
                            
                            <hr style={{ margin: '10px 0', border: '0', borderTop: '1px solid #eee' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* NEW: Button to view the Guide's Detailed Profile */}
                                <button 
                                    onClick={() => navigate(`/guide-profile/${guide.userId || guide.id}`)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: 'white',
                                        color: '#007bff',
                                        border: '1px solid #007bff',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    View Full Profile
                                </button>

                                {/* Quick Booking Button */}
                                <button 
                                    onClick={() => onBook(guide)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Book This Guide
                                </button>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default TourMap;