const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional: send to all with a specific role
    recipientRole: {
      type: String,
      enum: ['admin', 'manager', 'receptionist', 'housekeeping', 'service_staff', 'guest', null],
      default: null,
    },
    type: {
      type: String,
      enum: ['booking', 'check_in', 'check_out', 'payment', 'cancellation', 'service', 'system', 'alert'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // optional deep link
    read: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // extra context
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-expire old read notifications after 30 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { read: true } }
);

// ── Helper: create + broadcast ────────────────────────────────────────────────
NotificationSchema.statics.createAndBroadcast = async function (app, {
  recipient, type, title, message, link, metadata,
}) {
  const notif = await this.create({ recipient, type, title, message, link, metadata });
  app?.get('notifyUser')?.(recipient.toString(), notif.toJSON());
  return notif;
};

// Create for all users with a role
NotificationSchema.statics.createForRole = async function (app, {
  role, type, title, message, link, metadata,
}) {
  const User = mongoose.model('User');
  const users = await User.find({ role, isActive: true }).select('_id');

  const docs = users.map(u => ({
    recipient: u._id,
    recipientRole: role,
    type, title, message, link, metadata,
  }));

  if (docs.length === 0) return [];
  const notifs = await this.insertMany(docs);
  // Broadcast to role room
  app?.get('notifyRole')?.(role, {
    type, title, message, link, metadata,
    createdAt: new Date().toISOString(),
  });
  return notifs;
};

module.exports = mongoose.model('Notification', NotificationSchema);
