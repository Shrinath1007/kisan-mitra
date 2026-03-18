import { useState, useEffect, useMemo } from "react";
import machineService from "../../services/machineService";
import { useAuth } from "../../context/AuthContext";
import {
  FaCalendarAlt,
  FaRupeeSign,
  FaCheck,
  FaTimes,
  FaSync,
  FaFilter,
  FaTractor,
  FaSeedling,
} from "react-icons/fa";
import "./MachineOwnerBookings.css";

const MachineOwnerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch bookings
        const bookingsRes = await machineService.getOwnerBookings();
        console.log("Bookings data:", bookingsRes.data);

        if (bookingsRes.data.success) {
          const bookingsData = bookingsRes.data.bookings || [];
          console.log("Individual booking structure:", bookingsData[0]);
          setBookings(bookingsData);
        } else {
          setError(bookingsRes.data.message || "Failed to load bookings");
        }

        // Fetch statistics
        const statsRes = await machineService.getBookingStats();
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch bookings. Please try again."
        );
      } finally {
        setLoading(false);
        setLoadingStats(false);
      }
    };

    fetchData();
  }, [user, refresh]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to ${newStatus.toLowerCase()} this booking?`
      )
    ) {
      return;
    }

    try {
      const response = await machineService.updateBookingStatus(
        bookingId,
        newStatus
      );

      if (response.data.success) {
        // Update local state
        setBookings(
          bookings.map((booking) =>
            booking._id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );

        // Refresh stats
        const statsRes = await machineService.getBookingStats();
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }

        alert(`Booking ${newStatus.toLowerCase()} successfully!`);
      } else {
        alert(response.data.message || "Failed to update booking status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update booking status");
    }
  };

  const handleRefresh = () => {
    setRefresh(!refresh);
    setLoading(true);
    setLoadingStats(true);
  };

  const filteredBookings = useMemo(() => {
    console.log("Filtering bookings. Current filter:", filter);
    if (filter === "All") {
      bookings.forEach(booking => console.log("Filtered Booking (All):", booking.status, booking._id));
      return bookings;
    }
    const filtered = bookings.filter(
      (booking) => booking.status.toLowerCase() === filter.toLowerCase()
    );
    filtered.forEach(booking => console.log(`Filtered Booking (${filter}):`, booking.status, booking._id));
    return filtered;
  }, [filter, bookings]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const calculateHours = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
      
      const diffMs = end - start;
      const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
      
      return `${diffHours} hours`;
    } catch (error) {
      console.error("Error calculating hours:", error);
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>
            <FaTractor /> Booking Management
          </h1>
          <p className="subtitle">Manage all bookings for your agricultural machinery</p>
        </div>
        {/* <button className="refresh-btn" onClick={handleRefresh}>
          <FaSync /> Refresh
        </button> */}
      </div>

      {/* Stats Cards */}
      {!loadingStats && stats && (
        <div className="stats-cards">
          <div className="stat-card total">
            <h3>Total Bookings</h3>
            <div className="stat-value">{stats.totalBookings}</div>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <div className="stat-value">{stats.approved}</div>
          </div>
          <div className="stat-card completed">
            <h3>Completed</h3>
            <div className="stat-value">{stats.completed}</div>
          </div>
          <div className="stat-card revenue">
            <h3>Total Revenue</h3>
            <div className="stat-value">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <FaTimes /> {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-section">
        <div className="filter-header">
          <h3>
            <FaFilter /> Filter Bookings
          </h3>
          <div className="booking-count">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </div>
        <div className="filter-tabs">
          {[
            "All",
            "Pending",
            "Approved",
            "Completed",
            "Rejected",
            "Cancelled",
          ].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}{" "}
              {tab !== "All" &&
                `(${
                  bookings.filter(
                    (b) => b.status.toLowerCase() === tab.toLowerCase()
                  ).length
                })`}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bookings-table-container">
        {filteredBookings.length > 0 ? (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Farmer Details</th>
                <th>Machine Details</th>
                <th>Booking Date</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Booking Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="booking-row">
                  <td className="booking-id">#{booking._id.slice(-6)}</td>
                  <td className="farmer-details">
                    <div className="farmer-name">
                      {booking.farmer?.name || "N/A"}
                    </div>
                    <div className="farmer-contact">
                      {booking.farmer?.email || "No email"}
                      <br />
                      {booking.farmer?.phone || "No phone"}
                    </div>
                  </td>
                  <td className="machine-details">
                    {booking.machine?.photos && booking.machine.photos.length > 0 && (
                      <img
                        src={`http://localhost:5000/uploads/${booking.machine.photos[0]}`}
                        alt={booking.machine.name}
                        className="machine-photo"
                      />
                    )}
                    <div className="machine-name">
                      {booking.machine?.name || "N/A"}
                    </div>
                    <div className="machine-model">
                      {booking.machine?.model || "No model"}
                    </div>
                    <div className="machine-price">
                      ₹{booking.machine?.pricePerHour}/hour
                    </div>
                  </td>
                  <td className="booking-date">
                    <div className="date-info">
                      <strong>Start:</strong> {booking.date?.startDate ? formatDateTime(booking.date.startDate) : "N/A"}
                    </div>
                    <div className="date-info">
                      <strong>End:</strong> {booking.date?.endDate ? formatDateTime(booking.date.endDate) : "N/A"}
                    </div>
                    <div className="duration-info">
                      <strong>Duration:</strong> {booking.hours ? `${booking.hours} hours` : calculateHours(booking.date?.startDate, booking.date?.endDate)}
                    </div>
                  </td>
                  <td className="booking-amount">
                    <FaRupeeSign />{" "}
                    {booking.totalAmount?.toLocaleString() || "0"}
                  </td>
                  <td>
                    <span
                      className={`payment-status payment-${
                        booking.paymentStatus?.toLowerCase() || "pending"
                      }`}
                    >
                      {booking.paymentStatus || "Pending"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${
                        booking.status?.toLowerCase() || "pending"
                      }`}
                    >
                      {booking.status || "Pending"}
                    </span>
                  </td>
                  <td className="booking-actions">
                    {booking.status.toLowerCase() === "pending" ? (
                      <div className="action-buttons">
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, "Approved")
                          }
                          className="btn-approve"
                          title="Approve Booking"
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, "Rejected")
                          }
                          className="btn-reject"
                          title="Reject Booking"
                        >
                          <FaTimes /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="no-action">
                        {booking.status.toLowerCase() === "approved" 
                          ? "Waiting for booking period to end" 
                          : "No actions available"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-bookings">
            <div className="empty-state-icon">📅</div>
            <h3>No Bookings Found</h3>
            <p>
              {filter === "All"
                ? "You don't have any bookings yet. Bookings will appear here when farmers book your machines."
                : `No ${filter.toLowerCase()} bookings found.`}
            </p>
            <button onClick={() => setFilter("All")} className="btn-view-all">
              View All Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineOwnerBookings;
