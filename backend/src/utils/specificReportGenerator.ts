import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

interface ReportData {
  orderId: string;
  purchaseDate: string;
  courseName: string;
  originalCoursePrice: number;
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
    { header: "Date", key: "purchaseDate", width: 20 },
    { header: "Course Name", key: "courseName", width: 35 },
    { header: "Original Price", key: "originalCoursePrice", width: 15 },
    { header: "Coupon Used", key: "couponUsed", width: 15 },
    { header: "Discount Amount", key: "couponDeductionAmount", width: 18 },
    { header: "Final Price", key: "finalCoursePrice", width: 15 },
    { header: "Instructor Revenue", key: "instructorRevenue", width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  let totalInstructorRevenue = 0;
  const totalEnrollments = data.length > 0 ? data[0].totalEnrollments : 0;

  data.forEach((item) => {
    sheet.addRow({
      orderId: item.orderId,
      purchaseDate: new Date(item.purchaseDate).toLocaleDateString("en-IN"),
      courseName: item.courseName,
      originalCoursePrice: `₹${item.originalCoursePrice.toFixed(2)}`,
      couponUsed: item.couponUsed ? "Yes" : "No",
      couponDeductionAmount: `₹${item.couponDeductionAmount.toFixed(2)}`,
      finalCoursePrice: `₹${item.finalCoursePrice.toFixed(2)}`,
      instructorRevenue: `₹${item.instructorRevenue.toFixed(2)}`,
    });

    totalInstructorRevenue += item.instructorRevenue;
  });

  // Add empty row
  sheet.addRow({});

  // Total Instructor Revenue row
  const totalRevenueRow = sheet.addRow({
    orderId: "",
    purchaseDate: "",
    courseName: "",
    originalCoursePrice: "",
    couponUsed: "",
    couponDeductionAmount: "",
    finalCoursePrice: "Total Instructor Revenue:",
    instructorRevenue: `₹${totalInstructorRevenue.toFixed(2)}`,
  });
  totalRevenueRow.font = { bold: true };
  totalRevenueRow.getCell("instructorRevenue").font = { bold: true, color: { argb: "FF008000" } };

  // Total Enrollments row
  const totalEnrollmentsRow = sheet.addRow({
    orderId: "",
    purchaseDate: "",
    courseName: "",
    originalCoursePrice: "",
    couponUsed: "",
    couponDeductionAmount: "",
    finalCoursePrice: "Total Enrollments:",
    instructorRevenue: totalEnrollments.toString(),
  });
  totalEnrollmentsRow.font = { bold: true };
  totalEnrollmentsRow.getCell("instructorRevenue").font = { bold: true, color: { argb: "FF008000" } };

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
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=RevenueReport_${new Date().toISOString().split('T')[0]}.pdf`,
  );

  doc.pipe(stream);

  // Header Section with Company Branding
  doc.fillColor("#2563EB").fontSize(28).font("Helvetica-Bold").text("ULearn", { align: "center" });
  doc.fillColor("#6B7280").fontSize(14).font("Helvetica").text("Course Revenue Report", { align: "center" });
  doc.moveDown(0.3);
  
  // Add date and report info
  const reportDate = new Date().toLocaleDateString("en-IN", { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.fontSize(10).fillColor("#9CA3AF").text(`Generated on: ${reportDate}`, { align: "center" });
  
  // Decorative line
  doc.moveTo(40, doc.y + 15).lineTo(doc.page.width - 40, doc.y + 15).strokeColor("#E5E7EB").lineWidth(1.5).stroke();
  doc.moveDown(2);

  const headers = [
    "Order ID",
    "Date",
    "Course Name",
    "Original Price",
    "Coupon Used",
    "Discount",
    "Final Price",
    "Instructor Revenue",
  ];
  
  // Optimized column widths for A4 landscape (841px width - 80px margins = 761px usable)
  const colWidths = [95, 75, 180, 75, 65, 70, 70, 90]; // Total = 720px

  const startX = 40;
  let y = doc.y;
  const padding = 6;

  const drawRow = (
    row: string[],
    yOffset: number,
    height: number,
    options: { isHeader?: boolean; isTotal?: boolean; isEven?: boolean } = {},
  ) => {
    const { isHeader = false, isTotal = false, isEven = false } = options;
    
    let x = startX;

    // Draw background for header and alternating rows
    if (isHeader) {
      doc.rect(startX, yOffset, colWidths.reduce((a, b) => a + b, 0), height)
         .fillAndStroke("#3B82F6", "#2563EB");
    } else if (isTotal) {
      doc.rect(startX, yOffset, colWidths.reduce((a, b) => a + b, 0), height)
         .fillAndStroke("#ECFDF5", "#10B981");
    } else if (isEven) {
      doc.rect(startX, yOffset, colWidths.reduce((a, b) => a + b, 0), height)
         .fillAndStroke("#F9FAFB", "#E5E7EB");
    } else {
      doc.rect(startX, yOffset, colWidths.reduce((a, b) => a + b, 0), height)
         .fillAndStroke("#FFFFFF", "#E5E7EB");
    }

    // Set text properties
    if (isHeader) {
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
    } else if (isTotal) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#065F46");
    } else {
      doc.fontSize(9).font("Helvetica").fillColor("#374151");
    }

    // Draw text
    row.forEach((text, i) => {
      const cellWidth = colWidths[i];
      const textAlign = i === 0 || i === 1 || i === 2 ? "left" : 
                       i === 4 ? "center" : "right";
      
      doc.text(text, x + padding, yOffset + padding, {
        width: cellWidth - (padding * 2),
        align: textAlign,
        lineBreak: false,
        height: height - (padding * 2),
        ellipsis: true,
      });
      
      x += cellWidth;
    });
  };

  // Draw header
  const headerHeight = 28;
  drawRow(headers, y, headerHeight, { isHeader: true });
  y += headerHeight;

  let totalInstructorRevenue = 0;
  let rowIndex = 0;
  const rowHeight = 26;

  // Draw data rows
  data.forEach((item) => {
    // Check for page break
    if (y + rowHeight + 80 > doc.page.height - 40) {
      doc.addPage();
      y = 40;
      
      // Redraw header on new page
      drawRow(headers, y, headerHeight, { isHeader: true });
      y += headerHeight;
      rowIndex = 0; // Reset row index for alternating colors
    }

    // Truncate text intelligently
    const orderId = item.orderId.length > 15 ? item.orderId.substring(0, 15) + "..." : item.orderId;
    const courseName = item.courseName.length > 32 ? item.courseName.substring(0, 32) + "..." : item.courseName;
    
    const row = [
      orderId,
      new Date(item.purchaseDate).toLocaleDateString("en-IN", { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-'),
      courseName,
      `Rs. ${item.originalCoursePrice.toFixed(2)}`,
      item.couponUsed ? "True" : "False",
      `Rs. ${item.couponDeductionAmount.toFixed(2)}`,
      `Rs. ${item.finalCoursePrice.toFixed(2)}`,
      `Rs. ${item.instructorRevenue.toFixed(2)}`,
    ];

    drawRow(row, y, rowHeight, { isEven: rowIndex % 2 === 0 });
    y += rowHeight;
    rowIndex++;

    totalInstructorRevenue += item.instructorRevenue;
  });

  // Add decorative line before totals
  y += 12;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y)
     .strokeColor("#D1D5DB").lineWidth(1.5).stroke();
  y += 12;

  // Check for page break before totals
  if (y + 80 > doc.page.height - 40) {
    doc.addPage();
    y = 40;
  }

  // Summary box
  const summaryStartY = y;
  const summaryHeight = 70;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  // Draw summary background
  doc.rect(startX, summaryStartY, totalWidth, summaryHeight)
     .fillAndStroke("#F0FDF4", "#10B981");

  // Total Instructor Revenue
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#065F46");
  doc.text("Total Instructor Revenue:", startX + 20, summaryStartY + 18, { 
    width: totalWidth - 200,
    align: "left"
  });
  doc.fontSize(14).fillColor("#047857").font("Helvetica-Bold");
  doc.text(`Rs. ${totalInstructorRevenue.toFixed(2)}`, startX + totalWidth - 180, summaryStartY + 16, {
    width: 160,
    align: "right"
  });

  // Total Enrollments
  const totalEnrollments = data.length > 0 ? data[0].totalEnrollments : 0;
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#065F46");
  doc.text("Total Enrollments:", startX + 20, summaryStartY + 42, {
    width: totalWidth - 200,
    align: "left"
  });
  doc.fontSize(14).fillColor("#047857").font("Helvetica-Bold");
  doc.text(totalEnrollments.toString(), startX + totalWidth - 180, summaryStartY + 40, {
    width: 160,
    align: "right"
  });

  // Footer
  doc.fontSize(9).fillColor("#9CA3AF").font("Helvetica");
  const footerY = doc.page.height - 30;
  doc.text(
    `Page ${doc.bufferedPageRange().start + 1} | ULearn Platform | Confidential`,
    40,
    footerY,
    { align: "center", width: doc.page.width - 80 }
  );

  doc.end();
  stream.pipe(res);
}