import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

export interface CourseData {
  courseName: string;
  courseOriginalPrice: number;
  courseOfferPrice: number;
  couponCode: string;
  couponDiscountAmount: number;
  couponDiscount: number;
  finalCoursePrice: number;
}

export interface ReportData {
  orderId: string;
  orderDate: string;
  instructorEarning: number;
  totalOrderAmount: number;
  courses: CourseData[];
}

export async function generateExcelReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "orderInfo", key: "orderInfo", width: 40 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Original Price", key: "courseOriginalPrice", width: 15 },
    { header: "Offer Price", key: "courseOfferPrice", width: 15 },
    { header: "Coupon Used", key: "couponCode", width: 15 },
    { header: "Discount Amount", key: "couponDiscountAmount", width: 15 },
    { header: "Final Price", key: "finalCoursePrice", width: 15 },
    { header: "Instructor Earnings", key: "instructorEarning", width: 20 },
  ];

  let totalInstructorEarnings = 0;
  let totalOrderAmount = 0;

  data.forEach((order) => {
    order.courses.forEach((course, courseIndex) => {
      const courseInstructorEarning = course.finalCoursePrice * 0.9;
      sheet.addRow({
        orderInfo: courseIndex === 0 ? `Order ID: ${order.orderId}, Date: ${order.orderDate}, Total: Rs.${order.totalOrderAmount.toFixed(2)}` : "",
        courseName: course.courseName,
        courseOriginalPrice: course.courseOriginalPrice,
        courseOfferPrice: course.courseOfferPrice,
        couponCode: course.couponCode,
        couponDiscountAmount: course.couponDiscountAmount,
        finalCoursePrice: course.finalCoursePrice,
        instructorEarning: courseInstructorEarning,
      });

      totalInstructorEarnings += courseInstructorEarning;
      if (courseIndex === 0) {
        totalOrderAmount += order.totalOrderAmount;
      }
    });
  });

  sheet.addRow({}); // Empty row
  sheet.addRow({
    courseName: "Total Instructor Earnings:",
    instructorEarning: totalInstructorEarnings,
    totalOrderAmount: totalOrderAmount,
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
    bufferPages: true,
  });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=RevenueReport_${Date.now()}.pdf`,
  );

  doc.pipe(stream);

  // Header Section with Background
  doc.rect(0, 0, doc.page.width, 80).fill('#4A90E2');

  // Title
  doc.fillColor('white')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('ULearn', 50, 20, { align: 'left' });

  doc.fontSize(12)
    .font('Helvetica')
    .text('Revenue Report', 50, 45);

  // Date Range
  const reportDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  doc.fontSize(8)
    .text(`Generated on: ${reportDate} IST`, 50, 65);

  // Move below header
  doc.fillColor('black').moveDown(1);

  let totalEarnings = 0;
  let totalDiscount = 0;
  let totalOrders = data.length;
  let totalOrderAmount = 0;

  // Calculate totals
  data.forEach(order => {
    order.courses.forEach(course => {
      totalEarnings += course.finalCoursePrice * 0.9;
      totalDiscount += course.couponDiscountAmount;
    });
    totalOrderAmount += order.totalOrderAmount;
  });

  // Summary Cards
  const summaryY = 100;
  const cardWidth = 120;
  const cardHeight = 60;
  const spacing = 15;

  // Card 1 - Total Orders
  doc.roundedRect(50, summaryY, cardWidth, cardHeight, 5)
    .fillAndStroke('#E8F4F8', '#4A90E2');
  doc.fillColor('#4A90E2')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Total Orders', 55, summaryY + 10);
  doc.fillColor('black')
    .fontSize(16)
    .text(totalOrders.toString(), 55, summaryY + 30);

  // Card 2 - Total Discount
  doc.roundedRect(50 + cardWidth + spacing, summaryY, cardWidth, cardHeight, 5)
    .fillAndStroke('#FFF4E6', '#FF9800');
  doc.fillColor('#FF9800')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Total Discount', 55 + cardWidth + spacing, summaryY + 10);
  doc.fillColor('black')
    .fontSize(14)
    .text(`Rs.${totalDiscount.toFixed(2)}`, 55 + cardWidth + spacing, summaryY + 30);

  // Card 3 - Total Earnings
  doc.roundedRect(50 + (cardWidth + spacing) * 2, summaryY, cardWidth, cardHeight, 5)
    .fillAndStroke('#E8F5E9', '#4CAF50');
  doc.fillColor('#4CAF50')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Total Earnings', 55 + (cardWidth + spacing) * 2, summaryY + 10);
  doc.fillColor('black')
    .fontSize(14)
    .text(`Rs.${totalEarnings.toFixed(2)}`, 55 + (cardWidth + spacing) * 2, summaryY + 30);

  // Card 4 - Total Order Amount
  doc.roundedRect(50 + (cardWidth + spacing) * 3, summaryY, cardWidth, cardHeight, 5)
    .fillAndStroke('#F3E5F5', '#9C27B0');
  doc.fillColor('#9C27B0')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Total Order', 55 + (cardWidth + spacing) * 3, summaryY + 10);
  doc.fillColor('black')
    .fontSize(14)
    .text(`Rs.${totalOrderAmount.toFixed(2)}`, 55 + (cardWidth + spacing) * 3, summaryY + 30);

  // Table Header
  const tableTop = summaryY + cardHeight + 20;
  let currentY = tableTop;

  // Draw table header background
  doc.rect(50, currentY, doc.page.width - 100, 25)
    .fill('#F5F5F5');

  const headers = [
    { text: 'orderInfo', x: 50, width: 100 },
    { text: 'Course', x: 150, width: 130 },
    { text: 'Original', x: 280, width: 50 },
    { text: 'Offer', x: 330, width: 50 },
    { text: 'Coupon', x: 380, width: 50 },
    { text: 'Discount', x: 430, width: 50 },
    { text: 'Final', x: 480, width: 50 },
    { text: 'Earnings', x: 530, width: 60 },
  ];

  doc.fillColor('black')
    .fontSize(9)
    .font('Helvetica-Bold');

  headers.forEach(header => {
    doc.text(header.text, header.x, currentY + 7, {
      width: header.width,
      align: 'left',
    });
  });

  currentY += 25;
  doc.font('Helvetica').fontSize(8);

  // Draw table rows
  data.forEach((order, orderIndex) => {
    order.courses.forEach((course, courseIndex) => {
      // Alternate row colors
      if ((orderIndex + courseIndex) % 2 === 0) {
        doc.rect(50, currentY, doc.page.width - 100, 25)
          .fill('#FAFAFA');
      }

      // Check for page break
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;

        // Redraw header on new page
        doc.rect(50, currentY, doc.page.width - 100, 25)
          .fill('#F5F5F5');

        doc.fillColor('black')
          .fontSize(9)
          .font('Helvetica-Bold');

        headers.forEach(header => {
          doc.text(header.text, header.x, currentY + 7, {
            width: header.width,
            align: 'left',
          });
        });

        currentY += 25;
        doc.font('Helvetica').fontSize(8);
      }

      doc.fillColor('black');

      // orderInfo (only for first course in order)
      const orderInfoText = courseIndex === 0 ? `Order ID: ${order.orderId}, Date: ${order.orderDate}, Total: Rs.${order.totalOrderAmount.toFixed(2)}` : '';
      doc.text(orderInfoText, 50, currentY + 5, { width: 100 });

      // Course Name (wrap text if necessary)
      doc.text(course.courseName, 150, currentY + 5, {
        width: 130,
        height: 25,
        lineBreak: true,
      });

      // Original Price
      doc.text(`Rs.${course.courseOriginalPrice.toFixed(0)}`, 280, currentY + 5, { width: 50 });

      // Offer Price
      doc.text(`Rs.${course.courseOfferPrice.toFixed(0)}`, 330, currentY + 5, { width: 50 });

      // Coupon
      const coupon = course.couponCode === 'N/A' ? '-' : course.couponCode;
      doc.fillColor('#FF9800')
        .fontSize(7)
        .text(coupon, 380, currentY + 5, { width: 50 });

      // Discount
      doc.fillColor('black')
        .fontSize(8)
        .text(`Rs.${course.couponDiscountAmount.toFixed(2)}`, 430, currentY + 5, { width: 50 });

      // Final Price
      doc.text(`Rs.${course.finalCoursePrice.toFixed(2)}`, 480, currentY + 5, { width: 50 });

      // Earnings in green
      doc.fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text(`Rs.${(course.finalCoursePrice * 0.9).toFixed(2)}`, 530, currentY + 5, { width: 60 });

      currentY += 25;
    });
  });

  // Footer Summary
  currentY += 15;
  if (currentY + 80 < doc.page.height) {
    doc.rect(50, currentY, doc.page.width - 100, 30)
      .fill('#E8F5E9');

    doc.fillColor('#4CAF50')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Instructor Earnings:', 60, currentY + 8);

    doc.fontSize(12)
      .text(`Rs.${totalEarnings.toFixed(2)}`, doc.page.width - 120, currentY + 8);

    currentY += 30;
    doc.rect(50, currentY, doc.page.width - 100, 30)
      .fill('#F3E5F5');

    doc.fillColor('#9C27B0')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Order Amount:', 60, currentY + 8);

    doc.fontSize(12)
      .text(`Rs.${totalOrderAmount.toFixed(2)}`, doc.page.width - 120, currentY + 8);
  }

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(7)
      .fillColor('#777777')
      .text(
        `Page ${i + 1} of ${pageCount} | ULearn Revenue Report`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
  }

  doc.end();
  stream.pipe(res);
}