import React from "react";
// import "./WorkHistory.css";

const WorkHistory = ({ history }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to the beginning of the day for accurate comparison

  const completedWork = history.filter(
    (job) => new Date(job.date) <= today
  );
  const upcomingWork = history.filter(
    (job) => new Date(job.date) > today
  );

  return (
    <div className="work-history">
      <div className="completed-work">
        <h3>Completed Work</h3>
        <div className="history-list">
          {completedWork.length > 0 ? (
            completedWork.map((job) => (
              <div key={job._id} className="history-item">
                <div className="history-header">
                  <h4>{job.farmName || "Farm Work"}</h4>
                  <span className="history-date">
                    {new Date(job.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="history-details">
                  <p>
                    <strong>Farmer:</strong> {job.farmer?.name || "Unknown"}
                  </p>
                  <p>
                    <strong>Hours:</strong> {job.hours || "8"}
                  </p>
                  <p>
                    <strong>Earnings:</strong> ₹{job.earnings || "0"}
                  </p>
                  <p>
                    <strong>Rating:</strong> {job.rating || "N/A"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-history">No completed work history available.</p>
          )}
        </div>
      </div>

      <div className="upcoming-work">
        <h3>Upcoming Work</h3>
        <div className="history-list">
          {upcomingWork.length > 0 ? (
            upcomingWork.map((job) => (
              <div key={job._id} className="history-item">
                <div className="history-header">
                  <h4>{job.farmName || "Farm Work"}</h4>
                  <span className="history-date">
                    {new Date(job.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="history-details">
                  <p>
                    <strong>Farmer:</strong> {job.farmer?.name || "Unknown"}
                  </p>
                  <p>
                    <strong>Hours:</strong> {job.hours || "8"}
                  </p>
                  <p>
                    <strong>Earnings:</strong> ₹{job.earnings || "0"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-history">No upcoming work scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkHistory;
