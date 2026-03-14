const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated, asyncHandler, getPaginationOptions, getSortOptions } = require('../utils/response');

const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const sort = getSortOptions(req.query, { createdAt: -1 });
  const filter = {};

  if (req.query.role)     filter.role     = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { firstName:  { $regex: req.query.search, $options: 'i' } },
      { lastName:   { $regex: req.query.search, $options: 'i' } },
      { email:      { $regex: req.query.search, $options: 'i' } },
      { employeeId: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return sendPaginated(res, users, total, page, limit, 'Users retrieved');
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user });
});

const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone, department, shift, employeeId } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already in use', 409);

  const user = await User.create({
    firstName, lastName, email, password, role, phone,
    department, shift, employeeId, hireDate: new Date(), isActive: true,
  });
  return sendSuccess(res, {
    user: { id: user._id, firstName, lastName, email, role, employeeId },
  }, 'Staff account created', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  delete req.body.password;
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user }, 'User updated successfully');
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, {}, 'User deactivated successfully');
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, { isActive: user.isActive }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, toggleUserStatus };
