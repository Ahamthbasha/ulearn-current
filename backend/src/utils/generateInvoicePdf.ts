import PDFDocument from "pdfkit";
import { OrderDetailsDTO } from "../dto/userDTO/orderDetailsDTO";

export async function generateInvoicePdf(order: OrderDetailsDTO): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true
    });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Color palette
    const colors = {
      primary: '#2563eb',     // Blue
      secondary: '#64748b',   // Gray
      accent: '#f59e0b',      // Amber
      success: '#10b981',     // Green
      danger: '#ef4444',      // Red
      dark: '#1f2937',        // Dark gray
      light: '#f8fafc',       // Light gray
      white: '#ffffff'
    };

    // Helper function to add colored rectangle
    const addColoredRect = (x: number, y: number, width: number, height: number, color: string) => {
      doc.rect(x, y, width, height).fill(color);
    };

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      // Using Rs. instead of ₹ symbol to avoid locale issues
      return `Rs. ${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    // Helper function to get status color
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid':
        case 'completed':
        case 'success':
          return colors.success;
        case 'pending':
        case 'processing':
          return colors.accent;
        case 'failed':
        case 'cancelled':
          return colors.danger;
        default:
          return colors.secondary;
      }
    };

    // ========== HEADER SECTION ==========
    // Header background
    addColoredRect(0, 0, 595, 120, colors.primary);
    
    // Company logo area (placeholder circle)
    doc.circle(70, 40, 20).fill(colors.white);
    doc.fontSize(16).fillColor(colors.primary).font('Helvetica-Bold')
       .text('uL', 63, 33);

    // Company details
    doc.fontSize(28).fillColor(colors.white).font('Helvetica-Bold')
       .text('uLearn', 110, 30);
    doc.fontSize(12).font('Helvetica')
       .text('Knowledge Street', 110, 60)
       .text('Chennai, Tamil Nadu, India', 110, 75)
       .text('contact@ulearn.com | +91 98765 43210', 110, 90);

    // Invoice title
    doc.fontSize(32).font('Helvetica-Bold')
       .text('INVOICE', 420, 35, { align: 'right' });
    
    // Invoice number with background
    addColoredRect(420, 70, 125, 25, colors.accent);
    doc.fontSize(12).fillColor(colors.white).font('Helvetica-Bold')
       .text(`INV-${order.orderId.slice(-8)}`, 425, 78, { align: 'left' });

    // Reset position and color
    doc.y = 140;
    doc.fillColor(colors.dark);

    // ========== CLIENT INFORMATION SECTION ==========
    const clientSectionY = doc.y;
    
    // Bill To section
    addColoredRect(50, clientSectionY, 250, 5, colors.primary);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.primary)
       .text('BILL TO', 50, clientSectionY + 15);
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.dark)
       .text(order.customerName, 50, clientSectionY + 35);
    doc.fontSize(12).font('Helvetica').fillColor(colors.secondary)
       .text(order.customerEmail, 50, clientSectionY + 55);

    // Invoice details section
    const detailsX = 350;
    addColoredRect(detailsX, clientSectionY, 200, 5, colors.accent);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.accent)
       .text('INVOICE DETAILS', detailsX, clientSectionY + 15);

    const detailsData = [
      { label: 'Invoice Date:', value:order.orderDate},
      { label: 'Payment Method:', value: order.payment.toUpperCase() },
      { label: 'Status:', value: order.status.toUpperCase() }
    ];

    let detailY = clientSectionY + 35;
    detailsData.forEach(detail => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.dark)
         .text(detail.label, detailsX, detailY);
      
      if (detail.label === 'Status:') {
        // Status with colored background
        const statusColor = getStatusColor(detail.value);
        const statusWidth = doc.widthOfString(detail.value) + 10;
        addColoredRect(detailsX + 85, detailY - 2, statusWidth, 16, statusColor);
        doc.fillColor(colors.white).text(detail.value, detailsX + 90, detailY);
      } else {
        doc.fillColor(colors.secondary).font('Helvetica')
           .text(detail.value, detailsX + 85, detailY);
      }
      detailY += 20;
    });

    doc.y = Math.max(clientSectionY + 100, detailY + 20);

    // ========== COURSES TABLE SECTION ==========
    const tableStartY = doc.y + 20;
    
    // Table header
    addColoredRect(50, tableStartY, 495, 35, colors.light);
    doc.rect(50, tableStartY, 495, 35).stroke(colors.secondary);

    const colPositions = {
      course: 60,
      price: 380,
      total: 460
    };

    doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark);
    doc.text('COURSE DETAILS', colPositions.course, tableStartY + 12);
    doc.text('PRICE', colPositions.price, tableStartY + 12, { width: 70, align: 'center' });
    doc.text('TOTAL', colPositions.total, tableStartY + 12, { width: 75, align: 'center' });

    // Table rows
    let currentRowY = tableStartY + 35;
    const rowHeight = 40;
    
    order.courses.forEach((course, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        addColoredRect(50, currentRowY, 495, rowHeight, '#fafafa');
      }
      
      // Row border
      doc.rect(50, currentRowY, 495, rowHeight).stroke('#e5e7eb');
      
      // Course name (with text wrapping)
      doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.dark);
      doc.text(course.courseName, colPositions.course, currentRowY + 8, {
        width: 280,
        height: rowHeight - 16,
        ellipsis: true
      });
      
      // Price and total
      doc.fontSize(11).font('Helvetica').fillColor(colors.secondary);
      doc.text(formatCurrency(course.price), colPositions.price, currentRowY + 15, {
        width: 70,
        align: 'center'
      });
      doc.text(formatCurrency(course.price), colPositions.total, currentRowY + 15, {
        width: 75,
        align: 'center'
      });
      
      currentRowY += rowHeight;
    });

    // ========== SUMMARY SECTION ==========
    const summaryStartY = currentRowY + 20;
    const summaryX = 320;
    const summaryWidth = 225;

    // Summary background
    addColoredRect(summaryX, summaryStartY, summaryWidth, 5, colors.primary);
    
    let summaryY = summaryStartY + 20;

    // Original amount
    doc.fontSize(12).font('Helvetica').fillColor(colors.dark);
    doc.text('Subtotal:', summaryX + 10, summaryY);
    doc.text(formatCurrency(order.totalAmountWithoutDiscount), summaryX + 120, summaryY, {
      width: 95,
      align: 'right'
    });
    summaryY += 25;

    // Coupon discount (if applicable)
    if (order.couponCode && order.couponDiscountAmount && order.couponDiscountPercentage) {
      addColoredRect(summaryX, summaryY - 5, summaryWidth, 25, '#fef3c7');
      doc.fillColor(colors.accent);
      doc.text(`Discount (${order.couponCode})`, summaryX + 10, summaryY);
      doc.text(`-${order.couponDiscountPercentage}%`, summaryX + 150, summaryY);
      doc.text(`-${formatCurrency(order.couponDiscountAmount)}`, summaryX + 120, summaryY, {
        width: 95,
        align: 'right'
      });
      summaryY += 30;
    }

    // Total section
    addColoredRect(summaryX, summaryY, summaryWidth, 35, colors.primary);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.white);
    doc.text('TOTAL:', summaryX + 10, summaryY + 10);
    doc.text(formatCurrency(order.totalAmount), summaryX + 120, summaryY + 10, {
      width: 95,
      align: 'right'
    });

    // ========== FOOTER SECTION ==========
    const footerY = 720;
    
    // Footer line
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke(colors.secondary);
    
    // Thank you message
    doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.primary)
       .text('Thank you for choosing uLearn!', 50, footerY + 15);
    
    doc.fontSize(10).font('Helvetica').fillColor(colors.secondary)
       .text('This is a computer-generated invoice. No signature is required.', 50, footerY + 35)
       .text('For any queries, please contact us at support@ulearn.com', 50, footerY + 50);

    // Page numbers and watermark
    doc.fontSize(8).fillColor(colors.secondary)
       .text(`Invoice Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 400, footerY + 50);

    // Add a subtle watermark
    doc.fontSize(60).fillColor('#f0f0f0').opacity(0.1)
       .text('uLearn', 200, 400, { align: 'center' });

    // Reset opacity
    doc.opacity(1);

    // ========== FINISH ==========
    doc.end();
  });
}