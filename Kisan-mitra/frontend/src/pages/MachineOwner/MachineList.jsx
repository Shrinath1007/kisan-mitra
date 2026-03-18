import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import machineService from "../../services/machineService";
import { useAuth } from "../../context/AuthContext";
import { BACKEND_URL } from "../../services/apiConfig";
import { FaPlus, FaEdit, FaTrash, FaEye, FaImage, FaTractor, FaSeedling } from "react-icons/fa";
import "./MachineList.css";

const MachineList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const defaultImg = "https://cdn-icons-png.flaticon.com/512/1048/1048942.png"; // fallback image

  // Load Only Owner Machines
  useEffect(() => {
    const loadMachines = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const res = await machineService.getMyMachines();

        // Check if response structure is correct
        console.log("Machines API response:", res.data);

        // Handle different response structures
        if (res.data.machines) {
          setMachines(res.data.machines);
        } else if (Array.isArray(res.data)) {
          setMachines(res.data);
        } else {
          setMachines([]);
        }
      } catch (err) {
        console.error("Error loading machines:", err);
        setError(err.response?.data?.message || "Failed to load machines");
      } finally {
        setLoading(false);
      }
    };

    loadMachines();
  }, [user]);

  // Delete Machine
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this machine?"))
      return;

    try {
      await machineService.deleteMachine(id);
      setMachines(machines.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete machine.");
    }
  };

  // UI: Loading State
  if (loading) {
    return <div className="machine-loading">Loading your machines...</div>;
  }

  // UI: Error State
  if (error) {
    return <div className="machine-error">{error}</div>;
  }

  return (
    <div className="machine-list-container">
      {/* Header */}
      <div className="machine-list-header">
        <h1>Your Machinery Fleet</h1>
        <button
          className="add-machine-btn"
          onClick={() => navigate("/machine-owner/add-machine")}
        >
          <FaPlus /> Add New Machine
        </button>
      </div>

      {/* When No Machines */}
      {machines.length === 0 && (
        <div className="no-machines">
          <h2>No Machines in Your Fleet</h2>
          <p>Start building your agricultural machinery business by adding your first machine.</p>

          <button
            className="add-machine-btn"
            onClick={() => navigate("/machine-owner/add-machine")}
          >
            <FaPlus /> Add Your First Machine
          </button>
        </div>
      )}

      {/* Machine Cards */}
      <div className="machines-grid">
        {machines.map((machine) => (
          <div key={machine._id} className="machine-card">
            {/* Machine Image */}
            <div className="machine-image-box">
              {machine.photos && machine.photos.length > 0 ? (
                <img
                  src={`${BACKEND_URL}${machine.photos[0]}`}
                  alt={machine.name}
                  className="machine-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultImg;
                  }}
                />
              ) : (
                <div className="image-placeholder">
                  <FaImage size={40} />
                  <span>No Image</span>
                </div>
              )}
              {machine.photos && machine.photos.length > 1 && (
                <div className="image-count">
                  +{machine.photos.length - 1} more
                </div>
              )}
            </div>

            {/* Machine Info */}
            <div className="machine-info">
              <h3>{machine.name}</h3>

              <p>
                <strong>Model:</strong> {machine.model}
              </p>

              <p>
                <strong>Type:</strong> {machine.type}
              </p>

              <p>
                <strong>Price/hr:</strong> ₹{machine.pricePerHour}
              </p>

              <p>
                <strong>Location:</strong> {machine.location?.address || "N/A"}
              </p>

              <p>
                <strong>Availability:</strong>{" "}
                <span
                  className={
                    machine.availability
                      ? "status-available"
                      : "status-unavailable"
                  }
                >
                  {machine.availability ? "Available" : "Unavailable"}
                </span>
              </p>

              <p>
                <strong>Total Bookings:</strong>{" "}
                <span className="booking-count">
                  {machine.bookingCount || 0}
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="machine-actions">
              <Link
                to={`/machine-owner/machine/${machine._id}`}
                className="action-btn view-btn"
              >
                <FaEye /> View
              </Link>

              <Link
                to={`/machine-owner/edit-machine/${machine._id}`}
                className="action-btn edit-btn"
              >
                <FaEdit /> Edit
              </Link>

              <button
                onClick={() => handleDelete(machine._id)}
                className="action-btn delete-btn"
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MachineList;
