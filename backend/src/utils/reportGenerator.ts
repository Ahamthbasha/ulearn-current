import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

export interface ReportData {
  orderId: string;
  date: string;
  instructorRevenue: number;
  totalOrderAmount: number;
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number;
  courses: Array<{
    courseName: string;
    price: number;
  }>;
}

export async function generateExcelReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "Order Info", key: "orderInfo", width: 50 },
    { header: "Course Name", key: "courseName", width: 35 },
    { header: "Course Price", key: "coursePrice", width: 15 },
    { header: "Coupon", key: "coupon", width: 20 },
    { header: "Instructor Revenue", key: "instructorRevenue", width: 20 },
  ];

  let totalInstructorRevenue = 0;
  let totalOrderAmount = 0;

  data.forEach((order) => {
    let isFirstRow = true;

    order.courses.forEach((course) => {
      const courseInstructorRevenue = course.price * 0.9;

      sheet.addRow({
        orderInfo: isFirstRow
          ? `Order ID: ${order.orderId}\nDate: ${order.date}\nTotal: ${order.totalOrderAmount.toFixed(2)}\nCoupon: ${order.couponCode} (${order.couponDiscount}%)`
          : "",
        courseName: course.courseName,
        coursePrice: course.price,
        coupon: isFirstRow
          ? `${order.couponCode !== "N/A" ? `${order.couponCode} (${order.couponDiscount}%)` : "N/A"}\n-${(order.couponDiscountAmount || 0).toFixed(2)}`
          : "",
        instructorRevenue: courseInstructorRevenue,
      });

      totalInstructorRevenue += courseInstructorRevenue;
      if (isFirstRow) totalOrderAmount += order.totalOrderAmount;
      isFirstRow = false;
    });
  });

  // Summary Row
  sheet.addRow({});
  sheet.addRow({
    orderInfo: "TOTAL",
    coursePrice: totalOrderAmount.toFixed(2),
    instructorRevenue: totalInstructorRevenue.toFixed(2),
  });

  // Style summary
  const lastRow = sheet.lastRow;
  if (lastRow) {
    lastRow.font = { bold: true };
    lastRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename=RevenueReport.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}

