const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.listTeam = asyncHandler(async (req, res) => {
  const users = await User.find({ organization: req.user.organization }).select('-password');
  res.json(users);
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'viewer'].includes(role)) throw new ApiError(400, 'Invalid role');
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, "You can't change your own role");

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    { role },
    { new: true }
  ).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
});
