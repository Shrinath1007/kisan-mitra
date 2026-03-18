import API from "./axiosClient";

// Optional order creation (payment route) - your backend supports this too
export const createPaymentOrder = (bookingId) =>
    API.post(`/payment/order/${bookingId}`);

// Verify payment (send razorpay ids + bookingId)
export const verifyPayment = (paymentData) =>
    API.post(`/payment/verify`, paymentData);

// Get payment status
export const getPaymentStatus = (bookingId) =>
    API.get(`/payment/status/${bookingId}`);