const Feedback = require('../models/Feedback');
const { generateAIText } = require('../utils/aiClient');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// "Ask AI" - a lightweight retrieval-then-answer flow:
// 1. Find feedback entries related to the question (keyword match).
// 2. Hand those excerpts to the AI model (if configured) to write an answer.
// 3. If no AI key is set, fall back to a rule-based summary using real stats.
exports.ask = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) throw new ApiError(400, 'A question is required');

  const orgId = req.user.organization;
  const keywords = question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const regex = keywords.length ? keywords.join('|') : question;

  const relevant = await Feedback.find({
    organization: orgId,
    $or: [
      { text: { $regex: regex, $options: 'i' } },
      { themes: { $regex: regex, $options: 'i' } },
    ],
  }).sort({ createdAt: -1 }).limit(15);

  const pool = relevant.length
    ? relevant
    : await Feedback.find({ organization: orgId }).sort({ createdAt: -1 }).limit(15);

  const positive = pool.filter((f) => f.sentiment.label === 'positive').length;
  const negative = pool.filter((f) => f.sentiment.label === 'negative').length;
  const neutral = pool.length - positive - negative;

  const context = pool.map((f, i) => `${i + 1}. [${f.channel}, ${f.sentiment.label}] "${f.text}"`).join('\n');
  const prompt = `Customer feedback excerpts:\n${context}\n\nQuestion: ${question}\n\nAnswer the question using only the excerpts above. Mention specific themes and be concise (3-5 sentences).`;

  let answer = await generateAIText(prompt);
  if (!answer) {
    const topThemes = [...new Set(pool.flatMap((f) => f.themes))].slice(0, 5).join(', ') || 'no clear themes yet';
    answer = `Based on ${pool.length} related feedback entries (positive: ${positive}, neutral: ${neutral}, negative: ${negative}), `
      + `customers most frequently mention: ${topThemes}. `
      + `Tip: add an OPENAI_API_KEY in the server .env for a richer, AI-generated answer here.`;
  }

  res.json({
    answer,
    supportingFeedback: pool.slice(0, 5).map((f) => ({
      id: f._id,
      text: f.text,
      sentiment: f.sentiment.label,
      channel: f.channel,
      themes: f.themes,
    })),
  });
});

// Automated Voice-of-Customer report: aggregates real stats for a time window,
// then asks the AI model to turn them into an executive narrative (or falls
// back to a templated narrative if no AI key is configured).
exports.generateVoCReport = asyncHandler(async (req, res) => {
  const orgId = req.user.organization;
  const days = Math.min(Number(req.query.days) || 30, 180);
  const since = new Date(); since.setDate(since.getDate() - days);

  const feedback = await Feedback.find({ organization: orgId, createdAt: { $gte: since } });
  const total = feedback.length;
  const positive = feedback.filter((f) => f.sentiment.label === 'positive').length;
  const negative = feedback.filter((f) => f.sentiment.label === 'negative').length;
  const neutral = total - positive - negative;

  const themeCounts = {};
  feedback.forEach((f) => f.themes.forEach((t) => { themeCounts[t] = (themeCounts[t] || 0) + 1; }));
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  const channelCounts = {};
  feedback.forEach((f) => { channelCounts[f.channel] = (channelCounts[f.channel] || 0) + 1; });

  const stats = {
    period: `${days} days`,
    total,
    sentimentBreakdown: { positive, neutral, negative },
    positiveRate: total ? Math.round((positive / total) * 100) : 0,
    negativeRate: total ? Math.round((negative / total) * 100) : 0,
    topThemes,
    channelCounts,
  };

  const prompt = `Write a short Voice-of-Customer executive summary (4-6 sentences) using this data: ${JSON.stringify(stats)}. Be specific, mention the top themes and overall sentiment trend, and end with one actionable recommendation.`;

  let narrative = await generateAIText(prompt);
  if (!narrative) {
    narrative = `Over the last ${days} days, the team collected ${total} feedback entries with ${stats.positiveRate}% positive and ${stats.negativeRate}% negative sentiment. `
      + `The most frequently mentioned topics were ${topThemes.map((t) => t.theme).join(', ') || 'not enough data yet'}. `
      + `Recommendation: prioritize investigating "${topThemes[0]?.theme || 'top themes'}" since it drives the most customer conversation right now. `
      + `Tip: add an OPENAI_API_KEY in the server .env for a richer, AI-written narrative.`;
  }

  res.json({ stats, narrative, generatedAt: new Date() });
});