export async function generatePdfReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=RevenueReport_${Date.now()}.pdf`);

  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // === HEADER ===
  doc.rect(0, 0, pageWidth, 100).fill("#4A90E2");
  doc.fillColor("white").fontSize(24).font("Helvetica-Bold").text("ULearn", margin, 25);
  doc.fontSize(14).text("Instructor Revenue Report", margin, 55);

  const reportDate = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: "Asia/Kolkata",
  });
  doc.fontSize(9).text(`Generated: ${reportDate} IST`, margin, 80);

  // === SUMMARY STATS ===
  const totalRevenue = data.reduce((sum, o) => sum + o.instructorRevenue, 0);
  const totalOrders = data.length;
  const totalOrderAmount = data.reduce((sum, o) => sum + o.totalOrderAmount, 0);
  const totalCourses = data.reduce((sum, o) => sum + o.courses.length, 0);
  const totalDiscount = data.reduce((sum, o) => sum + (o.couponDiscountAmount || 0), 0);

  const summaryY = 120;
  const cardWidth = (contentWidth - 20) / 3;
  const cardHeight = 70;

  const cards = [
    { label: "Total Orders", value: totalOrders.toString(), color: "#4A90E2", bg: "#E8F4F8" },
    { label: "Courses Sold", value: totalCourses.toString(), color: "#FF9800", bg: "#FFF4E6" },
    { label: "Total Discount", value: totalDiscount.toFixed(2), color: "#9C27B0", bg: "#F3E5F5" },
    { label: "Order Amount", value: totalOrderAmount.toFixed(2), color: "#FF5722", bg: "#FBE9E7" },
    { label: "Your Revenue", value: totalRevenue.toFixed(2), color: "#4CAF50", bg: "#E8F5E9" },
  ];

  cards.forEach((card, i) => {
    const x = margin + (i % 3) * (cardWidth + 10);
    const y = summaryY + Math.floor(i / 3) * (cardHeight + 10);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke(card.bg, card.color);
    doc.fillColor(card.color).fontSize(10).font("Helvetica-Bold").text(card.label, x + 10, y + 12, { width: cardWidth - 20, align: "center" });
    doc.fillColor("black").fontSize(18).font("Helvetica-Bold").text(card.value, x + 10, y + 35, { width: cardWidth - 20, align: "center" });
  });

  // === TABLE SETUP ===
  const tableTop = summaryY + (Math.ceil(cards.length / 3) * (cardHeight + 10)) + 30;
  let currentY = tableTop;

  const colWidths = {
    orderId: contentWidth * 0.15,
    date: contentWidth * 0.12,
    course: contentWidth * 0.33,
    price: contentWidth * 0.12,
    coupon: contentWidth * 0.13,
    revenue: contentWidth * 0.13,
  };

  const colX = {
    orderId: margin,
    date: margin + colWidths.orderId,
    course: margin + colWidths.orderId + colWidths.date,
    price: margin + colWidths.orderId + colWidths.date + colWidths.course,
    coupon: margin + colWidths.orderId + colWidths.date + colWidths.course + colWidths.price,
    revenue: margin + colWidths.orderId + colWidths.date + colWidths.course + colWidths.price + colWidths.coupon,
  };

  const drawHeader = (y: number) => {
    doc.rect(margin, y, contentWidth, 30).fill("#F5F5F5");
    doc.fillColor("black").fontSize(10).font("Helvetica-Bold");
    const headers = ["Order ID", "Date", "Course", "Price", "Coupon", "Revenue"];
    headers.forEach((h, i) => {
      const key = Object.keys(colX)[i] as keyof typeof colX;
      doc.text(h, colX[key] + 5, y + 10, { width: colWidths[key] - 10, align: "center" });
    });
    return y + 30;
  };

  currentY = drawHeader(currentY);

  const checkPageBreak = (space: number) => {
    if (currentY + space > doc.page.height - 100) {
      doc.addPage();
      currentY = 60;
      currentY = drawHeader(currentY);
    }
  };

  // === DRAW TABLE ROWS ===
  data.forEach((order, orderIdx) => {
    const orderIdStr = String(order.orderId).slice(-8);

    order.courses.forEach((course, courseIdx) => {
      const isFirst = courseIdx === 0;
      const rowHeight = 32;
      checkPageBreak(rowHeight);

      // Row background
      const bgColor = orderIdx % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
      doc.rect(margin, currentY, contentWidth, rowHeight).fill(bgColor);

      // Reset font settings for each row
      doc.fillColor("black").fontSize(9).font("Helvetica");

      // Order ID & Date (only on first row)
      if (isFirst) {
        doc.text(orderIdStr, colX.orderId + 5, currentY + 10, { 
          width: colWidths.orderId - 10, 
          align: "left",
          lineBreak: false
        });
        doc.text(order.date, colX.date + 3, currentY + 10, { 
          width: colWidths.date - 6, 
          align: "left",
          lineBreak: false
        });
      }

      // Course Name (ALWAYS display for every course)
      doc.text(course.courseName, colX.course + 5, currentY + 10, {
        width: colWidths.course - 10,
        lineBreak: false,
        ellipsis: true,
      });

      // Price
      doc.text(course.price.toFixed(2), colX.price + 5, currentY + 10, {
        width: colWidths.price - 10,
        align: "right",
        lineBreak: false
      });

      // Coupon (only on first row)
      if (isFirst) {
        if (order.couponCode !== "N/A") {
          doc.fillColor("#FF9800").fontSize(7).text(
            `${order.couponCode} (${order.couponDiscount}%)`,
            colX.coupon + 5,
            currentY + 6,
            { width: colWidths.coupon - 10, align: "center", lineBreak: false }
          );
          doc.text(
            `-${(order.couponDiscountAmount || 0).toFixed(2)}`,
            colX.coupon + 5,
            currentY + 16,
            { width: colWidths.coupon - 10, align: "center", lineBreak: false }
          );
        } else {
          doc.fillColor("black").fontSize(8).text("N/A", colX.coupon + 5, currentY + 10, {
            width: colWidths.coupon - 10,
            align: "center",
            lineBreak: false
          });
        }
      }

      // Instructor Revenue (per course)
      const rev = (course.price * 0.9).toFixed(2);
      doc.fillColor("#4CAF50").font("Helvetica-Bold").fontSize(9).text(
        rev,
        colX.revenue + 5,
        currentY + 10,
        { width: colWidths.revenue - 10, align: "right", lineBreak: false }
      );

      currentY += rowHeight;
    });

    currentY += 6; // Gap between orders
  });

  // === TOTAL REVENUE FOOTER ===
  currentY += 10;
  checkPageBreak(50);
  doc.rect(margin, currentY, contentWidth, 40).fill("#E8F5E9");
  doc.fillColor("#4CAF50").fontSize(12).font("Helvetica-Bold").text(
    "Total Instructor Revenue:",
    margin + 15,
    currentY + 12
  );
  doc.fontSize(16).text(
    totalRevenue.toFixed(2),
    margin + contentWidth * 0.55,
    currentY + 10,
    { width: contentWidth * 0.4, align: "right" }
  );

  // === FINALIZE & ADD PAGE NUMBERS ===
  doc.end();

  // Wait for PDF to finish buffering
  doc.on("end", () => {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - 50;
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke("#E0E0E0");
      doc.fontSize(8).fillColor("#777")
        .text(`Page ${i + 1} of ${pageCount}`, margin, y + 10)
        .text("ULearn © " + new Date().getFullYear(), pageWidth / 2, y + 10, { align: "center" });
    }
    stream.pipe(res);
  });
}