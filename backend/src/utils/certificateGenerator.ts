import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { uploadToS3Bucket, IMulterFile } from "./s3Bucket";

export const generateCertificate = async ({
  studentName,
  courseName,
  instructorName,
  userId,
  courseId,
}: {
  studentName: string;
  courseName: string;
  instructorName: string;
  userId: string;
  courseId: string;
}): Promise<string> => {
  const buffer = await createCertificatePDF(
    studentName,
    courseName,
    instructorName,
  );

  const file: IMulterFile = {
    originalname: `certificate-${sanitize(studentName)}-${sanitize(courseName)}.pdf`,
    buffer,
    mimetype: "application/pdf",
  };

  const s3Key = await uploadToS3Bucket(
    file,
    `certificates/${userId}/${courseId}`,
  );
  return s3Key;
};

const createCertificatePDF = async (
  studentName: string,
  courseName: string,
  instructorName: string,
): Promise<Buffer> => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  // Page dimensions for landscape A4
  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Draw border around the certificate
  drawBorder(doc, pageWidth, pageHeight);

  // Draw orange accent elements
  drawOrangeAccents(doc, pageWidth, pageHeight);

  // Header - College Name
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#F59E0B") // Orange color
    .text("ULEARN", pageWidth / 2 - 100, 80, { align: "center", width: 200 });

  // Main Certificate Title
  doc
    .font("Helvetica-Bold")
    .fontSize(48)
    .fillColor("#1E40AF") // Blue color
    .text("CERTIFICATE", pageWidth / 2 - 200, 140, {
      align: "center",
      width: 400,
    });

  // Subtitle
  doc
    .font("Helvetica")
    .fontSize(24)
    .fillColor("#1E40AF")
    .text("OF COMPLETION", pageWidth / 2 - 200, 200, {
      align: "center",
      width: 400,
    });

  // Student Name with underline
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#000000")
    .text(studentName, pageWidth / 2 - 200, 280, {
      align: "center",
      width: 400,
    });

  // Draw underline for student name
  doc
    .strokeColor("#1E40AF")
    .lineWidth(2)
    .moveTo(pageWidth / 2 - 150, 315)
    .lineTo(pageWidth / 2 + 150, 315)
    .stroke();

  // Completion text
  doc
    .font("Helvetica")
    .fontSize(16)
    .fillColor("#6B7280")
    .text(
      "for successfully completing the course of",
      pageWidth / 2 - 200,
      340,
      { align: "center", width: 400 },
    );

  // Course Name
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#000000")
    .text(courseName, pageWidth / 2 - 200, 370, {
      align: "center",
      width: 400,
    });

  // Instructor signature area
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#000000")
    .text("ISSUED BY", pageWidth - 180, pageHeight - 100);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#000000")
    .text(instructorName, pageWidth - 180, pageHeight - 80);

  // Date
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#6B7280")
    .text(
      `Date: ${new Date().toLocaleDateString("en-IN")}`,
      pageWidth - 180,
      pageHeight - 60,
    );

  // Draw medal/ribbon icon
  drawMedalIcon(doc, pageWidth - 80, 80);

  // Draw illustration (person with laptop)
  drawPersonIllustration(doc, 80, pageHeight - 180);

  doc.end();

  return await streamToBuffer(stream);
};

const drawBorder = (
  doc: InstanceType<typeof PDFDocument>,
  pageWidth: number,
  pageHeight: number,
) => {
  doc.save();

  // Draw border around the entire certificate
  doc
    .strokeColor("#1E40AF")
    .lineWidth(3)
    .rect(20, 20, pageWidth - 40, pageHeight - 40)
    .stroke();

  // Draw inner border for more elegant look
  doc
    .strokeColor("#F59E0B")
    .lineWidth(1)
    .rect(30, 30, pageWidth - 60, pageHeight - 60)
    .stroke();

  doc.restore();
};

const drawOrangeAccents = (
  doc: InstanceType<typeof PDFDocument>,
  pageWidth: number,
  pageHeight: number,
) => {
  doc.save();

  // Orange vertical bar on the right
  doc
    .fillColor("#F59E0B")
    .rect(pageWidth - 30, 0, 30, pageHeight)
    .fill();

  // Orange horizontal bar at bottom
  doc
    .fillColor("#F59E0B")
    .rect(0, pageHeight - 30, pageWidth, 30)
    .fill();

  doc.restore();
};

const drawMedalIcon = (
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
) => {
  doc.save();

  // Medal circle
  doc.fillColor("#F59E0B").circle(x, y, 25).fill();

  // Inner circle
  doc.fillColor("#FEF3C7").circle(x, y, 20).fill();

  // Medal ribbon
  doc
    .fillColor("#F59E0B")
    .rect(x - 8, y + 15, 16, 30)
    .fill();

  // Ribbon ends (triangular)
  doc
    .moveTo(x - 8, y + 45)
    .lineTo(x, y + 35)
    .lineTo(x + 8, y + 45)
    .lineTo(x + 8, y + 45)
    .fill();

  doc.restore();
};

const drawPersonIllustration = (
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
) => {
  doc.save();

  // Simple person illustration
  // Head
  doc
    .fillColor("#F59E0B")
    .circle(x + 20, y - 20, 15)
    .fill();

  // Body
  doc
    .fillColor("#F59E0B")
    .rect(x + 10, y - 5, 20, 30)
    .fill();

  // Laptop
  doc
    .fillColor("#6B7280")
    .rect(x - 10, y + 10, 40, 25)
    .fill();

  // Laptop screen
  doc
    .fillColor("#000000")
    .rect(x - 8, y + 12, 36, 18)
    .fill();

  doc.restore();
};

const streamToBuffer = async (
  stream: NodeJS.ReadableStream,
): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

const sanitize = (str: string): string =>
  str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
