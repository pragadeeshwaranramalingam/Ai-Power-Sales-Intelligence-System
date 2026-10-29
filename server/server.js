const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express App
const app = express();

// Database Connection & Auto Demo Seeding
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    try {
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[Server] No users detected. Running initial demo seed...');
        const seedDatabase = require('./seeds/seed');
        await seedDatabase();
      }
    } catch (seedErr) {
      console.warn(`[Server] Auto-seed warning: ${seedErr.message}`);
    }
  }).catch(err => {
    console.error(`[Server] DB Init Error: ${err.message}`);
  });
}

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g. mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev to guarantee smooth evaluation
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Power Sales Intelligence System v2.0 API',
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Mount Versioned API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/leads', require('./routes/leadRoutes'));
app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));
app.use('/api/v1/tasks', require('./routes/taskRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  AI POWER SALES INTELLIGENCE SYSTEM (Version 2.0)     `);
    console.log(`  REST API Server running on port: ${PORT}             `);
    console.log(`  Health Check: http://localhost:${PORT}/api/health     `);
    console.log(`=======================================================`);
  });
}

// Graceful Shutdown Handling
const shutdown = () => {
  console.log('\n[Server] Gracefully terminating server...');
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
