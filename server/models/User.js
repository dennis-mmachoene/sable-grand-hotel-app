const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
    lastName:  { type: String, required: [true, 'Last name is required'],  trim: true, maxlength: 50 },
    email: {
      type: String, required: [true, 'Email is required'], unique: true,
      lowercase: true, trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String, required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'], select: false,
    },
    role: {
      type: String,
      enum: ['admin','manager','receptionist','housekeeping','service_staff','guest'],
      default: 'guest',
    },
    phone:  { type: String, trim: true },
    avatar: { type: String, default: null },
    address: { street: String, city: String, state: String, country: { type: String, default: 'South Africa' }, zipCode: String },
    idType:   { type: String, enum: ['passport','national_id','drivers_licence','other'] },
    idNumber: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: Date,
    // Staff fields
    department: { type: String, enum: ['front_desk','housekeeping','food_beverage','maintenance','management',null], default: null },
    employeeId: { type: String, sparse: true },
    shift:      { type: String, enum: ['morning','afternoon','night',null], default: null },
    hireDate:   { type: Date },
    // Guest fields
    loyaltyPoints: { type: Number, default: 0 },
    totalStays:    { type: Number, default: 0 },
    preferences: { roomType: String, floorPreference: String, specialRequests: String },
    // Notifications (legacy — new system uses Notification model)
    notifications: [{
      message: String,
      type: { type: String, enum: ['info','success','warning','error'] },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ employeeId: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

UserSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    return jwtTimestamp < parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);
