/**
 * Email Service for Wavelength Lore
 * 
 * Handles order confirmation emails and support notifications
 * Uses a simple console-based email system for development
 * Can be extended with real email providers (SendGrid, AWS SES, etc.)
 */

class EmailService {
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'console';
    this.fromEmail = process.env.FROM_EMAIL || 'orders@wavelengthlore.com';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@wavelengthlore.com';
    
    console.log(`📧 Email Service initialized with provider: ${this.emailProvider}`);
  }

  /**
   * Send order confirmation email to customer
   * @param {Object} orderData - Order details
   * @param {string} customerEmail - Customer email address
   */
  async sendOrderConfirmation(orderData, customerEmail) {
    try {
      const emailContent = this.generateOrderConfirmationEmail(orderData);
      
      const emailData = {
        to: customerEmail,
        from: this.fromEmail,
        subject: `Order Confirmation - ${orderData.orderId}`,
        html: emailContent,
        orderData: orderData
      };

      await this.sendEmail(emailData);
      console.log(`✅ Order confirmation email sent to: ${customerEmail}`);
      
    } catch (error) {
      console.error('❌ Error sending order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send support ticket notification to admin team
   * @param {Object} ticketData - Support ticket details
   */
  async sendSupportNotification(ticketData) {
    try {
      const emailContent = this.generateSupportNotificationEmail(ticketData);
      
      const emailData = {
        to: this.supportEmail,
        from: this.fromEmail,
        subject: `New Support Ticket - ${ticketData.subject}`,
        html: emailContent,
        ticketData: ticketData
      };

      await this.sendEmail(emailData);
      console.log(`✅ Support notification email sent for ticket: ${ticketData.id}`);
      
    } catch (error) {
      console.error('❌ Error sending support notification email:', error);
      throw error;
    }
  }

  /**
   * Send support ticket acknowledgment to customer
   * @param {Object} ticketData - Support ticket details
   */
  async sendSupportAcknowledgment(ticketData) {
    try {
      const emailContent = this.generateSupportAcknowledgmentEmail(ticketData);
      
      const emailData = {
        to: ticketData.email,
        from: this.fromEmail,
        subject: `Support Ticket Received - ${ticketData.subject} (${ticketData.id})`,
        html: emailContent,
        ticketData: ticketData
      };

      await this.sendEmail(emailData);
      console.log(`✅ Support acknowledgment email sent to customer: ${ticketData.email}`);
      
    } catch (error) {
      console.error('❌ Error sending support acknowledgment email:', error);
      throw error;
    }
  }

  /**
   * Generate order confirmation email HTML
   * @param {Object} orderData - Order details
   * @returns {string} HTML email content
   */
  generateOrderConfirmationEmail(orderData) {
    const orderDate = new Date(orderData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const itemsHTML = (orderData.items || []).map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <img src="${item.image || ''}" alt="${item.title}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px; vertical-align: top;">
          <div style="display: inline-block; vertical-align: top;">
            <strong>${item.title}</strong><br>
            <span style="color: #666;">Quantity: ${item.quantity}</span><br>
            <span style="color: #059669; font-weight: bold;">$${item.price}</span>
          </div>
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${orderData.orderId}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 2rem;">🎉 Order Confirmed!</h1>
        <p style="margin: 0; font-size: 1.1rem; opacity: 0.9;">Thank you for your Wavelength Lore order</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">📦 Order Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Order ID:</td>
                <td style="padding: 8px 0;">${orderData.orderId}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Order Date:</td>
                <td style="padding: 8px 0;">${orderDate}</td>
            </tr>
            ${orderData.subtotal ? `
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Subtotal:</td>
                <td style="padding: 8px 0;">$${orderData.subtotal.toFixed(2)}</td>
            </tr>` : ''}
            ${orderData.tax ? `
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Tax:</td>
                <td style="padding: 8px 0;">$${orderData.tax.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">$${(orderData.total || orderData.amount || 0).toFixed(2)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Payment ID:</td>
                <td style="padding: 8px 0;">${orderData.paymentId}</td>
            </tr>
        </table>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">📍 Shipping Address</h2>
        <div style="line-height: 1.8;">
            ${orderData.shippingAddress?.firstName} ${orderData.shippingAddress?.lastName}<br>
            ${orderData.customerData?.email || orderData.shippingAddress?.email}<br>
            ${orderData.shippingAddress?.address1}<br>
            ${orderData.shippingAddress?.address2 ? orderData.shippingAddress.address2 + '<br>' : ''}
            ${orderData.shippingAddress?.city}, ${orderData.shippingAddress?.state} ${orderData.shippingAddress?.zip}<br>
            ${orderData.shippingAddress?.country}
        </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">🛍️ Order Items</h2>
        <table style="width: 100%; border-collapse: collapse;">
            ${itemsHTML}
        </table>
    </div>

    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937;">🚚 What's Next?</h2>
        <p style="margin: 0 0 15px 0; color: #4b5563;">
            Your order is being processed! You'll receive another email with tracking information once your items ship.
            Typical processing time is 3-5 business days.
        </p>
        <a href="https://wavelengthlore.com/my-orders" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
            Track Your Order
        </a>
    </div>

    <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; color: #991b1b;">📞 Need Help?</h3>
        <p style="margin: 0; color: #7f1d1d;">
            Questions about your order? Our support team is here to help!<br>
            <strong>Email:</strong> support@wavelengthlore.com<br>
            <strong>Response Time:</strong> Within 24 hours
        </p>
        <a href="https://wavelengthlore.com/support" 
           style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
            Contact Support
        </a>
    </div>

    <div style="text-align: center; color: #6b7280; font-size: 0.9rem; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>Thank you for choosing Wavelength Lore!</p>
        <p style="margin: 5px 0;">
            <a href="https://wavelengthlore.com" style="color: #667eea; text-decoration: none;">wavelengthlore.com</a> | 
            <a href="https://wavelengthlore.com/support" style="color: #667eea; text-decoration: none;">Support</a>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 0.8rem;">
            © ${new Date().getFullYear()} Wavelength Lore. All rights reserved.
        </p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate support ticket notification email HTML
   * @param {Object} ticketData - Support ticket details
   * @returns {string} HTML email content
   */
  generateSupportNotificationEmail(ticketData) {
    const ticketDate = new Date(ticketData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const priorityColor = {
      normal: '#6b7280',
      high: '#f59e0b',
      urgent: '#ef4444'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Support Ticket - ${ticketData.id}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 2rem;">🚨 New Support Ticket</h1>
        <p style="margin: 0; font-size: 1.1rem; opacity: 0.9;">Customer support request received</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">📋 Ticket Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Ticket ID:</td>
                <td style="padding: 8px 0;">${ticketData.id}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0;">${ticketData.subject}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
                <td style="padding: 8px 0;">
                    <span style="background: ${priorityColor[ticketData.priority]}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.9rem; text-transform: uppercase;">
                        ${ticketData.priority}
                    </span>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Customer Email:</td>
                <td style="padding: 8px 0;">${ticketData.email}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Order ID:</td>
                <td style="padding: 8px 0;">${ticketData.orderId || 'N/A'}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Created:</td>
                <td style="padding: 8px 0;">${ticketDate}</td>
            </tr>
        </table>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">💬 Customer Message</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            ${ticketData.message.replace(/\n/g, '<br>')}
        </div>
    </div>

    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 12px; padding: 25px; text-align: center;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937;">⚡ Quick Actions</h2>
        <a href="https://wavelengthlore.com/admin/support" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
            View All Tickets
        </a>
        <a href="mailto:${ticketData.email}?subject=Re: ${ticketData.subject} (${ticketData.id})" 
           style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
            Reply to Customer
        </a>
    </div>

    <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Wavelength Lore. All rights reserved.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate support acknowledgment email HTML for customer
   * @param {Object} ticketData - Support ticket details
   * @returns {string} HTML email content
   */
  generateSupportAcknowledgmentEmail(ticketData) {
    const ticketDate = new Date(ticketData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const priorityEmoji = {
      normal: '📋',
      high: '⚡',
      urgent: '🚨'
    };

    const priorityText = {
      normal: 'Normal Priority',
      high: 'High Priority',
      urgent: 'Urgent Priority'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket Received - ${ticketData.id}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 2rem;">✅ Support Ticket Received!</h1>
        <p style="margin: 0; font-size: 1.1rem; opacity: 0.9;">We've received your support request and will respond soon</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">📋 Your Ticket Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Ticket ID:</td>
                <td style="padding: 8px 0; font-family: monospace; background: #e5e7eb; padding: 6px 12px; border-radius: 6px;">${ticketData.id}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0;">${ticketData.subject}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
                <td style="padding: 8px 0;">${priorityEmoji[ticketData.priority]} ${priorityText[ticketData.priority]}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
                <td style="padding: 8px 0;">${ticketDate}</td>
            </tr>
            ${ticketData.orderId ? `
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Related Order:</td>
                <td style="padding: 8px 0;">${ticketData.orderId}</td>
            </tr>` : ''}
        </table>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem;">💬 Your Message</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            ${ticketData.message.replace(/\n/g, '<br>')}
        </div>
    </div>

    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; color: #065f46;">⏰ What Happens Next?</h2>
        <div style="text-align: left; color: #064e3b;">
            <p style="margin: 0 0 10px 0;">📧 <strong>Email Confirmation:</strong> This email confirms we received your request</p>
            <p style="margin: 0 0 10px 0;">👀 <strong>Review:</strong> Our support team will review your ticket</p>
            <p style="margin: 0 0 10px 0;">📞 <strong>Response:</strong> We'll respond within 24-48 hours (or sooner for urgent issues)</p>
            <p style="margin: 0;">💌 <strong>Updates:</strong> We'll email you when there are updates to your ticket</p>
        </div>
    </div>

    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 12px; padding: 25px; text-align: center;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937;">Need Additional Help?</h2>
        <p style="margin: 0 0 20px 0; color: #4b5563;">Keep your ticket ID handy for reference: <strong>${ticketData.id}</strong></p>
        <a href="https://wavelengthlore.com/support" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
            Visit Support Center
        </a>
        <a href="https://wavelengthlore.com/my-orders" 
           style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
            View My Orders
        </a>
    </div>

    <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem;">
        <p style="margin: 0;">Thank you for choosing Wavelength Lore!</p>
        <p style="margin: 5px 0 0 0;">🌊 Where music is magic and your support matters ✨</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Send email using configured provider
   * @param {Object} emailData - Email details
   */
  async sendEmail(emailData) {
    switch (this.emailProvider) {
      case 'console':
        return this.sendConsoleEmail(emailData);
      case 'sendgrid':
        return this.sendSendGridEmail(emailData);
      case 'ses':
        return this.sendSESEmail(emailData);
      default:
        return this.sendConsoleEmail(emailData);
    }
  }

  /**
   * Console-based email for development
   * @param {Object} emailData - Email details
   */
  async sendConsoleEmail(emailData) {
    console.log('\n📧 ====== EMAIL SENT ======');
    console.log(`To: ${emailData.to}`);
    console.log(`From: ${emailData.from}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log('Content: [HTML Email Content - see email service for full content]');
    console.log('=========================\n');
    
    return { success: true, provider: 'console' };
  }

  /**
   * SendGrid email provider
   * @param {Object} emailData - Email details
   */
  async sendSendGridEmail(emailData) {
    const sgMail = require('@sendgrid/mail');
    
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required for SendGrid email service');
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: emailData.to,
      from: {
        email: emailData.from,
        name: 'Wavelength Lore'
      },
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || this.stripHtml(emailData.html)
    };
    
    try {
      const result = await sgMail.send(msg);
      console.log(`✅ SendGrid email sent successfully to ${emailData.to}`);
      return { 
        success: true, 
        provider: 'sendgrid',
        messageId: result[0].headers['x-message-id']
      };
    } catch (error) {
      console.error('❌ SendGrid email failed:', error);
      throw new Error(`SendGrid email failed: ${error.message}`);
    }
  }

  /**
   * AWS SES email provider
   * @param {Object} emailData - Email details
   */
  async sendSESEmail(emailData) {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are required for SES email service');
    }
    
    const sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const params = {
      Source: emailData.from,
      Destination: {
        ToAddresses: [emailData.to]
      },
      Message: {
        Subject: {
          Data: emailData.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: emailData.html,
            Charset: 'UTF-8'
          },
          Text: {
            Data: emailData.text || this.stripHtml(emailData.html),
            Charset: 'UTF-8'
          }
        }
      }
    };
    
    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      console.log(`✅ AWS SES email sent successfully to ${emailData.to}`);
      return { 
        success: true, 
        provider: 'ses',
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ AWS SES email failed:', error);
      throw new Error(`AWS SES email failed: ${error.message}`);
    }
  }

  /**
   * Strip HTML tags for plain text version
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailService();