import { IEmail } from "../types/Email";
import nodeMailer, { SentMessageInfo } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export class SendEmail implements IEmail {
  
  async sentEmailVerification(
    name: string,
    email: string,
    verificationCode: string,
  ): Promise<SentMessageInfo> {
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("Email credentials are not set in the environment");
    }

const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

    const mailOptions = {
      from: userEmail,
      to: email,
      subject: "🌟 Welcome to ulearn - Verify Your Email 🌟",
      text: `Hello ${name},\n\nYour verification code is: ${verificationCode}\n\nThanks,\nThe ulearn Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; text-align: center; border-radius: 8px; background-color: #f7f7f7; background: url('https://cdn.wallpapersafari.com/13/89/wb4WOU.jpg') no-repeat center center; background-size: cover;">
          <div style="background-color: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 8px; display: inline-block; width: 80%; max-width: 600px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50; margin-bottom: 10px;">Welcome to ulearn, ${name}!</h2>
            <p style="font-size: 1.1em; margin-bottom: 20px;">We're excited to have you onboard. Please use the verification code below to complete your email verification:</p>
            <div style="margin: 20px 0; font-size: 1.5em; font-weight: bold; color: #4CAF50; background: #f0f0f0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
              ${verificationCode}
            </div>
            <p>If you didn’t request this, please ignore this email.</p>
            <br>
            <p>Thank you, ${name}</p>
            <p><strong>The Ulearn Team</strong></p>
            <div style="margin-top: 20px; font-size: 0.9em; color: #777;">
              <p>Follow us on:</p>
              <a href="https://twitter.com/Ulearn" style="margin: 0 5px; text-decoration: none; color: #4CAF50;">Twitter</a> |
              <a href="https://facebook.com/Ulearn" style="margin: 0 5px; text-decoration: none; color: #4CAF50;">Facebook</a> |
              <a href="https://instagram.com/Ulearn" style="margin: 0 5px; text-decoration: none; color: #4CAF50;">Instagram</a>
            </div>
          </div>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }

  async sendRejectionEmail(
    name: string,
    email: string,
    reason: string,
  ): Promise<SentMessageInfo> {
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("Email credentials are not set in the environment");
    }

    const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

    const mailOptions = {
      from: userEmail,
      to: email,
      subject: "📢 uLearn - Verification Request Rejected",
      text: `Hello ${name},\n\nWe regret to inform you that your instructor verification request has been rejected.\n\nReason: ${reason}\n\nYou can re-apply after resolving the issue.\n\nThank you,\nThe uLearn Team`,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #fef2f2; text-align: center;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; display: inline-block; width: 80%; max-width: 600px; box-shadow: 0 0 10px rgba(255, 0, 0, 0.2);">
          <h2 style="color: #e53935;">Verification Rejected</h2>
          <p>Dear ${name},</p>
          <p>We regret to inform you that your instructor verification request has been <strong style="color: #e53935;">rejected</strong>.</p>
          <p><strong>Reason:</strong></p>
          <blockquote style="background-color: #ffe6e6; border-left: 4px solid #e53935; padding: 10px; margin: 20px 0; font-style: italic;">
            ${reason}
          </blockquote>
          <p>You are welcome to re-apply after addressing the issue.</p>
          <br>
          <p>Thank you,</p>
          <p><strong>The uLearn Team</strong></p>
        </div>
      </div>
    `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }

  async sendVerificationSuccessEmail(
    name: string,
    email: string,
  ): Promise<SentMessageInfo> {
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("Email credentials are not set in the environment");
    }

   const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

    const mailOptions = {
      from: userEmail,
      to: email,
      subject: "🎉 uLearn - Instructor Verification Approved!",
      text: `Hello ${name},\n\nCongratulations! Your instructor verification has been successfully approved.\n\nYou now have access to your instructor dashboard.\n\nWelcome aboard!\n\nThanks,\nThe uLearn Team`,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #e8f5e9; text-align: center;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; display: inline-block; width: 80%; max-width: 600px; box-shadow: 0 0 10px rgba(76, 175, 80, 0.2);">
          <h2 style="color: #4CAF50;">🎉 Congratulations ${name}!</h2>
          <p>Your instructor verification request has been <strong style="color: #4CAF50;">approved</strong>.</p>
          <p>You now have full access to the instructor dashboard and can begin uploading your courses, managing students, and sharing your knowledge.</p>
          <p>We're excited to see the value you'll bring to the uLearn community.</p>
          <br>
          <p>Welcome aboard!</p>
          <p><strong>The uLearn Team</strong></p>
        </div>
      </div>
    `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }

  async sendMembershipPurchaseEmail(
    name: string,
    email: string,
    planName: string,
    expiryDate: Date,
  ): Promise<SentMessageInfo> {
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("Email credentials are not set in the environment");
    }

   const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

    const mailOptions = {
      from: userEmail,
      to: email,
      subject: `✅ uLearn - Membership Activated for "${planName}"`,
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; text-align: center;">
        <div style="background-color: white; padding: 20px; border-radius: 10px; display: inline-block;">
          <h2 style="color: #4CAF50;">Membership Activated 🎉</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your membership plan "<strong>${planName}</strong>" has been successfully activated.</p>
          <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
          <p>Thank you for being part of uLearn! 🚀</p>
        </div>
      </div>
    `,
    };

    return await transporter.sendMail(mailOptions);
  }

  async sendMembershipExpiryReminder(
    name: string,
    email: string,
    expiryDate: Date,
  ): Promise<SentMessageInfo> {
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("Email credentials are not set in the environment");
    }

    const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

    const mailOptions = {
      from: userEmail,
      to: email,
      subject: `⚠️ Membership Expiring Soon`,
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #fff3cd; padding: 20px; text-align: center;">
        <div style="background-color: white; padding: 20px; border-radius: 10px; display: inline-block;">
          <h2 style="color: #ff9800;">Reminder: Membership Expiring Soon</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your membership is expiring on <strong>${new Date(expiryDate).toLocaleDateString()}</strong>.</p>
          <p>To continue enjoying instructor benefits, please renew your membership.</p>
        </div>
      </div>
    `,
    };

    return await transporter.sendMail(mailOptions);
  }

  async sendSlotBookingConfirmation(
    name: string,
    email: string,
    instructorName: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<SentMessageInfo> {
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("Email credentials are not set in the environment");
    }

    const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

    const mailOptions = {
      from: userEmail,
      to: email,
      subject: "✅ Slot Booking Confirmed - uLearn",
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #e8f5e9;">
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4CAF50;">Slot Booking Confirmed!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your session with <strong>${instructorName}</strong> has been successfully booked.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Start Time:</strong> ${startTime}</p>
          <p><strong>End Time:</strong> ${endTime}</p>
          <p>We look forward to your session!</p>
          <p>– uLearn Team</p>
        </div>
      </div>
    `,
    };

    return await transporter.sendMail(mailOptions);
  }
}
