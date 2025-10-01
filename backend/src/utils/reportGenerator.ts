import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

export interface ReportData {
  createdAt: string;
  courseName: string;
  courseOriginalPrice: number;
  couponCode: string;
  couponDiscount: number;
  courseDiscountAmount: number;
  finalCoursePrice: number;
  instructorEarning: number;
  orderId: string;
  paymentMethod?: string;
}

export async function generateExcelReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "createdAt", width: 20 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Course Price", key: "courseOriginalPrice", width: 15 },
    { header: "Coupon Used", key: "couponCode", width: 15 },
    { header: "Discount Amount", key: "courseDiscountAmount", width: 15 },
    { header: "Final Price", key: "finalCoursePrice", width: 15 },
    { header: "Instructor Earnings", key: "instructorEarning", width: 20 },
  ];

  let totalInstructorEarnings = 0;

  data.forEach((item) => {
    sheet.addRow({
      orderId: item.orderId,
      createdAt: item.createdAt,
      courseName: item.courseName,
      courseOriginalPrice: item.courseOriginalPrice,
      couponCode: item.couponCode,
      courseDiscountAmount: item.courseDiscountAmount,
      finalCoursePrice: item.finalCoursePrice,
      instructorEarning: item.instructorEarning,
    });

    totalInstructorEarnings += item.instructorEarning;
  });

  sheet.addRow({}); // Empty row
  sheet.addRow({
    courseName: "Total Instructor Earnings:",
    instructorEarning: totalInstructorEarnings,
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=RevenueReport.xlsx`,
  );
  await workbook.xlsx.write(res);
  res.end();
}

export async function generatePdfReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4',
    bufferPages: true
  });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=RevenueReport_${Date.now()}.pdf`,
  );

  doc.pipe(stream);

  // Header Section with Background
  doc.rect(0, 0, doc.page.width, 120).fill('#4A90E2');
  
  // Title
  doc.fillColor('white')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('ULearn', 50, 30, { align: 'left' });
  
  doc.fontSize(16)
     .font('Helvetica')
     .text('Revenue Report', 50, 65);
  
  // Date Range
  const reportDate = new Date().toLocaleDateString('en-GB');
  doc.fontSize(10)
     .text(`Generated on: ${reportDate}`, 50, 90);

  // Move below header
  doc.fillColor('black').moveDown(3);

  let totalEarnings = 0;
  let totalDiscount = 0;
  let totalOrders = data.length;

  // Calculate totals
  data.forEach(item => {
    totalEarnings += item.instructorEarning;
    totalDiscount += item.courseDiscountAmount;
  });

  // Summary Cards
  const summaryY = 140;
  const cardWidth = 150;
  const cardHeight = 70;
  const spacing = 20;

  // Card 1 - Total Orders
  doc.roundedRect(50, summaryY, cardWidth, cardHeight, 5)
     .fillAndStroke('#E8F4F8', '#4A90E2');
  doc.fillColor('#4A90E2')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Total Orders', 60, summaryY + 15);
  doc.fillColor('black')
     .fontSize(20)
     .text(totalOrders.toString(), 60, summaryY + 35);

  // Card 2 - Total Discount
  doc.roundedRect(50 + cardWidth + spacing, summaryY, cardWidth, cardHeight, 5)
     .fillAndStroke('#FFF4E6', '#FF9800');
  doc.fillColor('#FF9800')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Total Discount', 60 + cardWidth + spacing, summaryY + 15);
  doc.fillColor('black')
     .fontSize(16)
     .text(`Rs.${totalDiscount.toFixed(2)}`, 60 + cardWidth + spacing, summaryY + 35);

  // Card 3 - Total Earnings
  doc.roundedRect(50 + (cardWidth + spacing) * 2, summaryY, cardWidth, cardHeight, 5)
     .fillAndStroke('#E8F5E9', '#4CAF50');
  doc.fillColor('#4CAF50')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Total Earnings', 60 + (cardWidth + spacing) * 2, summaryY + 15);
  doc.fillColor('black')
     .fontSize(16)
     .text(`Rs.${totalEarnings.toFixed(2)}`, 60 + (cardWidth + spacing) * 2, summaryY + 35);

  doc.moveDown(6);

  // Table Header
  const tableTop = summaryY + cardHeight + 40;
  let currentY = tableTop;

  // Draw table header background
  doc.rect(50, currentY, doc.page.width - 100, 30)
     .fill('#F5F5F5');

  const headers = [
    { text: 'Date & Time', x: 55, width: 85 },
    { text: 'Course', x: 145, width: 110 },
    { text: 'Price', x: 260, width: 45 },
    { text: 'Coupon', x: 310, width: 50 },
    { text: 'Discount', x: 365, width: 50 },
    { text: 'Final', x: 420, width: 45 },
    { text: 'Earnings', x: 470, width: 55 }
  ];

  doc.fillColor('black')
     .fontSize(9)
     .font('Helvetica-Bold');

  headers.forEach(header => {
    doc.text(header.text, header.x, currentY + 10, { 
      width: header.width,
      align: 'left'
    });
  });

  currentY += 30;
  doc.font('Helvetica').fontSize(8);

  // Draw table rows
  data.forEach((item, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.rect(50, currentY, doc.page.width - 100, 35)
         .fill('#FAFAFA');
    }

    // Check for page break
    if (currentY > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
      
      // Redraw header on new page
      doc.rect(50, currentY, doc.page.width - 100, 30)
         .fill('#F5F5F5');
      
      doc.fillColor('black')
         .fontSize(9)
         .font('Helvetica-Bold');
      
      headers.forEach(header => {
        doc.text(header.text, header.x, currentY + 10, { 
          width: header.width,
          align: 'left'
        });
      });
      
      currentY += 30;
      doc.font('Helvetica').fontSize(8);
    }

    doc.fillColor('black');

    // Date (already formatted from DB)
    doc.text(item.createdAt, 55, currentY + 8, { width: 80 });

    // Course Name (truncate if too long)
    const courseName = item.courseName.length > 20 
      ? item.courseName.substring(0, 20) + '...' 
      : item.courseName;
    doc.text(courseName, 145, currentY + 8, { width: 105 });

    // Price
    doc.text(`Rs.${item.courseOriginalPrice.toFixed(0)}`, 260, currentY + 8);
    
    // Coupon
    const coupon = item.couponCode === 'N/A' ? '-' : item.couponCode;
    doc.fillColor('#FF9800')
       .fontSize(7)
       .text(coupon, 310, currentY + 8, { width: 45 });
    
    // Discount
    doc.fillColor('black')
       .fontSize(8)
       .text(`Rs.${item.courseDiscountAmount.toFixed(2)}`, 365, currentY + 8);
    
    // Final Price
    doc.text(`Rs.${item.finalCoursePrice.toFixed(2)}`, 420, currentY + 8);
    
    // Earnings in green
    doc.fillColor('#4CAF50')
       .font('Helvetica-Bold')
       .text(`Rs.${item.instructorEarning.toFixed(2)}`, 470, currentY + 8);

    currentY += 35;
  });

  // Footer Summary
  currentY += 20;
  doc.rect(50, currentY, doc.page.width - 100, 40)
     .fill('#E8F5E9');

  doc.fillColor('#4CAF50')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Total Instructor Earnings:', 60, currentY + 12);

  doc.fontSize(18)
     .text(`Rs.${totalEarnings.toFixed(2)}`, doc.page.width - 200, currentY + 10);

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .fillColor('#777777')
       .text(
         `Page ${i + 1} of ${pageCount} | ULearn Revenue Report`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );
  }

  doc.end();
  stream.pipe(res);
}