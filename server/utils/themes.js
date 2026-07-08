// Simple keyword-based theme classifier. Each incoming feedback string is scanned
// against curated keyword groups so recurring topics ("Pricing", "Shipping", etc.)
// can be tracked and charted without needing a heavy ML pipeline.
const THEME_KEYWORDS = {
  'Pricing & Billing': ['price', 'pricing', 'expensive', 'cost', 'costly', 'cheap', 'affordable', 'billing', 'subscription', 'invoice', 'refund'],
  'Customer Support': ['support', 'help', 'agent', 'response', 'responsive', 'service', 'staff', 'representative', 'ticket', 'help desk'],
  'Product Quality': ['quality', 'broken', 'defect', 'durable', 'sturdy', 'build', 'damaged', 'faulty'],
  'Shipping & Delivery': ['shipping', 'delivery', 'late', 'delayed', 'arrived', 'package', 'courier', 'tracking'],
  'User Experience': ['ui', 'ux', 'interface', 'easy to use', 'difficult', 'confusing', 'navigate', 'design', 'layout'],
  'Performance & Reliability': ['slow', 'fast', 'crash', 'bug', 'lag', 'loading', 'performance', 'downtime', 'glitch'],
  'Features & Functionality': ['feature', 'functionality', 'missing feature', 'request', 'wish', 'integration', 'update'],
  'Onboarding': ['onboarding', 'setup', 'getting started', 'tutorial', 'documentation'],
};

function extractThemes(text) {
  const lower = text.toLowerCase();
  const matched = [];
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(theme);
    }
  }
  return matched.length ? matched : ['General Feedback'];
}

module.exports = { extractThemes, THEME_KEYWORDS };
