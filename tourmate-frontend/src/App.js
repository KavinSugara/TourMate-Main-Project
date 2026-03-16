import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import TourMapContainer from './TourMapContainer';
import GuideDashboard from './components/GuideDashboard';
import TouristTrips from './components/TouristTrips';
import BookingForm from './components/BookingForm'; // NEW: Import the Booking Form
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Tourist Routes */}
          <Route path="/map" element={<TourMapContainer />} />
          <Route path="/my-trips" element={<TouristTrips />} />
          <Route path="/booking-form" element={<BookingForm />} /> {/* NEW: Route for the booking form */}

          {/* Guide Routes */}
          <Route path="/guide-dashboard" element={<GuideDashboard />} />
          
          {/* Catch-all: Redirect to login if path not found */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;