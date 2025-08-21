import PDFDocument from "pdfkit";
import { IOrder } from "../models/orderModel";
import { IUser } from "../models/userModel";
import { ICourse } from "../models/courseModel";

export async function generateInvoicePdf(order: IOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const user = order.userId as unknown as IUser;
    const courses = order.courses as unknown as ICourse[];

    // ========== HEADER ==========
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE", 450, 50, { align: "right" });

    doc.moveDown();
    doc.fontSize(12).font("Helvetica-Bold").text("uLearn", 50, 50);
    doc.font("Helvetica").text("Knowledge Street");
    doc.text("Chennai, India");
    doc.moveDown();

    // ========== BILL TO ==========
    doc.font("Helvetica-Bold").text("BILL TO:");
    doc.font("Helvetica").text(`${user.username}`);
    doc.text(`${user.email}`);
    doc.moveDown();

    // ========== ORDER INFO ==========
    doc
      .font("Helvetica-Bold")
      .text(`Invoice #: `, { continued: true })
      .font("Helvetica")
      .text(order._id.toString());
    doc
      .font("Helvetica-Bold")
      .text(`Date: `, { continued: true })
      .font("Helvetica")
      .text(new Date(order.createdAt).toLocaleDateString());
    doc
      .font("Helvetica-Bold")
      .text(`Payment Gateway: `, { continued: true })
      .font("Helvetica")
      .text(order.gateway);
    doc
      .font("Helvetica-Bold")
      .text(`Status: `, { continued: true })
      .font("Helvetica")
      .text(order.status);
    doc.moveDown(2);

    // ========== TABLE HEADERS ==========
    const tableTop = doc.y;
    const courseCol = 50;
    const priceCol = 370;
    const totalCol = 460;

    doc.font("Helvetica-Bold");
    doc.text("Course", courseCol, tableTop);
    doc.text("Price", priceCol, tableTop, { width: 80, align: "right" });
    doc.text("Total", totalCol, tableTop, { width: 80, align: "right" });

    // Draw line under headers
    doc
      .moveTo(courseCol, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // ========== TABLE ROWS ==========
    doc.font("Helvetica");
    let currentY = tableTop + 25;

    courses.forEach((course) => {
      doc.text(course.courseName, courseCol, currentY);
      doc.text(`${course.price.toFixed(2)}`, priceCol, currentY, {
        width: 80,
        align: "right",
      });
      doc.text(`${course.price.toFixed(2)}`, totalCol, currentY, {
        width: 80,
        align: "right",
      });
      currentY += 20; // Move to next row
    });

    // ========== TOTAL ==========
    // Draw line above total
    doc
      .moveTo(priceCol, currentY + 5)
      .lineTo(550, currentY + 5)
      .stroke();
    currentY += 15;

    doc.font("Helvetica-Bold");
    doc.text("Total", priceCol, currentY, { width: 80, align: "right" });
    doc.text(`${order.amount.toFixed(2)}`, totalCol, currentY, {
      width: 80,
      align: "right",
    });

    // ========== FINISH ==========
    doc.end();
  });
}
