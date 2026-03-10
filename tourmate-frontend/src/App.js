import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import TourMapContainer from './TourMapContainer';
import GuideDashboard from './components/GuideDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/map" element={<TourMapContainer />} />
          <Route path="/guide-dashboard" element={<GuideDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;