// src/services/bookingAPI.js
import API from "./axiosClient"; // token already attached in interceptor

/**========================
    1) Create Booking (FARMER)
 ========================**/
export const createBooking = (data) => {
    return API.post("/booking/create", data); // /booking/create
};

/**========================
    2) Confirm Manual UPI Payment
       → Updates Wallet / PaymentStatus=Paid
 ========================**/
export const confirmPayment = (bookingId) => {
    return API.post(`/booking/pay/${bookingId}`);
};

/**========================
    3) Get My Own Bookings (FARMER)
 ========================**/
export const getMyBookings = () => {
    return API.get("/booking/history");
};

/**========================
    4) Get bookings of machines owned by me (OWNER)
 ========================**/
export const getOwnerBookings = () => {
    return API.get(`/booking/owner`);
    // NO ownerId needed — backend auto uses req.user._id
};

/**========================
    5) Submit Review/Rating (FARMER)
 ========================**/
export const submitReview = (bookingId, reviewData) => {
    return API.post(`/booking/${bookingId}/review`, reviewData);
};

/**========================
    6) Get Owner Ratings (OWNER)
 ========================**/
export const getOwnerRatings = () => {
    return API.get(`/booking/owner/ratings`);
};