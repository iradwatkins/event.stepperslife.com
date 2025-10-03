import QRCode from 'qrcode';

export interface TicketQRData {
  ticketId: string;
  ticketNumber: string;
  eventId: string;
  eventName: string;
  holderName: string;
  holderEmail: string;
  validationCode: string;
  issueDate: string;
}

export interface CheckInQRData {
  ticketId: string;
  validationCode: string;
  eventId: string;
  checkInUrl: string;
}

class QRCodeService {
  /**
   * Generate QR code for ticket validation
   * Contains encrypted ticket data for check-in
   */
  async generateTicketQR(ticketData: TicketQRData): Promise<string> {
    try {
      // Create check-in URL with validation code
      const checkInUrl = `${process.env.NEXTAUTH_URL}/checkin/${ticketData.eventId}?ticket=${ticketData.ticketId}&code=${ticketData.validationCode}`;

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate ticket QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate simple QR code for check-in validation
   * Minimal data for faster scanning
   */
  async generateCheckInQR(data: CheckInQRData): Promise<string> {
    try {
      const qrData = JSON.stringify({
        t: data.ticketId,
        v: data.validationCode,
        e: data.eventId,
        u: data.checkInUrl
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        width: 250
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate check-in QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   * Better for email templates and scalable display
   */
  async generateTicketQRSVG(ticketData: TicketQRData): Promise<string> {
    try {
      const checkInUrl = `${process.env.NEXTAUTH_URL}/checkin/${ticketData.eventId}?ticket=${ticketData.ticketId}&code=${ticketData.validationCode}`;

      const qrCodeSVG = await QRCode.toString(checkInUrl, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      });

      return qrCodeSVG;
    } catch (error) {
      console.error('Failed to generate ticket QR SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate event-specific QR code for promotions
   */
  async generateEventQR(eventId: string, eventUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(eventUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        },
        width: 300
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate event QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate QR code data structure
   */
  validateQRData(qrData: string): boolean {
    try {
      // Try to parse as JSON (check-in format)
      const parsed = JSON.parse(qrData);
      return !!(parsed.t && parsed.v && parsed.e);
    } catch {
      // Try as URL (ticket format)
      try {
        const url = new URL(qrData);
        return url.pathname.includes('/checkin/') &&
               url.searchParams.has('ticket') &&
               url.searchParams.has('code');
      } catch {
        return false;
      }
    }
  }

  /**
   * Extract ticket info from QR code
   */
  extractTicketInfo(qrData: string): { ticketId: string; validationCode: string; eventId: string } | null {
    try {
      // Try JSON format first
      const parsed = JSON.parse(qrData);
      if (parsed.t && parsed.v && parsed.e) {
        return {
          ticketId: parsed.t,
          validationCode: parsed.v,
          eventId: parsed.e
        };
      }
    } catch {
      // Try URL format
      try {
        const url = new URL(qrData);
        const ticketId = url.searchParams.get('ticket');
        const validationCode = url.searchParams.get('code');
        const eventId = url.pathname.split('/')[2];

        if (ticketId && validationCode && eventId) {
          return { ticketId, validationCode, eventId };
        }
      } catch {
        return null;
      }
    }

    return null;
  }
}

export const qrCodeService = new QRCodeService();