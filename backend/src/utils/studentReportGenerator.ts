import ExcelJS from "exceljs";
import { Response } from "express";
import PDFDocument from "pdfkit";
import { IStudentCourseReportItem, IStudentSlotReportItem } from "../types/dashboardTypes";
import { PassThrough } from "stream";

// ✅ Time formatting utility
export function formatTo12Hour(time: string | Date): string {
  const strTime =
    typeof time === "string"
      ? time
      : new Date(time).toISOString().substring(11, 16); // 'HH:MM'

  const [hours, minutes] = strTime.split(":");
  let hourNum = parseInt(hours, 10);
  const ampm = hourNum >= 12 ? "PM" : "AM";
  hourNum = hourNum % 12 || 12;

  return `${hourNum}:${minutes} ${ampm}`;
}

// ✅ Excel - Course Report
export const generateStudentCourseReportExcel = async (
  report: IStudentCourseReportItem[],
  res: Response
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Course Report");

  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 30 },
    { header: "Date", key: "date", width: 20 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Price", key: "price", width: 15 },
  ];

  report.forEach((item) => {
    const priceArray = Array.isArray(item.price) ? item.price : [item.price];
    const totalPrice = priceArray.reduce((sum, val) => sum + Number(val), 0);

    worksheet.addRow({
      orderId: item.orderId,
      date: new Date(item.date).toLocaleDateString(),
      courseName: item.courseName,
      price: totalPrice,
    });
  });

  worksheet.addRow([]);
  worksheet.addRow(["", "", "Total Orders", report.length]);
  worksheet.addRow([
    "",
    "",
    "Total Revenue",
    report.reduce((sum, item) => {
      const prices = Array.isArray(item.price) ? item.price : [item.price];
      return sum + prices.reduce((s, val) => s + Number(val), 0);
    }, 0),
  ]);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=course_report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
};

// ✅ Excel - Slot Report
export const generateStudentSlotReportExcel = async (
  report: IStudentSlotReportItem[],
  res: Response
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Slot Booking Report");

  worksheet.columns = [
    { header: "Booking ID", key: "bookingId", width: 30 },
    { header: "Date", key: "date", width: 20 },
    { header: "Slot Time", key: "slotTime", width: 25 },
    { header: "Instructor Name", key: "instructorName", width: 30 },
    { header: "Price", key: "price", width: 15 },
  ];

  report.forEach((item) => {
    const slotTime =
      item.slotTime?.startTime && item.slotTime?.endTime
        ? `${formatTo12Hour(item.slotTime.startTime)} - ${formatTo12Hour(item.slotTime.endTime)}`
        : "N/A";

    worksheet.addRow({
      bookingId: item.bookingId,
      date: new Date(item.date).toLocaleDateString(),
      slotTime,
      instructorName: item.instructorName,
      price: Number(item.price),
    });
  });

  worksheet.addRow([]);
  worksheet.addRow(["", "", "", "Total Slots Booked", report.length]);
  worksheet.addRow([
    "",
    "",
    "",
    "Total Expenses",
    report.reduce((sum, item) => sum + Number(item.price), 0),
  ]);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=slot_report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
};

// ✅ PDF - Course Report
export async function generateStudentCourseReportPdf(
  data: IStudentCourseReportItem[],
  res: Response
): Promise<void> {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=CourseReport.pdf`);

  doc.pipe(stream);

  doc.fontSize(20).text("Student Course Purchase Report", { align: "center" });
  doc.moveDown(1.5);

  const headers = ["Order ID", "Date", "Course Name", "Price"];
  const colWidths = [100, 80, 200, 80];
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

    x = startX;
    colWidths.forEach((width) => {
      doc.rect(x, yOffset, width, height).stroke();
      x += width;
    });
  };

  drawRow(headers, y, 30, { isHeader: true });
  y += 30;

  let total = 0;

  for (const item of data) {
    const priceArray = Array.isArray(item.price) ? item.price : [item.price];
    const totalPrice = priceArray.reduce((sum, val) => sum + Number(val), 0);

    const row = [
      item.orderId,
      new Date(item.date).toLocaleDateString(),
      item.courseName,
      `Rs. ${totalPrice.toFixed(2)}`, // Changed to "Rs. [price]"
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

    total += totalPrice;
  }

  const totalRow1 = ["", "", "Total Orders:", `${data.length}`];
  drawRow(totalRow1, y, 30, { isTotal: true });
  y += 30;

  const totalRow2 = ["", "", "Total Expenses:", `Rs. ${total.toFixed(2)}`]; // Changed to "Rs. [total]"
  drawRow(totalRow2, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
}

// ✅ PDF - Slot Report
export const generateStudentSlotReportPdf = (
  data: IStudentSlotReportItem[],
  res: Response
): void => {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=StudentSlotReport.pdf`);

  doc.pipe(stream);

  doc.fontSize(20).text("Student Slot Booking Report", { align: "center" });
  doc.moveDown(1.5);

  const headers = ["Booking ID", "Date", "Slot Time", "Instructor", "Price"];
  const colWidths = [100, 70, 110, 140, 60];
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

    x = startX;
    colWidths.forEach((width) => {
      doc.rect(x, yOffset, width, height).stroke();
      x += width;
    });
  };

  drawRow(headers, y, 30, { isHeader: true });
  y += 30;

  let total = 0;

  for (const item of data) {
    const price = Number(item.price);
    const slotTime =
      item.slotTime?.startTime && item.slotTime?.endTime
        ? `${formatTo12Hour(item.slotTime.startTime)} - ${formatTo12Hour(item.slotTime.endTime)}`
        : "N/A";

    const row = [
      item.bookingId,
      new Date(item.date).toLocaleDateString(),
      slotTime,
      item.instructorName,
      `Rs. ${price.toFixed(2)}`, // Changed to "Rs. [price]"
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

    total += price;
  }

  const totalRow1 = ["", "", "", "Total Slots Booked:", `${data.length}`];
  drawRow(totalRow1, y, 30, { isTotal: true });
  y += 30;

  const totalRow2 = ["", "", "", "Total Revenue:", `Rs. ${total.toFixed(2)}`]; // Changed to "Rs. [total]"
  drawRow(totalRow2, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
};