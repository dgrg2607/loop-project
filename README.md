# Project LOOP — AI Customer Feedback Intelligence Platform

A working MERN-stack starter for Project LOOP: a multi-tenant SaaS platform that
collects customer feedback, automatically classifies sentiment, detects recurring
themes and emerging trends, answers natural-language questions about your feedback,
and generates Voice-of-Customer (VoC) reports.

This is a real, runnable scaffold — not a mockup. It works fully offline (sentiment
analysis and theme detection are rule-based, no API key required), and gets smarter
automatically if you add an OpenAI API key for the "Ask AI" and "VoC Report" features.

## Stack

- **MongoDB** — data storage (multi-tenant: every record is scoped to an `organization`)
- **Express** — REST API
- **React (Vite)** — frontend SPA
- **Node.js** — runtime

## Folder structure

```
project-loop/
├── server/                 Express + MongoDB API
│   ├── config/db.js         MongoDB connection
│   ├── models/              Organization, User, Feedback schemas
│   ├── middleware/           JWT auth + role-based access control
│   ├── utils/                sentiment.js, themes.js, aiClient.js
│   ├── controllers/          business logic per resource
│   ├── routes/                /api/auth, /api/feedback, /api/analytics, /api/ai, /api/users
│   ├── seed/seed.js           creates demo org + users + 30 feedback entries
│   └── server.js              app entry point
└── client/                 React (Vite) frontend
    └── src/
        ├── api/axios.js        pre-configured axios instance (adds JWT header)
        ├── context/AuthContext.jsx
        ├── components/         Layout, charts, table, modal
        └── pages/              Login, Register, Dashboard, Feedback, AskAI, Reports, Team
```

## 1. Prerequisites

- Node.js 18 or newer (`node -v`)
- MongoDB running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## 2. Install

From the project root:

```bash
npm install
npm run install:all
```

This installs the root `concurrently` helper plus all server and client dependencies.

## 3. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Open `server/.env` and set `MONGO_URI` to your MongoDB connection string, and set
`JWT_SECRET` to any long random string. Leave `OPENAI_API_KEY` blank to use the
built-in rule-based AI fallback, or paste in a key to unlock real GPT-generated
answers and reports.

## 4. Seed demo data (recommended)

```bash
npm run seed
```

This wipes the database and creates a demo organization ("Acme Corp") with 3 users
and 30 sample feedback entries spread across the last 30 days:

| Email              | Password    | Role    |
|--------------------|-------------|---------|
| admin@demo.com     | password123 | admin   |
| manager@demo.com   | password123 | manager |
| viewer@demo.com    | password123 | viewer  |

## 5. Run the app

```bash
npm run dev
```

This starts the API on `http://localhost:5000` and the React app on
`http://localhost:5173` at the same time. Open the client URL in your browser and
log in with one of the demo accounts above (or register a new workspace).

If you'd rather run them separately:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

## Features in this build

- **Multi-tenant data model** — every user and every feedback record belongs to an
  `Organization`. All API queries are automatically scoped to the logged-in user's
  organization, so two companies using the platform never see each other's data.
- **Role-based access control** — `admin`, `manager`, `viewer` roles. Admins manage
  the team and roles; admins/managers can delete feedback; everyone can view the
  dashboard and submit feedback.
- **Sentiment classification** — every piece of feedback is scored positive / neutral
  / negative automatically on submission (offline lexicon-based analysis).
- **Theme detection** — feedback text is matched against keyword groups (Pricing,
  Support, Shipping, UX, Performance, Features, Onboarding, Quality) so you can see
  what customers talk about most.
- **Emerging trend detection** — compares theme frequency in the last 7 days vs. the
  previous 7 days to flag topics that are suddenly spiking.
- **Analytics dashboard** — sentiment trend line chart, top-themes bar chart,
  channel breakdown pie chart, and live stat cards.
- **AI Q&A ("Ask AI")** — ask a plain-English question; the API retrieves the most
  relevant feedback and answers using it (OpenAI if configured, otherwise a
  rule-based summary built from real numbers).
- **Automated VoC reports** — generates a stats-backed executive summary for any
  time window (7/30/90 days).
- **Multi-channel feedback intake** — email, chat, survey, social, review, support
  ticket — modeled as a `channel` field on every feedback record, with a simple
  "Add feedback" form simulating intake from any of them.

## Notes for going to production

This scaffold is intentionally simple so it's easy to read, extend, and deploy. If
you take it further, consider:

- Adding refresh tokens / shorter-lived access tokens
- Adding pagination controls in the Feedback UI (the API already supports `page`/`limit`)
- Replacing the keyword-based theme detector with embeddings + clustering for
  more nuanced topic discovery
- Adding real email invites for the Team page (currently uses a shareable invite code)
- Adding automated tests (Jest/Supertest for the API, React Testing Library for the UI)
- Containerizing with Docker Compose (Mongo + server + client)
