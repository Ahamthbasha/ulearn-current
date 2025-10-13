import ExcelJS from "exceljs";
import { Response } from "express";
import PDFDocument from "pdfkit";
import {
  IStudentCourseReportItem,
  IStudentSlotReportItem,
} from "../types/dashboardTypes";
import { PassThrough } from "stream";

export function formatTo12Hour(time: string | Date): string {
  const strTime =
    typeof time === "string"
      ? time
      : new Date(time).toISOString().substring(11, 16); 

  const [hours, minutes] = strTime.split(":");
  let hourNum = parseInt(hours, 10);
  const ampm = hourNum >= 12 ? "PM" : "AM";
  hourNum = hourNum % 12 || 12;

  return `${hourNum}:${minutes} ${ampm}`;
}

// Excel - Course Report
export const generateStudentCourseReportExcel = async (
  report: IStudentCourseReportItem[],
  res: Response,
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Course Report");

  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 30 },
    { header: "Date", key: "date", width: 20 },
    { header: "Courses & Learning Paths", key: "itemsWithPrices", width: 40 },
    { header: "Coupon Code", key: "couponCode", width: 15 },
    { header: "Coupon Discount %", key: "couponDiscount", width: 18 },
    { header: "Original Price", key: "originalPrice", width: 15 },
    { header: "Discount Amount", key: "discountAmount", width: 18 },
    { header: "Final Price", key: "finalPrice", width: 15 },
  ];

  report.forEach((item) => {
    const itemsWithPrices = item.items.map(
      (i) =>
        `${i.type === "course" ? "Course" : "Learning Path"}: ${i.name} (Rs. ${(
          i.finalPrice || i.originalPrice
        ).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })})` +
        (i.offerPercentage
          ? ` [${i.offerPercentage}% off]`
          : ""),
    ).join(", ");

    worksheet.addRow({
      orderId: item.orderId,
      date: item.date,
      itemsWithPrices,
      couponCode: item.couponCode || "Not used",
      couponDiscount: item.couponDiscountPercent
        ? `${item.couponDiscountPercent}%`
        : "0 %",
      originalPrice: item.originalTotalPrice || 0,
      discountAmount: item.couponDiscountAmount || 0,
      finalPrice: item.finalTotalPrice || 0,
    });
  });

  worksheet.addRow([]);
  worksheet.addRow(["", "", "", "", "", "Total Orders:", report.length, ""]);
  
  const totalRevenue = report.reduce(
    (sum, item) => sum + (item.finalTotalPrice || 0),
    0,
  );
  const totalDiscount = report.reduce(
    (sum, item) => sum + (item.couponDiscountAmount || 0),
    0,
  );
  
  worksheet.addRow(["", "", "", "", "", "Total Discount:", totalDiscount, ""]);
  worksheet.addRow(["", "", "", "", "", "Total Revenue:", "", totalRevenue]);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=course_report.xlsx",
  );

  await workbook.xlsx.write(res);
  res.end();
};

