const nodemailer = require('nodemailer');
const ErrorResponse = require('./errorResponse');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message (HTML)
 */
const sendEmail = async (options) => {
  try {
    // Validate required fields
    if (!options.email || !options.subject || !options.message) {
      throw new ErrorResponse('Email, subject, and message are required', 400);
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      secure: process.env.SMTP_SECURE === 'true',
      debug: process.env.NODE_ENV === 'development'
    });

    // Verify connection configuration
    await transporter.verify();

    // Define email options
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.message
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent: %s', info.messageId);
      if (process.env.SMTP_HOST === 'smtp.mailtrap.io') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    }

    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw new ErrorResponse(
      'Email could not be sent. Please try again later.',
      500
    );
  }
};

module.exports = sendEmail; 