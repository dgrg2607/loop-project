// Wraps an async route handler so any thrown error (or rejected promise)
// is forwarded to Express's error middleware instead of crashing the
// process or requiring a try/catch in every single controller.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
