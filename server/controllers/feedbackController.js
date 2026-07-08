const Feedback = require('../models/Feedback');
const { analyzeSentiment } = require('../utils/sentiment');
const { extractThemes } = require('../utils/themes');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');

exports.createFeedback = asyncHandler(async (req, res) => {
  const { customerName, customerEmail, channel, text, rating } = req.body;

  const sentiment = analyzeSentiment(text);
  const themes = extractThemes(text);

  const feedback = await Feedback.create({
    organization: req.user.organization,
    customerName,
    customerEmail,
    channel,
    text,
    rating,
    sentiment: { score: sentiment.score, label: sentiment.label },
    themes,
    createdBy: req.user._id,
  });

  cache.invalidate(`analytics:${req.user.organization}`);
  res.status(201).json(feedback);
});

const ALLOWED_SORT = ['createdAt', '-createdAt', 'rating', '-rating'];

exports.listFeedback = asyncHandler(async (req, res) => {
  const { channel, sentiment, theme, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const filter = { organization: req.user.organization };
  if (channel) filter.channel = channel;
  if (sentiment) filter['sentiment.label'] = sentiment;
  if (theme) filter.themes = theme;
  if (search) filter.text = { $regex: search, $options: 'i' };

  const safeSort = ALLOWED_SORT.includes(sort) ? sort : '-createdAt';
  const safeLimit = Math.min(Number(limit) || 20, 100);
  const skip = (Number(page) - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Feedback.find(filter).sort(safeSort).skip(skip).limit(safeLimit),
    Feedback.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: safeLimit, pages: Math.ceil(total / safeLimit) });
});

exports.getFeedback = asyncHandler(async (req, res) => {
  const fb = await Feedback.findOne({ _id: req.params.id, organization: req.user.organization });
  if (!fb) throw new ApiError(404, 'Feedback not found');
  res.json(fb);
});

exports.deleteFeedback = asyncHandler(async (req, res) => {
  const fb = await Feedback.findOneAndDelete({ _id: req.params.id, organization: req.user.organization });
  if (!fb) throw new ApiError(404, 'Feedback not found');
  cache.invalidate(`analytics:${req.user.organization}`);
  res.json({ message: 'Feedback deleted' });
});

// Bulk delete - lets the UI offer "select all matching filters" style cleanup
// without round-tripping one request per row.
exports.bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, 'ids array is required');
  const result = await Feedback.deleteMany({ _id: { $in: ids }, organization: req.user.organization });
  cache.invalidate(`analytics:${req.user.organization}`);
  res.json({ deletedCount: result.deletedCount });
});

// Streams a CSV export of feedback matching the current filters, so teams
// can drop results into a spreadsheet or another BI tool.
exports.exportCsv = asyncHandler(async (req, res) => {
  const { channel, sentiment, theme, search } = req.query;
  const filter = { organization: req.user.organization };
  if (channel) filter.channel = channel;
  if (sentiment) filter['sentiment.label'] = sentiment;
  if (theme) filter.themes = theme;
  if (search) filter.text = { $regex: search, $options: 'i' };

  const items = await Feedback.find(filter).sort('-createdAt').limit(5000);

  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const header = ['Date', 'Customer', 'Email', 'Channel', 'Rating', 'Sentiment', 'Themes', 'Feedback'];
  const rows = items.map((f) => [
    new Date(f.createdAt).toISOString(),
    f.customerName,
    f.customerEmail,
    f.channel,
    f.rating ?? '',
    f.sentiment.label,
    f.themes.join('; '),
    f.text,
  ].map(escape).join(','));

  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="loop-feedback-${Date.now()}.csv"`);
  res.send(csv);
});
