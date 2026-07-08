const Sentiment = require('sentiment');
const analyzer = new Sentiment();

// Lexicon-based sentiment scoring - works fully offline, no API key needed.
function analyzeSentiment(text) {
  const result = analyzer.analyze(text);
  let label = 'neutral';
  if (result.score > 1) label = 'positive';
  else if (result.score < -1) label = 'negative';
  return { score: result.score, comparative: result.comparative, label };
}

module.exports = { analyzeSentiment };
