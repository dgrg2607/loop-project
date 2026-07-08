const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Register either creates a brand-new organization (first user = admin)
// or joins an existing organization via inviteCode (new user = viewer,
// can be promoted later from the Team page by an admin).
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, organizationName, inviteCode } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(400, 'Email already registered');

  let organization;
  let role = 'viewer';

  if (inviteCode) {
    organization = await Organization.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!organization) throw new ApiError(400, 'Invalid invite code');
  } else {
    if (!organizationName) throw new ApiError(400, 'organizationName is required to create a new workspace');
    organization = await Organization.create({ name: organizationName });
    role = 'admin';
  }

  const user = await User.create({ name, email, password, organization: organization._id, role });
  const token = signToken(user);
  res.status(201).json({
    token,
    user: user.toSafeObject(),
    organization: { id: organization._id, name: organization.name, inviteCode: organization.inviteCode },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');
  const token = signToken(user);
  res.json({ token, user: user.toSafeObject() });
});

exports.me = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.organization);
  res.json({
    user: req.user.toSafeObject(),
    organization: organization
      ? { id: organization._id, name: organization.name, inviteCode: organization.inviteCode }
      : null,
  });
});
