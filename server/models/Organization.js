const mongoose = require('mongoose');
const crypto = require('crypto');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
