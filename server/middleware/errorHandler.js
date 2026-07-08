const ApiError = require('../utils/ApiError');

// Central error handler — every route either throws an ApiError, throws a
// Mongoose/validation error, or lets asyncHandler forward unexpected errors
// here. Keeps controllers free of repetitive try/catch + status juggling.
module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
