const errorHandler = (err, req, res, next) => {
  let error   = { ...err };
  error.message = err.message;

  if (process.env.NODE_ENV === 'development') console.error('Error:', err);

  if (err.name === 'CastError') {
    error.message   = `Resource not found`;
    error.statusCode = 404;
  }
  if (err.code === 11000) {
    const field  = Object.keys(err.keyValue || {})[0] || 'field';
    const value  = err.keyValue?.[field];
    error.message   = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error.statusCode = 409;
  }
  if (err.name === 'ValidationError') {
    error.message   = Object.values(err.errors).map(v => v.message).join('. ');
    error.statusCode = 400;
  }
  if (err.name === 'JsonWebTokenError') { error.message = 'Invalid token';   error.statusCode = 401; }
  if (err.name === 'TokenExpiredError') { error.message = 'Token expired';   error.statusCode = 401; }
  if (err.code  === 'LIMIT_FILE_SIZE')  { error.message = 'File too large';  error.statusCode = 400; }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
