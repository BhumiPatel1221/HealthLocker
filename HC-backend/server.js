require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { initializeFirebase } = require('./config/firebase');

const PORT = process.env.PORT || 5000;

/**
 * Bootstrap the server:
 * 1. Connect to MongoDB
 * 2. Initialize Firebase Admin SDK
 * 3. Start listening
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('   HealthLocker API Server');
            console.log('  Secure Digital Health Record System');
            console.log('═══════════════════════════════════════════');
            console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Port        : ${PORT}`);
            console.log(`   API Base    : http://localhost:${PORT}/api`);
            console.log(`    Health      : http://localhost:${PORT}/api/health`);
            console.log('═══════════════════════════════════════════');
            console.log('');
        });

        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n  ${signal} received. Shutting down gracefully...`);
            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error(' Forced shutdown after timeout.');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

        // nodemon restart signal — close server so port is freed before reload
        process.once('SIGUSR2', () => {
            server.close(() => {
                process.kill(process.pid, 'SIGUSR2');
            });
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error(' UNHANDLED REJECTION:', err.message);
            console.error(err.stack);
            server.close(() => process.exit(1));
        });

        // Handle uncaught exceptions — close server first so port is released
        process.on('uncaughtException', (err) => {
            console.error(' UNCAUGHT EXCEPTION:', err.message);
            console.error(err.stack);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        console.error(' Server startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
