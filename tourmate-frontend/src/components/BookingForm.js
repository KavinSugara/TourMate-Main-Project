import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../BookingForm.css';

const BookingForm = () => {
    const { state } = useLocation(); // Gets guide info passed from Map
    const { guideId, guideName } = state || {};
    const navigate = useNavigate();
    const touristId = localStorage.getItem('userId');

    const [formData, setFormData] = useState({
        startTime: '',
        groupSize: 1,
        duration: 'Half Day',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const bookingData = {
            touristId: parseInt(touristId),
            guideId: parseInt(guideId),
            guideName: guideName,
            touristName: localStorage.getItem('userEmail'),
            touristMessage: formData.description,
            estimatedStartTime: formData.startTime, 
            groupSize: parseInt(formData.groupSize),
            duration: formData.duration,
            status: "Pending"
        };

        try {
            // STEP 1: Save to SQL Database
            const res = await axios.post('http://localhost:5211/api/Bookings/request', bookingData);
            
            // STEP 2: Notify via SignalR (MatchingController)
            // We use the ID returned from the database (res.data.bookingId)
            // and explicitly send the fields to ensure correct JSON casing
            await axios.post(`http://localhost:5211/api/Matching/request/${guideId}`, {
                ...bookingData,
                bookingId: res.data.bookingId, 
                estimatedStartTime: formData.startTime,
                groupSize: parseInt(formData.groupSize),
                duration: formData.duration
            });

            alert("Request sent successfully!");
            navigate('/my-trips');
        } catch (err) {
            console.error("Booking submission error:", err);
            alert("Error sending request.");
        }
    };

    return (
        <div className="booking-form-container">
            <h2>Book Your Tour with {guideName}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Estimated Start Time</label>
                    <input 
                        type="datetime-local" 
                        required 
                        onChange={e => setFormData({...formData, startTime: e.target.value})} 
                    />
                </div>
                
                <div className="form-group">
                    <label>Group Size (People)</label>
                    <input 
                        type="number" 
                        min="1" 
                        required 
                        value={formData.groupSize}
                        onChange={e => setFormData({...formData, groupSize: e.target.value})} 
                    />
                </div>

                <div className="form-group">
                    <label>Duration</label>
                    <select 
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                    >
                        <option value="Half Day">Half Day (4 hours)</option>
                        <option value="Full Day">Full Day (8 hours)</option>
                        <option value="Multi-day">Multi-day Trip</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>What do you want to explore? (Special Requirements)</label>
                    <textarea 
                        placeholder="e.g. I want to visit the ancient city and I need a vehicle..."
                        required 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <button type="submit" className="confirm-booking-btn">Send Booking Request</button>
                <button type="button" className="cancel-btn" onClick={() => navigate('/map')}>Cancel</button>
            </form>
        </div>
    );
};

export default BookingForm;