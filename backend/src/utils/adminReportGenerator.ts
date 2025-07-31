import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";
import { IAdminCourseSalesReportItem, IAdminMembershipReportItem } from "../types/dashboardTypes";

export async function generateCourseSalesExcelReport(
  data: IAdminCourseSalesReportItem[],
  totalAdminShare: number,
  res: Response
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Course Sales Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Instructor", key: "instructorName", width: 20 },
    { header: "Course Price", key: "coursePrice", width: 15 },
    { header: "Total Price", key: "totalPrice", width: 15 },
    { header: "Admin Share", key: "adminShare", width: 15 },
  ];

  data.forEach((item) => {
    item.courses.forEach((course, index) => {
      sheet.addRow({
        orderId: index === 0 ? item.orderId : "",
        date: index === 0 ? new Date(item.date).toLocaleDateString() : "",
        courseName: course.courseName,
        instructorName: course.instructorName,
        coursePrice: course.coursePrice,
        totalPrice: index === item.courses.length - 1 ? item.totalPrice : "",
        adminShare: index === item.courses.length - 1 ? item.totalAdminShare : "",
      });
    });
    sheet.addRow({}); // Add a blank row between orders
  });

  sheet.addRow({});
  sheet.addRow({
    courseName: "Overall Total Admin Share:",
    adminShare: totalAdminShare,
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=CourseSalesReport.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}

export async function generateCourseSalesPdfReport(
  data: IAdminCourseSalesReportItem[],
  totalAdminShare: number,
  res: Response
): Promise<void> {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=CourseSalesReport.pdf`);

  doc.pipe(stream);

  // Title
  doc.fontSize(20).text("Course Sales Report", { align: "center" });
  doc.moveDown(1.5);

  const headers = [
    "Order ID",
    "Date",
    "Course Name",
    "Instructor",
    "Course Price",
    "Total Price",
    "Admin Share",
  ];
  const colWidths = [80, 60, 100, 80, 60, 60, 60]; // Adjusted total width

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

  data.forEach((item) => {
    item.courses.forEach((course, index) => {
      const row = [
        index === 0 ? item.orderId : "",
        index === 0 ? new Date(item.date).toLocaleDateString() : "",
        course.courseName,
        course.instructorName,
        `Rs. ${course.coursePrice.toFixed(2)}`,
        index === item.courses.length - 1 ? `Rs. ${item.totalPrice.toFixed(2)}` : "",
        index === item.courses.length - 1 ? `Rs. ${item.totalAdminShare.toFixed(2)}` : "",
      ];

      const rowHeight = lineHeight + 8;

      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = doc.y;
        drawRow(headers, y, 30, { isHeader: true });
        y += 30;
      }

      drawRow(row, y, rowHeight);
      y += rowHeight;
    });
    y += lineHeight; // Add space between orders
  });

  // Overall Total Row
  const totalRow = [
    "",
    "",
    "",
    "",
    "",
    "Overall Total Admin Share:",
    `Rs. ${totalAdminShare.toFixed(2)}`,
  ];
  drawRow(totalRow, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
}

export async function generateMembershipSalesExcelReport(
  data: IAdminMembershipReportItem[],
  res: Response
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Membership Sales Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "Plan Name", key: "planName", width: 20 },
    { header: "Instructor", key: "instructorName", width: 20 },
    { header: "Price", key: "price", width: 15 },
  ];

  let totalRevenue = 0;

  data.forEach((item) => {
    sheet.addRow({
      orderId: item.orderId,
      date: new Date(item.date).toLocaleDateString(),
      planName: item.planName,
      instructorName: item.instructorName,
      price: item.price,
    });

    totalRevenue += item.price;
  });

  sheet.addRow({});
  sheet.addRow({
    planName: "Total Revenue:",
    price: totalRevenue,
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=MembershipSalesReport.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}

export async function generateMembershipSalesPdfReport(
  data: IAdminMembershipReportItem[],
  res: Response
): Promise<void> {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=MembershipSalesReport.pdf`);

  doc.pipe(stream);

  // Title
  doc.fontSize(20).text("Membership Sales Report", { align: "center" });
  doc.moveDown(1.5);

  const headers = [
    "Order ID",
    "Date",
    "Plan Name",
    "Instructor",
    "Price",
  ];
  const colWidths = [100, 60, 130, 100, 80]; // total ~470

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

  let totalRevenue = 0;

  for (const item of data) {
    const row = [
      item.orderId,
      new Date(item.date).toLocaleDateString(),
      item.planName,
      item.instructorName,
      `Rs. ${item.price.toFixed(2)}`,
    ];

    const rowHeight = lineHeight + 8;

    // Page break check
    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
      drawRow(headers, y, 30, { isHeader: true });
      y += 30;
    }

    drawRow(row, y, rowHeight);
    y += rowHeight;

    totalRevenue += item.price;
  }

  // Total Row
  const totalRow = [
    "",
    "",
    "",
    "Total Revenue:",
    `Rs. ${totalRevenue.toFixed(2)}`,
  ];
  drawRow(totalRow, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
}