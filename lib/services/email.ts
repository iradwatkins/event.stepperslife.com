import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
      const { data, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [template.to],
        subject: template.subject,
        html: template.html,
        text: template.text || this.stripHtml(template.html)
      });

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

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();