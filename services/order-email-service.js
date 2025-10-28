/**
 * WAVELENGTH Order Confirmation Email System
 * =========================================
 * 
 * Handles sending order confirmation emails to customers
 * with professional HTML email templates.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class OrderEmailService {
  constructor(config = {}) {
    this.config = {
      smtpHost: process.env.SMTP_HOST || config.smtpHost || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || config.smtpPort || 587,
      smtpUser: process.env.SMTP_USER || config.smtpUser,
      smtpPass: process.env.SMTP_PASS || config.smtpPass,
      fromEmail: process.env.FROM_EMAIL || config.fromEmail || 'noreply@wavelengthlore.com',
      fromName: process.env.FROM_NAME || config.fromName || 'Wavelength Lore'
    };

    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass
        }
      });

      // Verify connection
      if (this.config.smtpUser && this.config.smtpPass) {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      } else {
        console.log('⚠️  Email service not configured (SMTP credentials missing)');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  async sendOrderConfirmation(orderData) {
    if (!this.transporter) {
      console.log('⚠️  Email service not available, skipping confirmation email');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const htmlContent = this.generateOrderConfirmationHTML(orderData);
      const textContent = this.generateOrderConfirmationText(orderData);

      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: orderData.customerData.email,
        subject: `Order Confirmation - ${orderData.orderId}`,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Order confirmation email sent:', result.messageId);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  generateOrderConfirmationHTML(orderData) {
    const { orderId, customerData, items, subtotal, tax = 0, total } = orderData;
    
    const itemsHTML = items.map(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const variantInfo = this.getVariantDescription(item);
      
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 15px 0; vertical-align: top;">
            <img src="${item.image || 'https://wavelengthlore.com/images/previews/generic-product-preview.svg'}" 
                 alt="${item.title}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
          </td>
          <td style="padding: 15px 0; vertical-align: top;">
            <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${item.title}</div>
            <div style="color: #666; font-size: 14px; margin-bottom: 3px;">${variantInfo}</div>
            <div style="color: #666; font-size: 14px;">Qty: ${item.quantity}</div>
          </td>
          <td style="padding: 15px 0; text-align: right; vertical-align: top; font-weight: 600; color: #4CAF50;">
            $${itemTotal.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 18px; color: #333; margin-bottom: 10px;">
                    Order #<strong>${orderId}</strong>
                </div>
                <div style="color: #666;">
                    ${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                </div>
            </div>

            <!-- Customer Info -->
            <div style="margin-bottom: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Shipping Information</h3>
                <div style="color: #666; line-height: 1.6;">
                    <div>${customerData.firstName} ${customerData.lastName}</div>
                    <div>${customerData.email}</div>
                    <div>${customerData.address}</div>
                    <div>${customerData.city}, ${customerData.state} ${customerData.zip}</div>
                    <div>${customerData.country || 'US'}</div>
                </div>
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #333;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${itemsHTML}
                </table>
            </div>

            <!-- Order Summary -->
            <div style="border-top: 2px solid #eee; padding-top: 20px;">
                <table style="width: 100%; font-size: 16px;">
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Subtotal:</td>
                        <td style="text-align: right; padding: 5px 0;">$${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Shipping:</td>
                        <td style="text-align: right; padding: 5px 0; color: #4CAF50;">FREE</td>
                    </tr>
                    ${tax > 0 ? `
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Tax:</td>
                        <td style="text-align: right; padding: 5px 0;">$${tax.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr style="border-top: 1px solid #ddd; font-weight: 600; font-size: 18px;">
                        <td style="padding: 15px 0 5px 0; color: #333;">Total:</td>
                        <td style="text-align: right; padding: 15px 0 5px 0; color: #4CAF50;">$${total.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <!-- Tracking Info -->
            <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e8; border-radius: 8px; border-left: 4px solid #4CAF50;">
                <h4 style="margin: 0 0 10px 0; color: #4CAF50;">What's Next?</h4>
                <p style="margin: 0; color: #666; line-height: 1.6;">
                    Your order is being processed and will ship within 1-2 business days. 
                    You'll receive tracking information via email once your items are on their way.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px 0; color: #666;">
                Questions about your order? Contact us at 
                <a href="mailto:support@wavelengthlore.com" style="color: #667eea;">support@wavelengthlore.com</a>
            </p>
            <p style="margin: 0; color: #999; font-size: 14px;">
                © ${new Date().getFullYear()} Wavelength Lore. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }

  generateOrderConfirmationText(orderData) {
    const { orderId, customerData, items, subtotal, tax = 0, total } = orderData;
    
    const itemsList = items.map(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const variantInfo = this.getVariantDescription(item);
      return `- ${item.title} (${variantInfo}) - Qty: ${item.quantity} - $${itemTotal.toFixed(2)}`;
    }).join('\n');

    return `
ORDER CONFIRMATION
==================

Thank you for your purchase!

Order #: ${orderId}
Date: ${new Date().toLocaleDateString()}

SHIPPING INFORMATION:
${customerData.firstName} ${customerData.lastName}
${customerData.email}
${customerData.address}
${customerData.city}, ${customerData.state} ${customerData.zip}
${customerData.country || 'US'}

ORDER ITEMS:
${itemsList}

ORDER SUMMARY:
Subtotal: $${subtotal.toFixed(2)}
Shipping: FREE
${tax > 0 ? `Tax: $${tax.toFixed(2)}\n` : ''}Total: $${total.toFixed(2)}

WHAT'S NEXT?
Your order is being processed and will ship within 1-2 business days.
You'll receive tracking information via email once your items are on their way.

Questions? Contact us at support@wavelengthlore.com

© ${new Date().getFullYear()} Wavelength Lore. All rights reserved.
    `.trim();
  }

  getVariantDescription(item) {
    const parts = [];
    if (item.selectedSize) parts.push(`Size: ${item.selectedSize}`);
    if (item.selectedColor) parts.push(`Color: ${item.selectedColor}`);
    return parts.length > 0 ? parts.join(', ') : 'Standard';
  }
}

module.exports = OrderEmailService;