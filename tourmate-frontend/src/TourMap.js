import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Icons remain the same
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

// UPDATED: Destructuring 'onBook' from props
const TourMap = ({ guides, center, radius, onBook }) => {
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
          key={guide.id} 
          position={[guide.latitude, guide.longitude]} 
          icon={guideIcon}
        >
          <Popup>
            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <strong style={{ fontSize: '1.1rem' }}>{guide.fullName}</strong> <br />
              
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

              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                {guide.category} - {guide.specialization}
              </span> <br />
              
              <span style={{ fontSize: '0.85rem' }}>
                {guide.isVerified ? "✅ Verified SLTDA Guide" : "❌ Unverified"}
              </span>
              
              <hr style={{ margin: '10px 0' }} />
              
              {/* UPDATED: Calling onBook(guide) passed from Parent */}
              <button 
                onClick={() => onBook(guide)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Book This Guide
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default TourMap;