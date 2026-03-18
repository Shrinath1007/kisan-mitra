import React, { useEffect, useState, useMemo } from "react";
import { FaStar, FaRegStar } from 'react-icons/fa';
import API from "../../services/axiosClient";
import { submitReview } from "../../services/bookingAPI";
import { BACKEND_URL } from "../../services/apiConfig";
import "./History.css";

// Star Rating Component for Display
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

// Interactive Star Rating for Review Submission
const InteractiveStarRating = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="interactive-star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hoverRating || rating) ? 'filled' : 'empty'}`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          {star <= (hoverRating || rating) ? <FaStar /> : <FaRegStar />}
        </button>
      ))}
    </div>
  );
};

// Review Modal Component
const ReviewModal = ({ booking, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(booking._id, { rating, comment });
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate Your Experience</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="machine-info">
            <h4>{booking.machine?.name} - {booking.machine?.model}</h4>
            <p>Booking completed on {new Date(booking.date?.endDate).toLocaleDateString()}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rating-section">
              <label>How would you rate this machine and service?</label>
              <InteractiveStarRating rating={rating} onRatingChange={setRating} />
              <div className="rating-labels">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="comment-section">
              <label htmlFor="comment">Share your experience (optional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell other farmers about your experience with this machine..."
                rows="4"
                maxLength="500"
              />
              <small>{comment.length}/500 characters</small>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={submitting || rating === 0} className="submit-btn">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const FarmerHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewModal, setReviewModal] = useState({ isOpen: false, booking: null });

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/booking/history");

      const data =
        res.data.bookings ||
        res.data.data ||
        (Array.isArray(res.data) ? res.data : []);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Fetch bookings error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load bookings. Ensure backend is running and the bookings route exists."
      );
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (bookingId, reviewData) => {
    try {
      await submitReview(bookingId, reviewData);
      // Refresh bookings to show the new review
      await fetchBookings();
      alert('Review submitted successfully!');
    } catch (error) {
      throw error;
    }
  };

  const openReviewModal = (booking) => {
    setReviewModal({ isOpen: true, booking });
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, booking: null });
  };

  const totals = useMemo(() => {
    const totalAmount = bookings.reduce((s, b) => s + (b.amount || 0), 0);
    const totalBookings = bookings.length;
    return { totalAmount, totalBookings };
  }, [bookings]);

  const fmt = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <h1>Booking History</h1>
        <div className="history-summary">
          <span>Total bookings: {totals.totalBookings}</span>
          <span>Total spent: ₹{totals.totalAmount}</span>
        </div>
      </header>

      {loading ? (
        <div className="history-loading">Loading your bookings …</div>
      ) : error ? (
        <div className="history-error">
          <div>{error}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={fetchBookings}>Retry</button>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="history-empty">You have no bookings yet.</div>
      ) : (
        <div className="history-list">
          {bookings.map((booking) => {
            // SAFE DESTRUCTURING: set default for machine
            const machine = booking.machine || {};
            const photo =
              machine.photos && machine.photos.length > 0
                ? machine.photos[0]
                : null;

            return (
              <div key={booking._id} className="history-card">
                {/* LEFT: IMAGE */}
                <div className="hc-left">
                  <img
                    src={
                      photo 
                        ? `${BACKEND_URL}${photo}`
                        : "https://cdn-icons-png.flaticon.com/512/1048/1048942.png"
                    }
                    alt={machine.name || "Machine"}
                    className="hc-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://cdn-icons-png.flaticon.com/512/1048/1048942.png";
                    }}
                  />
                </div>

                {/* MIDDLE: MACHINE & BOOKING DETAILS */}
                <div className="hc-middle">
                  <div className="hc-title">{machine.name || "N/A"}</div>
                  <div className="hc-sub">
                    {machine.model || "N/A"} ({machine.type || "N/A"})
                  </div>
                  <div className="hc-dates">
                    <strong>Start:</strong> {fmt(booking.date?.startDate)}
                    <br />
                    <strong>End:</strong> {fmt(booking.date?.endDate)}
                  </div>
                  <div className="hc-meta">
                    Booked on: {fmt(booking.createdAt)}
                  </div>
                </div>

                {/* RIGHT: STATUS & FINANCIALS */}
                <div className="hc-right">
                  <div className="hc-row">
                    <span>Amount</span>
                    <strong>
                      ₹{booking.totalAmount?.toLocaleString() || 0}
                    </strong>
                  </div>
                  <div className="hc-row">
                    <span>Payment</span>
                    <strong className={`badge ${booking.paymentStatus}`}>
                      {booking.paymentStatus === "refunded" ? "Refunded to Wallet" : (booking.paymentStatus || "unpaid")}
                    </strong>
                  </div>
                  <div className="hc-row">
                    <span>Status</span>
                    <strong className={`badge status-${booking.status}`}>
                      {booking.status || "pending"}
                    </strong>
                  </div>

                  {/* Refund notice */}
                  {booking.status === "rejected" && booking.paymentStatus === "refunded" && (
                    <div className="refund-notice">
                      💰 ₹{booking.totalAmount?.toLocaleString() || 0} refunded to your wallet
                    </div>
                  )}
                  
                  {/* Review Section */}
                  {booking.status === 'completed' && (
                    <div className="review-section">
                      {booking.review && booking.review.rating ? (
                        <div className="existing-review">
                          <div className="review-header">
                            <span>Your Review:</span>
                            <StarRating rating={booking.review.rating} />
                          </div>
                          {booking.review.comment && (
                            <p className="review-comment">"{booking.review.comment}"</p>
                          )}
                          <small className="review-date">
                            Reviewed on {new Date(booking.review.reviewedAt).toLocaleDateString()}
                          </small>
                        </div>
                      ) : (
                        <button 
                          className="review-btn"
                          onClick={() => openReviewModal(booking)}
                        >
                          ⭐ Write Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        booking={reviewModal.booking}
        isOpen={reviewModal.isOpen}
        onClose={closeReviewModal}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default FarmerHistory;
