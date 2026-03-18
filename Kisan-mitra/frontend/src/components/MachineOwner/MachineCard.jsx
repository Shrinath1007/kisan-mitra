import React from "react";
import "./MachineCard.css";

const MachineCard = ({ machine }) => {
  return (
    <div className="machine-card">
      <div className="machine-header">
        <h3>{machine.name}</h3>
        <span className={`status ${machine.status}`}>{machine.status}</span>
      </div>
      <div className="machine-details">
        <p>
          <strong>Type:</strong> {machine.type}
        </p>
        <p>
          <strong>Model:</strong> {machine.model}
        </p>
        <p>
          <strong>Year:</strong> {machine.year}
        </p>
        <p>
          <strong>Rate:</strong> ₹{machine.ratePerDay}/day
        </p>
        <p>
          <strong>Location:</strong> {machine.location}
        </p>
      </div>
      <div className="machine-actions">
        <button className="btn-edit">Edit</button>
        <button className="btn-delete">Delete</button>
      </div>
    </div>
  );
};

export default MachineCard;
