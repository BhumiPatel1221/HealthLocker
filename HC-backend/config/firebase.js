const admin = require('firebase-admin');
const path = require('path');

/**
 * Initialize Firebase Admin SDK using the service account JSON file.
 * If FIREBASE_SERVICE_ACCOUNT_PATH is set, use it; otherwise, use
 * Application Default Credentials (for cloud deployments).
 */
const initializeFirebase = () => {
    try {
        if (admin.apps.length > 0) {
            return admin; // Already initialized
        }

        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath) {
            const serviceAccount = require(path.resolve(serviceAccountPath));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin SDK initialized with service account.');
        } else {
            // Use Application Default Credentials (GCP environments)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            console.log(' Firebase Admin SDK initialized with default credentials.');
        }

        return admin;
    } catch (error) {
        console.error(`Firebase Admin SDK initialization failed: ${error.message}`);
        throw error;
    }
};

module.exports = { initializeFirebase, admin };
