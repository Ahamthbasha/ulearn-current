import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

export interface CourseData {
  courseName: string;
  standAloneCourseTotalPrice: number;
}

export interface LearningPathData {
  learningPathName: string;
  learningPathTotalPrice: number;
}

export interface ReportData {
  orderId: string;
  date: string; 
  instructorRevenue: number;
  totalOrderAmount: number;
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number;
  standaloneCourse: CourseData[];
  learningPath: LearningPathData[];
}

export async function generateExcelReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "Order Info", key: "orderInfo", width: 40 },
    { header: "Item Name", key: "itemName", width: 30 },
    { header: "Type", key: "type", width: 15 },
    { header: "Final Price", key: "finalPrice", width: 15 },
    { header: "Coupon", key: "coupon", width: 20 },
    { header: "Instructor Revenue", key: "instructorRevenue", width: 20 },
  ];

  let totalInstructorRevenue = 0;
  let totalOrderAmount = 0;

  data.forEach((order) => {
    let isFirstRow = true;

    // Add courses
    order.standaloneCourse.forEach((course) => {
      const courseInstructorRevenue = course.standAloneCourseTotalPrice * 0.9;
      sheet.addRow({
        orderInfo: isFirstRow ? `Order ID: ${order.orderId}, Date: ${order.date}, Total: ${order.totalOrderAmount.toFixed(2)}, Coupon: ${order.couponCode} (${order.couponDiscount}%), Discount: ${order.couponDiscountAmount.toFixed(2)}` : "",
        itemName: course.courseName,
        type: "Course",
        finalPrice: course.standAloneCourseTotalPrice,
        coupon: isFirstRow ? `${order.couponCode} (${order.couponDiscount}%) ${order.couponDiscountAmount.toFixed(2)}` : "",
        instructorRevenue: courseInstructorRevenue,
      });

      totalInstructorRevenue += courseInstructorRevenue;
      if (isFirstRow) {
        totalOrderAmount += order.totalOrderAmount;
      }
      isFirstRow = false;
    });

    // Add learning paths
    order.learningPath.forEach((lp) => {
      const lpInstructorRevenue = lp.learningPathTotalPrice * 0.9;
      sheet.addRow({
        orderInfo: isFirstRow ? `Order ID: ${order.orderId}, Date: ${order.date}, Total: ${order.totalOrderAmount.toFixed(2)}, Coupon: ${order.couponCode} (${order.couponDiscount}%), Discount: ${order.couponDiscountAmount.toFixed(2)}` : "",
        itemName: lp.learningPathName,
        type: "Learning Path",
        finalPrice: lp.learningPathTotalPrice,
        coupon: isFirstRow ? `${order.couponCode} (${order.couponDiscount}%) ${order.couponDiscountAmount.toFixed(2)}` : "",
        instructorRevenue: lpInstructorRevenue,
      });

      totalInstructorRevenue += lpInstructorRevenue;
      if (isFirstRow) {
        totalOrderAmount += order.totalOrderAmount;
      }
      isFirstRow = false;
    });
  });

  sheet.addRow({}); // Empty row
  sheet.addRow({
    itemName: "Total Instructor Revenue:",
    instructorRevenue: totalInstructorRevenue,
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
    margin: 40,
    size: "A4",
    bufferPages: true,
  });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=RevenueReport_${Date.now()}.pdf`,
  );

  doc.pipe(stream);

  // Page dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  // Header Section with Background
  doc.rect(0, 0, pageWidth, 100).fill("#4A90E2");

  // Title
  doc
    .fillColor("white")
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("ULearn", margin, 25, { align: "left" });

  doc
    .fontSize(14)
    .font("Helvetica")
    .text("Instructor Revenue Report", margin, 55, { align: "left" });

  // Date Range
  const reportDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  doc.fontSize(9).text(`Generated on: ${reportDate} IST`, margin, 80, { align: "left" });

  // Move below header
  doc.fillColor("black");

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalOrders = data.length;
  let totalOrderAmount = 0;
  let totalCourseSales = 0;
  let totalLearningPathSales = 0;

  // Calculate totals
  data.forEach((order) => {
    order.standaloneCourse.forEach((course) => {
      totalRevenue += course.standAloneCourseTotalPrice * 0.9;
      totalCourseSales += 1;
    });
    order.learningPath.forEach((lp) => {
      totalRevenue += lp.learningPathTotalPrice * 0.9;
      totalLearningPathSales += 1;
    });
    totalDiscount += order.couponDiscountAmount;
    totalOrderAmount += order.totalOrderAmount;
  });

  // Summary Cards - Responsive Layout
  const summaryY = 120;
  const cardSpacing = 10;
  const cardsPerRow = 3;
  const cardWidth = (contentWidth - (cardSpacing * (cardsPerRow - 1))) / cardsPerRow;
  const cardHeight = 70;

  const summaryCards = [
    { label: "Total Orders", value: totalOrders.toString(), color: "#4A90E2", bg: "#E8F4F8" },
    { label: "Course Sales", value: totalCourseSales.toString(), color: "#FF9800", bg: "#FFF4E6" },
    { label: "LP Sales", value: totalLearningPathSales.toString(), color: "#4CAF50", bg: "#E8F5E9" },
    { label: "Total Discount", value: totalDiscount.toFixed(2), color: "#9C27B0", bg: "#F3E5F5" },
    { label: "Order Amount", value: totalOrderAmount.toFixed(2), color: "#FF5722", bg: "#FBE9E7" },
    { label: "Your Revenue", value: totalRevenue.toFixed(2), color: "#4CAF50", bg: "#E8F5E9" },
  ];

  summaryCards.forEach((card, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    const x = margin + (col * (cardWidth + cardSpacing));
    const y = summaryY + (row * (cardHeight + cardSpacing));

    // Card background
    doc
      .roundedRect(x, y, cardWidth, cardHeight, 5)
      .fillAndStroke(card.bg, card.color);

    // Card label
    doc
      .fillColor(card.color)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(card.label, x + 10, y + 10, {
        width: cardWidth - 20,
        align: "center",
      });

    // Card value
    doc
      .fillColor("black")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(card.value, x + 10, y + 35, {
        width: cardWidth - 20,
        align: "center",
        lineBreak: false,
      });
  });

  // Table starts after cards
  const tableTop = summaryY + (Math.ceil(summaryCards.length / cardsPerRow) * (cardHeight + cardSpacing)) + 20;
  let currentY = tableTop;

  // Responsive column widths based on content width
  const colWidths = {
    orderId: contentWidth * 0.12,
    date: contentWidth * 0.10,
    item: contentWidth * 0.30,
    type: contentWidth * 0.12,
    price: contentWidth * 0.12,
    coupon: contentWidth * 0.12,
    revenue: contentWidth * 0.12,
  };

  const colPositions = {
    orderId: margin,
    date: margin + colWidths.orderId,
    item: margin + colWidths.orderId + colWidths.date,
    type: margin + colWidths.orderId + colWidths.date + colWidths.item,
    price: margin + colWidths.orderId + colWidths.date + colWidths.item + colWidths.type,
    coupon: margin + colWidths.orderId + colWidths.date + colWidths.item + colWidths.type + colWidths.price,
    revenue: margin + colWidths.orderId + colWidths.date + colWidths.item + colWidths.type + colWidths.price + colWidths.coupon,
  };

  // Function to draw table header
  const drawTableHeader = (y: number) => {
    doc.rect(margin, y, contentWidth, 30).fill("#F5F5F5");

    doc.fillColor("black").fontSize(10).font("Helvetica-Bold");

    const headers = [
      { text: "Order ID", x: colPositions.orderId, width: colWidths.orderId },
      { text: "Date", x: colPositions.date, width: colWidths.date },
      { text: "Item", x: colPositions.item, width: colWidths.item },
      { text: "Type", x: colPositions.type, width: colWidths.type },
      { text: "Price", x: colPositions.price, width: colWidths.price },
      { text: "Coupon", x: colPositions.coupon, width: colWidths.coupon },
      { text: "Revenue", x: colPositions.revenue, width: colWidths.revenue },
    ];

    headers.forEach((header) => {
      doc.text(header.text, header.x + 5, y + 8, {
        width: header.width - 10,
        align: "center",
      });
    });

    return y + 30;
  };

  currentY = drawTableHeader(currentY);
  doc.font("Helvetica").fontSize(9);

  // Function to check and handle page break
  const checkPageBreak = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 80) {
      doc.addPage();
      currentY = 50;
      currentY = drawTableHeader(currentY);
      doc.font("Helvetica").fontSize(9);
    }
  };

  // Draw table rows
  data.forEach((order, orderIndex) => {
    const allItems = [
      ...order.standaloneCourse.map(course => ({
        type: 'course' as const,
        name: course.courseName,
        price: course.standAloneCourseTotalPrice,
        revenue: course.standAloneCourseTotalPrice * 0.9,
      })),
      ...order.learningPath.map(lp => ({
        type: 'lp' as const,
        name: lp.learningPathName,
        price: lp.learningPathTotalPrice,
        revenue: lp.learningPathTotalPrice * 0.9,
      })),
    ];

    allItems.forEach((item, itemIndex) => {
      const isFirstItem = itemIndex === 0;
      const rowHeight = 30;

      checkPageBreak(rowHeight);

      // Alternate row colors
      if (orderIndex % 2 === 0) {
        doc.rect(margin, currentY, contentWidth, rowHeight).fill("#FAFAFA");
      } else {
        doc.rect(margin, currentY, contentWidth, rowHeight).fill("#FFFFFF");
      }

      doc.fillColor("black").fontSize(9).font("Helvetica");

      // Order ID (only for first item, last 7 chars)
      if (isFirstItem) {
        const shortOrderId = order.orderId.toString().slice(-7);
        doc.text(shortOrderId, colPositions.orderId + 5, currentY + 8, {
          width: colWidths.orderId - 10,
          align: "center",
          lineBreak: false,
        });
      }

      // Date (only for first item)
      if (isFirstItem) {
        doc.text(order.date, colPositions.date + 5, currentY + 8, {
          width: colWidths.date - 10,
          align: "center",
          lineBreak: false,
        });
      }

      // Item Name
      doc.text(item.name, colPositions.item + 5, currentY + 8, {
        width: colWidths.item - 10,
        ellipsis: true,
        align: "center",
        lineBreak: false,
      });

      // Type
      doc.text(item.type === 'course' ? 'Course' : 'LP', colPositions.type + 5, currentY + 8, {
        width: colWidths.type - 10,
        align: "center",
        lineBreak: false,
      });

      // Price
      doc.text(item.price.toFixed(2), colPositions.price + 5, currentY + 8, {
        width: colWidths.price - 10,
        align: "center",
        lineBreak: false,
      });

      // Coupon (only for first item)
      if (isFirstItem) {
        const couponText = order.couponCode !== 'N/A' 
          ? `${order.couponCode}\n${order.couponDiscount}% (-${order.couponDiscountAmount.toFixed(2)})`
          : 'N/A';
        doc
          .fillColor("#FF9800")
          .fontSize(7)
          .text(couponText, colPositions.coupon + 5, currentY + 5, {
            width: colWidths.coupon - 10,
            align: "center",
          });
      }

      // Revenue
      doc
        .fillColor("#4CAF50")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(item.revenue.toFixed(2), colPositions.revenue + 5, currentY + 8, {
          width: colWidths.revenue - 10,
          align: "center",
          lineBreak: false,
        });

      currentY += rowHeight;
    });

    // Add small separator between orders
    currentY += 5;
  });

  // Footer Summary
  currentY += 15;
  checkPageBreak(80);

  // Total Revenue Box
  doc.rect(margin, currentY, contentWidth, 35).fill("#E8F5E9");
  doc
    .fillColor("#4CAF50")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Total Instructor Revenue:", margin + 10, currentY + 10, {
      width: contentWidth * 0.5,
      align: "left",
    });
  doc
    .fontSize(14)
    .text(totalRevenue.toFixed(2), margin + contentWidth * 0.55, currentY + 10, {
      width: contentWidth * 0.45,
      align: "right",
    });

  currentY += 40;

  // Total Order Amount Box
  doc.rect(margin, currentY, contentWidth, 35).fill("#F3E5F5");
  doc
    .fillColor("#9C27B0")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Total Order Amount:", margin + 10, currentY + 10, {
      width: contentWidth * 0.5,
      align: "left",
    });
  doc
    .fontSize(14)
    .text(totalOrderAmount.toFixed(2), margin + contentWidth * 0.55, currentY + 10, {
      width: contentWidth * 0.45,
      align: "right",
    });

  // Footer on all pages
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Footer line
    doc
      .moveTo(margin, pageHeight - 35)
      .lineTo(pageWidth - margin, pageHeight - 35)
      .stroke("#E0E0E0");
    
    doc
      .fontSize(8)
      .fillColor("#777777")
      .text(
        `Page ${i + 1} of ${pageCount}`,
        margin,
        pageHeight - 25,
        { align: "left" }
      );
    
    doc.text(
      "ULearn Revenue Report",
      pageWidth / 2,
      pageHeight - 25,
      { align: "center" }
    );
    
    doc.text(
      new Date().getFullYear().toString(),
      pageWidth - margin,
      pageHeight - 25,
      { align: "right" }
    );
  }

  doc.end();
  stream.pipe(res);
}