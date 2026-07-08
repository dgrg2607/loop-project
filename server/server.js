require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const mongoose = require('mongoose');

// ──────────────────────────────────────────────────────────────
// 1. DATABASE CONNECTION
// ──────────────────────────────────────────────────────────────
// Connect to MongoDB and exit if fails
connectDB();

// ──────────────────────────────────────────────────────────────
// 2. CORS CONFIGURATION
// ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL,
  /\.netlify\.app$/,
  /\.onrender\.com$/
];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return origin === pattern;
      }
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// ──────────────────────────────────────────────────────────────
// 3. SECURITY & PERFORMANCE MIDDLEWARE
// ──────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression - gzip responses
app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Body parsing with size limits
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// NoSQL injection protection
app.use(mongoSanitize({
  replaceWith: '_',
}));

// ──────────────────────────────────────────────────────────────
// 4. LOGGING
// ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  // Custom morgan format for better logs
  morgan.token('body', (req) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      return JSON.stringify(req.body);
    }
    return '-';
  });
  
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));
}

// ──────────────────────────────────────────────────────────────
// 5. RATE LIMITING
// ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 600, // Max 600 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health', // Skip health checks
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60), // Minutes
    });
  },
});
app.use('/api', limiter);

// ──────────────────────────────────────────────────────────────
// 6. HEALTH CHECK
// ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    service: 'Project LOOP API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      state: dbState[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'not connected',
      database: mongoose.connection.db?.databaseName || 'not connected',
    }
  });
});

// ──────────────────────────────────────────────────────────────
// 7. API ROUTES
// ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// ──────────────────────────────────────────────────────────────
// 8. 404 HANDLER
// ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ──────────────────────────────────────────────────────────────
// 9. GLOBAL ERROR HANDLER
// ──────────────────────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────
// 10. START SERVER
// ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('══════════════════════════════════════════════════════');
  console.log('🚀 Project LOOP API Server');
  console.log(`📡 Listening on: http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  console.log('══════════════════════════════════════════════════════');
});

// ──────────────────────────────────────────────────────────────
// 11. GRACEFUL SHUTDOWN
// ──────────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async (err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }
    
    try {
      // Close database connection
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed');
      console.log('✅ Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// ──────────────────────────────────────────────────────────────
// 12. EXPORT APP (For Testing)
// ──────────────────────────────────────────────────────────────
module.exports = app;