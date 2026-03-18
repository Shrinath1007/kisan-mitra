import React, { useState, useEffect } from 'react';
import { getLabourProfile, updateLabourProfile } from '../../services/labourAPI';
import './ProfileCard.css';

const ProfileCard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    availability: false,
    expectedRate: '',
    manualOverride: false,
    manualStatus: false,
  });
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getLabourProfile();
        console.log('Fetched profile data:', data);
        setProfile(data);
        setFormData({
          name: data.name || '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          availability: Boolean(data.availability),
          expectedRate: data.expectedRate || '',
          manualOverride: Boolean(data.manualOverride),
          manualStatus: Boolean(data.manualStatus),
        });
      } catch (err) {
        setError('Error fetching profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        name: profile.name || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        availability: Boolean(profile.availability),
        expectedRate: profile.expectedRate || '',
        manualOverride: Boolean(profile.manualOverride),
        manualStatus: Boolean(profile.manualStatus),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const updatedData = {
        ...formData,
        skills: formData.skills 
          ? formData.skills.split(',').map((skill) => skill.trim()).filter(skill => skill.length > 0)
          : [],
      };
      
      console.log('Sending update data:', updatedData);
      const { data } = await updateLabourProfile(updatedData);
      console.log('Received response data:', data);
      setProfile(data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error updating profile. Please try again.');
      console.error('Profile update error:', err);
    }
  };

  if (loading) {
    return (
      <div className="profile-card loading">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-card error">
        <div className="profile-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      {success && (
        <div className="profile-success">
          <span className="success-icon">✅</span>
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="profile-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="profile-header">
            <h3>Edit Profile</h3>
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="skills">Skills (comma separated):</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., Plowing, Harvesting, Irrigation"
              className="form-input"
            />
            <small className="form-hint">Enter your skills separated by commas</small>
          </div>
          
          <div className="form-group checkbox-group">
            <label htmlFor="manualOverride" className="checkbox-label">
              <input
                type="checkbox"
                id="manualOverride"
                name="manualOverride"
                checked={formData.manualOverride}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span className="checkbox-text">Manually control availability</span>
            </label>
          </div>
          
          {formData.manualOverride && (
            <div className="form-group checkbox-group" style={{ marginLeft: '20px' }}>
              <label htmlFor="manualStatus" className="checkbox-label">
                <input
                  type="checkbox"
                  id="manualStatus"
                  name="manualStatus"
                  checked={formData.manualStatus}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span className="checkbox-text">Set as Available for Work</span>
              </label>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="expectedRate">Expected Rate (₹/day):</label>
            <input
              type="number"
              id="expectedRate"
              name="expectedRate"
              value={formData.expectedRate}
              onChange={handleChange}
              min="0"
              step="50"
              className="form-input"
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-save">
              <span className="btn-icon">💾</span>
              Save Changes
            </button>
            <button type="button" onClick={handleCancel} className="btn-cancel">
              <span className="btn-icon">❌</span>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-display">
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-text">
                {(profile?.name || user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{profile?.name || user?.name || 'Unknown'}</h3>
              <p className="profile-email">{profile?.email || user?.email}</p>
            </div>
            <button onClick={handleEdit} className="btn-edit-profile">
              <span className="btn-icon">✏️</span>
              Edit Profile
            </button>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">📞 Phone:</span>
              <span className="detail-value">{profile?.phone || 'Not provided'}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">🛠️ Skills:</span>
              <div className="skills-container">
                {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="detail-value no-skills">No skills added yet</span>
                )}
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">🟢 Availability:</span>
              <div className="availability-container">
                <span className={`availability-status ${profile?.availability ? 'available' : 'unavailable'}`}>
                  {profile?.availability ? 'Available' : 'Not Available'}
                </span>
                {profile?.calculatedAvailability && (
                  <div className="availability-details">
                    <small style={{ color: '#6b7280', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                      {profile.calculatedAvailability.manualOverride 
                        ? 'Manually set'
                        : profile.calculatedAvailability.reason
                      }
                    </small>
                    {!profile.availability && profile.calculatedAvailability.nextAvailableDate && (
                      <small style={{ color: '#6b7280', fontSize: '10px', display: 'block' }}>
                        Next: {new Date(profile.calculatedAvailability.nextAvailableDate).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">💰 Expected Rate:</span>
              <span className="detail-value">
                {profile?.expectedRate ? `₹${profile.expectedRate}/day` : 'Not specified'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;