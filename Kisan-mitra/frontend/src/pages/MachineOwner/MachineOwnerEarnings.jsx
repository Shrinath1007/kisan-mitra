import { useState, useEffect } from 'react';
import machineService from '../../services/machineService';
import { useAuth } from '../../context/AuthContext';
import { FaRupeeSign, FaTractor, FaSeedling, FaLeaf } from 'react-icons/fa';
import './MachineOwnerEarnings.css';

const MachineOwnerEarnings = () => {
  const { user } = useAuth();
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        console.log("Fetching earnings...");
        
        const res = await machineService.getOwnerBookings({
          status: 'completed',
          paymentStatus: 'paid'
        });
        
        console.log("Response:", res);
        
        if (res.data && res.data.success) {
          setCompletedBookings(res.data.bookings || []);
        } else {
          setCompletedBookings([]);
        }
      } catch (err) {
        console.error("Error:", err);
        setError('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchEarnings();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Calculate total earnings (90% after 10% platform fee)
  const totalGross = completedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const totalNet = Math.round(totalGross * 0.9);
  const platformFee = totalGross - totalNet;

  if (loading) {
    return (
      <div className="earnings-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading your agricultural earnings...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="earnings-container">
        <div className="error-container">
          <h2 className="error-message">Error: {error}</h2>
          <button 
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="earnings-container">
      {/* Enhanced Header */}
      <div className="earnings-header">
        <h1>My Agricultural Earnings</h1>
        <p className="subtitle">Track your machinery rental income and farming business growth</p>
      </div>
      
      {/* Enhanced Summary Cards */}
      <div className="earnings-summary-grid">
        <div className="earnings-summary-card total">
          <div className="summary-icon">
            <FaRupeeSign />
          </div>
          <div className="summary-details">
            <p>Total Net Earnings</p>
            <h2>₹{totalNet.toLocaleString()}</h2>
            <small>After 10% platform fee</small>
          </div>
        </div>
        
        <div className="earnings-summary-card daily">
          <div className="summary-icon">
            <FaTractor />
          </div>
          <div className="summary-details">
            <p>Total Bookings</p>
            <h2>{completedBookings.length}</h2>
            <small>Completed transactions</small>
          </div>
        </div>
        
        <div className="earnings-summary-card monthly">
          <div className="summary-icon">
            💵
          </div>
          <div className="summary-details">
            <p>Gross Revenue</p>
            <h2>₹{totalGross.toLocaleString()}</h2>
            <small>Before platform fee</small>
          </div>
        </div>
      </div>

      {/* Enhanced Earnings Breakdown */}
      <div className="earnings-breakdown">
        <h3>Earnings Breakdown</h3>
        <div className="breakdown-items">
          <div className="breakdown-item">
            <span className="breakdown-label">Gross Revenue:</span>
            <span className="breakdown-value positive">₹{totalGross.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Platform Commission (10%):</span>
            <span className="breakdown-value negative">-₹{platformFee.toLocaleString()}</span>
          </div>
          <div className="breakdown-item highlight">
            <span className="breakdown-label">Your Net Earnings:</span>
            <span className="breakdown-value highlight">₹{totalNet.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Earnings Table */}
      <div className="table-wrapper">
        <h3>Earnings History ({completedBookings.length} transactions)</h3>
        
        {completedBookings.length > 0 ? (
          <div className="table-container">
            <table className="earnings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Booking ID</th>
                  <th>Machine</th>
                  <th>Farmer</th>
                  <th>Gross Amount</th>
                  <th>Your Share (90%)</th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.map(booking => (
                  <tr key={booking._id}>
                    <td>
                      {new Date(booking.updatedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <span className="booking-id">
                        #{booking._id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="machine-name">
                      {booking.machine?.name || 'N/A'}
                    </td>
                    <td className="farmer-name">
                      {booking.farmer?.name || 'N/A'}
                    </td>
                    <td className="gross-amount">
                      ₹{(booking.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="net-amount">
                      ₹{Math.round((booking.totalAmount || 0) * 0.9).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-earnings">
            <div className="empty-state-icon">💰</div>
            <h3>No Earnings Yet</h3>
            <p>
              You haven't received any payments yet. Earnings will appear here when farmers complete bookings and make payments for your agricultural machinery.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineOwnerEarnings;