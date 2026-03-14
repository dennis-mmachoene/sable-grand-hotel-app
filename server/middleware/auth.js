const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return sendError(res, 'Not authorised to access this route', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    if (!user)          return sendError(res, 'User no longer exists', 401);
    if (!user.isActive) return sendError(res, 'Your account has been deactivated. Please contact support.', 401);
    if (user.changedPasswordAfter(decoded.iat)) return sendError(res, 'Password recently changed. Please log in again.', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError')  return sendError(res, 'Invalid token', 401);
    if (err.name === 'TokenExpiredError')  return sendError(res, 'Token expired. Please log in again.', 401);
    return sendError(res, 'Authentication failed', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, `Role '${req.user.role}' is not authorised to access this route`, 403);
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
    next();
  } catch { next(); }
};

module.exports = { protect, authorize, optionalAuth };
