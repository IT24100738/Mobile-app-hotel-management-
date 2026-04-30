const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

// Route files
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Load env vars
dotenv.config();

// Connect to database
if (process.env.SMOKE_TEST === '1') {
  console.log('SMOKE_TEST=1 detected: skipping MongoDB connection');
} else {
  connectDB(); // Ensure you have MONGO_URI in your .env before calling this!
}

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients and same-origin requests.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin not allowed'));
  },
};

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 500),
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // For Multer uploaded files
app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/reviews', reviewRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('Hotel Management API is running...');
});

app.use(notFound);

// Global Error Handling Middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  const hint = process.env.PUBLIC_API_URL || `http://localhost:${PORT}`;
  console.log(`API listening on http://0.0.0.0:${PORT} (reachable on LAN)`);
  console.log(`Set EXPO_PUBLIC_API_BASE_URL on the app to your PC LAN IP, e.g. ${hint}`);
});
