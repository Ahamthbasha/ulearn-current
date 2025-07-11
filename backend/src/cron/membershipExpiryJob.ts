import cron from "node-cron";
import InstructorModel from "../models/instructorModel";
import { SendEmail } from "../utils/sendOtpEmail";

const emailService = new SendEmail();

export const startMembershipExpiryJob = () => {
  cron.schedule("0 0 * * *", async () => {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    try {
      const expiringSoon = await InstructorModel.find({
        isMentor: true,
        membershipExpiryDate: {
          $gte: new Date(threeDaysLater.setHours(0, 0, 0, 0)),
          $lte: new Date(threeDaysLater.setHours(23, 59, 59, 999)),
        },
      });

      for (const instructor of expiringSoon) {
        if (instructor.membershipExpiryDate) {
          await emailService.sendMembershipExpiryReminder(
            instructor.username,
            instructor.email,
            instructor.membershipExpiryDate
          );
          console.log(`📧 Reminder sent to: ${instructor.email}`);
        } else {
          console.warn(`⚠️ Skipped reminder: No expiry date for ${instructor.email}`);
        }
      }

      // ✅ Deactivate expired memberships
      const expired = await InstructorModel.find({
        isMentor: true,
        membershipExpiryDate: { $lte: now },
      });

      for (const instructor of expired) {
        instructor.isMentor = false;
        instructor.membershipPlanId = undefined;
        await instructor.save();
        console.log(`🛑 Membership expired for: ${instructor.email}`);
      }

      console.log(`✅ Membership expiry job completed at ${now.toISOString()}`);
    } catch (error) {
      console.error("❌ Error running membership expiry job:", error);
    }
  });
};
