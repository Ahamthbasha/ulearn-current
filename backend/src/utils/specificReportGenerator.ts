import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";

interface ReportData {
  createdAt: Date;
  courseName: string;
  coursePrice: number;
  instructorEarning: number;
  orderId: string;
  totalEnrollments: number; // Kept for compatibility with incoming data, but used only for summary
}

export async function generateExcelReport(data: ReportData[], res: Response): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "createdAt", width: 15 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Course Price", key: "coursePrice", width: 15 },
    { header: "Instructor Earning", key: "instructorEarning", width: 20 },
  ];

  let totalInstructorRevenue = 0;
  const totalEnrollments = data.length > 0 ? data[0].totalEnrollments : 0; // Use first item's enrollments

  data.forEach((item) => {
    sheet.addRow({
      orderId: item.orderId,
      createdAt: new Date(item.createdAt).toLocaleDateString("en-IN"),
      courseName: item.courseName,
      coursePrice: item.coursePrice,
      instructorEarning: item.instructorEarning,
    });

    totalInstructorRevenue += item.instructorEarning;
  });

  sheet.addRow({}); // Empty row
  sheet.addRow({
    courseName: "Total Instructor Revenue:",
    instructorEarning: totalInstructorRevenue,
    coursePrice: "", // Placeholder to align columns
    createdAt: "",  // Placeholder to align columns
    orderId: "",    // Placeholder to align columns
  });
  sheet.addRow({
    courseName: "Total Enrollments:",
    instructorEarning: totalEnrollments,
    coursePrice: "", // Placeholder to align columns
    createdAt: "",  // Placeholder to align columns
    orderId: "",    // Placeholder to align columns
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=RevenueReport.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}

export async function generatePdfReport(data: ReportData[], res: Response): Promise<void> {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=RevenueReport.pdf`);

  doc.pipe(stream);

  // Title
  doc.fontSize(20).text("ULearn", { align: "center" });
  doc.moveDown(1.5);

  const headers = [
    "Order ID",
    "Date",
    "Course Name",
    "Course Price",
    "Instructor Earning",
  ];
  const colWidths = [120, 80, 150, 100, 110]; // Adjusted total ~560

  const startX = doc.x;
  let y = doc.y;
  const lineHeight = 14;

  const drawRow = (
    row: string[],
    yOffset: number,
    height: number,
    options: { isHeader?: boolean; isTotal?: boolean } = {}
  ) => {
    const { isHeader = false, isTotal = false } = options;
    doc.fontSize(isHeader ? 10 : 9).fillColor(isTotal ? "green" : "black");

    let x = startX;
    row.forEach((text, i) => {
      doc.text(text, x + 4, yOffset + 4, {
        width: colWidths[i] - 8,
        align: "left",
      });
      x += colWidths[i];
    });

    // Draw borders
    x = startX;
    colWidths.forEach((width) => {
      doc.rect(x, yOffset, width, height).stroke();
      x += width;
    });
  };

  // Draw header
  drawRow(headers, y, 30, { isHeader: true });
  y += 30;

  let total = 0;

  // Group by orderId
  const grouped: Record<string, ReportData[]> = {};
  for (const item of data) {
    if (!grouped[item.orderId]) grouped[item.orderId] = [];
    grouped[item.orderId].push(item);
  }

  for (const orderId in grouped) {
    const group = grouped[orderId];
    const date = new Date(group[0].createdAt).toLocaleDateString("en-IN");
    const courseNames = group.map((g) => g.courseName).join("\n");
    const coursePrices = group.map((g) => `Rs. ${g.coursePrice}`).join("\n");
    const instructorEarnings = group.map((g) => `Rs. ${g.instructorEarning}`).join("\n");

    const row = [
      orderId,
      date,
      courseNames,
      coursePrices,
      instructorEarnings,
    ];

    const lines = Math.max(
      ...[courseNames, coursePrices, instructorEarnings].map((text) => text.split("\n").length)
    );
    const rowHeight = lines * lineHeight + 8;

    // Page break check
    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
      drawRow(headers, y, 30, { isHeader: true });
      y += 30;
    }

    drawRow(row, y, rowHeight);
    y += rowHeight;

    total += group.reduce((sum, g) => sum + g.instructorEarning, 0);
  }

  // Total Rows (aligned with table)
  const totalRevenueRow = ["", "", "Total Instructor Revenue:", "", `Rs. ${total.toFixed(2)}`];
  drawRow(totalRevenueRow, y, 30, { isTotal: true });
  y += 30;

  const totalEnrollments = data.length > 0 ? data[0].totalEnrollments : 0; // Use first item's enrollments
  const totalEnrollmentsRow = ["", "", "Total Enrollments:", "", totalEnrollments.toString()];
  drawRow(totalEnrollmentsRow, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
}
