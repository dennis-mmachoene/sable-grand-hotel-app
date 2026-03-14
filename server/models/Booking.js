const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, unique: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room:  { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    checkInDate:   { type: Date, required: true },
    checkOutDate:  { type: Date, required: true },
    actualCheckIn:  { type: Date },
    actualCheckOut: { type: Date },
    numberOfNights: { type: Number },
    guests: {
      adults:   { type: Number, required: true, min: 1, default: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    pricing: {
      roomRate:    { type: Number, required: true },  // ZAR excl. VAT
      taxes:       { type: Number, default: 0 },      // 15% VAT (SA)
      fees:        { type: Number, default: 0 },
      discount:    { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },  // ZAR incl. VAT
      paidAmount:  { type: Number, default: 0 },
      balanceDue:  { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending','confirmed','checked_in','completed','cancelled','no_show'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid','partial','paid','refunded'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card','debit_card','eft','cash','bank_transfer','online',null],
      default: null,
    },
    source: {
      type: String,
      enum: ['website','walk_in','phone','third_party','reception'],
      default: 'website',
    },
    specialRequests: { type: String },
    internalNotes:   { type: String },
    cancellation: {
      cancelledAt: Date,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason:       String,
      refundAmount: Number,
      refundStatus: { type: String, enum: ['pending','processed','denied',null], default: null },
    },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { score: { type: Number, min: 1, max: 5 }, comment: String, ratedAt: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Generate booking reference on save
BookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const yr     = new Date().getFullYear().toString().slice(-2);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingReference = `SG${yr}-${random}`;
  }
  if (this.checkInDate && this.checkOutDate) {
    this.numberOfNights = Math.ceil(
      (new Date(this.checkOutDate) - new Date(this.checkInDate)) / (1000 * 60 * 60 * 24)
    );
  }
  if (this.pricing) {
    this.pricing.balanceDue = Math.max(0, this.pricing.totalAmount - this.pricing.paidAmount);
  }
  next();
});

BookingSchema.index({ guest: 1, status: 1 });
BookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ bookingReference: 1 });
BookingSchema.index({ status: 1, checkInDate: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
