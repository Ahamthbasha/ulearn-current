import PDFDocument from "pdfkit";
import { Response } from "express";
import { IBooking } from "../models/bookingModel";
import { ISlot } from "../models/slotModel";
import { IInstructor } from "../models/instructorModel";
import { IUser } from "../models/userModel";

export const generateSlotReceiptPdf = (
  res: Response,
  booking: IBooking & {
    studentId: IUser;
    instructorId: IInstructor;
    slotId: ISlot;
  }
) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=ULearn-Receipt-${booking._id.toString()}.pdf`
  );

  doc.pipe(res);

  const primary = '#2563eb';
  const secondary = '#64748b';
  const success = '#16a34a';
  const border = '#e2e8f0';
  const labelWidth = 100;
  const valueX = 160;

  // Header Bar
  doc.rect(0, 0, doc.page.width, 70).fill(primary);
  doc
    .fontSize(22)
    .fillColor('white')
    .text('ULearn', 40, 20)
    .fontSize(10)
    .text('Learn. Grow. Succeed.', 40, 42)
    .fontSize(16)
    .text('BOOKING RECEIPT', 0, 25, { align: 'right', width: doc.page.width - 40 })
    .fontSize(10)
    .text(`Receipt #${booking._id.toString().slice(-8).toUpperCase()}`, 0, 45, {
      align: 'right',
      width: doc.page.width - 40
    });

  doc.y = 85;

  // Section Title
  doc
    .fontSize(12)
    .fillColor(primary)
    .text('Booking Summary', 40, doc.y);

  doc
    .moveTo(40, doc.y + 15)
    .lineTo(doc.page.width - 40, doc.y + 15)
    .strokeColor(primary)
    .stroke();

  const summaryY = doc.y + 25;

  // Booking ID and Date
  doc
    .fontSize(9)
    .fillColor(secondary)
    .text(`Booking ID: ${booking._id.toString()}`, 40, summaryY)
    .text(`Date Booked: ${new Date(booking.createdAt).toLocaleString("en-IN", {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })}`, 40, summaryY + 15);

  // Status badge
  const statusColor = booking.paymentStatus === 'paid' ? success : '#dc2626';
  doc
    .rect(doc.page.width - 110, summaryY + 5, 70, 20)
    .fillColor(statusColor)
    .fill()
    .fontSize(9)
    .fillColor('white')
    .text(booking.paymentStatus.toUpperCase(), doc.page.width - 105, summaryY + 9, {
      width: 60,
      align: 'center'
    });

  doc.y = summaryY + 45;

  // Section Renderer
  const section = (title: string, rows: { label: string; value: string }[]) => {
    doc
      .fontSize(11)
      .fillColor(primary)
      .text(title, 40, doc.y);

    doc
      .moveTo(40, doc.y + 15)
      .lineTo(doc.page.width - 40, doc.y + 15)
      .strokeColor(primary)
      .stroke();

    let y = doc.y + 20;

    rows.forEach((row, i) => {
      if (i % 2 === 0) {
        doc.rect(40, y - 2, doc.page.width - 80, 16).fillColor('#f9fafb').fill();
      }

      doc
        .fillColor(secondary)
        .fontSize(9)
        .text(row.label + ':', 50, y, { width: labelWidth });

      doc
        .fillColor('#000')
        .fontSize(9)
        .text(row.value, valueX, y, {
          width: doc.page.width - valueX - 40
        });

      y += 16;
    });

    doc.y = y + 10;
  };

  section('Student Information', [
    { label: 'Name', value: booking.studentId.username || 'N/A' },
    { label: 'Email', value: booking.studentId.email || 'N/A' }
  ]);

  section('Instructor Information', [
    { label: 'Name', value: booking.instructorId.username || 'N/A' },
    { label: 'Email', value: booking.instructorId.email || 'N/A' }
  ]);

  const start = new Date(booking.slotId.startTime);
  const end = new Date(booking.slotId.endTime);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  section('Slot Details', [
    {
      label: 'Date',
      value: start.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      })
    },
    {
      label: 'Time',
      value: `${start.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit"
      })} - ${end.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit"
      })}`
    },
    { label: 'Duration', value: `${duration} minutes` }
  ]);

  section('Payment Details', [
    { label: 'Amount', value: `INR ${booking.slotId.price.toFixed(2)}` },
    { label: 'Status', value: booking.paymentStatus.toUpperCase() },
    { label: 'Transaction ID', value: booking.txnId || 'N/A' }
  ]);

  // Total Box
  const totalY = doc.y;
  doc
    .rect(40, totalY, doc.page.width - 80, 40)
    .fill(primary);

  doc
    .fontSize(12)
    .fillColor('white')
    .text('Total Amount', 50, totalY + 12);

  doc
    .fontSize(16)
    .text(`INR ${booking.slotId.price.toFixed(2)}`, 0, totalY + 10, {
      align: 'right',
      width: doc.page.width - 55
    });

  doc.y = totalY + 60;

  // Footer
  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(8)
    .fillColor(secondary)
    .text('Thank you for choosing ULearn!', 40, doc.y + 10)
    .text('support@ulearn.com | www.ulearn.com', 40, doc.y + 24)
    .text('ULearn Technologies Pvt Ltd', 0, doc.y + 10, {
      align: 'right',
      width: doc.page.width - 40
    })
    .text('This is a computer-generated receipt.', 0, doc.y + 24, {
      align: 'right',
      width: doc.page.width - 40
    });

  doc.end();
};
