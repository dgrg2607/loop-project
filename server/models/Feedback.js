const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    customerName: { type: String, trim: true, default: 'Anonymous' },
    customerEmail: { type: String, trim: true, lowercase: true },
    channel: {
      type: String,
      enum: ['email', 'chat', 'survey', 'social', 'review', 'support_ticket'],
      default: 'survey',
    },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    sentiment: {
      score: { type: Number, default: 0 },
      label: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    },
    themes: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

feedbackSchema.index({ organization: 1, createdAt: -1 });
feedbackSchema.index({ organization: 1, 'sentiment.label': 1 });
feedbackSchema.index({ organization: 1, channel: 1 });
feedbackSchema.index({ organization: 1, themes: 1 });
feedbackSchema.index({ organization: 1, rating: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
