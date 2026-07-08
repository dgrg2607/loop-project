const { validationResult } = require('express-validator');

// Runs after an express-validator chain; turns the first validation failure
// into a clean 400 response instead of leaking Express internals.
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};
