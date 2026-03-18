import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { getOwnerRatings } from '../../services/bookingAPI';
import './MachineOwnerRatingsFeedback.css';

// Star rating component
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const emptyStars = totalStars - fullStars;
  return (
    <div className="star-rating">
      {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
      {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} />)}
    </div>
  );
};

const MachineOwnerRatingsFeedback = () => {
  const [ratingsData, setRatingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOwnerRatings();
      
      if (response.data.success) {
        setRatingsData(response.data.data);
      } else {
        setError('Failed to fetch ratings data');
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err.response?.data?.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="ratings-container">
        <div className="list-header">
          <h1>Ratings & Feedback</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your ratings and reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ratings-container">
        <div className="list-header">
          <h1>Ratings & Feedback</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Ratings</h3>
          <p>{error}</p>
          <button onClick={fetchRatings} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ratings-container">
      <div className="list-header">
        <h1>Ratings & Feedback</h1>
        <p>See what farmers think about your machines and service</p>
      </div>

      {ratingsData && ratingsData.totalReviews > 0 ? (
        <>
          <div className="overall-rating-card">
            <div className="rating-details">
              <p>Overall Average Rating</p>
              <div className="rating-value">
                {ratingsData.averageRating.toFixed(1)} <span className="out-of">/ 5</span>
              </div>
              <StarRating rating={ratingsData.averageRating} />
              <p className="total-reviews">Based on {ratingsData.totalReviews} review{ratingsData.totalReviews !== 1 ? 's' : ''}</p>
            </div>
            
            {/* Rating Distribution */}
            <div className="rating-distribution">
              <h4>Rating Breakdown</h4>
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="rating-bar">
                  <span className="star-label">{star} ⭐</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${ratingsData.totalReviews > 0 ? (ratingsData.ratingDistribution[star] / ratingsData.totalReviews) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="count">({ratingsData.ratingDistribution[star]})</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="reviews-section">
            <h3>Recent Reviews ({ratingsData.reviews.length})</h3>
            <div className="feedback-list">
              {ratingsData.reviews.map(review => (
                <div key={review.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="reviewer-info">
                      <span className="farmer-name">👨‍🌾 {review.farmerName}</span>
                      <span className="reviewer-badge">Verified Farmer</span>
                    </div>
                    <span className="feedback-date">{formatDate(review.date)}</span>
                  </div>
                  <div className="feedback-body">
                    <p><strong>Machine:</strong> {review.machineName}</p>
                    <div className="rating-row">
                      <StarRating rating={review.rating} />
                      <span className="rating-number">({review.rating}/5)</span>
                    </div>
                    {review.comment && (
                      <p className="comment">"{review.comment}"</p>
                    )}
                    <div className="booking-info">
                      <small>Booking completed on {new Date(review.bookingDate.endDate).toLocaleDateString()}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No Reviews Yet</h3>
          <p>Ratings will appear after farmers complete bookings and submit reviews.</p>
          <div className="empty-tips">
            <h4>💡 Tips to get more reviews:</h4>
            <ul>
              <li>Provide excellent service and well-maintained machines</li>
              <li>Be responsive to booking requests</li>
              <li>Complete bookings on time</li>
              <li>Follow up with farmers after completed jobs</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineOwnerRatingsFeedback;
