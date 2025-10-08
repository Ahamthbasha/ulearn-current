import { LearningPathModel } from "../models/learningPathModel";
import { CourseModel } from "../models/courseModel"; 
import { ILearningPathItem } from "../models/learningPathModel";

export async function updateLearningPathPrices() {
  try {
    const paths = await LearningPathModel.find();
    for (const path of paths) {
      const courses = await CourseModel.find({
        _id: { $in: path.items.map((item: ILearningPathItem) => item.courseId) },
      })
        .populate({
          path: "offer",
          select: "isActive startDate endDate discountPercentage",
        })
        .lean();
      path.totalPrice = courses.reduce((sum, course) => {
        const effectivePrice = course.effectivePrice ?? course.price;
        return sum + effectivePrice;
      }, 0);
      await path.save();
    }
    console.log("Learning path prices updated successfully");
  } catch (error) {
    console.error("Failed to update learning path prices:", error);
  }
}


import cron from "node-cron";
cron.schedule("0 0 * * *", updateLearningPathPrices);