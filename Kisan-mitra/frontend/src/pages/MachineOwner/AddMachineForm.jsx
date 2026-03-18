import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import machineService from "../../services/machineService";
import { FaTractor, FaSeedling, FaLeaf } from "react-icons/fa";
import "./AddMachineForm.css";

const AddMachineForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    type: "Tractor",
    model: "",
    pricePerHour: "",
    availability: true,
    location: {
      address: "",
    },
    specifications: "",
  });

  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [connectionTest, setConnectionTest] = useState(null);
  const navigate = useNavigate();

  // Test backend connection on component mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      console.log("🔍 Testing backend connection...");

      // Test 1: Health check
      const healthResponse = await machineService.testBackendHealth();
      console.log("✅ Health check:", healthResponse.data);

      // Test 2: CORS test
      const corsResponse = await machineService.testCors();
      console.log("✅ CORS test:", corsResponse.data);

      setConnectionTest({
        success: true,
        health: healthResponse.data,
        cors: corsResponse.data,
      });
    } catch (err) {
      console.error("❌ Backend connection test failed:", err);
      setConnectionTest({
        success: false,
        error: err.message,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // handle location
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [key]: value,
        },
      }));
      return;
    }

    // specifications must be plain string
    if (name === "specifications") {
      setFormData((prev) => ({
        ...prev,
        specifications: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
      setPhotos([]);
      setPhotoPreview([]);
      return;
    }

    // Convert files to base64
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            base64: e.target.result
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(base64Files => {
        setPhotos(base64Files);
        setPhotoPreview(base64Files.map(file => file.base64));
        console.log(`📸 Converted ${base64Files.length} photos to base64`);
      })
      .catch(error => {
        console.error('Error converting files to base64:', error);
        setError('Failed to process images. Please try again.');
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // First, test connection
    if (connectionTest && !connectionTest.success) {
      setError("Backend connection failed. Please check if server is running.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter machine name.");
      setLoading(false);
      return;
    }
    if (!formData.model.trim()) {
      setError("Please enter machine model.");
      setLoading(false);
      return;
    }
    if (!formData.pricePerHour || formData.pricePerHour <= 0) {
      setError("Please enter valid price per hour.");
      setLoading(false);
      return;
    }
    if (!formData.location.address.trim()) {
      setError("Please enter address.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Starting machine creation...");
      
      const machineData = {
        name: formData.name,
        type: formData.type,
        model: formData.model,
        pricePerHour: Number(formData.pricePerHour),
        availability: formData.availability,
        location: formData.location,
        specifications: formData.specifications || "",
        photos: photos.map(photo => photo.base64) // Send base64 images
      };

      console.log("📦 Machine data:", {
        ...machineData,
        photos: `${machineData.photos.length} base64 images`
      });

      const response = await machineService.addMachine(machineData);
      console.log("✅ Machine added successfully:", response.data);

      // Show success message and reset form
      setSuccessMessage("Machine added successfully!");
      setFormData({
        name: "",
        type: "Tractor",
        model: "",
        pricePerHour: "",
        availability: true,
        location: {
          address: "",
        },
        specifications: "",
      });
      setPhotos([]);
      setPhotoPreview([]);
      e.target.reset(); // Reset file input
    } catch (err) {
      console.error("❌ Error adding machine:", err);

      let errorMessage = "Failed to add machine. ";

      if (err.response) {
        // Server responded with error status
        errorMessage += `Server error: ${err.response.status}`;
        if (err.response.data?.message) {
          errorMessage += ` - ${err.response.data.message}`;
        }
      } else if (err.request) {
        // Request was made but no response
        errorMessage += "No response from server. Check if backend is running.";
      } else {
        // Something else happened
        errorMessage += err.message || "Unknown error";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-machine-container">
      <div className="add-machine-card">
        <h2>Add New Agricultural Machinery</h2>

        {/* Connection Status */}
        {connectionTest && (
          <div
            className={`connection-status ${
              connectionTest.success ? "success" : "error"
            }`}
          >
            {connectionTest.success ? (
              <>
                <span>✅ Backend connected</span>
                <button
                  onClick={testBackendConnection}
                  className="refresh-btn"
                  style={{
                    marginLeft: "10px",
                    padding: "2px 8px",
                    fontSize: "12px",
                  }}
                >
                  Refresh
                </button>
              </>
            ) : (
              <>
                <span>❌ Backend connection failed</span>
                <button
                  onClick={testBackendConnection}
                  className="refresh-btn"
                  style={{
                    marginLeft: "10px",
                    padding: "2px 8px",
                    fontSize: "12px",
                  }}
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="add-machine-form">
          <div className="form-group">
            <label>Machine Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter machine name"
              required
            />
          </div>

          <div className="form-group">
            <label>Machine Type *</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="Tractor">Tractor</option>
              <option value="Harvester">Harvester</option>
              <option value="Seeder">Seeder</option>
              <option value="Sprayer">Sprayer</option>
              <option value="Cultivator">Cultivator</option>
              <option value="Baler">Baler</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Model *</label>
            <input
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Enter model number/name"
              required
            />
          </div>

          <div className="form-group">
            <label>Price Per Hour (₹) *</label>
            <input
              type="number"
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleChange}
              min="0"
              step="50"
              placeholder="e.g., 500"
              required
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              placeholder="Enter complete address"
              required
            />
          </div>

          <div className="form-group">
            <label>Specifications</label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              placeholder="Enter specifications (optional)"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Machine Photos (Optional)</label>
            <input
              type="file"
              name="photos"
              multiple
              onChange={handlePhotoChange}
              accept="image/*"
              className="file-input"
            />
            {photos.length > 0 && (
              <div className="photo-preview-section">
                <div className="photo-count">
                  <small>✅ {photos.length} photo(s) selected</small>
                </div>
                <div className="photo-preview-grid">
                  {photoPreview.map((src, index) => (
                    <div key={index} className="photo-preview-item">
                      <img 
                        src={src} 
                        alt={`Preview ${index + 1}`}
                        className="preview-image"
                      />
                      <div className="photo-info">
                        <small>{photos[index].name}</small>
                        <small>{(photos[index].size / 1024).toFixed(1)} KB</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group-checkbox">
            <input
              type="checkbox"
              name="availability"
              checked={formData.availability}
              onChange={handleChange}
            />
            <label>Available for booking</label>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Adding Machine..." : "Add Machine"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddMachineForm;
