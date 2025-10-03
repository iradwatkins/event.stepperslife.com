import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface TicketPurchaseEmailData {
  buyerName: string;
  buyerEmail: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  orderNumber: string;
  ticketCount: number;
  totalAmount: number;
  tickets: Array<{
    ticketNumber: string;
    type: string;
    price: number;
  }>;
  qrCodeUrl?: string;
}

export interface EventCreatedEmailData {
  organizerName: string;
  organizerEmail: string;
  eventName: string;
  eventDate: string;
  eventUrl: string;
  managementUrl: string;
}

class EmailService {
  private fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@events.stepperslife.com';
  private fromName = 'SteppersLife Events';

  async sendEmail(template: EmailTemplate): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured. Email not sent.');
      return false;
    }

    try {
      const emailPayload: any = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [template.to],
        subject: template.subject,
        html: template.html,
        text: template.text || this.stripHtml(template.html)
      };

      // Add attachments if provided
      if (template.attachments && template.attachments.length > 0) {
        emailPayload.attachments = template.attachments.map(att => ({
          filename: att.filename,
          content: att.content instanceof Buffer ? att.content.toString('base64') : att.content
        }));
      }

      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        console.error('Resend error:', error);
        return false;
      }

      console.log(`Email sent successfully to ${template.to}`, data);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTicketPurchaseConfirmation(data: TicketPurchaseEmailData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.buyerEmail,
      subject: `Your tickets for ${data.eventName} - Order ${data.orderNumber}`,
      html: this.generateTicketConfirmationHTML(data)
    };

    return this.sendEmail(template);
  }

  async sendEventCreatedConfirmation(data: EventCreatedEmailData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.organizerEmail,
      subject: `Event Created: ${data.eventName}`,
      html: this.generateEventCreatedHTML(data)
    };

    return this.sendEmail(template);
  }

  async sendEventReminderToAttendees(
    eventName: string,
    eventDate: string,
    eventVenue: string,
    attendees: Array<{ email: string; name: string }>
  ): Promise<boolean[]> {
    const promises = attendees.map(attendee => {
      const template: EmailTemplate = {
        to: attendee.email,
        subject: `Reminder: ${eventName} is tomorrow!`,
        html: this.generateEventReminderHTML(attendee.name, eventName, eventDate, eventVenue)
      };
      return this.sendEmail(template);
    });

    return Promise.all(promises);
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationUrl: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Verify your SteppersLife Events account',
      html: this.generateVerificationHTML(firstName, verificationUrl)
    };

    return this.sendEmail(template);
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetUrl: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Reset your SteppersLife Events password',
      html: this.generatePasswordResetHTML(firstName, resetUrl)
    };

    return this.sendEmail(template);
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Welcome to SteppersLife Events!',
      html: this.generateWelcomeHTML(firstName)
    };

    return this.sendEmail(template);
  }

  async sendAffiliateWelcomeEmail(data: {
    to: string;
    firstName: string;
    affiliateId: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.to,
      subject: 'Welcome to the SteppersLife Events Affiliate Program!',
      html: this.generateAffiliateWelcomeHTML(data.firstName, data.affiliateId)
    };

    return this.sendEmail(template);
  }

  async sendAffiliateApprovalEmail(data: {
    to: string;
    firstName: string;
    affiliateId: string;
    dashboardUrl: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.to,
      subject: 'Your Affiliate Application Has Been Approved!',
      html: this.generateAffiliateApprovalHTML(data.firstName, data.dashboardUrl)
    };

    return this.sendEmail(template);
  }

  async sendAffiliateRejectionEmail(data: {
    to: string;
    firstName: string;
    reason: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.to,
      subject: 'Affiliate Application Status Update',
      html: this.generateAffiliateRejectionHTML(data.firstName, data.reason)
    };

    return this.sendEmail(template);
  }

  private generateTicketConfirmationHTML(data: TicketPurchaseEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Confirmation - ${data.eventName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .ticket { background: white; border: 2px dashed #e5e7eb; padding: 20px; margin: 15px 0; border-radius: 8px; }
    .total { background: #1f2937; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
    .qr-code { text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎫 Ticket Confirmation</h1>
    <p>Thank you for your purchase!</p>
  </div>

  <div class="content">
    <h2>Hello ${data.buyerName}!</h2>

    <p>Your tickets for <strong>${data.eventName}</strong> have been confirmed!</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📅 Event Details</h3>
      <p><strong>Event:</strong> ${data.eventName}</p>
      <p><strong>Date:</strong> ${data.eventDate}</p>
      <p><strong>Venue:</strong> ${data.eventVenue}</p>
      <p><strong>Order Number:</strong> ${data.orderNumber}</p>
    </div>

    <h3>🎟️ Your Tickets</h3>
    ${data.tickets.map(ticket => `
      <div class="ticket">
        <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
        <p><strong>Type:</strong> ${ticket.type}</p>
        <p><strong>Price:</strong> $${ticket.price.toFixed(2)}</p>
      </div>
    `).join('')}

    <div class="total">
      Total: $${data.totalAmount.toFixed(2)} (${data.ticketCount} ticket${data.ticketCount > 1 ? 's' : ''})
    </div>

    ${data.qrCodeUrl ? `
      <div class="qr-code">
        <h3>📱 Mobile Tickets</h3>
        <p>Show this QR code at the event entrance:</p>
        <img src="${data.qrCodeUrl}" alt="QR Code" style="max-width: 200px;">
      </div>
    ` : ''}

    <div style="margin-top: 30px; text-align: center;">
      <p>Need to make changes to your order?</p>
      <a href="#" class="button">View My Tickets</a>
    </div>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;
  }

  private generateEventCreatedHTML(data: EventCreatedEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Created - ${data.eventName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
    .action-button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Event Created Successfully!</h1>
  </div>

  <div class="content">
    <h2>Hello ${data.organizerName}!</h2>

    <p>Congratulations! Your event <strong>${data.eventName}</strong> has been created successfully.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📅 Event Details</h3>
      <p><strong>Event:</strong> ${data.eventName}</p>
      <p><strong>Date:</strong> ${data.eventDate}</p>
      <p><strong>Status:</strong> Draft (ready to publish)</p>
    </div>

    <h3>🚀 Next Steps</h3>
    <ul>
      <li>Review your event details</li>
      <li>Publish your event to make it visible to attendees</li>
      <li>Share your event with potential attendees</li>
      <li>Monitor ticket sales and analytics</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.managementUrl}" class="action-button">Manage Event</a>
      <a href="${data.eventUrl}" class="action-button">Preview Event</a>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>💡 Pro Tip:</strong> Don't forget to publish your event when you're ready for attendees to purchase tickets!</p>
    </div>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;
  }

  private generateEventReminderHTML(
    attendeeName: string,
    eventName: string,
    eventDate: string,
    eventVenue: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder - ${eventName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Event Reminder</h1>
    <p>Don't miss your event tomorrow!</p>
  </div>

  <div class="content">
    <h2>Hi ${attendeeName}!</h2>

    <p>This is a friendly reminder that <strong>${eventName}</strong> is happening tomorrow!</p>

    <div class="highlight">
      <h3>📅 Event Details</h3>
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Date:</strong> ${eventDate}</p>
      <p><strong>Venue:</strong> ${eventVenue}</p>
    </div>

    <h3>✅ What to Bring</h3>
    <ul>
      <li>Your ticket (digital or printed)</li>
      <li>Valid ID for entry</li>
      <li>Comfortable shoes for stepping!</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="#" class="button">View My Tickets</a>
    </div>

    <p>We can't wait to see you on the dance floor! 💃🕺</p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;
  }

  private generateVerificationHTML(firstName: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to SteppersLife Events!</h1>
  </div>

  <div class="content">
    <h2>Hi ${firstName}!</h2>

    <p>Thank you for signing up! To complete your registration and start exploring amazing events, please verify your email address.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>

    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${verificationUrl}</p>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours for your security.</p>
    </div>

    <p>If you didn't create an account with SteppersLife Events, you can safely ignore this email.</p>

    <p>Welcome to the community!<br>
    <strong>The SteppersLife Team</strong></p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;
  }

  private generatePasswordResetHTML(firstName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Reset Your Password</h1>
  </div>

  <div class="content">
    <h2>Hi ${firstName}!</h2>

    <p>We received a request to reset your password for your SteppersLife Events account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${resetUrl}</p>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>⏰ Important:</strong> This reset link will expire in 1 hour for your security.</p>
    </div>

    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <p>Stay secure!<br>
    <strong>The SteppersLife Team</strong></p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;
  }

  private generateWelcomeHTML(firstName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SteppersLife!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 5px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to SteppersLife Events!</h1>
  </div>

  <div class="content">
    <h2>Hi ${firstName}!</h2>

    <p>Your email has been verified successfully! You're all set to start exploring and enjoying amazing events.</p>

    <h3>What's Next?</h3>
    <ul>
      <li>🎫 Browse upcoming events in your area</li>
      <li>⭐ Save your favorite events for later</li>
      <li>🎉 Purchase tickets with secure payment</li>
      <li>📱 Access digital tickets on your mobile device</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://events.stepperslife.com'}/events" class="button">Browse Events</a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://events.stepperslife.com'}/dashboard" class="button">Go to Dashboard</a>
    </div>

    <p>Have questions or need help? We're here for you!</p>

    <p>Happy exploring!<br>
    <strong>The SteppersLife Team</strong></p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;
  }

  async sendRefundConfirmation(data: {
    userEmail: string;
    userName: string;
    eventName: string;
    eventDate: string;
    originalAmount: number;
    refundAmount: number;
    cancellationFee: number;
    ticketNumber: string;
  }): Promise<boolean> {
    const html = this.buildRefundConfirmationEmail(data);

    return await this.sendEmail({
      to: data.userEmail,
      subject: `Refund Processed for ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  async sendOrganizerRefundNotification(data: {
    organizerEmail: string;
    eventName: string;
    ticketNumber: string;
    refundAmount: number;
    customerName: string;
  }): Promise<boolean> {
    const html = this.buildOrganizerRefundEmail(data);

    return await this.sendEmail({
      to: data.organizerEmail,
      subject: `Ticket Refund Processed - ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  private buildRefundConfirmationEmail(data: {
    userName: string;
    eventName: string;
    eventDate: string;
    originalAmount: number;
    refundAmount: number;
    cancellationFee: number;
    ticketNumber: string;
  }): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${this.getEmailStyles()}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Processed</h1>
    </div>

    <div class="content">
      <p>Hi ${data.userName},</p>

      <p>Your refund request has been processed successfully.</p>

      <div class="event-details">
        <h2>Event Details</h2>
        <p><strong>Event:</strong> ${data.eventName}</p>
        <p><strong>Date:</strong> ${data.eventDate}</p>
        <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
      </div>

      <div class="refund-breakdown">
        <h2>Refund Breakdown</h2>
        <table>
          <tr>
            <td>Original Ticket Price:</td>
            <td style="text-align: right;"><strong>$${data.originalAmount.toFixed(2)}</strong></td>
          </tr>
          ${data.cancellationFee > 0 ? `
          <tr>
            <td>Cancellation Fee:</td>
            <td style="text-align: right; color: #e74c3c;">-$${data.cancellationFee.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #ddd;">
            <td><strong>Refund Amount:</strong></td>
            <td style="text-align: right;"><strong style="color: #27ae60;">$${data.refundAmount.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="info-box">
        <p><strong>Important Information:</strong></p>
        <ul>
          <li>The refund will appear in your account within <strong>5-10 business days</strong></li>
          <li>Your ticket has been cancelled and can no longer be used for entry</li>
          <li>You will receive the refund to your original payment method</li>
        </ul>
      </div>

      <p>If you have any questions about your refund, please don't hesitate to contact us.</p>

      <p style="margin-top: 30px;">
        Thanks,<br>
        <strong>SteppersLife Events Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>Questions? Contact us at support@events.stepperslife.com</p>
      <p>© 2024 SteppersLife Events. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildOrganizerRefundEmail(data: {
    eventName: string;
    ticketNumber: string;
    refundAmount: number;
    customerName: string;
  }): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${this.getEmailStyles()}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ticket Refund Notification</h1>
    </div>

    <div class="content">
      <p>A ticket has been refunded for your event.</p>

      <div class="event-details">
        <h2>Refund Details</h2>
        <p><strong>Event:</strong> ${data.eventName}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
        <p><strong>Refund Amount:</strong> $${data.refundAmount.toFixed(2)}</p>
      </div>

      <div class="info-box">
        <p><strong>What This Means:</strong></p>
        <ul>
          <li>One ticket has been returned to your available inventory</li>
          <li>The platform fee for this ticket has been refunded to your account</li>
          <li>Your billing dashboard has been updated</li>
        </ul>
      </div>

      <p>You can view updated event analytics and capacity in your organizer dashboard.</p>

      <p style="margin-top: 30px;">
        Thanks,<br>
        <strong>SteppersLife Events Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>Questions? Contact us at support@events.stepperslife.com</p>
      <p>© 2024 SteppersLife Events. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendTransferInitiationEmail(data: {
    recipientEmail: string;
    senderName: string;
    senderEmail: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    venueName: string;
    message: string;
    transferUrl: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>${data.senderName} sent you a ticket!</h1></div>
    <div class="content">
      <p><strong>${data.senderName}</strong> (${data.senderEmail}) has transferred a ticket to you for:</p>
      <div class="event-details">
        <h2>${data.eventName}</h2>
        <p>${data.eventDate} at ${data.eventTime}</p>
        <p>${data.venueName}</p>
      </div>
      ${data.message ? `<div class="info-box"><p><strong>Personal message:</strong></p><p>"${data.message}"</p></div>` : ''}
      <p><strong>You have 48 hours to accept this ticket.</strong></p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.transferUrl}" style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Ticket</a>
      </p>
      <p style="font-size: 14px; color: #666;">Expires: ${data.expiresAt.toLocaleString()}</p>
    </div>
    <div class="footer">
      <p>Questions? Contact support@events.stepperslife.com</p>
    </div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.recipientEmail,
      subject: `${data.senderName} sent you a ticket to ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  async sendTransferAcceptedToRecipient(data: {
    recipientEmail: string;
    recipientName: string;
    eventName: string;
    eventDate: string;
    ticketNumber: string;
    qrCode: string;
  }): Promise<boolean> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Ticket Transfer Complete!</h1></div>
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      <p>You've successfully received a ticket for <strong>${data.eventName}</strong>!</p>
      <div class="event-details">
        <p><strong>Event:</strong> ${data.eventName}</p>
        <p><strong>Date:</strong> ${data.eventDate}</p>
        <p><strong>Ticket #:</strong> ${data.ticketNumber}</p>
      </div>
      <p>Your ticket is now in your account. You can view it anytime in your dashboard.</p>
      <p style="text-align: center;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Tickets</a>
      </p>
    </div>
    <div class="footer"><p>© 2024 SteppersLife Events</p></div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.recipientEmail,
      subject: `Your ticket for ${data.eventName} is ready!`,
      html,
      text: this.stripHtml(html)
    });
  }

  async sendTransferAcceptedToSender(data: {
    senderEmail: string;
    senderName: string;
    recipientName: string;
    recipientEmail: string;
    eventName: string;
  }): Promise<boolean> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Transfer Accepted</h1></div>
    <div class="content">
      <p>Hi ${data.senderName},</p>
      <p>Good news! <strong>${data.recipientName}</strong> accepted your ticket transfer for <strong>${data.eventName}</strong>.</p>
      <div class="info-box">
        <p>The ticket has been transferred to: ${data.recipientEmail}</p>
        <p>Your original QR code is no longer valid.</p>
      </div>
      <p>Thanks for using SteppersLife Events!</p>
    </div>
    <div class="footer"><p>© 2024 SteppersLife Events</p></div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.senderEmail,
      subject: `Your ticket transfer was accepted`,
      html,
      text: this.stripHtml(html)
    });
  }

  async sendEventCancellationEmail(data: {
    recipientEmail: string;
    recipientName: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    venueName: string;
    cancellationReason: string;
    refundStatus: string;
    organizerName: string;
    organizerEmail: string;
    ticketCount: number;
  }): Promise<boolean> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: #ef4444;"><h1>Event Cancelled</h1></div>
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      <p>We regret to inform you that the following event has been cancelled:</p>
      <div class="info-box" style="border-color: #ef4444;">
        <h2 style="color: #ef4444; margin: 0 0 15px 0;">${data.eventName}</h2>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin: 5px 0;"><strong>Venue:</strong> ${data.venueName}</p>
        <p style="margin: 5px 0;"><strong>Tickets Affected:</strong> ${data.ticketCount}</p>
      </div>
      <h3>Cancellation Reason</h3>
      <p style="padding: 15px; background: #f9fafb; border-left: 4px solid #ef4444; margin: 15px 0;">${data.cancellationReason}</p>
      <h3>Refund Status</h3>
      <div class="info-box">
        <p>${data.refundStatus}</p>
      </div>
      <p>If you have any questions, please contact the event organizer:</p>
      <div class="info-box">
        <p><strong>${data.organizerName}</strong></p>
        <p>${data.organizerEmail}</p>
      </div>
      <p>We apologize for any inconvenience this may cause.</p>
    </div>
    <div class="footer"><p>© 2024 SteppersLife Events</p></div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.recipientEmail,
      subject: `Event Cancelled: ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  /**
   * Send event status change notification to organizer
   */
  async sendEventStatusChangeEmail(data: {
    organizerEmail: string;
    organizerName: string;
    eventName: string;
    oldStatus: string;
    newStatus: string;
    eventDate: string;
    eventTime: string;
    venueName: string;
    dashboardUrl: string;
  }): Promise<boolean> {
    let statusColor = '#667eea';
    let statusMessage = '';
    let nextSteps = '';

    if (data.newStatus === 'PUBLISHED') {
      statusColor = '#10b981';
      statusMessage = 'Your event has been successfully published and is now visible to the public!';
      nextSteps = `
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Your event is now live on the platform</li>
          <li style="padding: 8px 0;">✓ Users can browse and purchase tickets</li>
          <li style="padding: 8px 0;">✓ You'll receive notifications for new ticket sales</li>
          <li style="padding: 8px 0;">✓ Monitor sales and analytics in your dashboard</li>
        </ul>
      `;
    } else if (data.newStatus === 'DRAFT') {
      statusColor = '#f59e0b';
      statusMessage = 'Your event has been moved back to draft status and is no longer visible to the public.';
      nextSteps = `
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Your event is now hidden from public view</li>
          <li style="padding: 8px 0;">✓ You can make edits and changes</li>
          <li style="padding: 8px 0;">✓ Republish when you're ready</li>
        </ul>
      `;
    } else if (data.newStatus === 'CANCELLED') {
      statusColor = '#ef4444';
      statusMessage = 'Your event has been cancelled. Refunds are being processed for all ticket holders.';
      nextSteps = `
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Automatic refunds initiated for all tickets</li>
          <li style="padding: 8px 0;">✓ Attendees have been notified of the cancellation</li>
          <li style="padding: 8px 0;">✓ Refunds typically process within 5-10 business days</li>
          <li style="padding: 8px 0;">✓ You can view refund status in your dashboard</li>
        </ul>
      `;
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: ${statusColor};"><h1>Event Status Update</h1></div>
    <div class="content">
      <p>Hi ${data.organizerName},</p>
      <p>${statusMessage}</p>
      <div class="info-box" style="border-color: ${statusColor};">
        <h2 style="color: ${statusColor}; margin: 0 0 15px 0;">${data.eventName}</h2>
        <p style="margin: 5px 0;"><strong>Status Changed:</strong> ${data.oldStatus} → ${data.newStatus}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin: 5px 0;"><strong>Venue:</strong> ${data.venueName}</p>
      </div>
      <h3>Next Steps</h3>
      ${nextSteps}
      <a href="${data.dashboardUrl}" class="button" style="background: ${statusColor};">View Event Dashboard</a>
    </div>
    <div class="footer"><p>© 2024 SteppersLife Events</p></div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.organizerEmail,
      subject: `Event ${data.newStatus}: ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  /**
   * Send ticket purchase notification to event organizer
   */
  async sendOrganizerTicketSaleNotification(data: {
    organizerEmail: string;
    organizerName: string;
    buyerName: string;
    buyerEmail: string;
    eventName: string;
    eventDate: string;
    ticketCount: number;
    ticketTypeName: string;
    orderNumber: string;
    totalAmount: number;
    subtotal: number;
    platformFee: number;
    organizerPayout: number;
    dashboardUrl: string;
  }): Promise<boolean> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: #10b981;"><h1>New Ticket Sale! 🎉</h1></div>
    <div class="content">
      <p>Hi ${data.organizerName},</p>
      <p>Great news! You just sold ${data.ticketCount} ticket${data.ticketCount > 1 ? 's' : ''} for your event.</p>
      <div class="info-box" style="border-color: #10b981;">
        <h2 style="color: #10b981; margin: 0 0 15px 0;">${data.eventName}</h2>
        <p style="margin: 5px 0;"><strong>Event Date:</strong> ${data.eventDate}</p>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
      </div>
      <h3>Purchase Details</h3>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Buyer:</strong> ${data.buyerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.buyerEmail}</p>
        <p style="margin: 5px 0;"><strong>Ticket Type:</strong> ${data.ticketTypeName}</p>
        <p style="margin: 5px 0;"><strong>Quantity:</strong> ${data.ticketCount}</p>
      </div>
      <h3>Payment Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0;">Ticket Sales</td>
          <td style="text-align: right; padding: 8px 0;">$${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0;">Platform Fee</td>
          <td style="text-align: right; padding: 8px 0; color: #6b7280;">-$${data.platformFee.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 2px solid #10b981;">
          <td style="padding: 8px 0;"><strong>Your Payout</strong></td>
          <td style="text-align: right; padding: 8px 0;"><strong style="color: #10b981;">$${data.organizerPayout.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">Buyer Total</td>
          <td style="text-align: right; padding: 8px 0;">$${data.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardUrl}" class="button" style="background: #10b981;">View Order in Dashboard</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">Payouts are processed according to your payout schedule. View payout details in your dashboard.</p>
    </div>
    <div class="footer"><p>© 2024 SteppersLife Events</p></div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.organizerEmail,
      subject: `New Sale: ${data.ticketCount} ticket${data.ticketCount > 1 ? 's' : ''} for ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  /**
   * Send new event published notification to interested users
   */
  async sendEventPublishedNotification(data: {
    recipientEmail: string;
    recipientName: string;
    organizerName: string;
    eventName: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    venueName: string;
    venueAddress: string;
    ticketPriceRange: string;
    eventUrl: string;
    imageUrl?: string;
  }): Promise<boolean> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>New Event from ${data.organizerName}</h1></div>
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      <p>Great news! ${data.organizerName} just published a new event that you might be interested in:</p>
      ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.eventName}" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px; margin: 20px 0;" />` : ''}
      <div class="info-box" style="border-color: #667eea;">
        <h2 style="color: #667eea; margin: 0 0 15px 0;">${data.eventName}</h2>
        <p style="margin: 15px 0;">${data.eventDescription}</p>
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${data.eventDate}</p>
          <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${data.eventTime}</p>
          <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${data.venueName}</p>
          <p style="margin: 5px 0;"><strong>🎫 Tickets:</strong> ${data.ticketPriceRange}</p>
        </div>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.eventUrl}" class="button">View Event & Get Tickets</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">You're receiving this because you've favorited events by this organizer.</p>
    </div>
    <div class="footer"><p>© 2024 SteppersLife Events</p></div>
  </div>
</body>
</html>`;

    return await this.sendEmail({
      to: data.recipientEmail,
      subject: `New Event: ${data.eventName}`,
      html,
      text: this.stripHtml(html)
    });
  }

  private getEmailStyles(): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: #667eea;
        color: white;
        padding: 30px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .content {
        padding: 30px;
      }
      .content h2 {
        color: #667eea;
        font-size: 20px;
        margin-top: 25px;
        margin-bottom: 15px;
      }
      .content h3 {
        color: #667eea;
        font-size: 18px;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      .content p {
        margin: 15px 0;
        color: #555;
      }
      .info-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-left: 4px solid #667eea;
        padding: 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .info-box p {
        margin: 8px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 30px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
      }
      .button:hover {
        background: #5568d3;
      }
      .footer {
        background: #f9fafb;
        padding: 20px 30px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        border-top: 1px solid #e5e7eb;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      table td {
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
      }
      table tr:last-child td {
        border-bottom: none;
      }
    `;
  }

  private generateAffiliateWelcomeHTML(firstName: string, affiliateId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #10b981;">
      <h1>🎉 Welcome to the Affiliate Program!</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName}!</p>
      <p>Thank you for applying to become a SteppersLife Events affiliate! We're excited to review your application.</p>
      <div class="info-box">
        <h3>What Happens Next?</h3>
        <ul>
          <li>Our team will review your application within 2-3 business days</li>
          <li>You'll receive an email once your application is approved</li>
          <li>Upon approval, you'll get access to your affiliate dashboard</li>
          <li>You'll be able to generate unique tracking links and start earning commissions</li>
        </ul>
      </div>
      <div class="info-box" style="border-color: #10b981;">
        <h3>Your Application ID</h3>
        <p>${affiliateId}</p>
        <p style="font-size: 14px; color: #666;">Save this for your records</p>
      </div>
      <p>If you have any questions, please don't hesitate to reach out!</p>
      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>SteppersLife Events Team</strong>
      </p>
    </div>
    <div class="footer">
      <p>Questions? Contact us at affiliates@events.stepperslife.com</p>
      <p>© 2024 SteppersLife Events. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateAffiliateApprovalHTML(firstName: string, dashboardUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #10b981;">
      <h1>🎊 Congratulations! You're Approved!</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName}!</p>
      <p>Great news! Your affiliate application has been <strong>approved</strong>. Welcome to the SteppersLife Events Affiliate Program!</p>
      <div class="info-box" style="border-color: #10b981;">
        <h3>🚀 Get Started</h3>
        <p>You can now:</p>
        <ul>
          <li>Access your affiliate dashboard</li>
          <li>Generate unique tracking links for events</li>
          <li>Track your sales and commissions in real-time</li>
          <li>Process cash payments with your secure PIN</li>
          <li>View your earnings and payout history</li>
        </ul>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
      </p>
      <div class="info-box">
        <h3>💡 Pro Tips for Success</h3>
        <ul>
          <li>Share your affiliate links on social media</li>
          <li>Personalize your outreach to potential attendees</li>
          <li>Use the marketing resources we provide</li>
          <li>Set up your payment information for quick payouts</li>
        </ul>
      </div>
      <p>Let's start selling tickets together!</p>
      <p style="margin-top: 30px;">
        Welcome to the team,<br>
        <strong>SteppersLife Events</strong>
      </p>
    </div>
    <div class="footer">
      <p>Questions? Contact us at affiliates@events.stepperslife.com</p>
      <p>© 2024 SteppersLife Events. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateAffiliateRejectionHTML(firstName: string, reason: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #6b7280;">
      <h1>Affiliate Application Update</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>
      <p>Thank you for your interest in becoming a SteppersLife Events affiliate. After careful review, we're unable to approve your application at this time.</p>
      <div class="info-box">
        <h3>Reason</h3>
        <p>${reason}</p>
      </div>
      <p>We appreciate your interest in partnering with us. If you believe this decision was made in error or if you'd like to reapply in the future, please feel free to contact us.</p>
      <p style="margin-top: 30px;">
        Thank you for your understanding,<br>
        <strong>SteppersLife Events Team</strong>
      </p>
    </div>
    <div class="footer">
      <p>Questions? Contact us at affiliates@events.stepperslife.com</p>
      <p>© 2024 SteppersLife Events. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();

// Helper function for NextAuth Email Provider
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to SteppersLife Events</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sign in to SteppersLife Events</h1>
  </div>

  <div class="content">
    <p>Click the button below to sign in to your account. This link will expire in 24 hours.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" class="button">Sign In</a>
    </div>

    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${url}</p>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Security Notice:</strong> If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>© 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: `SteppersLife Events <${process.env.RESEND_FROM_EMAIL || 'noreply@events.stepperslife.com'}>`,
    to: email,
    subject: 'Sign in to SteppersLife Events',
    html,
  });
}