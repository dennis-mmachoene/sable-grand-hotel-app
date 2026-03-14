const mongoose = require('mongoose');

// ─── Service Request ─────────────────────────────────────────────────────────
const ServiceRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    roomNumber: { type: String },
    serviceType: {
      type: String, required: true,
      enum: ['room_cleaning','laundry','food_delivery','maintenance','extra_towels',
             'extra_pillows','wake_up_call','transportation','concierge','spa','other'],
    },
    title:       { type: String, required: true },
    description: { type: String },
    priority:    { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
    status:      { type: String, enum: ['pending','assigned','in_progress','completed','cancelled'], default: 'pending' },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledFor: { type: Date },
    completedAt:  { type: Date },
    notes:       { type: String },
    feedback: { rating: { type: Number, min: 1, max: 5 }, comment: String },
  },
  { timestamps: true }
);

ServiceRequestSchema.pre('save', function (next) {
  if (!this.requestNumber) {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.requestNumber = `SR-${random}`;
  }
  next();
});

ServiceRequestSchema.index({ status: 1, serviceType: 1 });
ServiceRequestSchema.index({ guest: 1 });

const HotelServiceSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    icon: String,
    available247: Boolean,
    hours: String,
  },
  { _id: false },
);

const DiningSchema = new mongoose.Schema(
  {
    name: String,
    type: String, // safe here — Mongoose won't misinterpret inside Schema()
    hours: String,
    description: String,
  },
  { _id: false }, // suppress auto _id on subdocs
);

// ─── Hotel Info ───────────────────────────────────────────────────────────────
const HotelInfoSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, default: 'Sable Grand' },
    tagline:     { type: String },
    description: { type: String },
    stars:       { type: Number, min: 1, max: 5, default: 5 },
    address: {
      street: String, city: { type: String, default: 'Sandton' },
      state:  { type: String, default: 'Gauteng' },
      country:{ type: String, default: 'South Africa' },
      zipCode:{ type: String, default: '2196' },
      coordinates: { lat: Number, lng: Number },
    },
    contact: { phone: String, alternatePhone: String, email: String, website: String },
    social:  { facebook: String, instagram: String, twitter: String },
    policies: {
      checkInTime:          { type: String, default: '14:00' },
      checkOutTime:         { type: String, default: '11:00' },
      cancellationPolicy:   String,
      petPolicy:            String,
      smokingPolicy:        String,
      childrenPolicy:       String,
    },
    amenities:  [String],
    images: [{ url: String, caption: String, category: String }],
    services: [HotelServiceSchema],
    dining: [DiningSchema],
    taxRate:    { type: Number, default: 15 }, // South Africa VAT
    currency:   { type: String, default: 'ZAR' },
    timezone:   { type: String, default: 'Africa/Johannesburg' },
    totalRooms: { type: Number, default: 0 },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Chat Log ─────────────────────────────────────────────────────────────────
const ChatLogSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messages: [{
      role:      { type: String, enum: ['user','assistant'], required: true },
      content:   { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      tokens:    Number,
    }],
    totalMessages:    { type: Number, default: 0 },
    resolvedQueries:  [String],
    escalated:        { type: Boolean, default: false },
    feedback: { helpful: Boolean, rating: { type: Number, min: 1, max: 5 } },
  },
  { timestamps: true }
);

ChatLogSchema.index({ sessionId: 1 });
ChatLogSchema.index({ user: 1 });

module.exports = {
  ServiceRequest: mongoose.model('ServiceRequest', ServiceRequestSchema),
  HotelInfo:      mongoose.model('HotelInfo', HotelInfoSchema),
  ChatLog:        mongoose.model('ChatLog', ChatLogSchema),
};
