const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createS3Client } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

let s3Client = null;

/**
 * Get or create the S3 client singleton.
 */
const getS3Client = () => {
    if (!s3Client) {
        s3Client = createS3Client();
    }
    return s3Client;
};

const BUCKET = () => process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload a file buffer to S3.
 *
 * @param {Buffer} fileBuffer - File content
 * @param {string} originalName - Original file name
 * @param {string} mimeType - MIME type
 * @param {string} folder - S3 folder prefix (e.g. 'visits/123')
 * @returns {Object} { s3Key, s3Url }
 */
const uploadToS3 = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
    const client = getS3Client();
    const ext = path.extname(originalName);
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256', // Encrypt at rest
    });

    await client.send(command);

    return {
        s3Key: key,
        s3Url: `https://${BUCKET()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
};

/**
 * Generate a pre-signed download URL (valid for 15 minutes by default).
 *
 * @param {string} s3Key - The S3 object key
 * @param {number} expiresIn - URL validity in seconds (default 900 = 15 min)
 * @returns {string} Signed URL
 */
const getSignedDownloadUrl = async (s3Key, expiresIn = 900) => {
    const client = getS3Client();

    const command = new GetObjectCommand({
        Bucket: BUCKET(),
        Key: s3Key,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
};

/**
 * Delete a file from S3.
 *
 * @param {string} s3Key - The S3 object key to delete
 */
const deleteFromS3 = async (s3Key) => {
    const client = getS3Client();

    const command = new DeleteObjectCommand({
        Bucket: BUCKET(),
        Key: s3Key,
    });

    await client.send(command);
};

module.exports = {
    uploadToS3,
    getSignedDownloadUrl,
    deleteFromS3,
};
