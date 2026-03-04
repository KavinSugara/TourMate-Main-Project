import React, { useEffect } from 'react';
// Added 'Circle' to the imports
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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

const TourMap = ({ guides, center, radius }) => {
  return (
    <MapContainer 
      center={center} 
      zoom={11} 
      style={{ height: "500px", width: "100%", borderRadius: "10px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
            <strong>{guide.fullName}</strong> <br />
            {guide.category} - {guide.specialization} <br />
            {guide.isVerified ? "✅ Verified SLTDA Guide" : "❌ Unverified"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default TourMap;