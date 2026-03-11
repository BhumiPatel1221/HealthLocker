#!/usr/bin/env node
/**
 * One-time script to configure CORS on the S3 bucket.
 * Run locally:  node scripts/setup-s3-cors.js
 *
 * Requires AWS credentials in .env (loaded via dotenv).
 */

require('dotenv').config();
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'ap-south-1';

if (!BUCKET) {
    console.error('❌ AWS_S3_BUCKET_NAME not set in .env');
    process.exit(1);
}

const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const corsConfig = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: [
                'https://health-locker.vercel.app',
                'http://localhost:5173',
                'http://localhost:5174',
            ],
            ExposeHeaders: ['Content-Length', 'Content-Type'],
            MaxAgeSeconds: 3600,
        },
    ],
};

(async () => {
    try {
        await s3.send(
            new PutBucketCorsCommand({
                Bucket: BUCKET,
                CORSConfiguration: corsConfig,
            })
        );
        console.log(`✅ CORS configured on bucket "${BUCKET}"`);
        console.log('   Allowed origins:', corsConfig.CORSRules[0].AllowedOrigins.join(', '));
    } catch (err) {
        console.error('❌ Failed to set CORS:', err.message);
        process.exit(1);
    }
})();
