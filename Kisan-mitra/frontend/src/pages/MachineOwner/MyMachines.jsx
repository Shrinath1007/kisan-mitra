import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import machineService from "../../services/machineService";
import MachineCard from "../../components/MachineOwner/MachineCard";
import { useAuth } from "../../context/AuthContext";

const MyMachines = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      loadMachines();
    }
  }, [user]);

  const loadMachines = async () => {
    try {
      // Use getMyMachines which correctly uses the auth token on the backend
      const res = await machineService.getMyMachines();
      const machineData = res.data.machines; // This endpoint returns { machines: [...] }
      setMachines(machineData || []);
    } catch (err) {
      console.error("Machines load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your machinery data...</p>
      </div>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title">
          <h2>My Machinery Fleet</h2>
          <p>Manage your agricultural equipment</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/machine-owner/add-machine")}
        >
          <span className="btn-icon">+</span>
          Add New Machine
        </button>
      </div>

      <div className="machine-grid">
        {machines.length > 0 ? (
          machines.map((machine) => (
            <MachineCard key={machine._id} machine={machine} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🚜</div>
            <h3>No machines yet</h3>
            <p>Add your first machine to get started</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/machine-owner/add-machine")}
            >
              Add Your First Machine
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MyMachines;
