import React from "react";
import "./AIRecommendation.css";

const AIRecommendation = ({ data }) => {
  if (!data) {
    return (
      <div className="ai-recommendation-placeholder">
        <p>No AI recommendations available at the moment.</p>
      </div>
    );
  }

  const { weather, tasks } = data;

  return (
    <div className="ai-recommendation">
      <div className="ai-weather-section">
        <h4>Weather Forecast &amp; Advice</h4>
        <p className="weather-summary">{weather?.summary}</p>
        <div className="weather-details-grid">
          <div className="weather-detail">
            <span>Temperature:</span>
            <strong>{weather?.temp_c}°C</strong>
          </div>
          <div className="weather-detail">
            <span>Humidity:</span>
            <strong>{weather?.humidity}%</strong>
          </div>
          <div className="weather-detail">
            <span>Wind Speed:</span>
            <strong>{weather?.wind_kph} km/h</strong>
          </div>
        </div>
      </div>

      <div className="ai-tasks-section">
        <h4>Recommended Tasks</h4>
        {tasks && tasks.length > 0 ? (
          <ul className="task-list">
            {tasks.map((task, index) => (
              <li key={index} className="task-item">
                <span className="task-icon">✅</span>
                <p className="task-description">{task.task}</p>
                <span className="task-priority">Priority: {task.priority}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No specific tasks recommended at this time.</p>
        )}
      </div>
    </div>
  );
};

export default AIRecommendation;