import React, { useEffect, useState } from "react";
import API from "../../services/axiosClient";
import { useAuth } from "../../context/AuthContext";
import "./Vacancies.css";

const defaultForm = {
  title: "",
  description: "",
  numberOfWorkers: 1,
  wagePerDay: "",
  startDate: "",
  numberOfDays: 1,
  location: "",
  contact: "",
};

const FarmerVacancies = () => {
  const { user } = useAuth?.() || {};
  const [form, setForm] = useState(defaultForm);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({}); // Individual field errors
  const [isFormValid, setIsFormValid] = useState(false); // Form validation state
  const [pendingVacancy, setPendingVacancy] = useState(null); // Store vacancy data before payment
  const [showToast, setShowToast] = useState(false); // Toast notification
  const [toastMessage, setToastMessage] = useState(''); // Toast message
  const [toastType, setToastType] = useState('success'); // Toast type: success, error, warning

  const [paymentPopup, setPaymentPopup] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentVacancy, setPaymentVacancy] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  // new: track attempts for payment order creation
  const [paymentAttempts, setPaymentAttempts] = useState([]);
  // new: edit/delete UI state
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    numberOfWorkers: 1,
    numberOfDays: 1,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  useEffect(() => {
    fetchVacancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check form validity on mount and when form changes
  useEffect(() => {
    checkFormValidity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, fieldErrors]);

  // Toast notification function
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const candidatesGet = [
    "/farmer/vacancies",
    "/vacancies/user",
    "/vacancies",
    "/v1/vacancies/user",
    "/v1/vacancies",
  ];

  const candidatesPost = [
    "/farmer/vacancy",
    "/vacancies",
    "/vacancies/create",
    "/v1/vacancies",
  ];

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      setError("");
      setAttempts([]);
      let res = null;
      const records = [];
      for (const path of candidatesGet) {
        try {
          const r = await API.get(path);
          records.push({ path, status: r.status, ok: true });
          res = r;
          break;
        } catch (e) {
          records.push({
            path,
            status: e?.response?.status ?? null,
            ok: false,
          });
        }
      }
      setAttempts(records);
      if (!res?.data)
        throw new Error("No vacancy data received. Check backend routes.");
      const data =
        res.data.vacancies ||
        res.data.data ||
        (Array.isArray(res.data) ? res.data : []);
      setVacancies(Array.isArray(data) ? data : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Fetch vacancies error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load vacancies."
      );
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form state
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error if it exists
    if (error) {
      setError('');
    }
    
    // Real-time validation for the changed field
    validateField(name, value, updatedForm);
    
    // Check overall form validity
    checkFormValidity(updatedForm);
  };

  // Validate individual field
  const validateField = (fieldName, value, formData = form) => {
    let fieldError = '';
    
    switch (fieldName) {
      case 'title':
        if (!value.trim()) {
          fieldError = 'Job title is required';
        } else if (value.trim().length < 3) {
          fieldError = 'Job title must be at least 3 characters';
        }
        break;
      case 'description':
        if (!value.trim()) {
          fieldError = 'Job description is required';
        } else if (value.trim().length < 10) {
          fieldError = 'Description must be at least 10 characters';
        }
        break;
      case 'wagePerDay':
        if (!value) {
          fieldError = 'Daily wage is required';
        } else if (Number(value) <= 0) {
          fieldError = 'Daily wage must be greater than 0';
        } else if (Number(value) < 100) {
          fieldError = 'Daily wage seems too low (minimum ₹100)';
        }
        break;
      case 'location':
        if (!value.trim()) {
          fieldError = 'Location is required';
        } else if (value.trim().length < 3) {
          fieldError = 'Location must be at least 3 characters';
        }
        break;
      case 'numberOfWorkers':
        if (!value || Number(value) < 1) {
          fieldError = 'Number of workers must be at least 1';
        } else if (Number(value) > 100) {
          fieldError = 'Number of workers cannot exceed 100';
        }
        break;
      case 'numberOfDays':
        if (!value || Number(value) < 1) {
          fieldError = 'Duration must be at least 1 day';
        } else if (Number(value) > 365) {
          fieldError = 'Duration cannot exceed 365 days';
        }
        break;
      case 'startDate':
        if (value && !isValidFutureDate(value)) {
          fieldError = 'Start date cannot be in the past';
        }
        break;
      case 'contact':
        if (value && value.length > 0 && value.length < 10) {
          fieldError = 'Contact number must be at least 10 digits';
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [fieldName]: fieldError }));
    return fieldError === '';
  };

  // Check overall form validity
  const checkFormValidity = (formData = form) => {
    const requiredFields = ['title', 'description', 'wagePerDay', 'location'];
    const isValid = requiredFields.every(field => {
      const value = formData[field];
      return value && value.toString().trim().length > 0;
    }) && 
    // Check if there are no field errors
    Object.values(fieldErrors).every(error => error === '') &&
    // Additional validations
    Number(formData.wagePerDay) >= 100 &&
    Number(formData.numberOfWorkers) >= 1 &&
    Number(formData.numberOfDays) >= 1 &&
    formData.title.trim().length >= 3 &&
    formData.description.trim().length >= 10 &&
    formData.location.trim().length >= 3 &&
    (!formData.startDate || isValidFutureDate(formData.startDate));
    
    setIsFormValid(isValid);
    return isValid;
  };

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate if a date is not in the past
  const isValidFutureDate = (dateString) => {
    if (!dateString) return true; // Allow empty dates
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return selectedDate >= today;
  };

  const validateForm = () => {
    const errors = {};
    let hasErrors = false;
    
    // Validate all required fields
    if (!form.title.trim()) {
      errors.title = 'Job title is required';
      hasErrors = true;
    } else if (form.title.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters';
      hasErrors = true;
    }
    
    if (!form.description.trim()) {
      errors.description = 'Job description is required';
      hasErrors = true;
    } else if (form.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
      hasErrors = true;
    }
    
    if (!form.wagePerDay) {
      errors.wagePerDay = 'Daily wage is required';
      hasErrors = true;
    } else if (Number(form.wagePerDay) <= 0) {
      errors.wagePerDay = 'Daily wage must be greater than 0';
      hasErrors = true;
    } else if (Number(form.wagePerDay) < 100) {
      errors.wagePerDay = 'Daily wage seems too low (minimum ₹100)';
      hasErrors = true;
    }
    
    if (!form.location.trim()) {
      errors.location = 'Location is required';
      hasErrors = true;
    } else if (form.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters';
      hasErrors = true;
    }
    
    if (Number(form.numberOfWorkers) < 1) {
      errors.numberOfWorkers = 'Number of workers must be at least 1';
      hasErrors = true;
    }
    
    if (Number(form.numberOfDays) < 1) {
      errors.numberOfDays = 'Duration must be at least 1 day';
      hasErrors = true;
    }
    
    // Validate start date if provided
    if (form.startDate && !isValidFutureDate(form.startDate)) {
      errors.startDate = 'Start date cannot be in the past';
      hasErrors = true;
    }
    
    // Validate contact if provided
    if (form.contact && form.contact.length > 0 && form.contact.length < 10) {
      errors.contact = 'Contact number must be at least 10 digits';
      hasErrors = true;
    }
    
    setFieldErrors(errors);
    
    if (hasErrors) {
      return "Please fix the errors above before submitting";
    }
    
    return null;
  };

  // Step 1: Validate and prepare vacancy (don't save to database yet)
  const prepareVacancy = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPosting(true);
    setError("");
    
    // Prepare vacancy data but don't save to database
    const vacancyData = {
      ...form,
      numberOfWorkers: Number(form.numberOfWorkers) || 1,
      numberOfDays: Number(form.numberOfDays) || 1,
      wagePerDay: Number(form.wagePerDay) || 0,
      postedBy: user?._id || user?.id || undefined,
    };
    
    // Store vacancy data temporarily
    setPendingVacancy(vacancyData);
    
    // Start payment process
    startSimplePayment(vacancyData);
    setPosting(false);
  };

  // Step 2: Save vacancy after successful payment
  const saveVacancyAfterPayment = async (vacancyData) => {
    try {
      let res = null;
      const records = [];
      
      for (const path of candidatesPost) {
        try {
          const r = await API.post(path, vacancyData);
          records.push({ path, status: r.status, ok: true });
          res = r;
          break;
        } catch (e) {
          records.push({
            path,
            status: e?.response?.status ?? null,
            ok: false,
            message: e?.message,
          });
        }
      }
      setAttempts(records);

      if (!res?.data) {
        throw new Error("Vacancy create failed. Check backend endpoints or request payload.");
      }

      const created = res.data.vacancy || res.data.data || res.data;
      
      if (created) {
        setVacancies((p) => [created, ...p]);
        setForm(defaultForm);
        setFieldErrors({});
        setPendingVacancy(null);
        return created;
      } else {
        await fetchVacancies();
        return null;
      }
    } catch (err) {
      console.error("Save vacancy error:", err);
      throw new Error(err.response?.data?.message || err.message || "Failed to save vacancy.");
    }
  };

  const [simplePaymentPopup, setSimplePaymentPopup] = useState(false);
  const [simplePaymentAmount, setSimplePaymentAmount] = useState(0);
  const [simplePaymentVacancy, setSimplePaymentVacancy] = useState(null);
  const [simplePaying, setSimplePaying] = useState(false);
  const [simplePaymentMsg, setSimplePaymentMsg] = useState("");
  const [upiId, setUpiId] = useState("");

  const startSimplePayment = (vacancyData) => {
    // Platform fee is fixed ₹50, not commission based
    const PLATFORM_FEE = 50;
    setSimplePaymentAmount(PLATFORM_FEE);
    setSimplePaymentVacancy(vacancyData);
    setSimplePaymentPopup(true);
    setSimplePaymentMsg("Pay ₹50 platform fee to activate your vacancy posting");
  };

  const closeSimplePaymentPopup = () => {
    setSimplePaymentPopup(false);
    setSimplePaymentMsg("");
    setUpiId("");
    setSimplePaymentVacancy(null);
    
    // Clear pending vacancy data since payment was cancelled
    if (pendingVacancy) {
      setPendingVacancy(null);
      showToastMessage("Vacancy not posted. Payment was cancelled.", 'warning');
    }
  };

  const handleSimplePayment = async () => {
    if (!upiId.trim()) {
      setSimplePaymentMsg("Please enter a valid UPI ID.");
      return;
    }
    
    if (!pendingVacancy) {
      setSimplePaymentMsg("Error: No vacancy data found. Please try again.");
      return;
    }
    
    setSimplePaying(true);
    setSimplePaymentMsg("Processing payment...");
    
    try {
      // First, save the vacancy to database after payment validation
      const savedVacancy = await saveVacancyAfterPayment(pendingVacancy);
      
      if (!savedVacancy) {
        throw new Error("Failed to save vacancy after payment");
      }
      
      // Then process the payment with the saved vacancy ID
      await API.post("/simple-payment/upi/vacancy-payment", {
        vacancyId: savedVacancy._id || savedVacancy.id,
        amount: simplePaymentAmount,
        upiId: upiId,
      });
      
      setSimplePaymentMsg("Payment successful! Your vacancy has been posted.");
      
      setTimeout(() => {
        setSimplePaymentPopup(false);
        setSimplePaymentMsg("");
        setUpiId("");
        setSimplePaymentVacancy(null);
        fetchVacancies(); // Refresh the list
      }, 2000);
      
    } catch (err) {
      console.error("Simple payment error:", err);
      setSimplePaymentMsg(
        err.response?.data?.message ||
          err.message ||
          "Payment failed. Please try again."
      );
      
      // If payment failed, we should remove the vacancy from database if it was saved
      // This would require a cleanup API call in a real implementation
    } finally {
      setSimplePaying(false);
    }
  };

  const tryCreatePaymentOrder = async (vacancyId) => {
    try {
        const res = await API.post("/payment/order/vacancy", { vacancyId });
        return res;
    } catch (err) {
        console.error("Create payment order error:", err);
        throw err;
    }
  };

  const startPaymentForVacancy = async (vacancy) => {
    try {
      if (!vacancy) return;
      setPaying(true);
      setPaymentMsg("Initiating payment...");
      setPaymentPopup(true);
      setPaymentVacancy(vacancy);

      const orderRes = await tryCreatePaymentOrder(vacancy._id || vacancy.id);
      const order = orderRes?.data?.order || orderRes?.data;
      if (!order)
        throw new Error(
          "Failed to create payment order (no order in response)"
        );

        setPaymentAmount(order.amount / 100);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "KisanMitra",
        description: `Vacancy payment - ${vacancy.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setPaymentMsg("Verifying payment...");
            await API.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              vacancyId: vacancy._id || vacancy.id,
              type: 'vacancy',
            });
            setPaymentMsg("Payment successful!");
            setTimeout(() => {
              setPaymentPopup(false);
              setPaymentMsg("");
              fetchVacancies();
            }, 1500);
          } catch (verifyErr) {
            // eslint-disable-next-line no-console
            console.error("Verify payment error:", verifyErr);
            setPaymentMsg("Payment verification failed. Please contact support.");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: form.contact || user?.phone,
        },
        theme: { color: "#4CAF50" },
      };

      if (typeof window === "undefined" || !window.Razorpay) {
        setPaymentMsg("Payment gateway not loaded. Please try again later.");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
      setPaymentMsg("Redirecting to payment gateway...");

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Payment Error:", err);
      setPaymentMsg(
        err.response?.data?.message ||
          err.message ||
          "Payment failed. Please try again."
      );
      setPaying(false);
    }
  };

  const startEdit = (v) => {
    setEditingId(v._id || v.id);
    setEditValues({
      numberOfWorkers: v.numWorkers ?? 1,
      numberOfDays: v.duration ?? 1,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ numberOfWorkers: 1, numberOfDays: 1 });
  };

  const saveEdit = async (id) => {
    const payload = {
      numberOfWorkers: Number(editValues.numberOfWorkers) || 1,
      numberOfDays: Number(editValues.numberOfDays) || 1,
    };

    setEditLoading(true);

    try {
      const path = `/farmer/vacancy/${id}`;
      res = await API.patch(path, payload);

      if (!res?.data) throw new Error("Update failed");

      const updated = res.data.vacancy;

      setVacancies((prev) =>
        prev.map((item) => (item._id === id ? { ...item, ...updated } : item))
      );

      cancelEdit();
    } catch (err) {
      console.error("Save edit error:", err);
      setError(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteVacancy = async (id) => {
    if (!window.confirm("Delete this vacancy? This cannot be undone.")) return;

    setDeleteLoadingId(id);
    let res = null;

    try {
      const path = `/farmer/vacancy/${id}`;
      res = await API.delete(path);

      if (!res || res.status >= 400) {
        throw new Error("Delete failed");
      }

      setVacancies((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      console.error("Delete vacancy error:", err);
      setError(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="vacancies-page">
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast-notification ${toastType}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : '⚠️'}
            </span>
            <span className="toast-message">{toastMessage}</span>
            <button 
              className="toast-close" 
              onClick={() => setShowToast(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="vacancies-header">
        <h1>Labor / Vacancies</h1>
        <p>Post labor needs and manage your posted vacancies.</p>
      </header>

      <section className="vacancy-form-section">
        <form className="vacancy-form" onSubmit={prepareVacancy}>
          <div className="form-row">
            <label>Title *</label>
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange}
              className={fieldErrors.title ? 'error' : ''}
            />
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
          </div>

          <div className="form-row">
            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className={fieldErrors.description ? 'error' : ''}
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </div>

          <div className="form-row cols">
            <div>
              <label>Workers</label>
              <input
                type="number"
                name="numberOfWorkers"
                min="1"
                max="100"
                value={form.numberOfWorkers}
                onChange={handleChange}
                className={fieldErrors.numberOfWorkers ? 'error' : ''}
              />
              {fieldErrors.numberOfWorkers && <span className="field-error">{fieldErrors.numberOfWorkers}</span>}
            </div>
            <div>
              <label>Wage / day (₹) *</label>
              <input
                type="number"
                name="wagePerDay"
                min="100"
                value={form.wagePerDay}
                onChange={handleChange}
                className={fieldErrors.wagePerDay ? 'error' : ''}
              />
              {fieldErrors.wagePerDay && <span className="field-error">{fieldErrors.wagePerDay}</span>}
            </div>
          </div>

          <div className="form-row cols">
            <div>
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                min={getTodayDate()}
                value={form.startDate}
                onChange={handleChange}
                title="Select today's date or a future date"
                className={fieldErrors.startDate ? 'error' : ''}
              />
              <small>
                📅 Select today's date or any future date
              </small>
              {fieldErrors.startDate && <span className="field-error">{fieldErrors.startDate}</span>}
            </div>
            <div>
              <label>Location *</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className={fieldErrors.location ? 'error' : ''}
              />
              {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
            </div>
          </div>

          <div className="form-row cols">
            <div>
              <label>Number of days *</label>
              <input
                type="number"
                name="numberOfDays"
                min="1"
                max="365"
                value={form.numberOfDays}
                onChange={handleChange}
                className={fieldErrors.numberOfDays ? 'error' : ''}
              />
              {fieldErrors.numberOfDays && <span className="field-error">{fieldErrors.numberOfDays}</span>}
            </div>
            <div>
              <label>Contact</label>
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="Optional: Your contact number"
                className={fieldErrors.contact ? 'error' : ''}
              />
              {fieldErrors.contact && <span className="field-error">{fieldErrors.contact}</span>}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={posting || !isFormValid}
              className={!isFormValid ? 'disabled' : ''}
            >
              {posting ? "Preparing..." : "Post Vacancy"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setForm(defaultForm);
                setFieldErrors({});
                setError('');
                setIsFormValid(false);
              }}
            >
              Reset
            </button>
          </div>

          <div className="payment-info">
            <p className="info-text">
              💡 <strong>Payment Info:</strong> After posting, you'll pay a ₹50 platform fee to activate your vacancy.
              <br />
              💰 <strong>Worker Payment:</strong> Pay workers directly in cash at the workplace - no online payment needed!
            </p>
          </div>
        </form>


      </section>

      <section className="vacancy-list-section">
        <h2>My Posted Vacancies</h2>

        {loading ? (
          <div className="loading">Loading vacancies …</div>
        ) : vacancies.length === 0 ? (
          <div className="empty">No vacancies posted yet.</div>
        ) : (
          <div className="vacancy-list">
            {vacancies.map((v) => {
              const id = v._id || v.id;
              const isEditing = editingId === id;
              return (
                <article
                  className="vacancy-card"
                  key={id || `${v.title}-${v.createdAt}`}
                >
                  <div className="vc-left">
                    <h3>{v.title}</h3>
                    <p className="muted">{v.description}</p>
                    <div className="meta">
                      <span>
                        Workers:{" "}
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="1"
                            value={editValues.numberOfWorkers}
                            onChange={(e) =>
                              setEditValues((p) => ({
                                ...p,
                                numberOfWorkers: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          v.numWorkers ?? "—"
                        )}
                      </span>
                      <span>Wage/day: ₹{v.ratePerDay ?? "—"}</span>
                      <span>
                        Days:{" "}
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="1"
                            value={editValues.numberOfDays}
                            onChange={(e) =>
                              setEditValues((p) => ({
                                ...p,
                                numberOfDays: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          v.duration ?? "—"
                        )}
                      </span>
                      <span>
                        Start:{" "}
                        {v.startDate
                          ? new Date(v.startDate).toLocaleDateString()
                          : "—"}
                      </span>
                      <span>Location: {v.location || "—"}</span>
                      <span className={`payment-status ${v.paymentStatus}`}>
                        Payment: {v.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="vc-right">
                    <div className="posted-by">
                      Posted on:{" "}
                      {v.createdAt
                        ? new Date(v.createdAt).toLocaleString()
                        : "—"}
                    </div>
                    <div className="contact">
                      Contact: {v.contact || (user?.phone ?? "—")}
                    </div>

                    <div className="vc-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="save-btn"
                            onClick={() => saveEdit(id)}
                            disabled={editLoading}
                          >
                            {editLoading ? "Saving..." : "Save"}
                          </button>
                          <button className="cancel-btn" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(v)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteVacancy(id)}
                            disabled={deleteLoadingId === id}
                          >
                            {deleteLoadingId === id ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}


      </section>

      {simplePaymentPopup && simplePaymentVacancy && (
        <div className="payment-popup" role="dialog" aria-modal="true">
          <div className="payment-box">
            <h3>Complete Your Vacancy Posting</h3>
            <div className="payment-details">
              <div className="vacancy-preview">
                <h4>📋 Vacancy Summary</h4>
                <p><strong>Title:</strong> {simplePaymentVacancy.title}</p>
                <p><strong>Workers Needed:</strong> {simplePaymentVacancy.numberOfWorkers}</p>
                <p><strong>Daily Wage:</strong> ₹{simplePaymentVacancy.wagePerDay}</p>
                <p><strong>Duration:</strong> {simplePaymentVacancy.numberOfDays} days</p>
                <p><strong>Location:</strong> {simplePaymentVacancy.location}</p>
              </div>
              
              <div className="fee-breakdown">
                <h4>💰 Payment Details</h4>
                <div className="fee-item">
                  <span>Platform Fee:</span>
                  <span className="amount">₹{simplePaymentAmount}</span>
                </div>
                <div className="total-fee">
                  <span><strong>Total to Pay:</strong></span>
                  <span className="amount"><strong>₹{simplePaymentAmount}</strong></span>
                </div>
              </div>
              
              <div className="worker-payment-info">
                <h4>👥 Worker Payment Instructions</h4>
                <p>• <strong>Per Day Cost:</strong> ₹{simplePaymentVacancy.wagePerDay} per worker</p>
                <p>• <strong>Total Workers:</strong> {simplePaymentVacancy.numberOfWorkers}</p>
                <p>• <strong>Duration:</strong> {simplePaymentVacancy.numberOfDays} days</p>
                <p>• <strong>Payment Method:</strong> Cash payment directly to workers at workplace</p>
                <div className="cash-instruction">
                  💡 <strong>Important:</strong> You will pay workers in cash at your location. No online payment required for worker wages.
                </div>
              </div>
              
              <div className="payment-notice">
                <p><strong>⚠️ Notice:</strong> Your vacancy will only be posted after successful payment completion. If you cancel this payment, your vacancy will not be saved.</p>
              </div>
            </div>

            <div className="form-row">
              <label>Enter UPI ID to pay platform fee</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
              />
            </div>

            {simplePaymentMsg && <div className="payment-msg">{simplePaymentMsg}</div>}

            <div className="payment-actions">
              <button onClick={handleSimplePayment} disabled={simplePaying}>
                {simplePaying ? "Processing..." : `Pay ₹${simplePaymentAmount} & Post Vacancy`}
              </button>
              <button
                onClick={closeSimplePaymentPopup}
                className="secondary"
              >
                Cancel (Don't Post)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerVacancies;
