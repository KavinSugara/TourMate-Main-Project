import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import the notification container
import Login from './components/Login';
import Signup from './components/Signup';
import TourMapContainer from './TourMapContainer';
import GuideDashboard from './components/GuideDashboard';
import TouristTrips from './components/TouristTrips';
import BookingForm from './components/BookingForm';
import GuideProfile from './components/GuideProfile';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/ProtectedRoute'; // Import the guard
import TrackGuide from './components/TrackGuide';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* The Toaster is a global component. 
            By placing it here, 'toast.success' or 'toast.error' 
            calls from ANY child component will trigger a popup 
            in the top-right corner of the screen.
        */}
        <Toaster 
            position="top-right" 
            reverseOrder={false} 
            toastOptions={{
                // Global styles for all notifications
                style: {
                    fontSize: '14px',
                    borderRadius: '8px',
                    background: '#333',
                    color: '#fff',
                },
                success: {
                    duration: 4000,
                    theme: {
                        primary: '#48bb78',
                    },
                },
                error: {
                    duration: 6000,
                    style: {
                        background: '#e53e3e',
                        color: '#fff',
                    }
                }
            }}
        />
        
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Tourist Routes */}
          <Route path="/map" element={<TourMapContainer />} />
          <Route path="/my-trips" element={<TouristTrips />} />
          <Route path="/booking-form" element={<BookingForm />} />
          
          {/* Public Guide Profile Route */}
          <Route path="/guide-profile/:id" element={<GuideProfile />} />
          <Route path="/track-guide/:id" element={<TrackGuide />} />
          {/* PROTECTED ADMIN ROUTE */}
          <Route 
              path="/admin" 
              element={
                  <AdminRoute>
                      <AdminDashboard />
                  </AdminRoute>
              } 
          />

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