const nodemailer = require('nodemailer');

/**
 * Custom Email Service using SMTP
 * Sends welcome emails using your own SMTP server
 */
class EmailService {
  constructor() {
    // Initialize transporter from environment variables
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Get email configuration from environment variables
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Additional SMTP options for better control
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
      },
      // Connection pool options
      pool: process.env.SMTP_POOL === 'true',
      maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS) || 5,
      maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES) || 100,
      // Rate limiting
      rateDelta: parseInt(process.env.SMTP_RATE_DELTA) || 1000,
      rateLimit: parseInt(process.env.SMTP_RATE_LIMIT) || 5
    };

    // Only create transporter if email is configured
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      try {
        this.transporter = nodemailer.createTransport(emailConfig);
        
        // Verify connection configuration
        this.transporter.verify((error, success) => {
          if (error) {
            console.error('❌ SMTP connection verification failed:', error.message);
            console.error('   Please check your SMTP configuration in .env file');
          } else {
            console.log('✅ SMTP email service initialized and verified');
            console.log(`   Host: ${emailConfig.host}:${emailConfig.port}`);
            console.log(`   Secure: ${emailConfig.secure ? 'Yes (SSL/TLS)' : 'No (STARTTLS)'}`);
          }
        });
      } catch (error) {
        console.error('❌ Failed to initialize SMTP transporter:', error.message);
        this.transporter = null;
      }
    } else {
      console.log('⚠️  SMTP email service not configured.');
      console.log('   Add SMTP_HOST, SMTP_USER, and SMTP_PASS to your .env file');
    }
  }

  /**
   * Send welcome email to new user
   * @param {Object} userData - User information
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email address
   */
  async sendWelcomeEmail(userData) {
    if (!this.transporter) {
      console.log('⚠️  Email service not configured. Skipping welcome email.');
      return { success: false, message: 'Email service not configured' };
    }

    const { name, email } = userData;

    // Email content with SMTP-specific options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'AuthFlow'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to: email,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.SMTP_USER,
      subject: `Welcome to AuthFlow, ${name}!`,
      // SMTP-specific headers
      headers: {
        'X-Mailer': 'AuthFlow Email Service',
        'X-Priority': '3',
        'Importance': 'normal'
      },
      // Message ID for tracking
      messageId: `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${process.env.SMTP_HOST || 'authflow'}>`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to AuthFlow!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We're excited to have you on board! Your account has been successfully created.</p>
            <p>You can now log in and start using AuthFlow to manage your authentication needs.</p>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Log In Now</a>
            </p>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Best regards,<br><strong>The AuthFlow Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} AuthFlow. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to AuthFlow, ${name}!
        
        We're excited to have you on board! Your account has been successfully created.
        
        You can now log in and start using AuthFlow.
        
        Log in here: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login
        
        If you have any questions, feel free to reach out to our support team.
        
        Best regards,
        The AuthFlow Team
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent successfully to: ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;

