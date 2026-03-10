import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TourMap from './TourMap';
import { startConnection, connection } from './SignalRService';

function TourMapContainer() {
    const [guides, setGuides] = useState([]);
    const [radius, setRadius] = useState(10);
    const [location, setLocation] = useState({ lat: 7.1550, lon: 80.0550 });

    useEffect(() => {
        const setupSignalR = async () => {
            await startConnection((data) => {
                console.log("Discovery data received:", data);
            });

         
            connection.on("ReceiveBookingResponse", (guideName, status) => {
                console.log(`🔔 Response received: ${guideName} has ${status}`);
                
         
                alert(`Guide ${guideName} has ${status} your booking request!`);
            });
        };

        setupSignalR();

        return () => {
            connection.off("ReceiveBookingResponse");
        };
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
                },
                (error) => console.error("Location error:", error)
            );
        }
    }, []);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const response = await axios.get(`http://localhost:5211/api/Matching/nearby`, {
                    params: { lat: location.lat, lon: location.lon, radiusKm: radius }
                });
                setGuides(response.data);
            } catch (error) { 
                console.error("Fetch error:", error); 
            }
        };
        fetchGuides();
    }, [location, radius]);

    return (
        <div className="TourMapContainer">
            <header className="App-header">
                <h1>TourMate: Discovery Map</h1>
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
                <TourMap 
                    guides={guides} 
                    center={[location.lat, location.lon]} 
                    radius={radius} 
                />
            </main>
        </div>
    );
}

export default TourMapContainer;