import React, { useState, useMemo, useEffect } from "react";
import { BACKEND_URL } from "../../services/apiConfig";
import API from "../../services/axiosClient";
import { createBooking } from "../../services/bookingAPI";
import { createPaymentOrder, verifyPayment } from "../../services/paymentAPI";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaRupeeSign,
  FaCalendar,
  FaStar,
  FaImage,
  FaTractor,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";
import "./Machinery.css";

const Machinery = () => {
  const [machines, setMachines] = useState([]);
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ type: "", maxPrice: "" });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });
  const [paymentErrors, setPaymentErrors] = useState({
    upiId: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    hours: 1,
    totalPrice: 0,
  });

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMachineDetails, setSelectedMachineDetails] = useState(null);
  const [machineBookings, setMachineBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Payment success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchMachines();
    fetchWalletBalance();
    // Test API connection
    testAPIConnection();
  }, []);

  // ================== PAYMENT VALIDATION UTILITIES ==================

  const validateCardholderName = (name) => {
    if (!name || !name.trim()) {
      return { isValid: false, error: '' }; // Empty is handled by required field validation
    }
    
    const nameRegex = /^[A-Za-z\s]+$/;
    const trimmedName = name.trim();
    
    if (!nameRegex.test(trimmedName)) {
      return { isValid: false, error: 'Cardholder name must contain only letters' };
    }
    
    if (trimmedName.length < 2) {
      return { isValid: false, error: 'Cardholder name must be at least 2 characters' };
    }
    
    return { isValid: true, error: '' };
  };

  const validateExpiryDate = (expiryDate) => {
    if (!expiryDate || !expiryDate.trim()) {
      return { isValid: false, error: '' }; // Empty is handled by required field validation
    }
    
    // Format validation (MM/YY)
    const formatRegex = /^\d{2}\/\d{2}$/;
    if (!formatRegex.test(expiryDate)) {
      return { isValid: false, error: 'Please enter a valid expiry date (MM/YY)' };
    }
    
    // Month validation (01-12)
    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: 'Please enter a valid expiry date (MM/YY)' };
    }
    
    // Future date validation
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    const yearNum = parseInt(year, 10);
    
    // Handle year 2000 issue - assume years 00-30 are 2000-2030, 31-99 are 1931-1999
    const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
    const currentFullYear = currentDate.getFullYear();
    
    if (fullYear < currentFullYear || (fullYear === currentFullYear && monthNum < currentMonth)) {
      return { isValid: false, error: 'Card has expired. Please use a valid card' };
    }
    
    return { isValid: true, error: '' };
  };

  const validateCardNumber = (cardNumber) => {
    if (!cardNumber || !cardNumber.trim()) {
      return { isValid: false, error: '' }; // Empty is handled by required field validation
    }
    
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 16) {
      return { isValid: false, error: 'Please enter a valid 16-digit card number' };
    }
    
    return { isValid: true, error: '' };
  };

  const validateCVV = (cvv) => {
    if (!cvv || !cvv.trim()) {
      return { isValid: false, error: '' }; // Empty is handled by required field validation
    }
    
    if (cvv.length < 3) {
      return { isValid: false, error: 'Please enter a valid CVV' };
    }
    
    return { isValid: true, error: '' };
  };

  const validateUpiId = (upiId) => {
    if (!upiId || !upiId.trim()) {
      return { isValid: false, error: '' }; // Empty is handled by required field validation
    }
    
    if (!upiId.includes('@')) {
      return { isValid: false, error: 'Please enter a valid UPI ID (e.g., user@paytm)' };
    }
    
    return { isValid: true, error: '' };
  };

  const validatePaymentForm = (method, details) => {
    if (method === 'upi') {
      const upiValidation = validateUpiId(details.upiId);
      return upiValidation.isValid && details.upiId.trim();
    } else if (method === 'card') {
      const nameValidation = validateCardholderName(details.cardholderName);
      const numberValidation = validateCardNumber(details.cardNumber);
      const expiryValidation = validateExpiryDate(details.expiryDate);
      const cvvValidation = validateCVV(details.cvv);
      
      return nameValidation.isValid && 
             numberValidation.isValid && 
             expiryValidation.isValid && 
             cvvValidation.isValid &&
             details.cardholderName.trim() &&
             details.cardNumber.trim() &&
             details.expiryDate.trim() &&
             details.cvv.trim();
    }
    
    return false;
  };

  // ================== END VALIDATION UTILITIES ==================

  const testAPIConnection = async () => {
    try {
      console.log("🔄 Testing API connection...");
      
      // Test basic API connectivity
      const response = await API.get("/payment/test");
      console.log("✅ API connection successful:", response.data);
      
      // Test authentication
      const token = localStorage.getItem("km_token") || 
                   (localStorage.getItem("km_user") ? JSON.parse(localStorage.getItem("km_user")).token : null);
      console.log("🔑 Current token:", token ? "Present" : "Missing");
      
      if (!token) {
        console.warn("⚠️ No authentication token found - user may need to login");
      }
      
    } catch (error) {
      console.error("❌ API connection failed:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await API.get("/wallet");
      setWalletBalance(res.data?.data?.balance || 0);
    } catch (err) {
      console.error("Fetch wallet error:", err);
    }
  };

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await API.get("/machines");
      console.log("Machines data:", res.data);
      setMachines(res.data.machines || []);
    } catch (err) {
      console.error("Fetch machines error:", err);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineBookings = async (machineId) => {
    try {
      setLoadingBookings(true);
      console.log(`🔄 Fetching bookings for machine: ${machineId}`);
      
      // Check authentication before making the call
      const token = localStorage.getItem("km_token") || 
                   (localStorage.getItem("km_user") ? JSON.parse(localStorage.getItem("km_user")).token : null);
      
      if (!token) {
        console.error("❌ No authentication token found");
        throw new Error("Authentication required");
      }
      
      console.log("🔑 Making authenticated request to:", `/booking/machine/${machineId}`);
      
      const res = await API.get(`/booking/machine/${machineId}`);
      console.log("📋 Machine bookings API response:", res.data);
      
      const bookings = res.data.bookings || [];
      console.log(`✅ Found ${bookings.length} bookings for machine ${machineId}:`, bookings);
      
      setMachineBookings(bookings);
      
      return bookings;
    } catch (err) {
      console.error("❌ Fetch machine bookings error:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url
      });
      
      // Show user-friendly error message
      if (err.response?.status === 401) {
        alert("Please login to view booking information");
      } else if (err.response?.status === 403) {
        alert("Access denied. Please check your permissions.");
      } else if (err.response?.status === 404) {
        console.warn("⚠️ Machine not found or no bookings endpoint available");
      }
      
      setMachineBookings([]);
      return [];
    } finally {
      setLoadingBookings(false);
    }
  };

  const checkDateConflict = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log("🔍 Checking date conflict:", {
      selectedStart: start,
      selectedEnd: end,
      existingBookings: machineBookings.length,
      bookings: machineBookings.map(b => ({
        id: b._id,
        status: b.status,
        start: b.date.startDate,
        end: b.date.endDate
      }))
    });
    
    const hasConflict = machineBookings.some(booking => {
      if (booking.status === 'cancelled' || booking.status === 'rejected') {
        console.log(`⏭️ Skipping ${booking.status} booking:`, booking._id);
        return false; // Don't consider cancelled/rejected bookings
      }
      
      const bookingStart = new Date(booking.date.startDate);
      const bookingEnd = new Date(booking.date.endDate);
      
      // Check for overlap
      const overlap = (
        (start >= bookingStart && start < bookingEnd) ||
        (end > bookingStart && end <= bookingEnd) ||
        (start <= bookingStart && end >= bookingEnd)
      );
      
      if (overlap) {
        console.log("❌ CONFLICT DETECTED with booking:", {
          bookingId: booking._id,
          bookingStart: bookingStart,
          bookingEnd: bookingEnd,
          selectedStart: start,
          selectedEnd: end,
          status: booking.status
        });
      }
      
      return overlap;
    });
    
    console.log("🔍 Conflict check result:", hasConflict);
    return hasConflict;
  };

  // derive unique machine types for filter select
  const machineTypes = useMemo(() => {
    const setTypes = new Set();
    machines.forEach((m) => m.type && setTypes.add(m.type));
    return ["", ...Array.from(setTypes)];
  }, [machines]);

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchName = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filters.type ? m.type === filters.type : true;
      const matchPrice = filters.maxPrice
        ? m.pricePerHour <= parseFloat(filters.maxPrice)
        : true;
      return matchName && matchType && matchPrice;
    });
  }, [machines, searchTerm, filters]);

  const openBookingPopup = async (machine) => {
    setSelectedMachine(machine);

    const formatDateTimeLocal = (date) => date.toISOString().slice(0, 16);

    const now = new Date(Date.now() + 2 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    setBookingData({
      startDate: formatDateTimeLocal(now),
      endDate: formatDateTimeLocal(tomorrow),
      hours: 24 * 60, // 24 hours in minutes
      totalPrice: (machine.pricePerHour || 0) * 24,
    });

    // Fetch existing bookings for this machine
    await fetchMachineBookings(machine._id);

    setShowPopup(true);
  };

  const openDetailsModal = async (machine) => {
    try {
      // Fetch full machine details with owner info
      const res = await API.get(`/machines/${machine._id}`);
      setSelectedMachineDetails(res.data.machine);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching machine details:", err);
      setSelectedMachineDetails(machine);
      setShowDetailsModal(true);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      console.log("🔄 Starting payment submission...");
      
      // Check authentication first
      const token = localStorage.getItem("km_token") || 
                   (localStorage.getItem("km_user") ? JSON.parse(localStorage.getItem("km_user")).token : null);
      
      if (!token) {
        alert("Please login first to make a booking");
        return;
      }
      
      console.log("🔑 Authentication check passed");
      
      // Check for date conflicts before processing payment
      const hasConflict = checkDateConflict(bookingData.startDate, bookingData.endDate);
      if (hasConflict) {
        setPaymentError("Selected dates conflict with existing bookings. Please choose different dates.");
        alert("Selected dates conflict with existing bookings. Please choose different dates.");
        return;
      }
      
      // Validate payment method and details using new validation functions
      if (paymentMethod === "upi") {
        const upiValidation = validateUpiId(paymentDetails.upiId);
        if (!upiValidation.isValid) {
          return alert(upiValidation.error || "Please enter your UPI ID");
        }
      } else if (paymentMethod === "card") {
        const nameValidation = validateCardholderName(paymentDetails.cardholderName);
        const numberValidation = validateCardNumber(paymentDetails.cardNumber);
        const expiryValidation = validateExpiryDate(paymentDetails.expiryDate);
        const cvvValidation = validateCVV(paymentDetails.cvv);
        
        if (!nameValidation.isValid) {
          return alert(nameValidation.error || "Please enter cardholder name");
        }
        if (!numberValidation.isValid) {
          return alert(numberValidation.error || "Please enter a valid card number");
        }
        if (!expiryValidation.isValid) {
          return alert(expiryValidation.error || "Please enter a valid expiry date");
        }
        if (!cvvValidation.isValid) {
          return alert(cvvValidation.error || "Please enter a valid CVV");
        }
      } else if (paymentMethod === "wallet") {
        if (walletBalance < bookingData.totalPrice) {
          return alert(`Insufficient wallet balance. Available: ₹${walletBalance}, Required: ₹${bookingData.totalPrice}`);
        }
      } else {
        return alert("Please select a payment method");
      }

      setIsProcessingPayment(true);
      setPaymentError("");
      setMsg("Creating booking...");

      // ================== WALLET PAYMENT FLOW ==================
      if (paymentMethod === "wallet") {
        const bookingRes = await createBooking({
          machineId: selectedMachine._id,
          startTime: bookingData.startDate,
          endTime: bookingData.endDate,
          totalAmount: bookingData.totalPrice,
        });
        const bookingId = bookingRes?.data?.booking?._id;
        if (!bookingId) throw new Error("Booking creation failed");

        setMsg("Processing wallet payment...");
        const walletRes = await API.post(`/wallet/pay/${bookingId}`);

        const receiptData = {
          bookingId,
          transactionId: `TXN${Date.now()}`,
          paymentId: `wallet_${Date.now()}`,
          orderId: `wallet_order_${Date.now()}`,
          machine: {
            name: selectedMachine.name,
            model: selectedMachine.model,
            type: selectedMachine.type,
            owner: selectedMachine.owner?.name || "N/A",
          },
          booking: {
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            hours: bookingData.hours,
            totalAmount: bookingData.totalPrice,
            platformFee: Math.round(bookingData.totalPrice * 0.1),
            ownerAmount: Math.round(bookingData.totalPrice * 0.9),
          },
          payment: {
            method: "wallet",
            details: "Paid from KisanMitra Wallet",
            timestamp: new Date().toISOString(),
            status: "Success",
          },
          farmer: { name: "Farmer", email: "" },
        };

        setWalletBalance(walletRes.data?.walletBalance ?? walletBalance - bookingData.totalPrice);
        setPaymentReceipt(receiptData);
        setShowSuccessModal(true);
        setShowPaymentModal(false);
        setShowPopup(false);
        setPaymentMethod("");
        setMsg("");
        fetchMachines();
        setIsProcessingPayment(false);
        return;
      }
      // ================== END WALLET PAYMENT FLOW ==================

      console.log("🔄 Processing payment with details:", {
        method: paymentMethod,
        details: paymentMethod === "upi" ? { upiId: paymentDetails.upiId } : "Card details provided"
      });

      // 1️⃣ CREATE BOOKING FIRST
      console.log("📋 Creating booking with data:", {
        machineId: selectedMachine._id,
        startTime: bookingData.startDate,
        endTime: bookingData.endDate,
        totalAmount: bookingData.totalPrice,
      });

      const bookingRes = await createBooking({
        machineId: selectedMachine._id,
        startTime: bookingData.startDate,
        endTime: bookingData.endDate,
        totalAmount: bookingData.totalPrice,
      });

      console.log("✅ Booking created successfully:", bookingRes);

      const bookingId = bookingRes?.data?.booking?._id;
      if (!bookingId) {
        console.error("❌ No booking ID in response:", bookingRes);
        throw new Error("Booking creation failed - no booking ID returned");
      }

      console.log(`📋 Booking ID: ${bookingId}`);
      setMsg("Processing payment...");

      // 2️⃣ CREATE PAYMENT ORDER
      console.log("🔄 Creating payment order...");
      const orderRes = await createPaymentOrder(bookingId);
      console.log("✅ Payment order created:", orderRes);
      
      const order = orderRes?.data?.order;
      if (!order) {
        console.error("❌ No order in response:", orderRes);
        throw new Error("Payment order creation failed - no order returned");
      }

      console.log(`💳 Order ID: ${order.id}`);
      setMsg("Verifying payment...");

      // 3️⃣ VERIFY PAYMENT (Development mode with mock data)
      const verifyRes = await verifyPayment({
        razorpay_order_id: order.id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: `mock_signature_${Date.now()}`,
        bookingId,
        type: 'booking',
      });

      console.log("✅ Payment verification successful:", verifyRes);

      // 4️⃣ SUCCESS - CREATE RECEIPT DATA AND SHOW SUCCESS MODAL
      const receiptData = {
        bookingId: bookingId,
        transactionId: `TXN${Date.now()}`,
        paymentId: `pay_mock_${Date.now()}`,
        orderId: order.id,
        machine: {
          name: selectedMachine.name,
          model: selectedMachine.model,
          type: selectedMachine.type,
          owner: selectedMachine.owner?.name || 'N/A'
        },
        booking: {
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          hours: bookingData.hours,
          totalAmount: bookingData.totalPrice,
          platformFee: Math.round(bookingData.totalPrice * 0.1),
          ownerAmount: Math.round(bookingData.totalPrice * 0.9)
        },
        payment: {
          method: paymentMethod,
          details: paymentMethod === "upi" ? paymentDetails.upiId : `****${paymentDetails.cardNumber.slice(-4)}`,
          timestamp: new Date().toISOString(),
          status: 'Success'
        },
        farmer: {
          // Will be populated from user context if available
          name: 'Farmer', // You can get this from user context
          email: 'farmer@example.com' // You can get this from user context
        }
      };

      setPaymentReceipt(receiptData);
      setShowSuccessModal(true);
      
      // Close other modals
      setShowPaymentModal(false);
      setShowPopup(false);
      setPaymentMethod("");
      setPaymentDetails({
        upiId: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: ""
      });
      setPaymentErrors({
        upiId: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: ""
      });
      setIsPaymentValid(false);
      
      // Clear the success message since we're showing the modal
      setMsg("");
      
      // Refresh data to show updated bookings
      fetchMachines();
      if (selectedMachine) {
        await fetchMachineBookings(selectedMachine._id);
      }
      
    } catch (error) {
      console.error("❌ Payment processing error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setMsg("");
      
      // Provide more specific error messages
      let errorMessage = "Payment failed. Please try again.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. Please check your account permissions.";
      } else if (error.response?.status === 409) {
        errorMessage = "Machine is already booked for that time. Please select different dates.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPaymentError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const calculateHours = () => {
    if (!bookingData.startDate || !bookingData.endDate || !selectedMachine)
      return;

    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);

    if (isNaN(start) || isNaN(end) || end <= start) {
      setBookingData((prev) => ({
        ...prev,
        hours: 0,
        totalPrice: 0,
      }));
      return;
    }

    // Calculate exact minutes (minimum 1 minute)
    const diffMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
    const pricePerHour = selectedMachine.pricePerHour || 0;
    // Price proportional to actual time (per-minute rate)
    const totalPrice = Math.round((diffMinutes / 60) * pricePerHour);

    setBookingData((prev) => ({
      ...prev,
      hours: diffMinutes, // store as minutes internally
      totalPrice,
    }));

    // Check for conflicts and show warning
    const hasConflict = checkDateConflict(bookingData.startDate, bookingData.endDate);
    if (hasConflict) {
      setPaymentError("Selected dates conflict with existing bookings. Please choose different dates.");
    } else {
      setPaymentError("");
    }
  };

  const formatBookingDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#6c757d';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const downloadReceipt = (receiptData) => {
    // Create receipt content as text
    const receiptText = `
KISANMITRA - BOOKING RECEIPT
============================

Receipt #: ${receiptData.transactionId}
Date: ${new Date(receiptData.payment.timestamp).toLocaleString('en-IN')}

MACHINE DETAILS
---------------
Machine: ${receiptData.machine.name}
Model: ${receiptData.machine.model || 'N/A'}
Type: ${receiptData.machine.type || 'N/A'}
Owner: ${receiptData.machine.owner}

BOOKING DETAILS
---------------
Booking ID: ${receiptData.bookingId}
Start Date: ${new Date(receiptData.booking.startDate).toLocaleString('en-IN')}
End Date: ${new Date(receiptData.booking.endDate).toLocaleString('en-IN')}
Duration: ${formatTime(receiptData.booking.hours)}

PAYMENT DETAILS
---------------
Payment Method: ${receiptData.payment.method.toUpperCase()}
Payment ID: ${receiptData.paymentId}
Status: ${receiptData.payment.status}

AMOUNT BREAKDOWN
----------------
Subtotal: ₹${receiptData.booking.totalAmount.toLocaleString()}
Platform Fee (10%): ₹${receiptData.booking.platformFee.toLocaleString()}
Total Paid: ₹${receiptData.booking.totalAmount.toLocaleString()}

Thank you for using KisanMitra!
For support: support@kisanmitra.com
============================
    `;

    // Create and download the file
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KisanMitra_Receipt_${receiptData.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    calculateHours();
  }, [bookingData.startDate, bookingData.endDate, selectedMachine]);

  const handleBookingInput = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // totalMinutes is the duration in minutes
  const formatTime = (totalMinutes) => {
    if (!totalMinutes || totalMinutes <= 0) return "0 minutes";
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (mins > 0) parts.push(`${mins} min${mins !== 1 ? "s" : ""}`);
    return parts.join(" ") || "0 minutes";
  };

  const startPayment = async () => {
    try {
      console.log("🔄 Starting payment process...");
      
      if (!bookingData.startDate || !bookingData.endDate) {
        console.error("❌ Missing dates");
        return alert("Please select start & end date");
      }
      if (!selectedMachine) {
        console.error("❌ No machine selected");
        return alert("No machine selected");
      }

      // ✅ CHECK FOR DATE CONFLICTS BEFORE PROCEEDING
      const hasConflict = checkDateConflict(bookingData.startDate, bookingData.endDate);
      if (hasConflict) {
        console.error("❌ Date conflict detected");
        alert("Machine is already booked for that time. Please select different dates.");
        return;
      }

      console.log("📋 Booking details:", {
        machineId: selectedMachine._id,
        machineName: selectedMachine.name,
        startTime: bookingData.startDate,
        endTime: bookingData.endDate,
        totalAmount: bookingData.totalPrice,
        hours: bookingData.hours
      });

      // ✅ SIMPLIFIED FLOW: Just show payment modal, don't create booking yet
      // The booking will be created in handlePaymentSubmit after payment details are entered
      console.log("🔧 Opening payment modal for payment details");
      setShowPaymentModal(true);
      
    } catch (err) {
      console.error("❌ Payment Error:", err);
      setMsg(""); // Clear loading message
      
      // Provide specific error messages based on the error
      const errorMessage = err.response?.data?.message || err.message;
      
      console.log("📝 Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: errorMessage
      });
      
      if (errorMessage.includes("Payment gateway not configured")) {
        alert("Payment system is currently under maintenance. Please try again later or contact support.");
      } else if (errorMessage.includes("Razorpay credentials")) {
        alert("Payment service is temporarily unavailable. Please contact support.");
      } else if (errorMessage.includes("Booking not found")) {
        alert("Booking could not be created. Please try again.");
      } else if (err.response?.status === 401) {
        alert("Authentication failed. Please login again.");
      } else if (err.response?.status === 500) {
        alert("Server error occurred. Please try again later.");
      } else {
        alert(errorMessage || "Payment failed. Please try again.");
      }
    }
  };

  return (
    <div className="machinery-page">
      {/* Success Message */}
      {msg && (
        <div className="success-message" role="status">
          ✅ {msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            <FaTractor /> Find Agricultural Machinery
          </h1>
          <p className="subtitle">
            Browse and book machinery for your farming needs
          </p>
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            ▦ Grid
          </button>
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List View"
          >
            ≡ List
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search machinery by name, model, or specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((p) => ({ ...p, type: e.target.value }))
              }
              className="filter-select"
            >
              <option value="">All Types</option>
              {machineTypes.map((t) =>
                t ? (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ) : null
              )}
            </select>
          </div>

          <div className="filter-group">
            <label>Max Price/Hour:</label>
            <input
              type="number"
              placeholder="₹ Max"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((p) => ({ ...p, maxPrice: e.target.value }))
              }
              min="0"
              className="filter-input"
            />
          </div>

          <button
            className="clear-filters"
            onClick={() => {
              setSearchTerm("");
              setFilters({ type: "", maxPrice: "" });
            }}
          >
            Clear Filters
          </button>
        </div>

        <div className="results-count">
          Showing {filteredMachines.length} of {machines.length} machines
          {filters.type && ` • Type: ${filters.type}`}
          {filters.maxPrice && ` • Max Price: ₹${filters.maxPrice}/hour`}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available machinery...</p>
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚜</div>
          <h3>No machinery found</h3>
          <p>Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilters({ type: "", maxPrice: "" });
            }}
            className="reset-btn"
          >
            Reset Filters
          </button>
        </div>
      ) : /* Machines Display */
      viewMode === "grid" ? (
        <div className="machine-grid">
          {filteredMachines.map((machine) => (
            <div key={machine._id} className="machine-card">
              {/* Machine Image */}
              <div className="card-image">
                {machine.photos && machine.photos.length > 0 ? (
                  <img
                    src={`${BACKEND_URL}${machine.photos[0]}`}
                    alt={machine.name}
                    className="machine-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://cdn-icons-png.flaticon.com/512/1048/1048942.png";
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    <FaImage size={40} />
                    <span>No Image</span>
                  </div>
                )}
                <div className="card-badge">
                  <span className="rating">
                    <FaStar /> {machine.rating || 4.5}
                  </span>
                </div>
              </div>

              {/* Machine Info */}
              <div className="card-content">
                <h3 className="machine-name">{machine.name}</h3>
                <p className="machine-model">
                  <FaTractor /> {machine.model || "Model not specified"}
                </p>
                <p className="machine-type">Type: {machine.type || "—"}</p>

                <div className="price-section">
                  <span className="price">
                    <FaRupeeSign /> {machine.pricePerHour || 0}/hour
                  </span>
                  <div className="machine-indicators">
                    {machine.bookingCount > 0 && (
                      <span className="booking-count">
                        {machine.bookingCount} booking
                        {machine.bookingCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {machine.hasActiveBookings && (
                      <span className="active-bookings-indicator" title="Has active bookings">
                        📅 Booked
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner Info */}
                {machine.owner && (
                  <div className="owner-info">
                    <FaUser /> Owner: {machine.owner.name || "N/A"}
                    {machine.owner.phone && (
                      <span> • 📞 {machine.owner.phone}</span>
                    )}
                  </div>
                )}

                {/* Location */}
                {machine.location?.address && (
                  <div className="location-info">
                    <FaMapMarkerAlt />{" "}
                    {machine.location.address.substring(0, 40)}
                    {machine.location.address.length > 40 && "..."}
                  </div>
                )}

                {/* Specifications */}
                {machine.specifications && (
                  <div className="specs-info">
                    <FaInfoCircle /> {machine.specifications.substring(0, 50)}
                    {machine.specifications.length > 50 && "..."}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="card-actions">
                <button
                  className="btn-details"
                  onClick={() => openDetailsModal(machine)}
                >
                  <FaInfoCircle /> View Details
                </button>
                <button
                  className={`btn-book ${
                    !machine.availability ? "disabled" : ""
                  }`}
                  onClick={() => openBookingPopup(machine)}
                  disabled={!machine.availability}
                >
                  {machine.availability ? "Book Now" : "Not Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="machine-list">
          {filteredMachines.map((machine) => (
            <div key={machine._id} className="list-item">
              <div className="list-image">
                {machine.photos && machine.photos.length > 0 ? (
                  <img
                    src={`${BACKEND_URL}${machine.photos[0]}`}
                    alt={machine.name}
                    className="machine-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://cdn-icons-png.flaticon.com/512/1048/1048942.png";
                    }}
                  />
                ) : (
                  <div className="image-placeholder-small">
                    <FaImage />
                  </div>
                )}
              </div>

              <div className="list-content">
                <div className="list-header">
                  <h3>{machine.name}</h3>
                </div>

                <div className="list-details">
                  <div>
                    <p>
                      <FaTractor /> {machine.type} • {machine.model}
                    </p>
                    <p>
                      <FaUser /> {machine.owner?.name || "Owner not specified"}
                    </p>
                    <p>
                      <FaMapMarkerAlt />{" "}
                      {machine.location?.address?.substring(0, 60) ||
                        "Location not specified"}
                    </p>
                  </div>
                  <div className="list-price">
                    <div className="price-large">
                      <FaRupeeSign /> {machine.pricePerHour}/hour
                    </div>
                    <div className="list-actions">
                      <button
                        className="btn-details"
                        onClick={() => openDetailsModal(machine)}
                      >
                        Details
                      </button>
                      <button
                        className={`btn-book ${
                          !machine.availability ? "disabled" : ""
                        }`}
                        onClick={() => openBookingPopup(machine)}
                        disabled={!machine.availability}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING POPUP */}
      {showPopup && selectedMachine && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <div className="modal-header">
              <h2>Book {selectedMachine.name}</h2>
              <button className="close-btn" onClick={() => setShowPopup(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="machine-summary">
                <div className="summary-image">
                  {selectedMachine.photos &&
                  selectedMachine.photos.length > 0 ? (
                    <img
                      src={`${BACKEND_URL}${selectedMachine.photos[0]}`}
                      alt={selectedMachine.name}
                    />
                  ) : (
                    <div className="summary-placeholder">📷</div>
                  )}
                </div>
                <div className="summary-details">
                  <h4>{selectedMachine.name}</h4>
                  <p>Type: {selectedMachine.type}</p>
                  <p>Model: {selectedMachine.model || "N/A"}</p>
                  <p>Price/Hour: ₹{selectedMachine.pricePerHour}</p>
                  <p>Owner: {selectedMachine.owner?.name || "N/A"}</p>
                </div>
              </div>

              <div className="booking-form">
                <div className="form-group">
                  <label>
                    <FaCalendar /> Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={bookingData.startDate}
                    onChange={handleBookingInput}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaCalendar /> End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={bookingData.endDate}
                    onChange={handleBookingInput}
                    min={
                      bookingData.startDate ||
                      new Date().toISOString().slice(0, 16)
                    }
                    required
                  />
                </div>

                <div className="booking-summary">
                  <div className="summary-row">
                    <span>Duration:</span>
                    <span>
                      <FaClock /> {formatTime(bookingData.hours)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Rate:</span>
                    <span>₹{selectedMachine.pricePerHour}/hour</span>
                  </div>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{bookingData.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="summary-row commission">
                    <span>Platform Fee (10%):</span>
                    <span>₹{Math.round(bookingData.totalPrice * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span className="total-amount">
                      <FaRupeeSign /> {bookingData.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="summary-note">
                    <small>* Platform fee is included in the total amount and will be automatically deducted</small>
                  </div>
                  <div className="summary-note wallet-note">
                    <small>💰 Wallet Balance: <strong>₹{walletBalance.toLocaleString()}</strong></small>
                  </div>
                </div>

                {/* Existing Bookings Display */}
                <div className="existing-bookings">
                  <h4>
                    <FaCalendar /> Existing Bookings
                    {loadingBookings && <span className="loading-spinner">⏳</span>}
                  </h4>
                  
                  {machineBookings.length === 0 ? (
                    <div className="no-bookings">
                      <p>✅ No existing bookings - All dates available</p>
                    </div>
                  ) : (
                    <div className="bookings-list">
                      {machineBookings
                        .filter(booking => booking.status !== 'cancelled' && booking.status !== 'rejected')
                        .map((booking, index) => (
                        <div key={index} className="booking-item">
                          <div className="booking-dates">
                            <strong>{formatBookingDate(booking.date.startDate)}</strong>
                            <span> → </span>
                            <strong>{formatBookingDate(booking.date.endDate)}</strong>
                          </div>
                          <div 
                            className="booking-status"
                            style={{ 
                              background: getBookingStatusColor(booking.status),
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              textTransform: 'capitalize'
                            }}
                          >
                            {booking.status}
                          </div>
                        </div>
                      ))}
                      
                      {checkDateConflict(bookingData.startDate, bookingData.endDate) && (
                        <div className="conflict-warning">
                          ⚠️ Your selected dates conflict with existing bookings above. Please choose different dates.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button
                className="btn-pay"
                onClick={startPayment}
                disabled={
                  bookingData.hours <= 0 || 
                  bookingData.totalPrice <= 0 || 
                  checkDateConflict(bookingData.startDate, bookingData.endDate) ||
                  new Date(bookingData.startDate).getTime() <= Date.now()
                }
                style={{
                  opacity: (checkDateConflict(bookingData.startDate, bookingData.endDate) || new Date(bookingData.startDate).getTime() <= Date.now()) ? 0.5 : 1,
                  cursor: (checkDateConflict(bookingData.startDate, bookingData.endDate) || new Date(bookingData.startDate).getTime() <= Date.now()) ? 'not-allowed' : 'pointer'
                }}
              >
                {new Date(bookingData.startDate).getTime() <= Date.now()
                  ? "Start time has passed - Select future time"
                  : checkDateConflict(bookingData.startDate, bookingData.endDate) 
                    ? "Dates Conflict - Choose Different Dates" 
                    : `Pay ₹${bookingData.totalPrice.toLocaleString()}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedMachineDetails && (
        <div className="modal-overlay">
          <div className="details-modal">
            <div className="modal-header">
              <h2>Machine Details</h2>
              <button
                className="close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Image Gallery */}
              <div className="image-gallery">
                {selectedMachineDetails.photos &&
                selectedMachineDetails.photos.length > 0 ? (
                  <>
                    <img
                      src={`${BACKEND_URL}${selectedMachineDetails.photos[0]}`}
                      alt={selectedMachineDetails.name}
                      className="main-image"
                    />
                    {selectedMachineDetails.photos.length > 1 && (
                      <div className="thumbnail-container">
                        {selectedMachineDetails.photos
                          .slice(1)
                          .map((photo, index) => (
                            <img
                              key={index}
                              src={`${BACKEND_URL}${photo}`}
                              alt={`${selectedMachineDetails.name} ${
                                index + 2
                              }`}
                              className="thumbnail"
                            />
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-images">
                    <FaImage size={60} />
                    <p>No images available</p>
                  </div>
                )}
              </div>

              {/* Machine Details */}
              <div className="details-content">
                <div className="details-header">
                  <h3>{selectedMachineDetails.name}</h3>
                  <div className="details-badges">
                    <span className="rating">
                      <FaStar /> {selectedMachineDetails.rating || 4.5}
                    </span>
                    <span className="price-badge">
                      <FaRupeeSign /> {selectedMachineDetails.pricePerHour}/hour
                    </span>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-item">
                    <FaTractor className="detail-icon" />
                    <div>
                      <label>Type</label>
                      <p>{selectedMachineDetails.type || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FaInfoCircle className="detail-icon" />
                    <div>
                      <label>Model</label>
                      <p>{selectedMachineDetails.model || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FaUser className="detail-icon" />
                    <div>
                      <label>Owner</label>
                      <p>
                        {selectedMachineDetails.owner?.name || "Not specified"}
                      </p>
                      {selectedMachineDetails.owner?.phone && (
                        <p className="contact-info">
                          <FaPhone /> {selectedMachineDetails.owner.phone}
                        </p>
                      )}
                      {selectedMachineDetails.owner?.email && (
                        <p className="contact-info">
                          ✉️ {selectedMachineDetails.owner.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <div>
                      <label>Location</label>
                      <p>
                        {selectedMachineDetails.location?.address ||
                          "Not specified"}
                      </p>
                    </div>
                  </div>

                  {selectedMachineDetails.bookingCount !== undefined && (
                    <div className="detail-item">
                      <FaCalendar className="detail-icon" />
                      <div>
                        <label>Total Bookings</label>
                        <p>{selectedMachineDetails.bookingCount}</p>
                      </div>
                    </div>
                  )}

                  <div className="detail-item full-width">
                    <FaInfoCircle className="detail-icon" />
                    <div>
                      <label>Specifications</label>
                      <p>
                        {selectedMachineDetails.specifications ||
                          "No specifications provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedMachineDetails.createdAt && (
                  <div className="detail-item">
                    <label>Listed on</label>
                    <p>{formatDate(selectedMachineDetails.createdAt)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-book"
                onClick={() => {
                  setShowDetailsModal(false);
                  openBookingPopup(selectedMachineDetails);
                }}
                disabled={!selectedMachineDetails.availability}
              >
                {selectedMachineDetails.availability
                  ? "Book This Machine"
                  : "Currently Unavailable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================== CUSTOM PAYMENT MODAL ================== */}
      {showPaymentModal && selectedMachine && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Complete Payment</h2>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod("");
                  setIsProcessingPayment(false);
                  setPaymentError("");
                  setPaymentDetails({
                    upiId: "",
                    cardNumber: "",
                    expiryDate: "",
                    cvv: "",
                    cardholderName: ""
                  });
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-summary">
                <h3>{selectedMachine.name}</h3>
                <div className="amount-breakdown">
                  <div className="breakdown-row">
                    <span>Booking Amount:</span>
                    <span>₹{bookingData.totalPrice}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Platform Fee (10%):</span>
                    <span>₹{Math.round(bookingData.totalPrice * 0.1)}</span>
                  </div>
                  <div className="breakdown-row total">
                    <span>Total Amount:</span>
                    <span>₹{bookingData.totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="payment-methods">
                <h4>Select Payment Method</h4>
                
                {paymentError && (
                  <div className="payment-error" style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                  }}>
                    ❌ {paymentError}
                  </div>
                )}
                
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === "wallet" ? "selected" : ""} ${walletBalance < bookingData.totalPrice ? "disabled-option" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      disabled={walletBalance < bookingData.totalPrice}
                      onChange={(e) => { setPaymentMethod(e.target.value); setIsPaymentValid(true); }}
                    />
                    <div className="option-content">
                      <div className="option-icon">👛</div>
                      <div className="option-text">
                        <strong>KisanMitra Wallet</strong>
                        <small>
                          Balance: ₹{walletBalance.toLocaleString()}
                          {walletBalance < bookingData.totalPrice && " (Insufficient balance)"}
                        </small>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <div className="option-icon">📱</div>
                      <div className="option-text">
                        <strong>UPI Payment</strong>
                        <small>Pay using UPI ID (PhonePe, Paytm, GPay, etc.)</small>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <div className="option-icon">💳</div>
                      <div className="option-text">
                        <strong>Credit/Debit Card</strong>
                        <small>Pay using your credit or debit card</small>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === "upi" && (
                  <div className="payment-form upi-form">
                    <div className="form-group">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        placeholder="Enter your UPI ID (e.g., user@paytm)"
                        value={paymentDetails.upiId}
                        onChange={(e) => {
                          const value = e.target.value;
                          const validation = validateUpiId(value);
                          
                          setPaymentDetails(prev => ({ ...prev, upiId: value }));
                          setPaymentErrors(prev => ({ ...prev, upiId: validation.error }));
                          
                          // Update overall form validity
                          const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, upiId: value });
                          setIsPaymentValid(isValid);
                        }}
                      />
                      {paymentErrors.upiId && (
                        <div className="payment-error">{paymentErrors.upiId}</div>
                      )}
                      <small>Enter your UPI ID to complete the payment</small>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="payment-form card-form">
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Enter name on card"
                        value={paymentDetails.cardholderName}
                        onChange={(e) => {
                          const value = e.target.value;
                          const validation = validateCardholderName(value);
                          
                          setPaymentDetails(prev => ({ ...prev, cardholderName: value }));
                          setPaymentErrors(prev => ({ ...prev, cardholderName: validation.error }));
                          
                          // Update overall form validity
                          const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, cardholderName: value });
                          setIsPaymentValid(isValid);
                        }}
                        className={paymentErrors.cardholderName ? 'error' : ''}
                        onPaste={(e) => {
                          // Handle paste events with validation
                          setTimeout(() => {
                            const value = e.target.value;
                            const validation = validateCardholderName(value);
                            setPaymentErrors(prev => ({ ...prev, cardholderName: validation.error }));
                            
                            const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, cardholderName: value });
                            setIsPaymentValid(isValid);
                          }, 0);
                        }}
                      />
                      {paymentErrors.cardholderName && (
                        <div className="payment-error">{paymentErrors.cardholderName}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                          const validation = validateCardNumber(value);
                          
                          setPaymentDetails(prev => ({ ...prev, cardNumber: value }));
                          setPaymentErrors(prev => ({ ...prev, cardNumber: validation.error }));
                          
                          // Update overall form validity
                          const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, cardNumber: value });
                          setIsPaymentValid(isValid);
                        }}
                      />
                      {paymentErrors.cardNumber && (
                        <div className="payment-error">{paymentErrors.cardNumber}</div>
                      )}
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          value={paymentDetails.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.substring(0, 2) + '/' + value.substring(2, 4);
                            }
                            
                            const validation = validateExpiryDate(value);
                            
                            setPaymentDetails(prev => ({ ...prev, expiryDate: value }));
                            setPaymentErrors(prev => ({ ...prev, expiryDate: validation.error }));
                            
                            // Update overall form validity
                            const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, expiryDate: value });
                            setIsPaymentValid(isValid);
                          }}
                          className={paymentErrors.expiryDate ? 'error' : ''}
                          onPaste={(e) => {
                            // Handle paste events with validation
                            setTimeout(() => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              const validation = validateExpiryDate(value);
                              setPaymentDetails(prev => ({ ...prev, expiryDate: value }));
                              setPaymentErrors(prev => ({ ...prev, expiryDate: validation.error }));
                              
                              const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, expiryDate: value });
                              setIsPaymentValid(isValid);
                            }, 0);
                          }}
                        />
                        {paymentErrors.expiryDate && (
                          <div className="payment-error">{paymentErrors.expiryDate}</div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength="4"
                          value={paymentDetails.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const validation = validateCVV(value);
                            
                            setPaymentDetails(prev => ({ ...prev, cvv: value }));
                            setPaymentErrors(prev => ({ ...prev, cvv: validation.error }));
                            
                            // Update overall form validity
                            const isValid = validatePaymentForm(paymentMethod, { ...paymentDetails, cvv: value });
                            setIsPaymentValid(isValid);
                          }}
                        />
                        {paymentErrors.cvv && (
                          <div className="payment-error">{paymentErrors.cvv}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod("");
                  setIsProcessingPayment(false);
                  setPaymentError("");
                  setPaymentDetails({
                    upiId: "",
                    cardNumber: "",
                    expiryDate: "",
                    cvv: "",
                    cardholderName: ""
                  });
                  setPaymentErrors({
                    upiId: "",
                    cardNumber: "",
                    expiryDate: "",
                    cvv: "",
                    cardholderName: ""
                  });
                  setIsPaymentValid(false);
                }}
              >
                Cancel
              </button>
              <button
                className={`btn-pay-now ${isProcessingPayment ? 'processing' : ''}`}
                onClick={handlePaymentSubmit}
                disabled={!paymentMethod || isProcessingPayment || (paymentMethod !== "wallet" && !isPaymentValid)}
              >
                {isProcessingPayment ? 'Processing...' : `Pay ₹${bookingData.totalPrice}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================== PAYMENT SUCCESS MODAL WITH RECEIPT ================== */}
      {showSuccessModal && paymentReceipt && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="modal-header">
              <div className="success-icon">
                <div className="checkmark">✓</div>
              </div>
              <h2>Payment Successful!</h2>
              <p className="success-subtitle">Your booking has been confirmed</p>
            </div>

            <div className="modal-body">
              <div className="receipt-container">
                <div className="receipt-header">
                  <h3>🧾 Booking Receipt</h3>
                  <div className="receipt-id">Receipt #: {paymentReceipt.transactionId}</div>
                </div>

                <div className="receipt-details">
                  {/* Machine Details */}
                  <div className="receipt-section">
                    <h4>🚜 Machine Details</h4>
                    <div className="detail-row">
                      <span>Machine:</span>
                      <span>{paymentReceipt.machine.name}</span>
                    </div>
                    <div className="detail-row">
                      <span>Model:</span>
                      <span>{paymentReceipt.machine.model || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span>Type:</span>
                      <span>{paymentReceipt.machine.type || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span>Owner:</span>
                      <span>{paymentReceipt.machine.owner}</span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="receipt-section">
                    <h4>📅 Booking Details</h4>
                    <div className="detail-row">
                      <span>Start Date:</span>
                      <span>{new Date(paymentReceipt.booking.startDate).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span>End Date:</span>
                      <span>{new Date(paymentReceipt.booking.endDate).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span>Duration:</span>
                      <span>{formatTime(paymentReceipt.booking.hours)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Booking ID:</span>
                      <span>{paymentReceipt.bookingId}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="receipt-section">
                    <h4>💳 Payment Details</h4>
                    <div className="detail-row">
                      <span>Payment Method:</span>
                      <span>{paymentReceipt.payment.method.toUpperCase()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Payment ID:</span>
                      <span>{paymentReceipt.paymentId}</span>
                    </div>
                    <div className="detail-row">
                      <span>Transaction Time:</span>
                      <span>{new Date(paymentReceipt.payment.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span>Status:</span>
                      <span className="status-success">{paymentReceipt.payment.status}</span>
                    </div>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="receipt-section amount-section">
                    <h4>💰 Amount Breakdown</h4>
                    <div className="detail-row">
                      <span>Subtotal:</span>
                      <span>₹{paymentReceipt.booking.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Platform Fee (10%):</span>
                      <span>₹{paymentReceipt.booking.platformFee.toLocaleString()}</span>
                    </div>
                    <div className="detail-row total-row">
                      <span><strong>Total Paid:</strong></span>
                      <span><strong>₹{paymentReceipt.booking.totalAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="receipt-footer">
                  <p className="thank-you">Thank you for using KisanMitra!</p>
                  <p className="contact-info">For support, contact us at support@kisanmitra.com</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-download"
                onClick={() => downloadReceipt(paymentReceipt)}
              >
                📄 Download Receipt
              </button>
              <button
                className="btn-close-success"
                onClick={() => {
                  setShowSuccessModal(false);
                  setPaymentReceipt(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Machinery;
