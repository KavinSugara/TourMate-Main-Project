import React, { useState } from 'react';

const ReviewModal = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '16px',
                width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginTop: 0, textAlign: 'center' }}>Rate Your Trip</h2>
                <p style={{ textAlign: 'center', color: '#718096' }}>How was your experience with the guide?</p>
                
                {/* Star Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                            key={star}
                            onClick={() => setRating(star)}
                            style={{ 
                                fontSize: '2rem', cursor: 'pointer',
                                color: star <= rating ? '#f1c40f' : '#cbd5e0'
                            }}
                        >
                            ★
                        </span>
                    ))}
                </div>

                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Feedback</label>
                <textarea 
                    placeholder="Tell us about your journey..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ 
                        width: '100%', height: '100px', padding: '12px', 
                        borderRadius: '8px', border: '1px solid #e2e8f0', 
                        resize: 'none', marginBottom: '20px', boxSizing: 'border-box'
                    }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={onClose}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSubmit(rating, comment)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#3182ce', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;