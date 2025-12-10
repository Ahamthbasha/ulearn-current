import PDFDocument from "pdfkit";
import { OrderDetailsDTO } from "../dto/userDTO/orderDetailsDTO";

export async function generateInvoicePdf(
  order: OrderDetailsDTO,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
    });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Color palette
    const colors = {
      primary: "#2563eb", // Blue
      secondary: "#64748b", // Gray
      accent: "#f59e0b", // Amber
      success: "#10b981", // Green
      danger: "#ef4444", // Red
      dark: "#1f2937", // Dark gray
      light: "#f8fafc", // Light gray
      white: "#ffffff",
    };

    // Helper function to add colored rectangle
    const addColoredRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: string,
    ) => {
      doc.rect(x, y, width, height).fill(color);
    };

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      return `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    // Helper function to get status color
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "success":
          return colors.success;
        case "pending":
          return colors.accent;
        case "failed":
        case "cancelled":
          return colors.danger;
        default:
          return colors.secondary;
      }
    };

    // ========== HEADER SECTION ==========
    // Header background
    addColoredRect(0, 0, 595, 120, colors.primary);

   
    doc.circle(70, 40, 20).fill(colors.white);
    doc
      .fontSize(16)
      .fillColor(colors.primary)
      .font("Helvetica-Bold")
      .text("uL", 63, 33);

    doc
      .fontSize(28)
      .fillColor(colors.white)
      .font("Helvetica-Bold")
      .text("uLearn", 110, 30);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Knowledge Street", 110, 60)
      .text("Chennai, Tamil Nadu, India", 110, 75)
      .text("contact@ulearn.com | +91 98765 43210", 110, 90);

    // Invoice title
    doc
      .fontSize(32)
      .font("Helvetica-Bold")
      .text("INVOICE", 420, 35, { align: "right" });

    // Invoice number with background
    addColoredRect(420, 70, 125, 25, colors.accent);
    doc
      .fontSize(12)
      .fillColor(colors.white)
      .font("Helvetica-Bold")
      .text(`INV-${order.orderId.toString().slice(-8)}`, 425, 78, {
        align: "left",
      });

    // Reset position and color
    doc.y = 140;
    doc.fillColor(colors.dark);

    // ========== CLIENT INFORMATION SECTION ==========
    const clientSectionY = doc.y;

    // Bill To section
    addColoredRect(50, clientSectionY, 250, 5, colors.primary);
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text("BILL TO", 50, clientSectionY + 15);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(colors.dark)
      .text(order.userInfo.username, 50, clientSectionY + 35);
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(colors.secondary)
      .text(order.userInfo.email, 50, clientSectionY + 55);

    // Invoice details section
    const detailsX = 350;
    addColoredRect(detailsX, clientSectionY, 200, 5, colors.accent);
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(colors.accent)
      .text("INVOICE DETAILS", detailsX, clientSectionY + 15);

    const detailsData = [
      { label: "Invoice Date:", value: order.orderDate },
      { label: "Status:", value: order.status.toUpperCase() },
    ];

    let detailY = clientSectionY + 35;
    detailsData.forEach((detail) => {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(colors.dark)
        .text(detail.label, detailsX, detailY);
      if (detail.label === "Status:") {
        const statusColor = getStatusColor(detail.value);
        const statusWidth = doc.widthOfString(detail.value) + 10;
        addColoredRect(
          detailsX + 85,
          detailY - 2,
          statusWidth,
          16,
          statusColor,
        );
        doc.fillColor(colors.white).text(detail.value, detailsX + 90, detailY);
      } else {
        doc
          .fillColor(colors.secondary)
          .font("Helvetica")
          .text(detail.value, detailsX + 90, detailY);
      }
      detailY += 20;
    });

    doc.y = Math.max(clientSectionY + 100, detailY + 20);

    // ========== COURSES AND LEARNING PATHS TABLE SECTION ==========
    const tableStartY = doc.y + 20;

    // Table header
    addColoredRect(50, tableStartY, 495, 35, colors.light);
    doc.rect(50, tableStartY, 495, 35).stroke(colors.secondary);

    const colPositions = {
      course: 60,
      originalPrice: 300,
      offer: 380,
      offerPrice: 460,
    };

    doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.dark);
    doc.text(
      "COURSE / LEARNING PATH DETAILS",
      colPositions.course,
      tableStartY + 12,
    );
    doc.text("ORIGINAL PRICE", colPositions.originalPrice, tableStartY + 12, {
      width: 70,
      align: "center",
    });
    doc.text("OFFER (%)", colPositions.offer, tableStartY + 12, {
      width: 70,
      align: "center",
    });
    doc.text("OFFER PRICE", colPositions.offerPrice, tableStartY + 12, {
      width: 75,
      align: "center",
    });

    // Table rows
    let currentRowY = tableStartY + 35;
    const rowHeight = 40;
    let rowIndex = 0;

    // Standalone courses
    if (order.coursesInfo.length > 0) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(colors.primary)
        .text("Standalone Courses", colPositions.course, currentRowY + 8);
      currentRowY += rowHeight;
      rowIndex++;

      order.coursesInfo.forEach((course) => {
        // Alternating row colors
        if (rowIndex % 2 === 0) {
          addColoredRect(50, currentRowY, 495, rowHeight, "#fafafa");
        }

        // Row border
        doc.rect(50, currentRowY, 495, rowHeight).stroke("#e5e7eb");

        // Course name (with text wrapping)
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(colors.dark)
          .text(course.courseName, colPositions.course, currentRowY + 8, {
            width: 220,
            height: rowHeight - 16,
            ellipsis: true,
          });

        // Original price, offer percentage, and offer price
        const originalPrice = course.isAlreadyEnrolled
          ? 0
          : course.courseOriginalPrice;
        const offerPrice = course.isAlreadyEnrolled
          ? 0
          : course.courseOfferPrice;
        doc.fontSize(11).font("Helvetica").fillColor(colors.secondary);
        doc.text(
          formatCurrency(originalPrice),
          colPositions.originalPrice,
          currentRowY + 15,
          {
            width: 70,
            align: "center",
          },
        );
        doc.text(
          course.courseOfferDiscount ? `${course.courseOfferDiscount}%` : "0%",
          colPositions.offer,
          currentRowY + 15,
          {
            width: 70,
            align: "center",
          },
        );
        doc.text(
          formatCurrency(offerPrice),
          colPositions.offerPrice,
          currentRowY + 15,
          {
            width: 75,
            align: "center",
          },
        );

        currentRowY += rowHeight;
        rowIndex++;
      });
    }

    // Learning paths
    if (order.learningPathsInfo.length > 0) {
      order.learningPathsInfo.forEach((learningPath) => {
        // Learning path header
        if (rowIndex % 2 === 0) {
          addColoredRect(50, currentRowY, 495, rowHeight, "#fafafa");
        }
        doc.rect(50, currentRowY, 495, rowHeight).stroke("#e5e7eb");
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor(colors.primary)
          .text(
            `Learning Path: ${learningPath.learningPathName}`,
            colPositions.course,
            currentRowY + 8,
            {
              width: 220,
              height: rowHeight - 16,
              ellipsis: true,
            },
          );
        currentRowY += rowHeight;
        rowIndex++;

        // Courses in learning path
        learningPath.courses.forEach((course) => {
          // Alternating row colors
          if (rowIndex % 2 === 0) {
            addColoredRect(50, currentRowY, 495, rowHeight, "#fafafa");
          }

          // Row border
          doc.rect(50, currentRowY, 495, rowHeight).stroke("#e5e7eb");

          // Course name (indented, with text wrapping)
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(colors.dark)
            .text(
              `  ${course.courseName}`,
              colPositions.course,
              currentRowY + 8,
              {
                width: 220,
                height: rowHeight - 16,
                ellipsis: true,
              },
            );

          // Original price, offer percentage, and offer price
          const originalPrice = course.isAlreadyEnrolled
            ? 0
            : course.courseOriginalPrice;
          const offerPrice = course.isAlreadyEnrolled
            ? 0
            : course.courseOfferPrice;
          doc.fontSize(11).font("Helvetica").fillColor(colors.secondary);
          doc.text(
            formatCurrency(originalPrice),
            colPositions.originalPrice,
            currentRowY + 15,
            {
              width: 70,
              align: "center",
            },
          );
          doc.text(
            course.courseOfferDiscount
              ? `${course.courseOfferDiscount}%`
              : "0%",
            colPositions.offer,
            currentRowY + 15,
            {
              width: 70,
              align: "center",
            },
          );
          doc.text(
            formatCurrency(offerPrice),
            colPositions.offerPrice,
            currentRowY + 15,
            {
              width: 75,
              align: "center",
            },
          );

          currentRowY += rowHeight;
          rowIndex++;
        });
      });
    }

    // Total section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(colors.dark)
      .text("Total Course Price:", colPositions.course, currentRowY + 10);
    doc.text(
      formatCurrency(order.sumOfAllCourseOriginalPrice),
      colPositions.offerPrice,
      currentRowY + 10,
      {
        width: 75,
        align: "center",
      },
    );

    currentRowY += 25;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(colors.dark)
      .text(
        "Final Price (Including Offers):",
        colPositions.course,
        currentRowY + 10,
      );
    doc.text(
      formatCurrency(order.sumOfAllCourseIncludingOfferPrice),
      colPositions.offerPrice,
      currentRowY + 10,
      {
        width: 75,
        align: "center",
      },
    );

    // ========== COUPON SECTION ==========
    let summaryStartY = currentRowY + 30;
    const summaryX = 320;
    const summaryWidth = 225;

    if (order.couponInfo) {
      addColoredRect(summaryX, summaryStartY, summaryWidth, 5, colors.accent);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(colors.accent)
        .text("COUPON DETAILS", summaryX, summaryStartY + 15);

      summaryStartY += 35;
      const couponData = [
        { label: "Coupon Code:", value: order.couponInfo.couponCode },
        {
          label: "Discount Percentage:",
          value: `${order.couponInfo.couponDiscountPercentage}%`,
        },
        {
          label: "Discount Amount:",
          value: `-${formatCurrency(order.couponInfo.discountAmount)}`,
        },
      ];

      couponData.forEach((item) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(colors.dark)
          .text(item.label, summaryX, summaryStartY);
        doc
          .font("Helvetica")
          .fillColor(colors.secondary)
          .text(item.value, summaryX + 120, summaryStartY, {
            width: 95,
            align: "right",
          });
        summaryStartY += 20;
      });
    }

    // ========== FINAL TOTAL SECTION ==========
    addColoredRect(summaryX, summaryStartY, summaryWidth, 35, colors.primary);
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(colors.white)
      .text("FINAL TOTAL:", summaryX + 10, summaryStartY + 10);
    doc.text(
      formatCurrency(order.finalPrice),
      summaryX + 120,
      summaryStartY + 10,
      {
        width: 95,
        align: "right",
      },
    );

    // ========== FOOTER SECTION ==========
    const footerY = 720;

    // Footer line
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke(colors.secondary);

    // Thank you message
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text("Thank you for choosing uLearn!", 50, footerY + 15);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(colors.secondary)
      .text(
        "This is a computer-generated invoice. No signature is required.",
        50,
        footerY + 35,
      )
      .text(
        "For queries, please contact us at support@ulearn.com",
        50,
        footerY + 50,
      );

    // Page numbers and watermark
    doc
      .fontSize(8)
      .fillColor(colors.secondary)
      .text(
        `Invoice Generated: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB")}`,
        400,
        footerY + 50,
      );

    // Add a subtle watermark
    doc
      .fontSize(60)
      .fillColor("#f0f0f0")
      .opacity(0.1)
      .text("uLearn", 200, 400, { align: "center" });

    // Reset opacity
    doc.opacity(1);

    // ========== FINISH ==========
    doc.end();
  });
}
