const User = require('../models/User');
const { sendSuccess, sendError, asyncHandler } = require('../utils/response');

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'An account with this email already exists', 409);

  const user = await User.create({ firstName, lastName, email, password, phone, role: 'guest' });
  const token = user.generateToken();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    token,
    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, phone: user.phone, loyaltyPoints: user.loyaltyPoints },
  }, 'Account created successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Please provide email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) return sendError(res, 'Invalid email or password', 401);
  if (!user.isActive) return sendError(res, 'Your account has been deactivated. Please contact support.', 401);

  const token = user.generateToken();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    token,
    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar, department: user.department, loyaltyPoints: user.loyaltyPoints },
  }, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  return sendSuccess(res, { user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['firstName','lastName','phone','address','preferences'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
  return sendSuccess(res, { user }, 'Profile updated successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.matchPassword(currentPassword))) return sendError(res, 'Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
  const token = user.generateToken();
  return sendSuccess(res, { token }, 'Password changed successfully');
});

module.exports = { register, login, getMe, updateProfile, changePassword };
