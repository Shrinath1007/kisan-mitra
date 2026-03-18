import { useState } from "react";
import API from "../../services/axiosClient";
import "./VacanciesList.css";

const VacanciesList = ({ vacancies, userId }) => {
  const [applyingId, setApplyingId] = useState(null);

  // Helper function to get expiration status
  const getExpirationStatus = (vacancy) => {
    if (!vacancy.startDate) return null;
    
    const currentDate = new Date();
    const startDate = new Date(vacancy.startDate);
    const timeDiff = startDate.getTime() - currentDate.getTime();
    const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (currentDate > startDate) {
      return {
        isExpired: true,
        message: `Expired on ${startDate.toLocaleDateString()} (start date passed)`,
        className: 'expired'
      };
    } else if (daysUntilExpiration <= 1) {
      return {
        isExpired: false,
        message: daysUntilExpiration === 1 ? 'Starts today!' : 'Starts in less than 24 hours!',
        className: 'expiring-soon'
      };
    } else if (daysUntilExpiration <= 3) {
      return {
        isExpired: false,
        message: `Starts in ${daysUntilExpiration} days`,
        className: 'expiring-warning'
      };
    }
    
    return {
      isExpired: false,
      message: `Starts on ${startDate.toLocaleDateString()}`,
      className: 'active'
    };
  };

  const applyForJob = async (vacancyId) => {
    try {
      setApplyingId(vacancyId);

      const res = await API.post("/labour/apply", { vacancyId });
      alert(res.data.message || "Applied successfully!");
      
      // Refresh the page to update the application status
      window.location.reload();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Error applying";
      
      if (err?.response?.data?.isExpired) {
        alert(`❌ ${errorMessage}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="vacancies-list">
      {vacancies.length > 0 ? (
        vacancies.map((v) => {
          const applied = v.applicants?.some(
            (a) => String(a.labourId) === String(userId)
          );

          const full = v.applicants?.length >= v.numWorkers;
          const expirationStatus = getExpirationStatus(v);
          const expired = expirationStatus?.isExpired || false;

          return (
            <div key={v._id} className={`vacancy-card ${expirationStatus?.className || ''}`}>
              <div className="vacancy-header">
                <h3>{v.title}</h3>
                <span>{v.postedBy?.name || "Farmer"}</span>
                {expirationStatus && (
                  <div className={`expiration-badge ${expirationStatus.className}`}>
                    {expired ? '⏰ EXPIRED' : '📅 STARTING SOON'}
                  </div>
                )}
              </div>

              <div className="vacancy-details">
                <p>
                  <strong>Description:</strong> {v.description}
                </p>
                <p>
                  <strong>Start Date:</strong> {v.startDate ? new Date(v.startDate).toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <strong>Duration:</strong> {v.duration} Days
                </p>
                <p>
                  <strong>Rate:</strong> ₹{v.ratePerDay}/day
                </p>

                <p>
                  <strong>Workers:</strong> {v.applicants.length} /{" "}
                  {v.numWorkers}
                </p>

                <p>
                  <strong>Status:</strong> {full ? "Filled" : expired ? "Expired (Start Date Passed)" : v.status}
                </p>

                {expirationStatus && (
                  <p className={`expiration-info ${expirationStatus.className}`}>
                    <strong>📅 {expirationStatus.message}</strong>
                  </p>
                )}
              </div>

              <div className="vacancy-actions">
                {expired ? (
                  <button className="expired-btn" disabled>
                    ❌ Job Expired (Start Date Passed)
                  </button>
                ) : full ? (
                  <button className="full-btn" disabled>
                    Full
                  </button>
                ) : applied ? (
                  <button className="applied-btn" disabled>
                    ✅ Already Applied
                  </button>
                ) : (
                  <button
                    className="apply-btn"
                    onClick={() => applyForJob(v._id)}
                    disabled={applyingId === v._id}
                  >
                    {applyingId === v._id ? "Applying..." : "Apply Now"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p className="no-vacancies">No vacancies available.</p>
      )}
    </div>
  );
};

export default VacanciesList;