// Excel - Slot Report
export const generateStudentSlotReportExcel = async (
  report: IStudentSlotReportItem[],
  res: Response,
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
        ? `${item.slotTime.startTime} - ${
            item.slotTime.endTime}`
        : "N/A";

    worksheet.addRow({
      bookingId: item.bookingId,
      date: item.date,
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

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", "attachment; filename=slot_report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
};

// PDF - Course Report
export async function generateStudentCourseReportPdf(
  data: IStudentCourseReportItem[],
  res: Response,
): Promise<void> {
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    layout: "landscape",
    bufferPages: true,
  });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=CourseReport.pdf`);

  doc.pipe(stream);

  // Header Section with gradient-like effect
  doc
    .fillColor("#1e3a8a")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Student Course & Learning Path Report", { align: "center" });
  doc
    .fillColor("#64748b")
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Generated on ${new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}`,
      { align: "center" },
    );
  doc.moveDown(0.5);

  // Decorative line
  const pageWidth = doc.page.width - 80;
  doc
    .strokeColor("#3b82f6")
    .lineWidth(2)
    .moveTo(40, doc.y)
    .lineTo(40 + pageWidth, doc.y)
    .stroke();

  doc.moveDown(1);

  const headers = [
    "Order ID",
    "Date",
    "Courses & Learning Paths",
    "Coupon",
    "Discount",
    "Original",
    "Saved",
    "Final Price",
  ];

  // Responsive column widths based on page width
  const totalWidth = doc.page.width - 80;
  const colWidths = [
    totalWidth * 0.12, // Order ID
    totalWidth * 0.10, // Date
    totalWidth * 0.28, // Courses & Learning Paths
    totalWidth * 0.10, // Coupon
    totalWidth * 0.08, // Discount %
    totalWidth * 0.11, // Original
    totalWidth * 0.10, // Saved
    totalWidth * 0.11, // Final
  ];

  const startX = 40;
  let y = doc.y;

  const drawRow = (
    row: string[],
    itemsArray: string[],
    yOffset: number,
    options: { isHeader?: boolean; isTotal?: boolean; isSummary?: boolean } = {},
  ) => {
    const { isHeader = false, isTotal = false, isSummary = false } = options;

    // Calculate dynamic row height based on items
    const baseHeight = isHeader ? 30 : isSummary ? 25 : 18;
    const itemsCount = itemsArray.length || 1;
    const rowHeight = isHeader || isTotal || isSummary
      ? baseHeight
      : Math.max(baseHeight, itemsCount * 12 + 12);

    // Draw background for header
    if (isHeader) {
      doc
        .fillColor("#3b82f6")
        .rect(startX, yOffset, totalWidth, rowHeight)
        .fill();
    } else if (isTotal) {
      doc
        .fillColor("#e0f2fe")
        .rect(startX, yOffset, totalWidth, rowHeight)
        .fill(); // Light blue for totals
    } else if (isSummary) {
      doc
        .fillColor("#f1f5f9")
        .rect(startX, yOffset, totalWidth, rowHeight)
        .fill(); // Light gray for summary
    } else {
      // Alternating row colors
      const rowIndex = Math.floor((yOffset - 100) / 20);
      if (rowIndex % 2 === 0) {
        doc
          .fillColor("#f8fafc")
          .rect(startX, yOffset, totalWidth, rowHeight)
          .fill();
      }
    }

    // Set text properties
    if (isHeader) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");
    } else if (isTotal) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#16a34a");
    } else if (isSummary) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b");
    } else {
      doc.fontSize(9).font("Helvetica").fillColor("#334155");
    }

    let x = startX;
    row.forEach((text, i) => {
      const align = i >= 5 ? "right" : i >= 3 ? "center" : "left";
      const padding = 4;

      if (!isHeader && !isTotal && !isSummary && i === 2) {
        // Handle multi-line items vertically
        itemsArray.forEach((item, itemIdx) => {
          doc.text(item, x + padding, yOffset + padding + itemIdx * 12, {
            width: colWidths[i] - padding * 2,
            align: "left",
            lineBreak: false,
          });
        });
      } else {
        doc.text(text, x + padding, yOffset + padding + (rowHeight - 16) / 2, {
          width: colWidths[i] - padding * 2,
          align: align,
          lineBreak: false,
        });
      }
      x += colWidths[i];
    });

    // Draw borders
    doc.strokeColor("#cbd5e1").lineWidth(0.5);
    x = startX;
    colWidths.forEach((width) => {
      doc.rect(x, yOffset, width, rowHeight).stroke();
      x += width;
    });

    return rowHeight;
  };

  const headerHeight = drawRow(headers, [], y, { isHeader: true });
  y += headerHeight;

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalOriginal = 0;

  for (const item of data) {
    // Create array of items with prices (each on separate line)
    const itemsArray = item.items.map(
      (i) =>
        `${i.type === "course" ? "Course" : "Learning Path"}: ${i.name} (Rs. ${(
          i.finalPrice || i.originalPrice
        ).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })})` +
        (i.offerPercentage
          ? ` [${i.offerPercentage}% off]`
          : ""),
    );

    const finalPrice = item.finalTotalPrice || 0;
    const discountAmount = item.couponDiscountAmount || 0;
    const originalPrice = item.originalTotalPrice || 0;

    // Truncate order ID for display
    const shortOrderId =
      item.orderId.length > 16
        ? item.orderId.substring(0, 13) + "..."
        : item.orderId;

    const row = [
      shortOrderId,
      item.date.includes(" ") ? item.date.split(" ")[0] : item.date,
      "", // Items handled separately
      item.couponCode || "-",
      item.couponDiscountPercent ? `${item.couponDiscountPercent}%` : "-",
      `Rs. ${originalPrice.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      `Rs. ${discountAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      `Rs. ${finalPrice.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    ];

    // Calculate required height for this row
    const requiredHeight = Math.max(30, itemsArray.length * 12 + 12);

    // Check if new page is needed
    if (y + requiredHeight + 50 > doc.page.height - 80) {
      doc.addPage();
      y = 40;
      const newHeaderHeight = drawRow(headers, [], y, { isHeader: true });
      y += newHeaderHeight;
    }

    const rowHeight = drawRow(row, itemsArray, y, {});
    y += rowHeight;

    totalRevenue += finalPrice;
    totalDiscount += discountAmount;
    totalOriginal += originalPrice;
  }

  // Summary Section
  y += 10;

  // Add a separator line
  doc
    .strokeColor("#3b82f6")
    .lineWidth(1.5)
    .moveTo(startX, y)
    .lineTo(startX + totalWidth, y)
    .stroke();
  y += 15;

  // Summary background
  doc.fillColor("#f1f5f9").rect(startX, y, totalWidth, 85).fill();

  // Summary title
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("Summary", startX + 10, y + 10);
  y += 30;

  // Summary rows
  const summaryStartX = startX + totalWidth - 300;
  const summaryData = [
    { label: "Total Orders:", value: `${data.length}`, color: "#3b82f6" },
    {
      label: "Total Original Amount:",
      value: `Rs. ${totalOriginal.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      color: "#64748b",
    },
    {
      label: "Total Discount:",
      value: `Rs. ${totalDiscount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      color: "#16a34a",
    },
    {
      label: "Total Revenue:",
      value: `Rs. ${totalRevenue.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      color: "#dc2626",
    },
  ];

  summaryData.forEach((item, index) => {
    const rowY = y + index * 18;
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#475569")
      .text(item.label, summaryStartX, rowY, { width: 150, align: "left" });
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(item.color)
      .text(item.value, summaryStartX + 160, rowY, {
        width: 140,
        align: "right",
      });
  });

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .font("Helvetica")
      .text(
        `Page ${i + 1} of ${pageCount}`,
        40,
        doc.page.height - 30,
        { align: "center", width: pageWidth },
      );
  }

  doc.end();
  stream.pipe(res);
}

// PDF - Slot Report
export const generateStudentSlotReportPdf = (
  data: IStudentSlotReportItem[],
  res: Response,
): void => {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=StudentSlotReport.pdf`,
  );

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
    options: { isHeader?: boolean; isTotal?: boolean } = {},
  ) => {
    const { isHeader = false, isTotal = false } = options;
    doc
      .fontSize(isHeader ? 10 : 9)
      .fillColor(isTotal ? "green" : "black");

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
        ? `${item.slotTime.startTime} - ${item.slotTime.endTime}`
        : "N/A";

    const row = [
      item.bookingId,
      item.date,
      slotTime,
      item.instructorName,
      `Rs. ${price.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
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

  const totalRow2 = [
    "",
    "",
    "",
    "Total Expenses:",
    `Rs. ${total.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  ];
  drawRow(totalRow2, y, 30, { isTotal: true });

  doc.end();
  stream.pipe(res);
};