const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // The user initiating the transaction (e.g., farmer paying)
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // The user receiving the funds (e.g., owner, labour, or admin for commission)
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // The wallet funds are being debited from
  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
  },
  // The wallet funds are being credited to
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
  },
  amount: {
    type: Number,
    required: true,
  },
  // Type of transaction
  type: {
    type: String,
    enum: [
      'booking_payment', // Farmer pays for a service
      'payout_release',  // Admin releases funds to owner/labour
      'commission',      // Platform takes its cut
      'withdrawal',      // User withdraws funds
      'refund',          // Refunding a payment
      'platform_fee',    // A specific fee charged by the platform
    ],
    required: true,
  },
  // Status of the transaction
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'on_hold'],
    default: 'pending',
  },
  // Related entities for context
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  // Additional details or notes
  description: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
