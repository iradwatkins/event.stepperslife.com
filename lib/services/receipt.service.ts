/**
 * Receipt Generation Service
 *
 * Generates PDF receipts for ticket purchases with complete order details,
 * tax breakdown, and branding. Supports 7-year retention requirements.
 *
 * @module ReceiptService
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface ReceiptData {
  orderNumber: string;
  orderDate: Date;
  eventName: string;
  eventDate: Date;
  eventVenue: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  tickets: Array<{
    ticketNumber: string;
    type: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
  paymentMethod: string;
  paymentId?: string;
}

export class ReceiptService {
  /**
   * Generate PDF receipt for an order
   */
  async generateReceipt(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate receipt content
        this.addHeader(doc);
        this.addOrderInfo(doc, data);
        this.addEventDetails(doc, data);
        this.addBuyerInfo(doc, data);
        this.addTicketDetails(doc, data);
        this.addPaymentSummary(doc, data);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add receipt header with branding
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('STEPPERSLIFE EVENTS', { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .text('Official Receipt', { align: 'center' })
      .moveDown(2);
  }

  /**
   * Add order information section
   */
  private addOrderInfo(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    const y = doc.y;

    // Left column
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Receipt Number:', 50, y)
      .font('Helvetica')
      .text(data.orderNumber, 50, y + 15)
      .moveDown(0.5);

    // Right column
    doc
      .font('Helvetica-Bold')
      .text('Date:', 350, y, { align: 'right' })
      .font('Helvetica')
      .text(this.formatDate(data.orderDate), 350, y + 15, { align: 'right' });

    doc.moveDown(2);
  }

  /**
   * Add event details section
   */
  private addEventDetails(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    this.addSectionHeader(doc, 'EVENT DETAILS');

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(data.eventName)
      .fontSize(10)
      .font('Helvetica')
      .moveDown(0.3)
      .text(`Date: ${this.formatDateTime(data.eventDate)}`)
      .text(`Venue: ${data.eventVenue}`)
      .moveDown(1.5);
  }

  /**
   * Add buyer information section
   */
  private addBuyerInfo(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    this.addSectionHeader(doc, 'BUYER INFORMATION');

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Name: ${data.buyerName}`)
      .text(`Email: ${data.buyerEmail}`);

    if (data.buyerPhone) {
      doc.text(`Phone: ${data.buyerPhone}`);
    }

    doc.moveDown(1.5);
  }

  /**
   * Add ticket details table
   */
  private addTicketDetails(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    this.addSectionHeader(doc, 'TICKET DETAILS');

    const tableTop = doc.y;
    const itemHeight = 25;

    // Table headers
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Ticket', 50, tableTop)
      .text('Type', 200, tableTop)
      .text('Qty', 350, tableTop)
      .text('Price', 450, tableTop, { width: 100, align: 'right' });

    // Draw header line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Table rows
    let currentY = tableTop + 20;
    data.tickets.forEach((ticket) => {
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(ticket.ticketNumber, 50, currentY, { width: 140, ellipsis: true })
        .text(ticket.type, 200, currentY)
        .text(ticket.quantity.toString(), 350, currentY)
        .text(`$${ticket.price.toFixed(2)}`, 450, currentY, { width: 100, align: 'right' });

      currentY += itemHeight;
    });

    doc.y = currentY + 10;
  }

  /**
   * Add payment summary section
   */
  private addPaymentSummary(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    const startY = doc.y;

    // Draw dividing line
    doc
      .moveTo(350, startY)
      .lineTo(550, startY)
      .stroke();

    doc.moveDown(0.5);

    const summaryX = 350;
    const amountX = 450;
    let currentY = doc.y;

    // Subtotal
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', summaryX, currentY)
      .text(`$${data.subtotal.toFixed(2)}`, amountX, currentY, { width: 100, align: 'right' });

    currentY += 15;

    // Fees (if any)
    if (data.fees > 0) {
      doc
        .text('Service Fees:', summaryX, currentY)
        .text(`$${data.fees.toFixed(2)}`, amountX, currentY, { width: 100, align: 'right' });
      currentY += 15;
    }

    // Taxes
    doc
      .text('Sales Tax:', summaryX, currentY)
      .text(`$${data.taxes.toFixed(2)}`, amountX, currentY, { width: 100, align: 'right' });

    currentY += 20;

    // Total line
    doc
      .moveTo(350, currentY)
      .lineTo(550, currentY)
      .stroke();

    currentY += 10;

    // Total amount
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL PAID:', summaryX, currentY)
      .text(`$${data.total.toFixed(2)}`, amountX, currentY, { width: 100, align: 'right' });

    currentY += 25;

    // Payment method
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Payment Method: ${data.paymentMethod}`, summaryX, currentY);

    if (data.paymentId) {
      currentY += 12;
      doc
        .fontSize(8)
        .text(`Transaction ID: ${data.paymentId}`, summaryX, currentY, { width: 200 });
    }

    doc.moveDown(3);
  }

  /**
   * Add footer with legal information
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Thank you for your purchase!', 50, footerY, { align: 'center' })
      .moveDown(0.5)
      .fontSize(7)
      .text('This receipt serves as proof of purchase. Please retain for your records.', { align: 'center' })
      .text('For questions or support, contact: support@events.stepperslife.com', { align: 'center' })
      .moveDown(0.5)
      .text('SteppersLife Events | www.events.stepperslife.com', { align: 'center' })
      .moveDown(0.5)
      .fontSize(6)
      .fillColor('#999999')
      .text(`Generated: ${new Date().toISOString()} | Receipt ID: ${Date.now()}`, { align: 'center' });
  }

  /**
   * Add section header with underline
   */
  private addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    const y = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(title, 50, y);

    doc
      .moveTo(50, y + 12)
      .lineTo(200, y + 12)
      .strokeColor('#333333')
      .stroke()
      .strokeColor('#000000');

    doc.moveDown(1);
  }

  /**
   * Format date as MM/DD/YYYY
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  /**
   * Format date and time
   */
  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }

  /**
   * Generate receipt filename
   */
  generateFilename(orderNumber: string): string {
    return `receipt-${orderNumber}-${Date.now()}.pdf`;
  }

  /**
   * Convert buffer to base64 for email attachments
   */
  bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }
}

// Export singleton instance
export const receiptService = new ReceiptService();