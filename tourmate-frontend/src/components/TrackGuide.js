import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

// Custom Icons
const guideIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Component to auto-center map when locations update
function RecenterMap({ userLoc, guideLoc }) {
    const map = useMap();
    useEffect(() => {
        if (userLoc && guideLoc) {
            const bounds = L.latLngBounds([userLoc, guideLoc]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [userLoc, guideLoc, map]);
    return null;
}

const TrackGuide = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [guideLoc, setGuideLoc] = useState(null);
    const [userLoc, setUserLoc] = useState(null);
    const [distance, setDistance] = useState(null);
    const trip = state?.trip;

    // Haversine Formula for Frontend Calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return (R * c).toFixed(2);
    };

    const fetchGuideLocation = async () => {
        try {
            const res = await axios.get(`http://localhost:5211/api/Guides/update/${trip.guideId}`);
            if (res.data.latitude && res.data.longitude) {
                const gCoords = [res.data.latitude, res.data.longitude];
                setGuideLoc(gCoords);
                
                // If we have both, update distance
                if (userLoc) {
                    const dist = calculateDistance(userLoc[0], userLoc[1], gCoords[0], gCoords[1]);
                    setDistance(dist);
                }
            }
        } catch (err) {
            console.error("Tracking fetch error", err);
        }
    };

    useEffect(() => {
        // 1. Get initial User location
        navigator.geolocation.getCurrentPosition((pos) => {
            setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        });

        // 2. Initial fetch
        fetchGuideLocation();

        // 3. Set up polling interval (Live update every 5 seconds)
        const interval = setInterval(fetchGuideLocation, 5000);

        return () => clearInterval(interval);
    }, [userLoc]); // Re-run distance calculation if userLoc changes

    if (!userLoc || !guideLoc) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7fafc' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#4a5568' }}>Locating your guide via GPS...</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            
            {/* TOP NAVIGATION OVERLAY */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{ padding: '10px 20px', background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Back
                </button>
            </div>

            {/* LIVE DISTANCE CARD */}
            <div style={{ 
                position: 'absolute', 
                bottom: '30px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 1000, 
                background: 'white', 
                padding: '20px', 
                borderRadius: '15px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.9rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>Distance to {trip.guideName}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2d3748', margin: '5px 0' }}>
                    {distance} <span style={{ fontSize: '1rem' }}>KM</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#48bb78', fontWeight: 'bold' }}>
                    <div style={{ width: '8px', height: '8px', background: '#48bb78', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                    Live GPS Tracking Active
                </div>
            </div>

            <MapContainer center={userLoc} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <RecenterMap userLoc={userLoc} guideLoc={guideLoc} />

                {/* Tourist Marker */}
                <Marker position={userLoc} icon={userIcon}>
                    <Popup><b>You</b> (Your current location)</Popup>
                </Marker>

                {/* Guide Marker */}
                <Marker position={guideLoc} icon={guideIcon}>
                    <Popup><b>{trip.guideName}</b> (Last updated: Just now)</Popup>
                </Marker>

                {/* Visual Connection Line */}
                <Polyline positions={[userLoc, guideLoc]} color="#3182ce" weight={3} dashArray="10, 10" opacity={0.6} />
            </MapContainer>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border-left-color: #3182ce;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default TrackGuide;