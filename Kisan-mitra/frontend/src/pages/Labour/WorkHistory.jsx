import React, { useEffect, useState } from "react";
import API from "../../services/axiosClient";
import "./WorkHistory.css";

const WorkHistory = () => {
  const [applied, setApplied] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      // 1) load all vacancies
      const vacRes = await API.get("/labour/vacancies");

      // check where labour applied
      const myApplied = vacRes.data.vacancies.filter((v) =>
        v.applicants?.some(
          (a) =>
            a.labourId === vacRes.data.currentUser ||
            a.labourId?._id === vacRes.data.currentUser
        )
      );

      setApplied(myApplied);

      // 2) get work history
      const histRes = await API.get("/labour/work-history");
      setHistory(histRes.data.history || []);
    } catch (err) {
      console.error("WorkHistory error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="work-history-page">
      <h1>Work History</h1>

      {loading ? (
        <p className="loading">Loading your data...</p>
      ) : (
        <>
          {/* APPLIED JOBS */}
          <section className="section">
            <h2>Applied Jobs ({applied.length})</h2>

            {applied.length === 0 ? (
              <p className="empty">You haven't applied to any jobs yet.</p>
            ) : (
              <div className="card-list">
                {applied.map((v) => (
                  <div className="card" key={v._id}>
                    <h3>{v.title}</h3>
                    <p>{v.description}</p>

                    <div className="meta">
                      <span>
                        <strong>Status:</strong> {v.status}
                      </span>
                      <span>
                        <strong>Workers Needed:</strong> {v.numWorkers}
                      </span>
                      <span>
                        <strong>Rate/Day:</strong> ₹{v.ratePerDay}
                      </span>
                      {v.startDate && (
                        <span>
                          <strong>Start:</strong>{" "}
                          {new Date(v.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* WORK HISTORY */}
          <section className="section">
            <h2>Completed Work History ({history.length})</h2>

            {history.length === 0 ? (
              <p className="empty">No completed work history yet.</p>
            ) : (
              <div className="card-list">
                {history.map((h) => (
                  <div className="card" key={h._id}>
                    <h3>{h.vacancy?.title || "Unknown Work"}</h3>
                    <p>{h.vacancy?.description}</p>

                    <div className="meta">
                      <span>
                        <strong>Date:</strong>{" "}
                        {new Date(h.date).toLocaleDateString()}
                      </span>
                      <span>
                        <strong>Hours Worked:</strong> {h.hoursWorked}
                      </span>
                      <span>
                        <strong>Payment:</strong> ₹{h.payment}
                      </span>
                      <span>
                        <strong>Status:</strong> Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default WorkHistory;
