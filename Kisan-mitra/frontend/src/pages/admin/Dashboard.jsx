import React, { useState, useEffect } from "react";
import { FaUsers, FaTractor, FaHardHat, FaWallet } from "react-icons/fa";
import adminService from "../../services/adminService";
import adminwalletService from "../../services/adminwalletService";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboard.css";

const StatCard = ({ icon, title, value, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-info">
      <p>{title}</p>
      <span>{value}</span>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [labours, setLabours] = useState([]);
  const [view, setView] = useState("");
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load wallet data when component mounts
    if (user && user.role === "admin") {
      loadWallet();
    }
  }, [user]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await adminwalletService.getWallet();
      if (res.success) {
        setWallet(res.data);
      }
    } catch (error) {
      console.error("Failed to load wallet", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const loadFarmers = async () => {
    try {
      const res = await adminService.getFarmers();
      setFarmers(res.data.farmers || []);
      setView("farmers");
    } catch (error) {
      console.error("Failed to load farmers:", error);
      alert("Failed to load farmers. Please try again.");
    }
  };

  const deleteFarmer = async (id) => {
    if (!confirm("Delete Farmer?")) return;
    try {
      await adminService.deleteFarmer(id);
      setFarmers(farmers.filter((f) => f._id !== id));
    } catch (error) {
      console.error("Failed to delete farmer:", error);
      alert("Failed to delete farmer. Please try again.");
    }
  };

  const loadMachines = async () => {
    try {
      const res = await adminService.getMachines();
      setMachines(res.data.machines || []);
      setView("machines");
    } catch (error) {
      console.error("Failed to load machines:", error);
      alert("Failed to load machines. Please try again.");
    }
  };

  const deleteMachine = async (id) => {
    if (!confirm("Delete Machine?")) return;
    try {
      await adminService.deleteMachine(id);
      setMachines(machines.filter((m) => m._id !== id));
    } catch (error) {
      console.error("Failed to delete machine:", error);
      alert("Failed to delete machine. Please try again.");
    }
  };

  const loadLabours = async () => {
    try {
      const res = await adminService.getLabours();
      setLabours(res.data.labours || []);
      setView("labours");
    } catch (error) {
      console.error("Failed to load labours:", error);
      alert("Failed to load labours. Please try again.");
    }
  };

  const deleteLabour = async (id) => {
    if (!confirm("Delete Labour?")) return;
    try {
      await adminService.deleteLabour(id);
      setLabours(labours.filter((l) => l._id !== id));
    } catch (error) {
      console.error("Failed to delete labour:", error);
      alert("Failed to delete labour. Please try again.");
    }
  };

  return (
    <div className="admin-container">
      {!user || user.role !== "admin" ? (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Admin Access Required 🔐</h2>
            <p>Please login as admin from the main login page to access the admin dashboard.</p>
            <button 
              className="popup-btn" 
              onClick={() => window.location.href = "/login"}
            >
              Go to Login
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-header">
            <h1 className="admin-heading">Admin Dashboard 🛠️</h1>
            <div className="admin-user-info">
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout} className="main-btn logout-btn">
                Logout
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <p>Loading admin data...</p>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={<FaWallet />}
                  title="Platform Earnings"
                  value={`₹${wallet ? wallet.balance.toLocaleString() : "0"}`}
                  color="#388e3c"
                />
                <StatCard
                  icon={<FaUsers />}
                  title="Total Farmers"
                  value={farmers.length}
                  color="#1976d2"
                />
                <StatCard
                  icon={<FaTractor />}
                  title="Total Machines"
                  value={machines.length}
                  color="#f57c00"
                />
                <StatCard
                  icon={<FaHardHat />}
                  title="Total Workers"
                  value={labours.length}
                  color="#7b1fa2"
                />
              </div>

              <div className="nav-buttons">
                <button onClick={loadFarmers} className="main-btn">
                  📜 Manage Farmers
                </button>
                <button onClick={loadMachines} className="main-btn">
                  🚜 Manage Machines
                </button>
                <button onClick={loadLabours} className="main-btn">
                  👷 Manage Workers
                </button>
              </div>
            </>
          )}

          {view === "farmers" && (
            <div className="table-box">
              <h2>Farmers List ({farmers.length})</h2>
              {farmers.length === 0 ? (
                <p>No farmers found.</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmers.map((f) => (
                        <tr key={f._id}>
                          <td>{f.name}</td>
                          <td>{f.email}</td>
                          <td>{f.phone || "NA"}</td>
                          <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => deleteFarmer(f._id)}
                            >
                              ❌ Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "machines" && (
            <div className="table-box">
              <h2>Machines List ({machines.length})</h2>
              {machines.length === 0 ? (
                <p>No machines found.</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Owner</th>
                        <th>Contact</th>
                        <th>Price/Hour</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machines.map((m) => (
                        <tr key={m._id}>
                          <td>{m.name}</td>
                          <td>{m.type}</td>
                          <td>{m.owner?.name}</td>
                          <td>{m.owner?.phone || "NA"}</td>
                          <td>₹{m.pricePerHour}</td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => deleteMachine(m._id)}
                            >
                              ❌ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "labours" && (
            <div className="table-box">
              <h2>Workers List ({labours.length})</h2>
              {labours.length === 0 ? (
                <p>No workers found.</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labours.map((l) => (
                        <tr key={l._id}>
                          <td>{l.name}</td>
                          <td>{l.email}</td>
                          <td>{l.phone || "NA"}</td>
                          <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => deleteLabour(l._id)}
                            >
                              ❌ Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
