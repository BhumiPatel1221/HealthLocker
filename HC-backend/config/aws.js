const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Create and configure the AWS S3 Client.
 */
const createS3Client = () => {
    const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    console.log('✅ AWS S3 Client configured.');
    return s3Client;
};

module.exports = { createS3Client };
