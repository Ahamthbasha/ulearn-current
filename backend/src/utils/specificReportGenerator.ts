import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

interface ReportData {
  orderId: string;
  purchaseDate: string;
  courseName: string;
  originalCoursePrice: number;
  courseOfferPrice: number;
  couponUsed: boolean;
  couponDeductionAmount: number;
  finalCoursePrice: number;
  instructorRevenue: number;
  totalEnrollments: number;
}

export async function generateExcelReport(
  data: ReportData[],
  res: Response,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Course Name", key: "courseName", width: 35 },
    { header: "Course Price", key: "coursePrice", width: 15 },
    { header: "Coupon Used", key: "couponUsed", width: 15 },
    { header: "Discount Amount", key: "couponDeductionAmount", width: 18 },
    { header: "Instructor Revenue", key: "instructorRevenue", width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4B5EAA" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  let totalInstructorRevenue = 0;
  const totalEnrollments = data.length > 0 ? data[0].totalEnrollments : 0;

  data.forEach((item) => {
    const coursePrice = item.courseOfferPrice > 0 ? `Rs ${item.courseOfferPrice.toFixed(2)}` : `Rs ${item.originalCoursePrice.toFixed(2)}`;

    sheet.addRow({
      orderId: item.orderId,
      courseName: item.courseName,
      coursePrice: coursePrice,
      couponUsed: item.couponUsed ? "Yes" : "No",
      couponDeductionAmount: `Rs ${item.couponDeductionAmount.toFixed(2)}`,
      instructorRevenue: `Rs ${item.instructorRevenue.toFixed(2)}`,
    }).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      if (["orderId", "courseName"].includes(cell.col)) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });

    totalInstructorRevenue += item.instructorRevenue;
  });

  sheet.addRow({});

  const totalRevenueRow = sheet.addRow({
    orderId: "",
    courseName: "",
    coursePrice: "",
    couponUsed: "",
    couponDeductionAmount: "Total Instructor Revenue:",
    instructorRevenue: `Rs ${totalInstructorRevenue.toFixed(2)}`,
  });
  totalRevenueRow.font = { bold: true };
  totalRevenueRow.getCell("couponDeductionAmount").font = { bold: true, color: { argb: "FF000000" } };
  totalRevenueRow.getCell("instructorRevenue").font = { bold: true, color: { argb: "FF008000" } };
  totalRevenueRow.alignment = { vertical: "middle", horizontal: "right" };
  totalRevenueRow.height = 20;

  const totalEnrollmentsRow = sheet.addRow({
    orderId: "",
    courseName: "",
    coursePrice: "",
    couponUsed: "",
    couponDeductionAmount: "Total Enrollments:",
    instructorRevenue: totalEnrollments.toString(),
  });
  totalEnrollmentsRow.font = { bold: true };
  totalEnrollmentsRow.getCell("couponDeductionAmount").font = { bold: true, color: { argb: "FF000000" } };
  totalEnrollmentsRow.getCell("instructorRevenue").font = { bold: true, color: { argb: "FF008000" } };
  totalEnrollmentsRow.alignment = { vertical: "middle", horizontal: "right" };
  totalEnrollmentsRow.height = 20;

  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    if (rowNumber > 2 && rowNumber < data.length + 2) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowNumber % 2 === 0 ? "FFF9FAFB" : "FFFFFFFF" },
      };
    }
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=RevenueReport_${new Date().toISOString().split('T')[0]}.xlsx`,
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
    `attachment; filename=RevenueReport_${new Date().toISOString().split("T")[0]}.pdf`,
  );

  doc.pipe(stream);

  const pageWidth = doc.page.width - 80;
  const startX = 40;

  // Header section
  doc.fillColor("#1E40AF").fontSize(26).font("Helvetica-Bold").text("ULearn", { align: "center" });
  doc.fillColor("#6B7280").fontSize(15).font("Helvetica").text("Course Revenue Report", { align: "center" });
  doc.moveDown(0.5);

  // Current date and time (06:59 PM IST, October 14, 2025)
  const reportDate = "October 14, 2025";
  const reportTime = "06:59 PM";
  doc.fontSize(10).fillColor("#9CA3AF").text(`Generated on: ${reportDate} | ${reportTime}`, { align: "center" });
  doc.moveDown(1.2);

  doc.moveTo(startX, doc.y).lineTo(doc.page.width - startX, doc.y).strokeColor("#3B82F6").lineWidth(2).stroke();
  doc.moveDown(1.5);

  const headers = [
    "Order ID",
    "Date",
    "Course Name",
    "Course Price",
    "Coupon Used",
    "Final Price",
    "Revenue",
  ];

  // Adjusted column widths to match the image layout
  const colWidths = [70, 70, 120, 60, 60, 60, 60];
  const padding = 8;

  const truncateText = (text: string, maxWidth: number, fontSize: number): string => {
    doc.fontSize(fontSize).font("Helvetica");
    if (doc.widthOfString(text) <= maxWidth) return text;
    let truncated = text;
    while (doc.widthOfString(truncated + "...") > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  };

  const drawRow = (
    row: string[],
    yOffset: number,
    options: { isHeader?: boolean; isTotal?: boolean; isEven?: boolean } = {},
  ) => {
    const { isHeader = false, isTotal = false, isEven = false } = options;
    let x = startX;
    const rowHeight = isHeader ? 30 : isTotal ? 35 : 25;

    // Draw cell backgrounds
    if (isHeader) {
      doc.rect(startX, yOffset, pageWidth, rowHeight).fillAndStroke("#3B82F6", "#1E40AF");
    } else if (isTotal) {
      doc.rect(startX, yOffset, pageWidth, rowHeight).fillAndStroke("#ECFDF5", "#10B981");
    } else {
      const fillColor = isEven ? "#F9FAFB" : "#FFFFFF";
      doc.rect(startX, yOffset, pageWidth, rowHeight).fillAndStroke(fillColor, "#E5E7EB");
    }

    // Draw cell content
    row.forEach((text, i) => {
      const cellWidth = colWidths[i];
      const maxTextWidth = cellWidth - (padding * 2);

      // Set font styles
      if (isHeader) {
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF");
      } else if (isTotal) {
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#065F46");
      } else {
        doc.fontSize(9).font("Helvetica").fillColor("#374151");
      }

      let displayText = text;

      // Determine text alignment
      const textAlign = (i === 0 || i === 2) ? "left" : (i === 4) ? "center" : "right";

      // Truncate text for Order ID and Course Name in data rows
      if (!isHeader && !isTotal && (i === 0 || i === 2)) {
        displayText = truncateText(text, maxTextWidth, 9);
      }

      // Calculate text width after potential truncation
      const textWidth = doc.widthOfString(displayText);
      let textX = x + padding;

      if (textAlign === "right") {
        textX = x + cellWidth - padding - textWidth;
      } else if (textAlign === "center") {
        textX = x + (cellWidth - textWidth) / 2;
      }

      const textY = yOffset + (rowHeight / 2) - 5;

      doc.text(displayText, textX, textY, {
        lineBreak: false,
      });

      x += cellWidth;
    });

    return rowHeight;
  };

  // Draw table
  let y = doc.y;
  y += drawRow(headers, y, { isHeader: true });

  let totalInstructorRevenue = 0;
  let rowIndex = 0;

  data.forEach((item) => {
    if (y + 120 > doc.page.height - 100) {
      doc.addPage();
      y = 40;
      y += drawRow(headers, y, { isHeader: true });
      rowIndex = 0;
    }

    const row = [
      item.orderId.slice(-7),
      item.purchaseDate.split(" ")[0],
      item.courseName,
      `Rs ${item.courseOfferPrice.toFixed(2)}`,
      item.couponUsed ? "Yes" : "No",
      `Rs ${item.finalCoursePrice.toFixed(2)}`,
      `Rs ${item.instructorRevenue.toFixed(2)}`,
    ];

    y += drawRow(row, y, { isEven: rowIndex % 2 === 0 });
    rowIndex++;
    totalInstructorRevenue += item.instructorRevenue;
  });

  // Summary section
  y += 20;
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor("#D1D5DB").lineWidth(2).stroke();
  y += 20;

  const summaryHeight = 70;
  doc.roundedRect(startX, y, pageWidth, summaryHeight, 10).fillAndStroke("#ECFDF5", "#10B981");

  // Total Instructor Revenue
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#065F46");
  doc.text("Total Instructor Revenue:", startX + 20, y + 15);

  doc.fontSize(12).fillColor("#047857").font("Helvetica-Bold");
  const totalRevenueText = `Rs ${totalInstructorRevenue.toFixed(2)}`;
  const totalRevenueWidth = doc.widthOfString(totalRevenueText);
  doc.text(totalRevenueText, startX + pageWidth - 20 - totalRevenueWidth, y + 15);

  // Total Enrollments
  const totalEnrollments = data.length > 0 ? data[0].totalEnrollments : 0;
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#065F46");
  doc.text("Total Enrollments:", startX + 20, y + 40);

  doc.fontSize(12).fillColor("#047857").font("Helvetica-Bold");
  const totalEnrollmentsText = totalEnrollments.toString();
  const totalEnrollmentsWidth = doc.widthOfString(totalEnrollmentsText);
  doc.text(totalEnrollmentsText, startX + pageWidth - 20 - totalEnrollmentsWidth, y + 40);

  // Add page numbers and footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(9).fillColor("#9CA3AF").font("Helvetica");
    const footerY = doc.page.height - 30;
    doc.text(
      `Page ${i + 1} of ${range.count} | ULearn Platform | Confidential | ${reportDate}`,
      40,
      footerY,
      { align: "center", width: doc.page.width - 80 }
    );
  }

  doc.end();
  stream.pipe(res);
}