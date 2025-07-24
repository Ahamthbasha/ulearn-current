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
  paymentMethod?: string;
}

export async function generateExcelReport(data: ReportData[], res: Response): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "createdAt", width: 15 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Course Price", key: "coursePrice", width: 15 },
    { header: "Payment Method", key: "paymentMethod", width: 20 },
    { header: "Instructor Earning", key: "instructorEarning", width: 20 },
  ];

  let totalInstructorRevenue = 0;

  data.forEach((item) => {
    sheet.addRow({
      orderId: item.orderId,
      createdAt: new Date(item.createdAt).toLocaleDateString(),
      courseName: item.courseName,
      coursePrice: item.coursePrice,
      paymentMethod: item.paymentMethod,
      instructorEarning: item.instructorEarning,
    });

    totalInstructorRevenue += item.instructorEarning;
  });

  sheet.addRow({}); // Empty row
  sheet.addRow({
    courseName: "Total Instructor Revenue:",
    instructorEarning: totalInstructorRevenue,
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
    "Payment Method",
    "Instructor Earning",
  ];
  const colWidths = [100, 60, 130, 80, 80, 90]; // total ~540

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
    const date = new Date(group[0].createdAt).toLocaleDateString();
    const paymentMethod = group[0].paymentMethod || "N/A";

    const courseNames = group.map((g) => g.courseName).join("\n");
    const coursePrices = group.map((g) => `Rs. ${g.coursePrice}`).join("\n");
    const instructorEarnings = group.map((g) => `Rs. ${g.instructorEarning}`).join("\n");

    const row = [
      orderId,
      date,
      courseNames,
      coursePrices,
      paymentMethod,
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

  // Total Row (aligned with table)
  const totalRow = ["", "", "", "", "Total Instructor Revenue:", `Rs. ${total.toFixed(2)}`];
  drawRow(totalRow, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
}