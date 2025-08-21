import PDFDocument from "pdfkit";
import { InstructorMembershipOrderDTO } from "../models/instructorMembershipOrderModel";

export async function generateMembershipReceiptPdf(
  order: InstructorMembershipOrderDTO,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      bufferPages: true,
    });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Colors
    const primaryColor = "#2563eb"; // Blue
    const accentColor = "#f8fafc"; // Light gray
    const textColor = "#374151"; // Dark gray
    const successColor = "#10b981"; // Green

    // === HEADER SECTION ===
    // Background accent for header
    doc.rect(0, 0, doc.page.width, 100).fill(accentColor);

    // Company logo area (placeholder)
    doc.rect(40, 25, 50, 50).fill(primaryColor);
    doc
      .fillColor("white")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("uL", 55, 45);

    // Company details
    doc
      .fillColor(textColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("uLearn", 110, 35);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Knowledge Street", 110, 55)
      .text("Chennai, Tamil Nadu, India", 110, 67);

    // Receipt title
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("MEMBERSHIP RECEIPT", 0, 35, {
        align: "right",
        width: doc.page.width - 40,
      });

    // Status badge
    const statusColor =
      order.paymentStatus === "paid" ? successColor : "#ef4444";
    doc.rect(doc.page.width - 130, 60, 90, 20).fill(statusColor);
    doc
      .fillColor("white")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(order.paymentStatus.toUpperCase(), doc.page.width - 130, 67, {
        align: "center",
        width: 90,
      });

    // === TRANSACTION INFO BAR ===
    const infoBarY = 120;
    doc.rect(40, infoBarY, doc.page.width - 80, 50).fill("#f1f5f9");

    doc
      .fillColor(textColor)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("TRANSACTION ID", 50, infoBarY + 10)
      .text("DATE", 220, infoBarY + 10);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(order.txnId, 50, infoBarY + 25)
      .text(
        new Date(order.createdAt).toLocaleDateString("en-IN"),
        220,
        infoBarY + 25,
      );

    // === CUSTOMER INFORMATION ===
    let currentY = infoBarY + 70;
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("CUSTOMER INFORMATION", 40, currentY);

    currentY += 20;
    doc.rect(40, currentY, doc.page.width - 80, 60).stroke("#e5e7eb");

    doc
      .fillColor(textColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Name:", 50, currentY + 12)
      .text("Email:", 50, currentY + 28)
      .text("Member Since:", 50, currentY + 44);

    doc
      .font("Helvetica")
      .text(order.instructor.name, 130, currentY + 12)
      .text(order.instructor.email, 130, currentY + 28)
      .text(
        new Date(order.createdAt).toLocaleDateString("en-IN"),
        130,
        currentY + 44,
      );

    // === MEMBERSHIP PLAN DETAILS ===
    currentY += 80;
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("MEMBERSHIP PLAN DETAILS", 40, currentY);

    currentY += 20;

    // Plan name with highlight
    doc.rect(40, currentY, doc.page.width - 80, 30).fill(primaryColor);
    doc
      .fillColor("white")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(order.membershipPlan.name, 0, currentY + 8, {
        align: "center",
        width: doc.page.width,
      });

    currentY += 40;

    // Plan details grid - more compact
    const detailsData = [
      {
        label: "Duration",
        value: `${order.membershipPlan.durationInDays} days`,
      },
      {
        label: "Start Date",
        value: new Date(order.startDate).toLocaleDateString("en-IN"),
      },
      {
        label: "End Date",
        value: new Date(order.endDate).toLocaleDateString("en-IN"),
      },
      {
        label: "Description",
        value: order.membershipPlan.description || "Standard membership plan",
      },
    ];

    detailsData.forEach((item, index) => {
      const y = currentY + index * 22;
      const bgColor = index % 2 === 0 ? "#f8fafc" : "white";

      doc.rect(40, y, doc.page.width - 80, 22).fill(bgColor);
      doc
        .fillColor(textColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(item.label + ":", 50, y + 6);
      doc
        .font("Helvetica")
        .text(item.value, 150, y + 6, { width: doc.page.width - 190 });
    });

    currentY += detailsData.length * 22 + 30;

    // === MEMBERSHIP BENEFITS ===
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("MEMBERSHIP BENEFITS", 40, currentY);

    currentY += 20;

    // Benefits container
    const benefitsContainerHeight = 120; // Adjust based on your needs
    doc
      .rect(40, currentY, doc.page.width - 80, benefitsContainerHeight)
      .fill("#f0f9ff")
      .stroke("#bfdbfe");

    // Benefits header
    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Your membership includes:", 50, currentY + 15);

    // Default benefits if not provided in membershipPlan
    const defaultBenefits = [
      "Unlimited access to all courses",
      "Priority customer support",
      "Download course materials",
      "Certificate of completion",
      "Access to exclusive content",
      "Community forum participation",
    ];

    // Use benefits from membershipPlan if available, otherwise use defaults
    const benefits = order.membershipPlan.benefits || defaultBenefits;

    // Display benefits with bullet points
    benefits.slice(0, 6).forEach((benefit: string, index: number) => {
      const benefitY = currentY + 35 + index * 12;

      // Bullet point
      doc.fillColor(successColor).fontSize(8).text("●", 55, benefitY);

      // Benefit text
      doc
        .fillColor(textColor)
        .fontSize(9)
        .font("Helvetica")
        .text(benefit, 70, benefitY, { width: doc.page.width - 120 });
    });

    // If there are more than 6 benefits, show count
    if (benefits.length > 6) {
      doc
        .fillColor(primaryColor)
        .fontSize(8)
        .font("Helvetica-Oblique")
        .text(
          `And ${benefits.length - 6} more benefits...`,
          70,
          currentY + 107,
        );
    }

    currentY += benefitsContainerHeight + 20;

    // === PAYMENT SUMMARY ===
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("PAYMENT SUMMARY", 40, currentY);

    currentY += 20;

    // Summary box
    doc
      .rect(40, currentY, doc.page.width - 80, 60)
      .fill("#f8fafc")
      .stroke("#e5e7eb");

    doc
      .fillColor(textColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total Amount Paid:", 50, currentY + 15);

    // Fixed currency formatting - ensure proper alignment
    const amountText = `Rs. ${order.price.toFixed(2)}`;
    doc
      .fillColor(successColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(amountText, 40, currentY + 35, {
        align: "right",
        width: doc.page.width - 80,
      });

    currentY += 80;

    // === FOOTER ===
    // Ensure footer fits on the page
    const footerStartY = Math.max(currentY, doc.page.height - 100);

    // Divider line
    doc
      .moveTo(40, footerStartY)
      .lineTo(doc.page.width - 40, footerStartY)
      .stroke("#e5e7eb");

    // Thank you message
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Thank you for your membership!", 0, footerStartY + 15, {
        align: "center",
        width: doc.page.width,
      });

    doc
      .fillColor(textColor)
      .fontSize(8)
      .font("Helvetica")
      .text(
        "This is a computer-generated receipt. For any queries, please contact support.",
        0,
        footerStartY + 35,
        {
          align: "center",
          width: doc.page.width,
        },
      );

    doc.text("© 2024 uLearn. All rights reserved.", 0, footerStartY + 50, {
      align: "center",
      width: doc.page.width,
    });

    // === PAGE BORDER ===
    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .stroke("#e5e7eb");

    doc.end();
  });
}
