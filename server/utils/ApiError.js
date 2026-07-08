// A small typed error so controllers can throw `new ApiError(404, '...')`
// and the central error handler knows exactly what status/message to send,
// instead of every controller hand-rolling res.status().json().
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = ApiError;
