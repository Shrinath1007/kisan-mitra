import React from "react";
import "./PredictionCard.css";

const PredictionCard = ({ pred }) => {
  if (!pred)
    return <div className="prediction-card">No predictions available</div>;

  return (
    <div className="prediction-card">
      <h3>{pred.title || "Labour Demand Forecast"}</h3>

      <div className="prediction-list">
        {pred.predictions?.map((p) => (
          <div className="prediction-item" key={p.date}>
            <div>
              <h4>{p.dayOfWeek}</h4>
              <small>{p.date}</small>
            </div>
            <strong>{p.predictedDemand} labourers</strong>
          </div>
        ))}
      </div>

      <div className="prediction-recommendation">
        <strong>AI Suggestion:</strong>
        <p>{pred.recommendation}</p>
      </div>
    </div>
  );
};

export default PredictionCard;
