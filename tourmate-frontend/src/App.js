import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TourMap from './TourMap';
import { startConnection } from './SignalRService';
import './App.css';

function App() {
  const [guides, setGuides] = useState([]);
  const [radius, setRadius] = useState(10); 
  const [location, setLocation] = useState({ lat: 7.1550, lon: 80.0550 }); 

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("📍 Location found:", position.coords.latitude, position.coords.longitude);
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location (defaulting to Veyangoda):", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await axios.get(`/api/Matching/nearby`, {
          params: {
            lat: location.lat,
            lon: location.lon,
            radiusKm: radius
          }
        });
        setGuides(response.data);
      } catch (error) {
        console.error("Error fetching guides:", error);
      }
    };

    fetchGuides();
  }, [location, radius]);

useEffect(() => {
    startConnection((data) => {
      console.log("📥 Raw SignalR data received:", data);

      try {
        const target = (data && data.guideId && typeof data.guideId === 'object') ? data.guideId : data;
        
        const guideName = target.fullName || `Guide #${target.guideId}`;
        const touristName = target.touristName || "a Tourist";

        alert(`New Request for ${guideName} from ${touristName}!`);
        
      } catch (err) {
        console.error("❌ Notification error:", err);
      }
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>TourMate: Visibility Dashboard</h1>
        <p>Bridging the Gap for Rural Professionals</p>
      </header>

      <main style={{ padding: "20px" }}>
        <div className="controls" style={{ marginBottom: "20px" }}>
          <label>Search Radius: {radius} km </label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={radius} 
            onChange={(e) => setRadius(e.target.value)} 
          />
        </div>

        <TourMap guides={guides} center={[location.lat, location.lon]} radius={radius} />        
        
        <div className="guide-list">
          <h3>Verified Guides Nearby: {guides.length}</h3>
          <ul>
            {guides.map(g => (
              <li key={g.id}>
                <strong>{g.fullName}</strong> - {g.category} ({g.licenseNumber})
                {g.isVerified && <span style={{color: 'green'}}> ✅ Verified</span>}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;