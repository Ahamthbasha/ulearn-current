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











// import ExcelJS from "exceljs";
// import PDFDocument from "pdfkit";
// import { PassThrough } from "stream";
// import { Response } from "express";

// interface ReportData {
//   createdAt: Date;
//   courseName: string;
//   coursePrice: number;
//   instructorEarning: number;
//   orderId: string;
//   paymentMethod?: string;
// }

// export async function generateExcelReport(data: ReportData[], res: Response): Promise<void> {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Revenue Report");

//     // Set worksheet properties
//     sheet.properties.defaultRowHeight = 20;

//     // Define columns with better formatting
//     sheet.columns = [
//       { header: "Order ID", key: "orderId", width: 25 },
//       { header: "Date", key: "createdAt", width: 15 },
//       { header: "Course Name", key: "courseName", width: 35 },
//       { header: "Course Price (Rs.)", key: "coursePrice", width: 18 },
//       { header: "Payment Method", key: "paymentMethod", width: 20 },
//       { header: "Instructor Earning (Rs.)", key: "instructorEarning", width: 22 },
//     ];

//     // Style the header row
//     const headerRow = sheet.getRow(1);
//     headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
//     headerRow.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: '366092' }
//     };
//     headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
//     headerRow.height = 25;

//     let totalInstructorRevenue = 0;
//     let rowIndex = 2;

//     // Add data rows
//     data.forEach((item) => {
//       const row = sheet.addRow({
//         orderId: item.orderId,
//         createdAt: new Date(item.createdAt).toLocaleDateString('en-IN'),
//         courseName: item.courseName,
//         coursePrice: item.coursePrice,
//         paymentMethod: item.paymentMethod || 'N/A',
//         instructorEarning: item.instructorEarning,
//       });

//       // Format currency columns
//       row.getCell('coursePrice').numFmt = '₹#,##0.00';
//       row.getCell('instructorEarning').numFmt = '₹#,##0.00';
      
//       // Alternate row colors
//       if (rowIndex % 2 === 0) {
//         row.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'F8F9FA' }
//         };
//       }

//       totalInstructorRevenue += item.instructorEarning;
//       rowIndex++;
//     });

//     // Add empty row
//     sheet.addRow({});

//     // Add total row with styling
//     const totalRow = sheet.addRow({
//       orderId: '',
//       createdAt: '',
//       courseName: '',
//       coursePrice: '',
//       paymentMethod: 'Total Instructor Revenue:',
//       instructorEarning: totalInstructorRevenue,
//     });

//     totalRow.font = { bold: true };
//     totalRow.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'E8F5E8' }
//     };
//     totalRow.getCell('instructorEarning').numFmt = '₹#,##0.00';

//     // Add borders to all cells
//     sheet.eachRow((row) => {
//       row.eachCell((cell) => {
//         cell.border = {
//           top: { style: 'thin' },
//           left: { style: 'thin' },
//           bottom: { style: 'thin' },
//           right: { style: 'thin' }
//         };
//       });
//     });

//     // Set response headers
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader("Content-Disposition", `attachment; filename=RevenueReport_${new Date().toISOString().split('T')[0]}.xlsx`);
    
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error('Error generating Excel report:', error);
//     res.status(500).json({ success: false, message: 'Failed to generate Excel report' });
//   }
// }

// export async function generatePdfReport(data: ReportData[], res: Response): Promise<void> {
//   try {
//     const doc = new PDFDocument({ margin: 40, size: 'A4' });
//     const stream = new PassThrough();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=RevenueReport_${new Date().toISOString().split('T')[0]}.pdf`);

//     doc.pipe(stream);

//     // Header section
//     doc.fontSize(24).fillColor('#2c3e50').text("ULearn Revenue Report", { align: "center" });
//     doc.fontSize(12).fillColor('#7f8c8d').text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: "center" });
//     doc.moveDown(2);

//     // Table setup
//     const headers = [
//       "Order ID",
//       "Date", 
//       "Course Name",
//       "Course Price",
//       "Payment Method",
//       "Instructor Earning",
//     ];
//     const colWidths = [80, 70, 120, 80, 90, 100]; // Adjusted widths for better fit

//     const startX = doc.x;
//     let y = doc.y;
//     const lineHeight = 16;
//     const headerHeight = 35;
//     const rowPadding = 8;

//     const drawRow = (
//       row: string[],
//       yOffset: number,
//       height: number,
//       options: { isHeader?: boolean; isTotal?: boolean } = {}
//     ) => {
//       const { isHeader = false, isTotal = false } = options;
      
//       // Set colors and fonts
//       if (isHeader) {
//         doc.fontSize(10).fillColor('#ffffff');
//       } else if (isTotal) {
//         doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold');
//       } else {
//         doc.fontSize(9).fillColor('#2c3e50').font('Helvetica');
//       }

//       let x = startX;
      
