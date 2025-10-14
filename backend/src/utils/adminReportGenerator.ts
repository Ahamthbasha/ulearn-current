import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Response } from "express";
import {
  IAdminCourseSalesReportItem,
  IAdminMembershipReportItem,
} from "../types/dashboardTypes";

export async function generateCourseSalesExcelReport(
  data: IAdminCourseSalesReportItem[],
  totalAdminShare: number,
  res: Response,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Course Sales Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "Course Name", key: "courseName", width: 30 },
    { header: "Instructor", key: "instructorName", width: 20 },
    { header: "Course Price", key: "coursePrice", width: 15 },
    { header: "Coupon Used", key: "couponUsed", width: 15 },
    { header: "Discounted Price", key: "discountedPrice", width: 18 },
    { header: "Admin Share", key: "adminShare", width: 15 },
    { header: "Total Price", key: "totalPrice", width: 15 },
    { header: "Total Admin Share", key: "totalAdminShare", width: 18 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Add data rows
  data.forEach((item) => {
    item.courses.forEach((course, index) => {
      const row = sheet.addRow({
        orderId: index === 0 ? item.orderId : "",
        date: index === 0 ? item.date: "",
        courseName: course.courseName,
        instructorName: course.instructorName,
        coursePrice: course.offerPrice != null ? course.offerPrice : course.coursePrice, // Use offerPrice if available
        couponUsed: index === 0 ? (item.couponCode ? "Yes" : "No") : "",
        discountedPrice: course.discountedPrice,
        adminShare: course.adminShare,
        totalPrice: index === item.courses.length - 1 ? item.totalPrice : "",
        totalAdminShare:
          index === item.courses.length - 1 ? item.totalAdminShare : "",
      });

      // Apply row styling
      row.alignment = { vertical: "middle", horizontal: "left" };
      row.height = 20;

      // Center align numeric columns
      [5, 6, 7, 8, 9, 10].forEach((colNum) => {
        const cell = row.getCell(colNum);
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Add borders
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add a blank separator row
    sheet.addRow({});
  });

  // Add overall total row
  sheet.addRow({});
  const totalRow = sheet.addRow({
    orderId: "",
    date: "",
    courseName: "",
    instructorName: "",
    coursePrice: "",
    couponUsed: "",
    discountedPrice: "",
    adminShare: "",
    totalPrice: "Overall Total Admin Share:",
    totalAdminShare: totalAdminShare,
  });

  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };
  totalRow.alignment = { vertical: "middle", horizontal: "center" };
  totalRow.height = 25;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=CourseSalesReport.xlsx`,
  );
  await workbook.xlsx.write(res);
  res.end();
}

export async function generateCourseSalesPdfReport(
  data: IAdminCourseSalesReportItem[],
  totalAdminShare: number,
  res: Response,
): Promise<void> {
  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
    layout: "landscape",
  });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=CourseSalesReport.pdf`,
  );

  doc.pipe(stream);

  // Title with background
  const pageWidth = doc.page.width - 60;
  doc
    .rect(30, 30, pageWidth, 40)
    .fillAndStroke("#4472C4", "#4472C4");
  
  doc
    .fontSize(18)
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .text("Course Sales Report", 30, 45, {
      width: pageWidth,
      align: "center",
    });

  doc.moveDown(2);

  const headers = [
    "Order ID",
    "Date",
    "Course Name",
    "Instructor",
    "Course Price",
    "Coupon",
    "Disc. Price",
    "Admin Share",
    "Total Price",
    "Total Admin",
  ];
  
  const colWidths = [100, 55, 150, 85, 60, 45, 60, 65, 60, 70];

  const startX = 30;
  let y = 100;
  const lineHeight = 16;

  const drawRow = (
    row: string[],
    yOffset: number,
    height: number,
    options: { isHeader?: boolean; isTotal?: boolean } = {},
  ) => {
    const { isHeader = false, isTotal = false } = options;
    
    if (isHeader) {
      doc.rect(startX, yOffset, pageWidth, height).fillAndStroke("#4472C4", "#4472C4");
      doc.fontSize(9).fillColor("#FFFFFF").font("Helvetica-Bold");
    } else if (isTotal) {
      doc.rect(startX, yOffset, pageWidth, height).fillAndStroke("#D9E1F2", "#4472C4");
      doc.fontSize(10).fillColor("#000000").font("Helvetica-Bold");
    } else {
      doc.fontSize(8).fillColor("#000000").font("Helvetica");
    }

    let x = startX;
    row.forEach((text, i) => {
      const cellWidth = colWidths[i];
      const padding = 3;
      
      doc.text(text, x + padding, yOffset + (height - 8) / 2, {
        width: cellWidth - padding * 2,
        align: i === 2 || i === 3 ? "left" : "center", // Left align for Course Name and Instructor
        ellipsis: true,
      });

      if (!isHeader && !isTotal) {
        doc.rect(x, yOffset, cellWidth, height).stroke("#CCCCCC");
      }
      
      x += cellWidth;
    });
  };

  // Draw header
  drawRow(headers, y, 28, { isHeader: true });
  y += 28;

  // Alternating row colors
  let rowIndex = 0;

  data.forEach((item) => {
    item.courses.forEach((course, index) => {
      const orderIdStr = String(item.orderId);
      const truncatedCourseName = course.courseName.length > 30 ? course.courseName.substring(0, 30) + ".." : course.courseName;
      
      const row = [
        index === 0 ? orderIdStr : "",
        index === 0 ? item.date : "",
        truncatedCourseName,
        course.instructorName.length > 16 ? course.instructorName.substring(0, 16) + ".." : course.instructorName,
        (course.offerPrice != null ? course.offerPrice : course.coursePrice).toFixed(2), // Use offerPrice if available
        index === 0 ? (item.couponCode ? "Yes" : "No") : "",
        course.discountedPrice.toFixed(2),
        course.adminShare.toFixed(2),
        index === item.courses.length - 1 ? item.totalPrice.toFixed(2) : "",
        index === item.courses.length - 1 ? item.totalAdminShare.toFixed(2) : "",
      ];

      const rowHeight = lineHeight + 6;

      // Check if we need a new page
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage({ layout: "landscape" });
        y = 30;
        drawRow(headers, y, 28, { isHeader: true });
        y += 28;
        rowIndex = 0;
      }

      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.rect(startX, y, pageWidth, rowHeight).fill("#F9F9F9");
      }

      drawRow(row, y, rowHeight);
      y += rowHeight;
      rowIndex++;
    });
    
    y += 4; // Small gap between orders
  });

  // Overall Total Row
  y += 8;
  if (y > doc.page.height - 80) {
    doc.addPage({ layout: "landscape" });
    y = 30;
  }

  const totalRow = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Overall Total:",
    totalAdminShare.toFixed(2),
  ];
  
  drawRow(totalRow, y, 32, { isTotal: true });

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#666666")
      .font("Helvetica")
      .text(
        `Page ${i + 1} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
        30,
        doc.page.height - 40,
        { align: "center", width: pageWidth }
      );
  }

  doc.end();
  stream.pipe(res);
}

export async function generateMembershipSalesExcelReport(
  data: IAdminMembershipReportItem[],
  res: Response,
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
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=MembershipSalesReport.xlsx`,
  );
  await workbook.xlsx.write(res);
  res.end();
}

export async function generateMembershipSalesPdfReport(
  data: IAdminMembershipReportItem[],
  res: Response,
): Promise<void> {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=MembershipSalesReport.pdf`,
  );

  doc.pipe(stream);

  // Title
  doc.fontSize(20).text("Membership Sales Report", { align: "center" });
  doc.moveDown(1.5);

  const headers = ["Order ID", "Date", "Plan Name", "Instructor", "Price"];
  const colWidths = [100, 60, 130, 100, 80]; // total ~470

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
