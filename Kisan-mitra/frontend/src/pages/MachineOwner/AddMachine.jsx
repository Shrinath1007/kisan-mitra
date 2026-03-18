import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addMachine } from "../../services/ownerAPI";
import AddMachineForm from "../MachineOwner/AddMachineForm";

const AddMachine = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const handleAddMachine = async (payload) => {
    try {
      await addMachine(payload);
      setMsg("🎉 Machine added successfully!");
      setTimeout(() => {
        setMsg("");
        navigate("/owner/machines");
      }, 2000);
    } catch (err) {
      console.error("Add machine error:", err);
      setMsg("❌ Failed to add machine. Please try again.");
    }
  };

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-title">
          <h2>Add New Machine</h2>
          <p>Register your agricultural equipment</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate("/owner/machines")}
        >
          ← Back to Machines
        </button>
      </div>
      {msg && (
        <div
          className={`message-alert ${
            msg.includes("❌") ? "error" : "success"
          }`}
        >
          <span className="alert-icon">{msg.includes("❌") ? "⚠️" : "✅"}</span>
          {msg}
        </div>
      )}
      <AddMachineForm onAdd={handleAddMachine} />
    </section>
  );
};

export default AddMachine;
