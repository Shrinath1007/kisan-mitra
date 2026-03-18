import { useState, useEffect } from "react";
import { FaTractor, FaClock, FaRupeeSign, FaFilter, FaLeaf, FaSeedling } from "react-icons/fa";
import machineService from "../../services/machineService";
import walletService from "../../services/walletService";
import { useAuth } from "../../context/AuthContext";
import "./MachineOwnerDashboard.css";

const StatCard = ({ icon, title, value, color, delay = 0 }) => (
  <div className="stat-card" style={{ borderLeftColor: color, animationDelay: `${delay}ms` }}>
    <div className="stat-card-icon" style={{ backgroundColor: `${color}20`, color: color }}>
      {icon}
    </div>
    <div className="stat-card-info">
      <p>{title}</p>
      <span className="count-up" data-target={typeof value === 'string' ? value : value}>
        {value}
      </span>
    </div>
    <div className="stat-card-bg-icon">{icon}</div>
  </div>
);

const MachineOwnerDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalMachines: 0,
    pendingBookings: 0,
  });
  const [wallet, setWallet] = useState(null); // Add state for wallet
  const [error, setError] = useState(null); // Add error state

  const [recentBookings, setRecentBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings for filtering
  const [aiWeather, setAiWeather] = useState([]);
  const [aiTasks, setAiTasks] = useState([]);
  const [aiMachinery, setAiMachinery] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("24h");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        console.log("Loading dashboard for user:", user?.name, "Role:", user?.role);

        const ownerId = user?._id;

        // Load each API separately to identify which one is failing
        let myMachines, bookingsRes, weatherRes, machineryRes, walletRes;

        try {
          console.log("Fetching machines...");
          myMachines = await machineService.getMyMachines();
          console.log("Machines response:", myMachines);
          
          // Additional validation
          if (!myMachines || !myMachines.data) {
            console.error("Invalid machines response structure:", myMachines);
            throw new Error("Invalid machines response structure");
          }
        } catch (error) {
          console.error("Failed to fetch machines:", error);
          console.error("Error details:", {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          myMachines = { data: { machines: [] } };
        }

        try {
          console.log("Fetching bookings...");
          bookingsRes = await machineService.getOwnerBookings(ownerId);
          console.log("Bookings response:", bookingsRes);
          
          // Additional validation
          if (!bookingsRes || !bookingsRes.data) {
            console.error("Invalid bookings response structure:", bookingsRes);
            throw new Error("Invalid bookings response structure");
          }
        } catch (error) {
          console.error("Failed to fetch bookings:", error);
          console.error("Error details:", {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          bookingsRes = { data: { bookings: [] } };
        }

        try {
          console.log("Fetching wallet...");
          walletRes = await walletService.getWallet();
          console.log("Wallet response:", walletRes);
          
          // Additional validation
          if (!walletRes) {
            console.error("Invalid wallet response structure:", walletRes);
            throw new Error("Invalid wallet response structure");
          }
        } catch (error) {
          console.error("Failed to fetch wallet:", error);
          console.error("Error details:", {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          walletRes = { success: false, data: null };
        }

        try {
          console.log("Fetching weather...");
          weatherRes = await machineService.getAIWeatherPrediction({
            city: user?.city || "Delhi",
          });
          console.log("Weather response:", weatherRes);
        } catch (error) {
          console.error("Failed to fetch weather:", error);
          weatherRes = { data: { weather: [], tasks: [] } };
        }

        try {
          console.log("Fetching machinery demand...");
          machineryRes = await machineService.getAIMachineryDemand();
          console.log("Machinery response:", machineryRes);
        } catch (error) {
          console.error("Failed to fetch machinery demand:", error);
          machineryRes = { data: {} };
        }

        const machines = myMachines.data?.machines || [];
        const bookings = bookingsRes.data?.bookings || [];

        console.log("Processed data:", {
          machinesCount: machines.length,
          bookingsCount: bookings.length,
          walletData: walletRes.data
        });

        // Store all bookings for filtering
        setAllBookings(bookings);

        // ------------------- Stats -------------------
        const pending = bookings.filter((b) => b.status === "pending").length;

        setStats({
          totalMachines: machines.length,
          pendingBookings: pending,
        });

        if (walletRes.success && walletRes.data) {
          setWallet(walletRes.data); // Set wallet data
        } else {
          console.warn("Wallet data not available:", walletRes);
        }

        // Apply filters to get recent bookings (will be updated by useEffect when filters change)
        const filteredBookings = bookings.filter((b) => new Date(b.createdAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000));
        setRecentBookings(filteredBookings.slice(0, 5));

        // ------------------ AI Data -------------------
        setAiWeather(weatherRes.data?.weather || []);
        setAiTasks(weatherRes.data?.tasks || []);
        setAiMachinery(machineryRes.data || {});
      } catch (err) {
        console.error("Dashboard Load Failed:", err);
        setError("Failed to load dashboard data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      // Validate user has the correct role
      if (!['owner', 'farmer'].includes(user.role)) {
        console.error("User does not have owner or farmer role:", user.role);
        setLoading(false);
        return;
      }
      
      loadDashboard();
    } else {
      console.warn("No user found, cannot load dashboard");
      setLoading(false);
    }
  }, [user]);

  // Filter function
  const applyFilters = (bookings, status, time) => {
    let filtered = [...bookings];

    // Apply status filter
    if (status !== "All") {
      filtered = filtered.filter(booking => 
        booking.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply time filter
    const now = new Date();
    let cutoffTime;
    
    switch (time) {
      case "24h":
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = null;
    }

    if (cutoffTime) {
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= cutoffTime
      );
    }

    return filtered;
  };

  // Update bookings when filters change
  useEffect(() => {
    if (allBookings.length > 0) {
      const filteredBookings = applyFilters(allBookings, statusFilter, timeFilter);
      setRecentBookings(filteredBookings.slice(0, 5));
    }
  }, [statusFilter, timeFilter, allBookings]);

  if (loading)
    return <div className="loading-spinner">Loading Dashboard...</div>;

  // Show error if user doesn't have correct role
  if (user && !['owner', 'farmer'].includes(user.role)) {
    return (
      <div className="owner-dashboard">
        <div className="error-message" style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '20px', 
          borderRadius: '5px',
          textAlign: 'center',
          margin: '20px'
        }}>
          <h2>Access Denied</h2>
          <p>This dashboard is only available for machine owners and farmers.</p>
          <p>Your current role: <strong>{user.role}</strong></p>
        </div>
      </div>
    );
  }

  // Show error if API calls failed
  if (error) {
    return (
      <div className="owner-dashboard">
        <div className="error-message" style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '20px', 
          borderRadius: '5px',
          textAlign: 'center',
          margin: '20px'
        }}>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      {/* Animated Background Elements */}
      <div className="dashboard-background">
        <div className="floating-tractor"></div>
        <div className="floating-ox"></div>
        <div className="floating-seeds"></div>
        <div className="field-pattern"></div>
      </div>

      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Welcome, {user?.name}!</h1>
            <p>Manage your agricultural machinery and grow your farming business</p>
          </div>
          <div className="hero-animation">
            <div className="animated-tractor">
              <FaTractor />
            </div>
            <div className="animated-field">
              <FaLeaf />
              <FaSeedling />
              <FaLeaf />
            </div>
          </div>
        </div>
      </div>

      {/* ------------ STATS ------------- */}
      <div className="stats-grid">
        <StatCard
          icon={<FaTractor />}
          title="Total Machines"
          value={stats.totalMachines}
          color="#1976d2"
          delay={0}
        />

        <StatCard
          icon={<FaClock />}
          title="Pending Bookings"
          value={stats.pendingBookings}
          color="#fbc02d"
          delay={200}
        />

        <StatCard
          icon={<FaRupeeSign />}
          title="Wallet Balance"
          value={wallet ? `₹${wallet.balance.toLocaleString()}` : "₹0"}
          color="#388e3c"
          delay={400}
        />
      </div>

      <div className="dashboard-columns">
        {/* ----------- RECENT BOOKINGS ------------ */}
        <div className="dashboard-card">
          <div className="bookings-header">
            <h2>Recent Bookings</h2>
            
            {/* Filter Controls */}
            <div className="dashboard-filters">
              <div className="filter-group">
                <label htmlFor="status-filter">
                  <FaFilter /> Status:
                </label>
                <select 
                  id="status-filter"
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="time-filter">Time:</label>
                <select 
                  id="time-filter"
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="All">All Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Machine</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.farmer?.name}</td>
                      <td>{b.machine?.name}</td>
                      <td>{new Date(b.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge status-${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No recent bookings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ----------- AI WEATHER + TASKS + MACHINE DEMAND ------------ */}
        <div className="dashboard-card ai-advisory">
          <h2>AI Forecast & Workload Estimates</h2>

          <h4>Weather (Next 7 Days)</h4>
          <div className="weather-forecast">
            {aiWeather.slice(0, 5).map((day, i) => (
              <div key={i} className="weather-day">
                <strong>{day.date}</strong>
                <p>Rain: {day.rainChance}%</p>
                <p>Temp: {day.temp}°C</p>
              </div>
            ))}
          </div>

          <h4>AI Recommended Tasks</h4>
          <ul className="ai-tasks">
            {aiTasks.slice(0, 5).map((t, i) => (
              <li key={i}>{t.task}</li>
            ))}
          </ul>

          <h4>AI Machinery Demand</h4>
          <div className="machinery-demand">
            <p>Tractor Demand: {aiMachinery.tractorDemand}%</p>
            <p>Harvester Demand: {aiMachinery.harvesterDemand}%</p>
            <p>Peak Hours: {aiMachinery.peakHours?.join(", ")}</p>
            <p>Expected Earnings: ₹{aiMachinery.predictedEarnings}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineOwnerDashboard;