const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Generate email verification token
 * @returns {string} Verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send verification email
 * @param {string} email - User email address
 * @param {string} token - Verification token
 * @param {string} username - User's username
 */
async function sendVerificationEmail(email, token, username) {
  const verificationUrl = `${
    process.env.BACKEND_URL || "http://localhost:4000"
  }/api/users/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Wardrop" <noreply@wardrop.com>',
    to: email,
    subject: "Verify Your Email - Wardrop",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #1B1229;
            color: #FFFFFF;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1B1229 0%, #2D1B4E 100%);
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          }
          .logo {
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            color: #B13BFF;
            margin-bottom: 30px;
          }
          .content {
            text-align: center;
          }
          h1 {
            color: #B13BFF;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            color: #E0E0E0;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #B13BFF;
            color: #000000;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 14px;
            color: #999;
          }
          .link {
            color: #B13BFF;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">✨ Wardrop</div>
          <div class="content">
            <h1>Welcome, ${username}!</h1>
            <p>Thank you for signing up for Wardrop. We're excited to have you on board!</p>
            <p>To complete your registration and start creating amazing outfits, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p style="font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p class="link" style="font-size: 12px;">
              ${verificationUrl}
            </p>
          </div>
          <div class="footer">
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with Wardrop, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Wardrop, ${username}!
      
      Thank you for signing up. To complete your registration, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with Wardrop, you can safely ignore this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

/**
 * Send password reset email (for future use)
 * @param {string} email - User email address
 * @param {string} token - Reset token
 */
async function sendPasswordResetEmail(email, token) {
  // Placeholder for future password reset functionality
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Wardrop" <noreply@wardrop.com>',
    to: email,
    subject: "Reset Your Password - Wardrop",
    html: `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
    text: `You requested a password reset. Visit this link: ${resetUrl}\n\nThis link will expire in 1 hour.`,
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send password reset code
 * @param {string} email - User email address
 * @param {string} code - 6-digit reset code
 */
async function sendPasswordResetCode(email, code) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Wardrop" <noreply@wardrop.com>',
    to: email,
    subject: "Password Reset Code - Wardrop",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Use the following code to reset your password:</p>
        <h1 style="color: #B13BFF; letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `Your password reset code is: ${code}. It expires in 15 minutes.`,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetCode,
};
