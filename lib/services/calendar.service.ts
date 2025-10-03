/**
 * Calendar Service
 *
 * Generates .ics (iCalendar) files for event tickets,
 * allowing users to add events to their calendar apps.
 *
 * @module CalendarService
 */

export interface CalendarEventData {
  eventName: string;
  eventDescription?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
  url?: string;
}

export class CalendarService {
  /**
   * Generate .ics calendar file content
   */
  generateICS(data: CalendarEventData): string {
    const now = new Date();
    const timestamp = this.formatDateTimeUTC(now).replace(/[-:]/g, '');

    // Generate unique ID
    const uid = `${timestamp}-${Math.random().toString(36).substr(2, 9)}@events.stepperslife.com`;

    // Format dates for iCalendar (must be in UTC format: YYYYMMDDTHHMMSSZ)
    const startDateTime = this.formatDateTimeUTC(data.startDate);
    const endDateTime = this.formatDateTimeUTC(data.endDate);

    // Build ICS content
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SteppersLife Events//Event Tickets//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${this.escapeText(data.eventName)}`,
    ];

    // Add optional fields
    if (data.eventDescription) {
      lines.push(`DESCRIPTION:${this.escapeText(data.eventDescription)}`);
    }

    if (data.location) {
      lines.push(`LOCATION:${this.escapeText(data.location)}`);
    }

    if (data.organizerName && data.organizerEmail) {
      lines.push(`ORGANIZER;CN=${this.escapeText(data.organizerName)}:mailto:${data.organizerEmail}`);
    }

    if (data.url) {
      lines.push(`URL:${data.url}`);
    }

    // Add reminders (1 day before and 1 hour before)
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event reminder: Tomorrow',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event starting in 1 hour',
      'END:VALARM'
    );

    // Close event and calendar
    lines.push(
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    // Join with CRLF as per iCalendar spec
    return lines.join('\r\n');
  }

  /**
   * Generate .ics file as Buffer
   */
  generateICSBuffer(data: CalendarEventData): Buffer {
    const content = this.generateICS(data);
    return Buffer.from(content, 'utf-8');
  }

  /**
   * Generate .ics file as base64 for email attachments
   */
  generateICSBase64(data: CalendarEventData): string {
    const buffer = this.generateICSBuffer(data);
    return buffer.toString('base64');
  }

  /**
   * Generate filename for .ics file
   */
  generateFilename(eventName: string): string {
    const sanitized = eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${sanitized}-${Date.now()}.ics`;
  }

  /**
   * Format date to iCalendar UTC format (YYYYMMDDTHHMMSSZ)
   */
  private formatDateTimeUTC(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escape special characters for iCalendar format
   */
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/;/g, '\\;')    // Escape semicolons
      .replace(/,/g, '\\,')    // Escape commas
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '');     // Remove carriage returns
  }

  /**
   * Create calendar event data from ticket purchase
   */
  createEventDataFromOrder(params: {
    eventName: string;
    eventDate: Date;
    eventDuration?: number; // in hours, default 3
    venue?: string;
    ticketCount?: number;
    orderNumber?: string;
    organizerName?: string;
    organizerEmail?: string;
  }): CalendarEventData {
    const duration = params.eventDuration || 3; // Default 3 hours
    const endDate = new Date(params.eventDate.getTime() + duration * 60 * 60 * 1000);

    let description = `You have tickets for this event!`;
    if (params.ticketCount) {
      description += ` (${params.ticketCount} ticket${params.ticketCount > 1 ? 's' : ''})`;
    }
    if (params.orderNumber) {
      description += `\n\nOrder: ${params.orderNumber}`;
    }
    description += '\n\nPlease arrive early and bring your ticket QR code.';

    return {
      eventName: params.eventName,
      eventDescription: description,
      startDate: params.eventDate,
      endDate,
      location: params.venue,
      organizerName: params.organizerName,
      organizerEmail: params.organizerEmail,
      url: `https://events.stepperslife.com/dashboard/orders`
    };
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
