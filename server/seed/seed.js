// Run with: npm run seed  (from /server)
// Wipes existing data and creates a demo organization, 3 demo users (admin,
// manager, viewer), and ~30 realistic feedback entries spread across the
// last 30 days so the dashboard has something interesting to show right away.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { analyzeSentiment } = require('../utils/sentiment');
const { extractThemes } = require('../utils/themes');

const SAMPLE_FEEDBACK = [
  { channel: 'review', rating: 5, text: 'The product quality is amazing and the user interface is so easy to use. Five stars!' },
  { channel: 'support_ticket', rating: 2, text: 'Support response time has been slow this week. I waited three days for a reply from an agent.' },
  { channel: 'chat', rating: 4, text: 'Quick chat with support, the agent was helpful and resolved my billing issue fast.' },
  { channel: 'survey', rating: 1, text: 'Pricing is too expensive for the features we get. Considering cancelling our subscription.' },
  { channel: 'email', rating: 3, text: 'Delivery was delayed by a week, the package arrived damaged but support gave a refund.' },
  { channel: 'social', rating: 5, text: 'Loving the new dashboard design, the UX is clean and intuitive now.' },
  { channel: 'review', rating: 2, text: 'App keeps crashing and the performance is really slow during peak hours.' },
  { channel: 'survey', rating: 4, text: 'Onboarding documentation was clear, setup took less than ten minutes.' },
  { channel: 'support_ticket', rating: 1, text: 'Billing invoice was wrong twice in a row, very frustrating customer service experience.' },
  { channel: 'chat', rating: 5, text: 'Great customer support, the representative was friendly and fixed everything quickly.' },
  { channel: 'review', rating: 3, text: 'Decent product but missing some key features we requested months ago.' },
  { channel: 'email', rating: 2, text: 'Shipping tracking was inaccurate and the courier never updated the delivery status.' },
  { channel: 'social', rating: 4, text: 'Affordable pricing for a small business, good value overall.' },
  { channel: 'survey', rating: 1, text: 'The interface is confusing, hard to navigate, and the layout feels outdated.' },
  { channel: 'support_ticket', rating: 4, text: 'Quick resolution from the support staff, much appreciated.' },
  { channel: 'review', rating: 5, text: 'Reliable and fast, no crashes or bugs so far, excellent performance.' },
  { channel: 'chat', rating: 2, text: 'Requested a refund due to a defect in the product, still waiting on a response.' },
  { channel: 'email', rating: 3, text: 'Subscription billing cycle is confusing, would like clearer invoices.' },
  { channel: 'survey', rating: 5, text: 'The new feature update was exactly what we wished for, great integration with our tools.' },
  { channel: 'social', rating: 1, text: 'Terrible experience, the app crashed during checkout and support was unresponsive.' },
  { channel: 'review', rating: 4, text: 'Good build quality, durable product, delivery was on time.' },
  { channel: 'chat', rating: 3, text: 'Onboarding tutorial helped but documentation could be more detailed.' },
  { channel: 'support_ticket', rating: 5, text: 'Excellent service, the agent went above and beyond to help with our setup.' },
  { channel: 'email', rating: 2, text: 'Cost is going up every renewal, not happy with the pricing changes.' },
  { channel: 'survey', rating: 4, text: 'Love the easy to use interface, design feels modern and clean.' },
  { channel: 'review', rating: 1, text: 'Package arrived broken, packaging was poor and the delivery courier was careless.' },
  { channel: 'chat', rating: 5, text: 'Fast loading times now, performance has improved a lot since the last update.' },
  { channel: 'support_ticket', rating: 3, text: 'Help desk resolved my ticket but it took longer than expected.' },
  { channel: 'social', rating: 4, text: 'Great feature request turnaround, the team actually listens to feedback.' },
  { channel: 'survey', rating: 2, text: 'Setup documentation was missing steps, onboarding was confusing for new users.' },
];

async function run() {
  await connectDB();
  await Promise.all([Organization.deleteMany({}), User.deleteMany({}), Feedback.deleteMany({})]);

  const org = await Organization.create({ name: 'Acme Corp (Demo)' });
  const admin = await User.create({ name: 'Demo Admin', email: 'admin@demo.com', password: 'password123', role: 'admin', organization: org._id });
  await User.create({ name: 'Demo Manager', email: 'manager@demo.com', password: 'password123', role: 'manager', organization: org._id });
  await User.create({ name: 'Demo Viewer', email: 'viewer@demo.com', password: 'password123', role: 'viewer', organization: org._id });

  for (let i = 0; i < SAMPLE_FEEDBACK.length; i += 1) {
    const item = SAMPLE_FEEDBACK[i];
    const sentiment = analyzeSentiment(item.text);
    const themes = extractThemes(item.text);
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const doc = new Feedback({
      organization: org._id,
      customerName: `Customer ${i + 1}`,
      customerEmail: `customer${i + 1}@example.com`,
      channel: item.channel,
      text: item.text,
      rating: item.rating,
      sentiment: { score: sentiment.score, label: sentiment.label },
      themes,
      createdBy: admin._id,
      createdAt,
    });
    await doc.save();
  }

  console.log('--------------------------------------------------');
  console.log(`Seeded organization: "${org.name}"`);
  console.log(`Invite code: ${org.inviteCode}`);
  console.log('Login with:');
  console.log('  admin@demo.com   / password123  (role: admin)');
  console.log('  manager@demo.com / password123  (role: manager)');
  console.log('  viewer@demo.com  / password123  (role: viewer)');
  console.log(`Inserted ${SAMPLE_FEEDBACK.length} feedback entries.`);
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
