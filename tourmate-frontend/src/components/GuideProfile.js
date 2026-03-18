import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GuideProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5211/api/Guides/public-profile/${id}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Professional Profile...</div>;
    if (!data) return <div style={{ padding: '50px', textAlign: 'center' }}>Profile not found.</div>;

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header Navigation */}
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}
                >
                    ← Back to Discovery
                </button>

                {/* Profile Header Card */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '2.2rem' }}>{data.fullName}</h1>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ backgroundColor: '#ebf8ff', color: '#3182ce', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {data.category} Guide
                            </span>
                            {data.isVerified && (
                                <span style={{ backgroundColor: '#f0fff4', color: '#38a169', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    ✅ SLTDA Verified
                                </span>
                            )}
                        </div>
                        <p style={{ color: '#718096', marginTop: '15px', fontSize: '1.1rem' }}>
                            Specialized in: <b>{data.specialization || "General Tours"}</b>
                        </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#f1c40f', fontSize: '2.5rem', fontWeight: 'bold' }}>
                            ★ {data.averageRating > 0 ? data.averageRating.toFixed(1) : "N/A"}
                        </div>
                        <p style={{ margin: 0, color: '#a0aec0', fontWeight: '600' }}>{data.totalReviews} Verified Reviews</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '25px', marginTop: '25px' }}>
                    
                    {/* Left Column: Reviews History */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ borderBottom: '2px solid #f7fafc', paddingBottom: '15px', marginBottom: '20px' }}>Tourist Feedback</h3>
                        
                        {data.reviewHistory.length === 0 ? (
                            <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>No reviews yet for this guide.</p>
                        ) : (
                            data.reviewHistory.map((rev, index) => (
                                <div key={index} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #edf2f7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <strong style={{ color: '#2d3748' }}>{rev.touristName}</strong>
                                        <span style={{ color: '#f1c40f' }}>{"★".repeat(rev.rating)}</span>
                                    </div>
                                    <p style={{ margin: 0, color: '#4a5568', lineHeight: '1.5', fontStyle: 'italic' }}>"{rev.reviewComment}"</p>
                                    <small style={{ color: '#cbd5e0' }}>{new Date(rev.endTime).toLocaleDateString()}</small>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right Column: Booking & Details Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        
                        {/* Quick Stats Box */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#718096', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Service Details</h4>
                            <div style={{ marginBottom: '15px' }}>
                                <small style={{ color: '#a0aec0' }}>Standard Rate</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>LKR {data.baseRate?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#718096' }}>/ day</span></div>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <small style={{ color: '#a0aec0' }}>License Number</small>
                                <div style={{ fontWeight: '600', color: '#4a5568' }}>{data.licenseNumber || "Not Provided"}</div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button 
                            onClick={() => navigate('/booking-form', { state: { guideId: id, guideName: data.fullName } })}
                            style={{ 
                                backgroundColor: '#3182ce', 
                                color: 'white', 
                                border: 'none', 
                                padding: '18px', 
                                borderRadius: '12px', 
                                fontSize: '1.1rem', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(49, 130, 206, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Book with {data.fullName.split(' ')[0]}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideProfile;