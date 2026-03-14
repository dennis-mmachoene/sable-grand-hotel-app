const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const sendPaginated = (res, data, total, page, limit, message = 'Success') =>
  res.status(200).json({
    success: true, message, data,
    pagination: {
      total, page: parseInt(page), limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getPaginationOptions = query => {
  const page  = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const getSortOptions = (query, defaultSort = { createdAt: -1 }) => {
  if (!query.sortBy) return defaultSort;
  return { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
};

module.exports = { sendSuccess, sendError, sendPaginated, asyncHandler, getPaginationOptions, getSortOptions };