//       // Fill background for header and total rows
//       if (isHeader) {
//         doc.rect(startX, yOffset, colWidths.reduce((a, b) => a + b, 0), height)
//            .fillAndStroke('#3498db', '#2980b9');
//       } else if (isTotal) {
//         doc.rect(startX, yOffset, colWidths.reduce((a, b) => a + b, 0), height)
//            .fillAndStroke('#e8f5e8', '#27ae60');
//       }

//       // Draw text
//       row.forEach((text, i) => {
//         const textY = yOffset + (height - lineHeight) / 2;
//         doc.text(text, x + 4, textY, {
//           width: colWidths[i] - 8,
//           align: isHeader ? "center" : "left",
//           ellipsis: true
//         });
//         x += colWidths[i];
//       });

//       // Draw cell borders
//       x = startX;
//       colWidths.forEach((width) => {
//         doc.rect(x, yOffset, width, height).stroke('#bdc3c7');
//         x += width;
//       });
//     };

//     // Draw header
//     drawRow(headers, y, headerHeight, { isHeader: true });
//     y += headerHeight;

//     let total = 0;
//     let alternateRow = false;

//     // Check if we need to group by orderId or show individual entries
//     const shouldGroup = data.length > 0 && data.some(item => 
//       data.filter(d => d.orderId === item.orderId).length > 1
//     );

//     if (shouldGroup) {
//       // Group by orderId for orders with multiple courses
//       const grouped: Record<string, ReportData[]> = {};
//       for (const item of data) {
//         if (!grouped[item.orderId]) grouped[item.orderId] = [];
//         grouped[item.orderId].push(item);
//       }

//       for (const orderId in grouped) {
//         const group = grouped[orderId];
//         const date = new Date(group[0].createdAt).toLocaleDateString('en-IN');
//         const paymentMethod = group[0].paymentMethod || "N/A";

//         const courseNames = group.map((g) => g.courseName).join("\n");
//         const coursePrices = group.map((g) => `₹${g.coursePrice.toLocaleString('en-IN')}`).join("\n");
//         const instructorEarnings = group.map((g) => `₹${g.instructorEarning.toLocaleString('en-IN')}`).join("\n");

//         const row = [
//           orderId,
//           date,
//           courseNames,
//           coursePrices,
//           paymentMethod,
//           instructorEarnings,
//         ];

//         const lines = Math.max(
//           ...[courseNames, coursePrices, instructorEarnings].map((text) => text.split("\n").length)
//         );
//         const rowHeight = Math.max(lines * lineHeight + rowPadding, 30);

//         // Page break check
//         if (y + rowHeight > doc.page.height - 100) {
//           doc.addPage();
//           y = 60; // Reset Y position for new page
//           drawRow(headers, y, headerHeight, { isHeader: true });
//           y += headerHeight;
//         }

//         // Alternate row background
//         if (alternateRow) {
//           doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
//              .fillAndStroke('#f8f9fa', '#f8f9fa');
//         }

//         drawRow(row, y, rowHeight);
//         y += rowHeight;

//         total += group.reduce((sum, g) => sum + g.instructorEarning, 0);
//         alternateRow = !alternateRow;
//       }
//     } else {
//       // Show individual entries
//       for (const item of data) {
//         const row = [
//           item.orderId,
//           new Date(item.createdAt).toLocaleDateString('en-IN'),
//           item.courseName,
//           `₹${item.coursePrice.toLocaleString('en-IN')}`,
//           item.paymentMethod || "N/A",
//           `₹${item.instructorEarning.toLocaleString('en-IN')}`,
//         ];

//         const rowHeight = 30;

//         // Page break check
//         if (y + rowHeight > doc.page.height - 100) {
//           doc.addPage();
//           y = 60;
//           drawRow(headers, y, headerHeight, { isHeader: true });
//           y += headerHeight;
//         }

//         // Alternate row background
//         if (alternateRow) {
//           doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
//              .fillAndStroke('#f8f9fa', '#f8f9fa');
//         }

//         drawRow(row, y, rowHeight);
//         y += rowHeight;

//         total += item.instructorEarning;
//         alternateRow = !alternateRow;
//       }
//     }

//     // Add some space before total
//     y += 10;

//     // Total Row
//     const totalRow = ["", "", "", "", "Total Instructor Revenue:", `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`];
//     drawRow(totalRow, y, 35, { isTotal: true });

//     // Footer
//     doc.fontSize(8).fillColor('#7f8c8d');
//     doc.text(`Report generated by ULearn System - ${new Date().toLocaleTimeString('en-IN')}`, 
//              startX, doc.page.height - 50, 
//              { align: 'center', width: colWidths.reduce((a, b) => a + b, 0) });

//     doc.end();
//     stream.pipe(res);
//   } catch (error) {
//     console.error('Error generating PDF report:', error);
//     res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
//   }
// }