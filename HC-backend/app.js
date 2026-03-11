const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/AppError');

// Route imports
const authRoutes = require('./routes/authRoutes');
const recordRoutes = require('./routes/recordRoutes');
const accessRoutes = require('./routes/accessRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const visitRoutes = require('./routes/visitRoutes');
const logRoutes = require('./routes/logRoutes');
const shareLinkRoutes = require('./routes/shareLinkRoutes');

const app = express();

/**
 * GLOBAL MIDDLEWARE
 */

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const devOriginAllowlist = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
]);

const corsOrigin = (origin, callback) => {
    // Allow non-browser clients (curl/postman) or same-origin
    if (!origin) return callback(null, true);

    // Support comma-separated origins; trim whitespace and trailing slashes
    const configuredOrigin = process.env.CORS_ORIGIN;
    if (configuredOrigin) {
        const allowedOrigins = configuredOrigin
            .split(',')
            .map(o => o.trim().replace(/\/+$/, ''));
        const normalizedOrigin = origin.replace(/\/+$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }
    }

    // Dev convenience: Vite may auto-pick another port if 5173 is taken
    if ((process.env.NODE_ENV || 'development') === 'development') {
        if (devOriginAllowlist.has(origin)) return callback(null, true);
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    }

    return callback(null, false);
};

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/**
 * ROUTES
 */

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/share', shareLinkRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'HealthLocker API is running' });
});

// 404
app.all('*', (req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Error handling
app.use(errorHandler);

module.exports = app;
