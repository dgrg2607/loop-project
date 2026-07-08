const Feedback = require('../models/Feedback');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../utils/cache');

// Aggregation pipelines are the most expensive thing this API does, so every
// endpoint here is cached per-organization for 30s. Writes to Feedback call
// cache.invalidate(`analytics:${orgId}`) so the dashboard never shows stale
// numbers for more than a moment after a real change.
function cacheKey(req, name) {
  return `analytics:${req.user.organization}:${name}:${JSON.stringify(req.query)}`;
}

exports.overview = asyncHandler(async (req, res) => {
  const key = cacheKey(req, 'overview');
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const orgId = req.user.organization;
  const total = await Feedback.countDocuments({ organization: orgId });
  const bySentiment = await Feedback.aggregate([
    { $match: { organization: orgId } },
    { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
  ]);

  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  bySentiment.forEach((s) => { sentimentBreakdown[s._id] = s.count; });

  const avgRatingResult = await Feedback.aggregate([
    { $match: { organization: orgId, rating: { $exists: true, $ne: null } } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);

  const payload = {
    total,
    sentimentBreakdown,
    averageRating: avgRatingResult[0]?.avg ? Number(avgRatingResult[0].avg.toFixed(2)) : null,
  };
  cache.set(key, payload);
  res.json(payload);
});

exports.sentimentTrend = asyncHandler(async (req, res) => {
  const key = cacheKey(req, 'trend');
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const orgId = req.user.organization;
  const days = Math.min(Number(req.query.days) || 30, 180);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const trend = await Feedback.aggregate([
    { $match: { organization: orgId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, label: '$sentiment.label' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  const grouped = {};
  trend.forEach((t) => {
    const date = t._id.date;
    if (!grouped[date]) grouped[date] = { date, positive: 0, neutral: 0, negative: 0 };
    grouped[date][t._id.label] = t.count;
  });

  const payload = Object.values(grouped);
  cache.set(key, payload);
  res.json(payload);
});

exports.themes = asyncHandler(async (req, res) => {
  const key = cacheKey(req, 'themes');
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const orgId = req.user.organization;
  const themes = await Feedback.aggregate([
    { $match: { organization: orgId } },
    { $unwind: '$themes' },
    { $group: { _id: '$themes', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const payload = themes.map((t) => ({ theme: t._id, count: t.count }));
  cache.set(key, payload);
  res.json(payload);
});

exports.channels = asyncHandler(async (req, res) => {
  const key = cacheKey(req, 'channels');
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const orgId = req.user.organization;
  const channels = await Feedback.aggregate([
    { $match: { organization: orgId } },
    { $group: { _id: '$channel', count: { $sum: 1 } } },
  ]);

  const payload = channels.map((c) => ({ channel: c._id, count: c.count }));
  cache.set(key, payload);
  res.json(payload);
});

// Compares theme frequency this week vs the prior week to surface emerging trends.
exports.trends = asyncHandler(async (req, res) => {
  const key = cacheKey(req, 'trends');
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const orgId = req.user.organization;
  const now = new Date();
  const recentStart = new Date(now); recentStart.setDate(now.getDate() - 7);
  const previousStart = new Date(now); previousStart.setDate(now.getDate() - 14);

  const [recent, previous] = await Promise.all([
    Feedback.aggregate([
      { $match: { organization: orgId, createdAt: { $gte: recentStart } } },
      { $unwind: '$themes' },
      { $group: { _id: '$themes', count: { $sum: 1 } } },
    ]),
    Feedback.aggregate([
      { $match: { organization: orgId, createdAt: { $gte: previousStart, $lt: recentStart } } },
      { $unwind: '$themes' },
      { $group: { _id: '$themes', count: { $sum: 1 } } },
    ]),
  ]);

  const prevMap = Object.fromEntries(previous.map((p) => [p._id, p.count]));
  const payload = recent
    .map((r) => {
      const prevCount = prevMap[r._id] || 0;
      const change = prevCount === 0 ? 100 : Math.round(((r.count - prevCount) / prevCount) * 100);
      return { theme: r._id, recentCount: r.count, previousCount: prevCount, changePercent: change };
    })
    .sort((a, b) => b.changePercent - a.changePercent);

  cache.set(key, payload);
  res.json(payload);
});
