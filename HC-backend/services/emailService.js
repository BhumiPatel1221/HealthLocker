const nodemailer = require('nodemailer');

/**
 * Creates a reusable Nodemailer transporter from environment variables.
 * Supports any SMTP provider (Gmail, SendGrid, Mailgun, etc.)
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Sends an email verification link to a newly registered user.
 *
 * @param {string} toEmail    - Recipient email address
 * @param {string} name       - Recipient's display name
 * @param {string} token      - Secure random verification token
 * @param {number} expiryHours - Token validity in hours (default 24)
 */
const sendVerificationEmail = async (toEmail, name, token, expiryHours = 24) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const transporter = createTransporter();

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'HealthLocker'}" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Verify your HealthLocker email address',
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:#1b6f63;padding:36px 48px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                HealthLocker
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Medical Vault
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <h2 style="margin:0 0 16px;color:#1a2e2b;font-size:24px;font-weight:700;">
                Verify your email address
              </h2>
              <p style="margin:0 0 12px;color:#4a5e5b;font-size:15px;line-height:1.6;">
                Hi ${name},
              </p>
              <p style="margin:0 0 32px;color:#4a5e5b;font-size:15px;line-height:1.6;">
                Thanks for registering with HealthLocker. Click the button below to verify your email address and activate your account. This link expires in <strong>${expiryHours} hour${expiryHours === 1 ? '' : 's'}</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:10px;background:#1b6f63;">
                    <a href="${verifyUrl}"
                       target="_blank"
                       style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Fallback URL -->
              <p style="margin:32px 0 0;color:#7a9e9b;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this URL into your browser:
              </p>
              <p style="margin:6px 0 0;word-break:break-all;">
                <a href="${verifyUrl}" style="color:#1b6f63;font-size:13px;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #e8f0ee;">
              <p style="margin:0;color:#a0b5b2;font-size:12px;line-height:1.6;">
                If you did not create a HealthLocker account, you can safely ignore this email.<br/>
                This link will expire in ${expiryHours} hour${expiryHours === 1 ? '' : 's'} for your security.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        text: `Hi ${name},\n\nPlease verify your HealthLocker email address by visiting the link below:\n\n${verifyUrl}\n\nThis link expires in ${expiryHours} hour${expiryHours === 1 ? '' : 's'}.\n\nIf you did not create an account, ignore this email.`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Verification email sent to ${toEmail} — MessageId: ${info.messageId}`);
    } catch (err) {
        console.error(`[Email] Failed to send verification email to ${toEmail}:`, err.message);
        throw err;
    }
};

module.exports = { sendVerificationEmail };
