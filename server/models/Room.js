const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: [true, 'Room number is required'], unique: true, trim: true },
    type: {
      type: String, required: true,
      enum: ['standard','deluxe','suite','presidential'],
    },
    name:        { type: String, required: [true, 'Room name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    floor:       { type: Number, required: true },
    capacity: {
      adults:   { type: Number, default: 2, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    bedConfiguration: {
      type: String,
      enum: ['single','double','twin','queen','king','two_queens','two_kings'],
      required: true,
    },
    size: { type: Number }, // m²
    price: {
      base:     { type: Number, required: [true, 'Base price (ZAR) is required'], min: 0 },
      weekend:  { type: Number, min: 0 },
      seasonal: { type: Number, min: 0 },
    },
    status: {
      type: String,
      enum: ['available','booked','maintenance','cleaning'],
      default: 'available',
    },
    amenities: [{
      type: String,
      enum: [
        'wifi','ac','tv','minibar','safe','bathtub','shower','balcony',
        'ocean_view','city_view','garden_view','pool_view','jacuzzi',
        'kitchen','living_room','dining_area','butler_service',
        'coffee_machine','iron','hair_dryer','telephone','desk',
        'sofa','extra_bed_available','pet_friendly','smoking_allowed',
      ],
    }],
    images: [{
      url:       { type: String, required: true },
      caption:   String,
      isPrimary: { type: Boolean, default: false },
    }],
    features: {
      smokingAllowed:        { type: Boolean, default: false },
      petFriendly:           { type: Boolean, default: false },
      accessible:            { type: Boolean, default: false },
      connectingRoom:        { type: Boolean, default: false },
    },
    rating: { average: { type: Number, default: 0, min: 0, max: 5 }, count: { type: Number, default: 0 } },
    lastCleaned:     { type: Date },
    lastMaintenance: { type: Date },
    notes:     { type: String },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

RoomSchema.virtual('primaryImage').get(function () {
  if (!this.images?.length) return null;
  return (this.images.find(i => i.isPrimary) || this.images[0]).url;
});

RoomSchema.index({ type: 1, status: 1 });
RoomSchema.index({ 'price.base': 1 });
RoomSchema.index({ roomNumber: 1 });

module.exports = mongoose.model('Room', RoomSchema);
